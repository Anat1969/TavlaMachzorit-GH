// Motion that explains: shared helpers for moving elements between arrangements.
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

export type P = { x: number; y: number }

export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Glide every point from where it is now to its new target.
 * `from` is used once, on the first render (e.g. start from the classic table).
 */
export function useTween(target: Map<string, P>, duration = 1100, from?: Map<string, P>) {
  const [cur, setCur] = useState<Map<string, P>>(() => (reducedMotion() ? target : from ?? target))
  const curRef = useRef(cur)
  useEffect(() => {
    const start = curRef.current
    if (reducedMotion() || start === target) { curRef.current = target; setCur(target); return }
    let raf = 0
    const t0 = performance.now()
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration)
      const e = ease(k)
      const m = new Map<string, P>()
      for (const [id, p] of target) {
        const f = start.get(id) ?? p
        m.set(id, { x: f.x + (p.x - f.x) * e, y: f.y + (p.y - f.y) * e })
      }
      curRef.current = m
      setCur(m)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return cur
}

export type Box = P & { w: number; h: number }

/** Centres of the grid cells (by symbol), relative to the container, kept current on resize. */
export function useCellBoxes(ref: RefObject<HTMLElement>) {
  const [pos, setPos] = useState<Map<string, Box>>(new Map())
  useLayoutEffect(() => {
    const box = ref.current
    if (!box) return
    const measure = () => {
      const r0 = box.getBoundingClientRect()
      const m = new Map<string, Box>()
      box.querySelectorAll<HTMLElement>('[data-sym]').forEach((c) => {
        const r = c.getBoundingClientRect()
        m.set(c.dataset.sym!, { x: r.left - r0.left + r.width / 2, y: r.top - r0.top + r.height / 2, w: r.width, h: r.height })
      })
      setPos(m)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    return () => ro.disconnect()
  }, [ref])
  return pos
}
