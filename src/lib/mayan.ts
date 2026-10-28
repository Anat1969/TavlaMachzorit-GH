// The "Mayan" arrangement (Mitch Fincher, mayanperiodic.com): every period is a ring,
// the noble gases stand on one vertical line above the centre, and the number of hops
// an element needs to reach that line predicts how eagerly it reacts and in what ratio.
import { ELEMENTS, type Element } from '../data/elements'
import { FORMULA_SET, COMPOUNDS, parseFormula, formatFormula } from '../data/compounds'

export const PERIOD_LEN = [2, 8, 8, 18, 18, 32, 32]
const START = [1, 3, 11, 19, 37, 55, 87]
export const RING_R = (p: number) => 46 + (p - 1) * 52 // radius of period p (1..7)
export const VIEW = 400 // the drawing spans -VIEW..VIEW

export interface RingPos { x: number; y: number; ang: number; size: number; ringHops: number }

/** Place an element on its ring: the period closes at the top, so alkali metals sit just right of the line, halogens just left. */
export function ringPos(e: Element): RingPos {
  const p = e.period, n = PERIOD_LEN[p - 1], i = e.z - START[p - 1]
  const ang = -Math.PI / 2 + ((i + 1) / n) * Math.PI * 2
  const r = RING_R(p)
  return {
    x: Math.cos(ang) * r, y: Math.sin(ang) * r, ang,
    size: Math.max(18, Math.min(42, (2 * Math.PI * r) / n - 6)),
    ringHops: e.cat === 'noble' ? 0 : Math.min(i + 1, n - 1 - i),
  }
}

export type Side = 'give' | 'take' | 'both'
export interface Hops { n: number; side: Side }

/**
 * Hops to the noble-gas line, counted over the s and p blocks only.
 * In periods 2–3 this is exactly the number of tiles on the ring; in the long rings the
 * d and f blocks sit in between, and counting them would give gallium five hops instead of three.
 * null: the rule says nothing about this element (d and f blocks).
 */
export function hops(e: Element): Hops | null {
  if (e.cat === 'noble') return { n: 0, side: 'both' }
  if (e.z === 1) return { n: 1, side: 'both' }
  const g = e.group
  if (g === null || (g >= 3 && g <= 12)) return null
  if (g <= 2) return { n: g, side: 'give' }
  if (g === 13) return { n: 3, side: 'give' }
  if (g === 14) return { n: 4, side: 'both' }
  return { n: 18 - g, side: 'take' }
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

export interface Prediction {
  giver: Element; taker: Element; gh: number; th: number
  parts: [string, number][]; formula: string; known: boolean
}

/** One side loses electrons, the other gains them; the hops must balance. */
export function predict(a: Element, b: Element): Prediction | null {
  const ha = hops(a), hb = hops(b)
  if (!ha || !hb || !ha.n || !hb.n || a.sym === b.sym) return null
  const canGive = (h: Hops) => h.side !== 'take'
  const canTake = (h: Hops) => h.side !== 'give'
  let giver: Element, taker: Element, gh: number, th: number
  // prefer the reading where the less electronegative element gives
  const aFirst = (a.en ?? 0) <= (b.en ?? 0)
  if (canGive(ha) && canTake(hb) && (aFirst || !(canGive(hb) && canTake(ha)))) { giver = a; taker = b; gh = ha.n; th = hb.n }
  else if (canGive(hb) && canTake(ha)) { giver = b; taker = a; gh = hb.n; th = ha.n }
  else return null
  const k = gcd(gh, th)
  const parts: [string, number][] = [[giver.sym, th / k], [taker.sym, gh / k]]
  const formula = formatFormula(parts)
  return { giver, taker, gh, th, parts, formula, known: FORMULA_SET.has(formula) }
}

/**
 * How reliable is the rule? For every binary compound in the sample whose two elements the rule
 * covers, does it predict exactly that ratio? Compounds the rule cannot read are counted separately.
 */
export const RELIABILITY = (() => {
  let tested = 0, hit = 0
  const misses: string[] = []
  for (const c of COMPOUNDS) {
    const parts = parseFormula(c.formula)
    if (parts.length !== 2) continue
    const A = ELEMENTS.find((e) => e.sym === parts[0][0])!, B = ELEMENTS.find((e) => e.sym === parts[1][0])!
    const p = predict(A, B)
    if (!p) continue
    tested++
    // the sample may hold several oxidation states of one pair; the rule names only one
    if (p.formula === c.formula) hit++
    else if (misses.length < 12) misses.push(c.formula)
  }
  return { tested, hit, misses, total: COMPOUNDS.length }
})()

/** An arc along ring p from angle a0 to a1 (radians), for drawing the hop path. */
export function arcPath(p: number, a0: number, a1: number) {
  const r = RING_R(p)
  const x0 = Math.cos(a0) * r, y0 = Math.sin(a0) * r, x1 = Math.cos(a1) * r, y1 = Math.sin(a1) * r
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0
  const sweep = a1 > a0 ? 1 : 0
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} ${sweep} ${x1.toFixed(1)},${y1.toFixed(1)}`
}
