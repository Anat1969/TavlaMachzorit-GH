// Physically based "matter": what a real sample of each element looks like.
// Loaded lazily (three.js is large), only when a 3D view is on screen.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EVERYDAY, type Everyday } from '../data/everyday'

export function info(sym: string): Everyday {
  return EVERYDAY.get(sym) ?? { state: 's', kind: 'synth', look: '#9aa0b0', rough: 0.3, uses: [] }
}

/** A renderer set up like a photo studio: filmic tone mapping, soft shadows, sRGB. */
export function studioRenderer(canvas: HTMLCanvasElement) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
  r.setPixelRatio(Math.min(2, window.devicePixelRatio))
  r.toneMapping = THREE.ACESFilmicToneMapping
  r.toneMappingExposure = 1.05
  r.outputColorSpace = THREE.SRGBColorSpace
  r.shadowMap.enabled = true
  r.shadowMap.type = THREE.PCFSoftShadowMap
  return r
}

/** Soft studio reflections, so metals mirror a room instead of black. */
export function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const pm = new THREE.PMREMGenerator(renderer)
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture
  pm.dispose()
  return env
}

export function studioLights(scene: THREE.Scene) {
  const key = new THREE.DirectionalLight(0xffffff, 2.2)
  key.position.set(2.5, 4, 2)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.radius = 6
  key.shadow.camera.near = 0.5
  key.shadow.camera.far = 12
  ;(['left', 'right', 'top', 'bottom'] as const).forEach((k, i) => { key.shadow.camera[k] = i % 2 ? -2.5 : 2.5 })
  scene.add(key)
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x302820, 0.6))
  const rim = new THREE.DirectionalLight(0x9fc4ff, 1.1)
  rim.position.set(-3, 2, -3)
  scene.add(rim)
}

/** The surface material of the element itself. */
export function surface(sym: string): THREE.MeshPhysicalMaterial {
  const e = info(sym)
  const color = new THREE.Color(e.look)
  switch (e.kind) {
    case 'metal':
      return new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: e.rough, clearcoat: e.rough < 0.15 ? 0.6 : 0, clearcoatRoughness: 0.1 })
    case 'semi':
      return new THREE.MeshPhysicalMaterial({ color, metalness: 0.7, roughness: e.rough, flatShading: true, clearcoat: 0.4 })
    case 'crystal':
      return sym === 'S'
        ? new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.35, clearcoat: 0.6, flatShading: true, sheen: 0.3, sheenColor: color })
        : new THREE.MeshPhysicalMaterial({ color, metalness: sym === 'C' ? 0.45 : 0.6, roughness: e.rough, flatShading: true, clearcoat: 0.3 })
    case 'powder':
      return new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.95, sheen: 0.4, sheenColor: color })
    case 'liquid':
      return sym === 'Hg'
        ? new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.02 })
        : new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.92 })
    case 'gas':
      return glass()
    case 'synth':
      return new THREE.MeshPhysicalMaterial({ color: 0x8fa6ff, metalness: 0.2, roughness: 0.4, emissive: 0x3050ff, emissiveIntensity: 0.4, transparent: true, opacity: 0.35, wireframe: true })
  }
}

// Clear glass that keeps its contents visible (a transmission pass would hide the glowing gas inside).
export function glass() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.18,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide,
  })
}

/** A gas is something we see by its glow (a discharge tube, a neon sign) or its tint. */
export function gasCore(sym: string, radius: number) {
  const e = info(sym)
  const c = new THREE.Color(e.glow ?? e.look)
  const mat = new THREE.MeshBasicMaterial({
    color: c, transparent: true, opacity: e.glow ? 0.7 : 0.38, depthWrite: false,
    blending: e.glow ? THREE.AdditiveBlending : THREE.NormalBlending,
  })
  const core = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat)
  core.userData.pulse = !!e.glow
  return core
}

const rand = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

/** A physical sample: ingot, shard, crystals, powder, flask or vial. Centred on the floor at y=0. */
export function sample(sym: string): THREE.Group {
  const e = info(sym)
  const g = new THREE.Group()
  const mat = surface(sym)
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, ry = 0, rx = 0) => {
    const mesh = new THREE.Mesh(geo, m)
    mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, 0)
    mesh.castShadow = true; mesh.receiveShadow = true
    g.add(mesh)
    return mesh
  }
  const r = rand(sym.charCodeAt(0) * 31 + (sym.charCodeAt(1) || 7))

  if (e.kind === 'metal') {
    add(new RoundedBoxGeometry(1.1, 0.62, 0.8, 6, 0.1), mat, -0.1, 0.31, 0, 0.5)
    add(new THREE.SphereGeometry(0.22, 48, 32), mat, 0.62, 0.22, 0.45)
    add(new RoundedBoxGeometry(0.34, 0.2, 0.3, 4, 0.05), mat, 0.55, 0.1, -0.35, 1.1)
  } else if (e.kind === 'semi') {
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.IcosahedronGeometry(0.42 - i * 0.07, 0)
      geo.scale(1, 1.3 + r() * 0.4, 0.8)
      add(geo, mat, (r() - 0.5) * 0.9, 0.3 - i * 0.04, (r() - 0.5) * 0.7, r() * 3, r() * 0.6)
    }
  } else if (e.kind === 'crystal') {
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.OctahedronGeometry(0.36 - i * 0.035, 0)
      geo.scale(0.8, 1.4, 0.8)
      add(geo, mat, (r() - 0.5) * 1.0, 0.35 - i * 0.03, (r() - 0.5) * 0.7, r() * 3, (r() - 0.5) * 0.8)
    }
  } else if (e.kind === 'powder') {
    const dish = new THREE.MeshPhysicalMaterial({ color: 0xf2f2f0, roughness: 0.25, clearcoat: 0.8 })
    add(new THREE.CylinderGeometry(0.85, 0.7, 0.12, 64), dish, 0, 0.06, 0)
    const pts: THREE.Vector2[] = []
    for (let i = 0; i <= 24; i++) { const x = (i / 24) * 0.72; pts.push(new THREE.Vector2(x, 0.42 * Math.exp(-((x / 0.36) ** 2)))) }
    const pile = new THREE.LatheGeometry(pts.reverse(), 64)
    const pos = pile.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) * (0.9 + r() * 0.2))
    pile.computeVertexNormals()
    add(pile, mat, 0, 0.12, 0)
  } else if (e.kind === 'gas') {
    const gl = glass()
    add(new THREE.SphereGeometry(0.62, 64, 48), gl, 0, 0.66, 0)
    add(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 32, 1, true), gl, 0, 1.45, 0)
    add(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 32), new THREE.MeshPhysicalMaterial({ color: 0x8a6a4a, roughness: 0.8 }), 0, 1.71, 0)
    const core = gasCore(sym, 0.57)
    core.position.set(0, 0.66, 0)
    g.add(core)
    if (e.glow) {
      const light = new THREE.PointLight(new THREE.Color(e.glow), 2.5, 3)
      light.position.set(0, 0.66, 0)
      g.add(light)
    }
  } else if (e.kind === 'liquid') {
    const gl = glass()
    add(new THREE.CylinderGeometry(0.38, 0.38, 1.3, 64, 1, true), gl, 0, 0.65, 0)
    add(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 64), gl, 0, 0.02, 0)
    add(new THREE.CylinderGeometry(0.35, 0.35, 0.55, 64), mat, 0, 0.3, 0)
    if (sym === 'Br') {
      const vapour = new THREE.MeshBasicMaterial({ color: 0xa0401c, transparent: true, opacity: 0.22, depthWrite: false })
      add(new THREE.CylinderGeometry(0.35, 0.35, 0.6, 48), vapour, 0, 0.88, 0)
    }
  } else {
    // synthetic: no sample exists, only a handful of atoms that decay
    const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.62, 1)), new THREE.LineBasicMaterial({ color: 0x8fb0ff, transparent: true, opacity: 0.7 }))
    shell.position.y = 0.7
    g.add(shell)
    const atoms = new THREE.MeshPhysicalMaterial({ color: 0xbcd0ff, emissive: 0x5070ff, emissiveIntensity: 0.8, roughness: 0.3 })
    for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.05, 16, 12), atoms, (r() - 0.5) * 0.6, 0.7 + (r() - 0.5) * 0.6, (r() - 0.5) * 0.6)
    g.userData.spin = shell
  }
  return g
}

export function disposeTree(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh
    m.geometry?.dispose()
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
    mats.forEach((x) => { (x as THREE.MeshStandardMaterial).map?.dispose(); x.dispose() })
  })
}

/** CSS colours (including var(--token)) resolved for canvas and WebGL. */
export function cssColor(c: string) {
  const m = c.match(/var\((--[^)]+)\)/)
  return m ? getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() || '#888' : c
}
