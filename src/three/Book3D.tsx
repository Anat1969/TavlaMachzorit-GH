// A 3D book on a table. Every lesson's diagram lifts off the right-hand page, and turning
// to the next lesson turns a real page. Inspired by "Every Joule" (iamtechartist.com), rebuilt
// for chemistry: the diagram is the rule, drawn as a small machine you can turn around.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { reducedMotion } from '../lib/motion'
import { disposeTree, studioEnvironment, studioLights, studioRenderer } from './matter'

const PAGE_W = 2.1, PAGE_D = 2.8, BOOK_H = 0.18

const mat = (color: string, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, metalness: 0, clearcoat: 0.3, ...opts })
const ball = (r: number, color: string, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), mat(color, opts))
  m.castShadow = true
  return m
}
const rod = (a: THREE.Vector3, b: THREE.Vector3, r = 0.025, color = '#d8d2c4') => {
  const len = a.distanceTo(b)
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color))
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  m.castShadow = true
  return m
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

const C = { metal: '#c9cdd2', oxygen: '#e0584f', alkali: '#ff7a6b', halogen: '#e6d36b', electron: '#e8a54b', carbon: '#3a3a3e', nitrogen: '#6fa8ff', white: '#f4f1ea', dark: '#1d1d22', gas: '#9be07a', bad: '#ff5c5c' }

type Diagram = THREE.Group & { userData: { update?: (t: number) => void } }

/** One builder per lesson. Each returns a group about 1.6 wide that sits on the page. */
const BUILD: Record<string, () => Diagram> = {
  charge() {
    const g = new THREE.Group() as Diagram
    const al = [v(-0.45, 0.35, 0), v(0.45, 0.35, 0)].map((p) => { const b = ball(0.22, C.metal, { metalness: 0.8, roughness: 0.25 }); b.position.copy(p); g.add(b); return b })
    const o = [v(-0.75, 0.35, 0.55), v(0, 0.35, 0.55), v(0.75, 0.35, 0.55)].map((p) => { const b = ball(0.17, C.oxygen); b.position.copy(p); g.add(b); return b })
    // six electrons: each Al gives three, each O takes two
    const trips = [0, 0, 0, 1, 1, 1].map((ai, i) => ({ from: al[ai].position, to: o[Math.floor(i / 2)].position, e: ball(0.05, C.electron, { emissive: C.electron, emissiveIntensity: 0.6 }) }))
    trips.forEach((t) => g.add(t.e))
    g.userData.update = (t) => trips.forEach((tr, i) => { const k = (Math.sin(t * 1.4 - i * 0.5) + 1) / 2; tr.e.position.lerpVectors(tr.from, tr.to, k).add(v(0, 0.35 * Math.sin(k * Math.PI), 0)) })
    return g
  },
  column() {
    const g = new THREE.Group() as Diagram
    const sizes = [0.12, 0.17, 0.22, 0.26]
    const balls = sizes.map((r, i) => { const b = ball(r, C.alkali); b.position.set(-0.5, 0.25 + i * 0.5, 0); g.add(b); return b })
    for (let i = 0; i < 3; i++) g.add(rod(balls[i].position, balls[i + 1].position, 0.015))
    const cl = ball(0.2, C.halogen); cl.position.set(0.45, 0.9, 0); g.add(cl)
    g.userData.update = (t) => { const i = Math.floor(t / 1.6) % 4; balls.forEach((b, j) => b.scale.setScalar(j === i ? 1.25 : 1)); cl.position.y = balls[i].position.y }
    return g
  },
  size() {
    const g = new THREE.Group() as Diagram
    const hands = (n: number, color: string, x: number) => {
      const b = ball(0.28, color); b.position.set(x, 0.5, 0); g.add(b)
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.add(rod(b.position, b.position.clone().add(v(Math.cos(a) * 0.55, 0.15, Math.sin(a) * 0.55)), 0.02, '#a9b3ba')) }
    }
    hands(1, '#ff8fc7', -0.55); hands(3, '#6fa8ff', 0.55)
    return g
  },
  bonds() {
    const g = new THREE.Group() as Diagram
    const na = ball(0.14, C.alkali); na.position.set(-0.75, 0.35, 0); g.add(na)
    const cl = ball(0.24, C.halogen); cl.position.set(-0.4, 0.35, 0); g.add(cl)
    const cloud1 = new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 16), mat(C.electron, { transparent: true, opacity: 0.25 })); cloud1.position.copy(cl.position); g.add(cloud1)
    const a = ball(0.16, C.halogen), b = ball(0.16, C.halogen); a.position.set(0.0, 0.35, 0); b.position.set(0.28, 0.35, 0); g.add(a, b)
    const cloud2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), mat(C.electron, { transparent: true, opacity: 0.3 })); cloud2.scale.set(1.6, 0.8, 0.8); cloud2.position.set(0.14, 0.35, 0); g.add(cloud2)
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const m = ball(0.07, '#d9a066', { metalness: 0.9, roughness: 0.2 }); m.position.set(0.6 + i * 0.16, 0.2 + j * 0.16, 0); g.add(m) }
    const sea = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), mat(C.electron, { transparent: true, opacity: 0.18 })); sea.position.set(0.76, 0.36, 0); g.add(sea)
    g.userData.update = (t) => { cloud2.scale.x = 1.6 + Math.sin(t * 2) * 0.1; (sea.material as THREE.MeshPhysicalMaterial).opacity = 0.14 + Math.sin(t * 3) * 0.06 }
    return g
  },
  structure() {
    const g = new THREE.Group() as Diagram
    // diamond: one atom bonded to four in a tetrahedron
    const c0 = v(-0.5, 0.55, 0)
    const tet = [v(1, 1, 1), v(1, -1, -1), v(-1, 1, -1), v(-1, -1, 1)].map((d) => c0.clone().add(d.multiplyScalar(0.17)))
    const center = ball(0.09, C.carbon); center.position.copy(c0); g.add(center)
    tet.forEach((p) => { const b = ball(0.08, C.carbon); b.position.copy(p); g.add(b); g.add(rod(c0, p, 0.018, '#8a8f95')) })
    // graphite: three flat sheets that slide over each other
    const sheets: THREE.Group[] = []
    for (let k = 0; k < 3; k++) {
      const s = new THREE.Group()
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, n = ((i + 1) / 6) * Math.PI * 2; const p = v(Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22), q = v(Math.cos(n) * 0.22, 0, Math.sin(n) * 0.22); const b = ball(0.04, C.carbon); b.position.copy(p); s.add(b); s.add(rod(p, q, 0.012, '#8a8f95')) }
      s.position.set(0.5, 0.25 + k * 0.22, 0); sheets.push(s); g.add(s)
    }
    g.userData.update = (t) => sheets.forEach((s, k) => { s.position.x = 0.5 + Math.sin(t * 1.2 + k) * 0.12 })
    return g
  },
  stability() {
    const g = new THREE.Group() as Diagram
    const geo = new THREE.PlaneGeometry(1.8, 1.4, 60, 40)
    const pos = geo.attributes.position
    const h = (x: number, y: number) => 0.25 + 0.18 * Math.cos(x * 3.2) + 0.08 * Math.sin(y * 4)
    for (let i = 0; i < pos.count; i++) pos.setZ(i, h(pos.getX(i), pos.getY(i)))
    geo.computeVertexNormals()
    const land = new THREE.Mesh(geo, mat('#7a8f9f', { roughness: 0.8 })); land.rotation.x = -Math.PI / 2; land.receiveShadow = true; g.add(land)
    const marble = ball(0.08, C.electron, { metalness: 0.3 }); g.add(marble)
    g.userData.update = (t) => {
      const x = Math.PI / 3.2 * (1 - Math.exp(-((t % 4) * 1.2))) * Math.cos(t * 2.2 * Math.exp(-(t % 4) * 0.3)) * 0.6 + Math.PI / 3.2
      const y = 0
      marble.position.set(x - 0.35, h(x - 0.35, -y) + 0.08, y)
    }
    return g
  },
  piezo() {
    const g = new THREE.Group() as Diagram
    const cube = new THREE.Group()
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) { const b = ball(0.08, (i + j + k) % 2 ? C.alkali : C.halogen); b.position.set(i * 0.3, j * 0.3, k * 0.3); cube.add(b) }
    cube.position.set(-0.75, 0.15, -0.15); g.add(cube)
    const prism = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.45, 6), mat('#cfd6dc', { transmission: 0, transparent: true, opacity: 0.85 })); prism.position.set(0.45, 0.38, 0); prism.castShadow = true; g.add(prism)
    const plateA = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.5), mat('#5e6b73')), plateB = plateA.clone()
    g.add(plateA, plateB)
    const sparks = [0, 1, 2, 3].map(() => { const s = ball(0.035, C.electron, { emissive: C.electron, emissiveIntensity: 1.2 }); g.add(s); return s })
    g.userData.update = (t) => {
      const p = Math.max(0, Math.sin(t * 2.4)) * 0.06
      plateA.position.set(-0.6, 0.62 - p, 0); plateB.position.set(0.45, 0.66 - p, 0)
      prism.scale.y = 1 - p * 1.2
      sparks.forEach((s, i) => { s.visible = p > 0.03; s.position.set(0.45 + Math.cos(i * 1.6 + t * 6) * 0.3, 0.38 + Math.sin(i * 2.1 + t * 5) * 0.15, Math.sin(i + t * 4) * 0.3) })
    }
    return g
  },
  gap() {
    const g = new THREE.Group() as Diagram
    const white = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.55), mat(C.white, { roughness: 0.9 })); white.position.set(-0.5, 0.2, 0); white.castShadow = true
    const black = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.55), mat(C.dark, { roughness: 0.6 })); black.position.set(0.5, 0.2, 0); black.castShadow = true
    g.add(white, black)
    const rays = [-0.5, 0.5].flatMap((x) => [0, 1].map((k) => { const r = rod(v(x - 0.4, 1.2, 0), v(x, 0.42, 0), 0.015, '#ffd76b'); (r.material as THREE.MeshPhysicalMaterial).emissive = new THREE.Color('#ffb800'); r.userData = { x, k }; g.add(r); return r }))
    const back = rod(v(-0.5, 0.42, 0), v(-0.1, 1.2, 0), 0.015, '#ffd76b'); (back.material as THREE.MeshPhysicalMaterial).emissive = new THREE.Color('#ffb800'); g.add(back)
    g.userData.update = (t) => { const k = (Math.sin(t * 2) + 1) / 2; rays.forEach((r) => r.scale.y = 0.6 + 0.4 * k); back.scale.y = 0.6 + 0.4 * k; (black.material as THREE.MeshPhysicalMaterial).emissive = new THREE.Color('#3a1d0a').multiplyScalar(k) }
    return g
  },
  water() {
    const g = new THREE.Group() as Diagram
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), mat('#8a8578')); block.position.set(0, 0.15, 0); block.castShadow = true; g.add(block)
    const drops = [0, 1, 2].map((i) => { const d = ball(0.05, '#7fd6ff', { transparent: true, opacity: 0.8 }); d.userData.x = -0.2 + i * 0.2; g.add(d); return d })
    const bubbles = [0, 1, 2, 3, 4].map(() => { const b = ball(0.06, C.gas, { transparent: true, opacity: 0.55, emissive: C.gas, emissiveIntensity: 0.3 }); g.add(b); return b })
    g.userData.update = (t) => {
      drops.forEach((d, i) => { const k = ((t * 0.8 + i * 0.33) % 1); d.position.set(d.userData.x, 1.3 - k * 1.0, 0) })
      bubbles.forEach((b, i) => { const k = ((t * 0.5 + i * 0.2) % 1); b.position.set(Math.sin(i * 2 + t) * 0.25, 0.32 + k * 1.0, Math.cos(i * 3) * 0.2); b.scale.setScalar(0.6 + k) })
    }
    return g
  },
  giver() {
    const g = new THREE.Group() as Diagram
    const colors = ['#c9cdd2', '#ff7a6b', '#ffb36b', '#6fa8ff']
    const metal = ball(0.2, colors[0], { metalness: 0.7, roughness: 0.3 }); metal.position.set(-0.45, 0.45, 0)
    const o = ball(0.18, C.oxygen); o.position.set(0.0, 0.45, 0)
    const o2 = ball(0.18, C.oxygen); o2.position.set(0.55, 0.45, 0)
    const m2 = ball(0.2, C.metal, { metalness: 0.7, roughness: 0.3 }); m2.position.set(1.0, 0.45, 0)
    g.add(metal, o, rod(metal.position, o.position), o2, m2, rod(o2.position, m2.position))
    g.userData.update = (t) => {
      const i = Math.floor(t / 1.2) % colors.length
      ;(metal.material as THREE.MeshPhysicalMaterial).color.set(colors[i])
      const bad = Math.floor(t / 1.2) % 2 === 1
      ;(o2.material as THREE.MeshPhysicalMaterial).color.set(bad ? C.bad : C.oxygen)
      o2.position.y = 0.45 + (bad ? Math.sin(t * 30) * 0.02 : 0)
    }
    return g
  },
}

export interface Page { id: string; n: number; title: string; rule: string }

export default function Book3D({ page, onReady }: { page: Page; onReady?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const api = useRef<{ show: (p: Page) => void } | null>(null)

  useEffect(() => {
    const canvas = ref.current!
    const renderer = studioRenderer(canvas)
    const scene = new THREE.Scene()
    scene.environment = studioEnvironment(renderer)
    studioLights(scene)
    const calm = reducedMotion()

    // the table and the book
    const table = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat('#6b5240', { roughness: 0.85 }))
    table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table)
    const mat2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.02, 3.8), mat('#5e7a78', { roughness: 0.95 })); mat2.position.y = 0.01; mat2.receiveShadow = true; scene.add(mat2)
    const cover = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W * 2 + 0.16, 0.04, PAGE_D + 0.16), mat('#c9962f', { roughness: 0.6 })); cover.position.y = 0.04; cover.castShadow = true; cover.receiveShadow = true; scene.add(cover)
    const paper = mat('#f3ecdc', { roughness: 0.95, clearcoat: 0 })
    const left = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W, BOOK_H, PAGE_D), paper); left.position.set(-PAGE_W / 2, 0.06 + BOOK_H / 2, 0)
    const right = left.clone(); right.position.x = PAGE_W / 2
    left.receiveShadow = right.receiveShadow = true; left.castShadow = right.castShadow = true
    scene.add(left, right)
    // the left page is printed: lesson number, name and rule, drawn on a canvas in Hebrew
    const pc = document.createElement('canvas'); pc.width = 768; pc.height = 1024
    const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace; ptex.anisotropy = 4
    const print = new THREE.Mesh(new THREE.PlaneGeometry(PAGE_W * 0.92, PAGE_D * 0.92), new THREE.MeshStandardMaterial({ map: ptex, transparent: true, roughness: 1 }))
    print.rotation.x = -Math.PI / 2; print.position.set(-PAGE_W / 2, 0.06 + BOOK_H + 0.002, 0); scene.add(print)
    const printPage = (p: Page) => {
      const x = pc.getContext('2d')!
      x.clearRect(0, 0, pc.width, pc.height)
      x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = '#6b5f50'
      x.font = '36px "IBM Plex Mono", monospace'; x.fillText(`שיעור ${p.n}`, 700, 110)
      x.fillStyle = '#2a2320'; x.font = '84px "Frank Ruhl Libre", Georgia, serif'; x.fillText(p.title, 700, 215)
      x.fillStyle = '#c9962f'; x.fillRect(560, 245, 140, 5)
      x.fillStyle = '#3d342c'; x.font = '50px "Frank Ruhl Libre", Georgia, serif'
      const words = p.rule.split(' '); let line = '', y = 330
      for (const w of words) { const test = line ? `${line} ${w}` : w; if (x.measureText(test).width > 620) { x.fillText(line, 700, y); line = w; y += 72 } else line = test }
      if (line) x.fillText(line, 700, y)
      x.fillStyle = '#9a8e7d'
      for (let i = 0; i < 6; i++) x.fillRect(80 + (i % 3 === 2 ? 200 : 0), y + 110 + i * 46, i % 3 === 2 ? 420 : 620, 6)
      ptex.needsUpdate = true
    }
    // a turning page, hinged on the spine
    const hinge = new THREE.Group(); hinge.position.set(0, 0.06 + BOOK_H + 0.004, 0); scene.add(hinge)
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W, 0.008, PAGE_D), paper); leaf.position.x = PAGE_W / 2; leaf.castShadow = true; hinge.add(leaf)
    hinge.visible = false
    // ribbon
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.005, 1.2), mat('#27408b')); ribbon.position.set(0.15, 0.065, PAGE_D / 2 + 0.5); scene.add(ribbon)

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60)
    camera.position.set(0.5, 2.9, 4.4)
    const controls = new OrbitControls(camera, canvas)
    controls.target.set(0.4, 0.55, 0)
    controls.enablePan = false; controls.enableDamping = true
    controls.minDistance = 3; controls.maxDistance = 8; controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.25

    const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix() }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(canvas)

    let diagram: Diagram | null = null
    let shownAt = 0, turnAt = -10
    const clock = new THREE.Clock()
    const show = (p: Page) => {
      if (diagram) { scene.remove(diagram); disposeTree(diagram) }
      printPage(p)
      document.fonts?.ready.then(() => printPage(p))
      const build = BUILD[p.id]
      diagram = build ? build() : null
      if (diagram) { diagram.position.set(PAGE_W / 2, 0.06 + BOOK_H, 0); scene.add(diagram) }
      shownAt = clock.getElapsedTime()
      turnAt = shownAt
    }
    api.current = { show }
    show(page)
    onReady?.()

    let raf = 0, visible = true
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting }); io.observe(canvas)
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible) return
      const t = clock.getElapsedTime()
      // page turn: the leaf sweeps from right to left in 0.8s
      const k = calm ? 1 : Math.min(1, (t - turnAt) / 0.8)
      hinge.visible = k < 1
      hinge.rotation.z = k * Math.PI
      // the diagram lifts off the page after the turn
      if (diagram) {
        const r = calm ? 1 : Math.min(1, Math.max(0, (t - shownAt - 0.5) / 0.9))
        const ease = 1 - Math.pow(1 - r, 3)
        diagram.position.y = 0.06 + BOOK_H + ease * 0.12
        diagram.scale.set(1.1, 1.1 * Math.max(0.02, ease), 1.1)
        if (!calm && r >= 1) diagram.userData.update?.(t - shownAt)
        else if (calm) diagram.userData.update?.(1.3)
      }
      controls.update()
      renderer.render(scene, camera)
    }
    loop()
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose(); disposeTree(scene); scene.environment?.dispose(); renderer.dispose() }
  }, [])

  useEffect(() => { api.current?.show(page) }, [page.id])

  return <canvas ref={ref} className="book3d" role="img" aria-label="ספר תלת־ממדי. האיור של השיעור עולה מהדף. גררו כדי לסובב." />
}
