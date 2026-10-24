// A rotating studio shot of a real sample of one element.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { reducedMotion } from '../lib/motion'
import { disposeTree, sample, studioEnvironment, studioLights, studioRenderer } from './matter'

export default function Sample3D({ sym, height = 210 }: { sym: string; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const renderer = studioRenderer(canvas)
    const scene = new THREE.Scene()
    scene.environment = studioEnvironment(renderer)
    studioLights(scene)

    // floor that only receives the soft shadow, so the sample sits on the card
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.35 }))
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    const obj = sample(sym)
    scene.add(obj)

    // frame the sample by its real size, so tall flasks and flat dishes both fit
    const bb = new THREE.Box3().setFromObject(obj)
    const c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3())
    const dist = Math.max(sz.x, sz.y * 1.4, sz.z) * 1.75 + 0.7
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
    camera.position.set(dist * 0.6, c.y + dist * 0.38, dist * 0.8)
    const controls = new OrbitControls(camera, canvas)
    controls.target.copy(c)
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableDamping = true
    controls.autoRotate = !reducedMotion()
    controls.autoRotateSpeed = 1.6
    controls.minPolarAngle = 0.3
    controls.maxPolarAngle = 1.45

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // render only while visible
    let visible = true, raf = 0
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting })
    io.observe(canvas)
    const clock = new THREE.Clock()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible) return
      const t = clock.getElapsedTime()
      obj.traverse((c) => {
        if (c.userData.pulse) ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(t * 3) * 0.08 + Math.sin(t * 17) * 0.03
      })
      if (obj.userData.spin) (obj.userData.spin as THREE.Object3D).rotation.y = t * 0.5
      controls.update()
      renderer.render(scene, camera)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose()
      disposeTree(scene); scene.environment?.dispose(); renderer.dispose()
    }
  }, [sym])
  return <canvas ref={ref} className="sample3d" style={{ height }} aria-label={`דגימה תלת־ממדית של ${sym}. גררו כדי לסובב.`} role="img" />
}
