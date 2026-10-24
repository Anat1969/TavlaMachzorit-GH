// The similarity network as real matter in space: each node is a sphere of the
// element's actual material, with perspective, depth fog and studio light.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// @ts-expect-error no bundled types
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force-3d'
import { BY_SYM } from '../data/elements'
import { colorOf, type ColorBy } from '../lib/colors'
import type { Edge } from '../lib/similarity'
import { reducedMotion } from '../lib/motion'
import { cssColor, disposeTree, gasCore, glass, info, studioEnvironment, studioLights, studioRenderer, surface } from './matter'

interface Props { ids: string[]; edges: Edge[]; sel: string | null; near: Set<string> | null; surprise: Set<string>; colorBy: ColorBy; onPick: (s: string) => void }
type N = { id: string; x: number; y: number; z: number }

function label(sym: string, bg: string) {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = bg
  g.fillRect(28, 8, 72, 48)
  g.fillStyle = '#0b1020'
  g.font = '600 34px "IBM Plex Sans Hebrew", system-ui, sans-serif'
  g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillText(sym, 64, 34)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true }))
  s.scale.set(0.66, 0.33, 1)
  return s
}

export default function Network3D({ ids, edges, sel, near, surprise, colorBy, onPick }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const api = useRef<{ highlight: (sel: string | null, near: Set<string> | null) => void } | null>(null)
  const pickRef = useRef(onPick)
  pickRef.current = onPick

  useEffect(() => {
    const canvas = ref.current!
    const renderer = studioRenderer(canvas)
    const scene = new THREE.Scene()
    scene.environment = studioEnvironment(renderer)
    scene.fog = new THREE.Fog(0x0b1020, 14, 40)
    renderer.toneMappingExposure = 1.35
    studioLights(scene)

    // 3D layout, deterministic
    const nodes: N[] = ids.map((id, i) => ({ id, x: Math.cos(i) * 5, y: Math.sin(i * 1.7) * 5, z: Math.sin(i) * 5 }))
    forceSimulation(nodes, 3)
      .force('link', forceLink(edges.map((e) => ({ source: e.a, target: e.b, w: e.w }))).id((d: N) => d.id).distance((l: { w: number }) => 1.2 + 2 * (1 - l.w)))
      .force('charge', forceManyBody().strength(-6))
      .force('center', forceCenter(0, 0, 0))
      .stop().tick(300)
    const box = new THREE.Box3()
    nodes.forEach((n) => box.expandByPoint(new THREE.Vector3(n.x, n.y, n.z)))
    const size = box.getSize(new THREE.Vector3()).length() || 10
    const k = 16 / size
    const pos = new Map(nodes.map((n) => [n.id, new THREE.Vector3(n.x * k, n.y * k, n.z * k)]))

    const world = new THREE.Group()
    scene.add(world)
    const deg = new Map<string, number>()
    edges.forEach((e) => { deg.set(e.a, (deg.get(e.a) ?? 0) + 1); deg.set(e.b, (deg.get(e.b) ?? 0) + 1) })

    const balls = new Map<string, THREE.Group>()
    const pickables: THREE.Mesh[] = []
    for (const id of ids) {
      const e = info(id)
      const r = 0.22 + Math.min(6, deg.get(id) ?? 0) * 0.025
      const g = new THREE.Group()
      g.position.copy(pos.get(id)!)
      const mat = e.kind === 'gas' ? glass() : e.kind === 'synth' ? new THREE.MeshPhysicalMaterial({ color: 0x8fa6ff, roughness: 0.4, transparent: true, opacity: 0.6 }) : surface(id)
      mat.transparent = true
      const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), mat)
      ball.userData.sym = id
      g.add(ball)
      pickables.push(ball)
      if (e.kind === 'gas') g.add(gasCore(id, r * 0.9))
      const lab = label(id, cssColor(colorOf(BY_SYM.get(id)!, colorBy)))
      lab.position.y = r + 0.28
      g.add(lab)
      // remember each material's own opacity (glass is mostly clear) before dimming
      g.traverse((c) => { const m = (c as THREE.Mesh).material as THREE.Material | undefined; if (m) m.userData.baseOpacity = m.opacity })
      world.add(g)
      balls.set(id, g)
    }

    // bonds: one line set, coloured per edge
    const lineGeo = new THREE.BufferGeometry()
    const verts: number[] = []
    edges.forEach((e) => { const a = pos.get(e.a)!, b = pos.get(e.b)!; verts.push(a.x, a.y, a.z, b.x, b.y, b.z) })
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    const colors = new Float32Array(edges.length * 6)
    lineGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 }))
    world.add(lines)
    const base = new THREE.Color(0x8a96b4), hot = new THREE.Color(cssColor('var(--glow)')), warn = new THREE.Color(cssColor('var(--warn)')), faint = new THREE.Color(0x1c2234)

    const highlight = (s: string | null, nr: Set<string> | null) => {
      edges.forEach((e, i) => {
        const key = e.a + '|' + e.b
        const c = s && (e.a === s || e.b === s) ? hot : nr ? faint : surprise.has(key) ? warn : base
        c.toArray(colors, i * 6); c.toArray(colors, i * 6 + 3)
      })
      lineGeo.attributes.color.needsUpdate = true
      for (const [id, g] of balls) {
        const dim = !!nr && !nr.has(id)
        g.traverse((c) => {
          const m = (c as THREE.Mesh).material as THREE.Material & { opacity: number }
          if (m) m.opacity = (m.userData.baseOpacity ?? 1) * (dim ? 0.3 : 1)
        })
        g.userData.target = id === s ? 1.8 : nr?.has(id) ? 1.3 : 1
      }
    }
    api.current = { highlight }
    highlight(sel, near)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 2, 12)
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.autoRotate = !reducedMotion()
    controls.autoRotateSpeed = 0.5
    controls.minDistance = 5
    controls.maxDistance = 40

    // click to pick an element
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
    let downAt = 0
    const onDown = () => { downAt = performance.now() }
    const onUp = (ev: PointerEvent) => {
      if (performance.now() - downAt > 250) return // that was a drag
      const r = canvas.getBoundingClientRect()
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const hit = ray.intersectObjects(pickables)[0]
      if (hit) pickRef.current(hit.object.userData.sym)
    }
    const onMove = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      canvas.style.cursor = ray.intersectObjects(pickables).length ? 'pointer' : 'grab'
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointermove', onMove)

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      // a portrait screen needs the camera further back to see the whole network
      camera.position.setLength(camera.aspect < 1 ? 12 / Math.max(0.45, camera.aspect) * 0.8 : 12)
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // entrance: the network grows out of a single point
    const t0 = performance.now()
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const k = reducedMotion() ? 1 : Math.min(1, (performance.now() - t0) / 1600)
      const ease = 1 - (1 - k) ** 3
      world.scale.setScalar(0.05 + 0.95 * ease)
      for (const g of balls.values()) {
        const target = g.userData.target ?? 1
        g.scale.setScalar(g.scale.x + (target - g.scale.x) * 0.12)
      }
      controls.update()
      renderer.render(scene, camera)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose()
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointermove', onMove)
      disposeTree(scene); scene.environment?.dispose(); renderer.dispose()
      api.current = null
    }
    // rebuild the scene only when the network itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, edges, colorBy])

  useEffect(() => { api.current?.highlight(sel, near) }, [sel, near])

  return <canvas ref={ref} className="net3d" role="img" aria-label="רשת היסודות בתלת־ממד. גררו כדי לסובב, גלגלו כדי להתקרב, לחצו על יסוד כדי לבחור אותו." />
}
