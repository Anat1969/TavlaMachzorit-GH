// A row of real samples on a lit shelf, seen in perspective. Clicking a sample picks it.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { reducedMotion } from '../lib/motion'
import { disposeTree, sample, studioEnvironment, studioLights, studioRenderer } from './matter'

function tag(sym: string) {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = 'rgba(245,247,251,0.92)'
  g.fillRect(24, 10, 80, 44)
  g.fillStyle = '#0b1020'
  g.font = '600 30px "IBM Plex Sans Hebrew", system-ui, sans-serif'
  g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillText(sym, 64, 33)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshBasicMaterial({ map: t, transparent: true }))
  return m
}

export default function Shelf3D({ syms, sel, onPick, height = 230 }: { syms: string[]; sel: string | null; onPick: (s: string) => void; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const pickRef = useRef(onPick)
  pickRef.current = onPick
  const selRef = useRef(sel)
  selRef.current = sel
  const key = syms.join(',')

  useEffect(() => {
    const canvas = ref.current!
    const renderer = studioRenderer(canvas)
    const scene = new THREE.Scene()
    scene.environment = studioEnvironment(renderer)
    studioLights(scene)

    const gap = 2.1
    const width = Math.max(1, syms.length) * gap
    // a glossy shelf that catches reflections and shadows
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(width + 1.2, 0.18, 2.2),
      new THREE.MeshPhysicalMaterial({ color: 0x1a2236, roughness: 0.25, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.15 }),
    )
    shelf.position.y = -0.09
    shelf.receiveShadow = true
    scene.add(shelf)

    const items: { sym: string; g: THREE.Group; hit: THREE.Mesh }[] = []
    syms.forEach((sym, i) => {
      const g = sample(sym)
      g.position.x = (i - (syms.length - 1) / 2) * gap
      g.scale.setScalar(0.001)
      scene.add(g)
      const t = tag(sym)
      t.position.set(g.position.x, 0.012, 0.85)
      t.rotation.x = -Math.PI / 2 + 0.35
      scene.add(t)
      // invisible hit box so the whole sample is clickable
      const hit = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.6), new THREE.MeshBasicMaterial({ visible: false }))
      hit.position.set(g.position.x, 0.8, 0)
      hit.userData.sym = sym
      scene.add(hit)
      items.push({ sym, g, hit })
    })

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    const controls = new OrbitControls(camera, canvas)
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableDamping = true
    controls.minPolarAngle = 0.6
    controls.maxPolarAngle = 1.4
    controls.minAzimuthAngle = -0.7
    controls.maxAzimuthAngle = 0.7
    controls.target.set(0, 0.35, 0.2)

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      // fit the whole shelf in view
      const dist = Math.max(4.5, (width / 2 + 0.8) / Math.tan((camera.fov * Math.PI) / 360) / camera.aspect)
      camera.position.set(0, dist * 0.42, dist)
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
    let downAt = 0
    const onDown = () => { downAt = performance.now() }
    const onUp = (ev: PointerEvent) => {
      if (performance.now() - downAt > 250) return
      const r = canvas.getBoundingClientRect()
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const hit = ray.intersectObjects(items.map((x) => x.hit))[0]
      if (hit) pickRef.current(hit.object.userData.sym)
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)

    let visible = true, raf = 0
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting })
    io.observe(canvas)
    const t0 = performance.now()
    const still = reducedMotion()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible) return
      const t = (performance.now() - t0) / 1000
      items.forEach(({ sym, g }, i) => {
        // samples are placed on the shelf one after another
        const k = still ? 1 : Math.min(1, Math.max(0, (t - i * 0.12) / 0.5))
        const lift = selRef.current === sym ? 0.25 : 0
        g.scale.setScalar(Math.max(0.001, 1 - (1 - k) ** 3))
        g.position.y += (lift - g.position.y) * 0.15
        if (!still) g.rotation.y = t * 0.35 + i
        g.traverse((c) => {
          if (c.userData.pulse) ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(t * 3 + i) * 0.08
        })
      })
      controls.update()
      renderer.render(scene, camera)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose()
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerup', onUp)
      disposeTree(scene); scene.environment?.dispose(); renderer.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return <canvas ref={ref} className="shelf3d" style={{ height }} role="img" aria-label={`מדף דגימות: ${syms.join(', ')}. לחצו על דגימה כדי לבחור.`} />
}
