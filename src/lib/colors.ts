import type { Element } from '../data/elements'

export type ColorBy = 'cat' | 'geo' | 'en' | 'radius' | 'ie'

export const COLOR_BY: { id: ColorBy; label: string }[] = [
  { id: 'cat', label: 'משפחה' },
  { id: 'geo', label: 'גיאוכימיה' },
  { id: 'en', label: 'אלקטרושליליות' },
  { id: 'radius', label: 'רדיוס' },
  { id: 'ie', label: 'אנרגיית יינון' },
]

const RANGE = { en: [0.7, 4.0], radius: [28, 260], ie: [3.8, 24.6] } as const

// one consistent sequential ramp for every numeric property (low = deep blue, high = warm)
function ramp(t: number) {
  const stops = [[52, 86, 170], [80, 170, 210], [140, 225, 180], [240, 220, 120], [255, 140, 100]]
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(x)), f = x - i
  const c = stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}
export const RAMP_CSS = `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1].map(ramp).join(',')})`

export function colorOf(e: Element, by: ColorBy = 'cat'): string {
  if (by === 'cat') return `var(--c-${e.cat})`
  if (by === 'geo') return `var(--g-${e.geo})`
  const v = e[by]
  if (v === null) return 'var(--g-synthetic)'
  const [lo, hi] = RANGE[by]
  return ramp((v - lo) / (hi - lo))
}
export const RANGE_LABEL = RANGE
