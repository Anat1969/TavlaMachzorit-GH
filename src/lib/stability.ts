// The stability oracle: computed thermodynamic stability of binary compounds from the
// Materials Project open database (AWS Open Data, thermo collection, GGA/GGA+U/r2SCAN mix,
// build 2026-09-28). Energy above hull: 0 means no mix of other compounds is lower in energy.
// Known materials are rarely far above the hull: Sun et al., Science Advances 2016, found that
// most known inorganic crystals sit within about 70 meV per atom of it.
import MP from '../data/mp-binary.json'

export type Status = 'stable' | 'meta' | 'unstable' | 'absent'
export interface MPEntry { formula: string; id: string; ehull: number; eform: number | null; spacegroup: string; decomposes: string[] }

export const META_LIMIT = 0.07 // eV per atom
export const MP_BUILD = '2026-09-28' // rebuild: scripts/fetch-mp-binary.py
const DATA = MP as unknown as Record<string, [string, string, number, number | null, string, string[]]>
export const MP_COUNT = Object.keys(DATA).length

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

/** Reduced composition key, element symbols sorted: Al2O3 -> "Al2O3", OPd -> "O1Pd1". */
export function compKey(parts: [string, number][]) {
  const m = new Map<string, number>()
  for (const [s, n] of parts) m.set(s, (m.get(s) ?? 0) + n)
  const g = [...m.values()].reduce(gcd)
  return [...m.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([s, n]) => `${s}${n / g}`).join('')
}

export function lookup(parts: [string, number][]): MPEntry | null {
  const r = DATA[compKey(parts)]
  return r ? { formula: r[0], id: r[1], ehull: r[2], eform: r[3], spacegroup: r[4], decomposes: r[5] } : null
}

export function status(e: MPEntry | null): Status {
  if (!e) return 'absent'
  if (e.ehull <= 0.001) return 'stable'
  return e.ehull <= META_LIMIT ? 'meta' : 'unstable'
}

export const STATUS_LABEL: Record<Status, string> = {
  stable: 'יציב לפי החישוב',
  meta: 'כמעט יציב',
  unstable: 'לא יציב',
  absent: 'לא חושב עדיין',
}
export const STATUS_ABOUT: Record<Status, string> = {
  stable: 'אין צירוף אחר של אותם אטומים עם אנרגיה נמוכה יותר.',
  meta: `עד ${META_LIMIT * 1000} meV לאטום מעל קו היציבות, בטווח שבו נמצאים רוב החומרים הידועים.`,
  unstable: 'החישוב מראה שהוא יתפרק לחומרים אחרים.',
  absent: 'אף אחד עוד לא חישב את הנוסחה הזו. זו השערה פתוחה באמת.',
}
export const mpLink = (id: string) => `https://next-gen.materialsproject.org/materials/${id}`

/** How the oracle judges what is already known: the measure of its own reliability. */
export const CALIBRATION = (() => {
  // computed lazily by the caller's import; the compound list is small
  return calibrate()
})()

import { COMPOUNDS } from '../data/compounds'
function calibrate() {
  const c = { total: COMPOUNDS.length, stable: 0, meta: 0, unstable: 0, absent: 0, agree: 0, unstableExamples: [] as string[] }
  for (const x of COMPOUNDS) {
    const s = status(lookup(x.parts))
    c[s === 'absent' ? 'absent' : s]++
    if (s === 'unstable' && c.unstableExamples.length < 3 && /^(Mn2O7|Na3N|PtCl4|CS2|AsH3)$/.test(x.formula)) c.unstableExamples.push(x.formula)
  }
  c.agree = (c.stable + c.meta) / Math.max(1, c.total - c.absent)
  return c
}

/** Every element pair Materials Project has computed, with its compounds: was the neighbourhood explored? */
const SYSTEMS = (() => {
  const m = new Map<string, { formula: string; ehull: number }[]>()
  for (const [key, r] of Object.entries(DATA)) {
    const els = key.match(/[A-Z][a-z]?/g)!
    const k = els.sort().join('-')
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push({ formula: r[0], ehull: r[2] })
  }
  return m
})()
/** Stable compounds Materials Project knows in the same two-element system, most stable first. */
export function system(a: string, b: string) {
  return (SYSTEMS.get([a, b].sort().join('-')) ?? []).filter((x) => x.ehull <= META_LIMIT).sort((x, y) => x.ehull - y.ehull)
}
