// How two elements are "close". Each lens is a different definition of closeness,
// and every network, ranking and suggestion in the app is derived from these functions.

import { ELEMENTS, BY_SYM, type Element } from '../data/elements'
import { COMPOUNDS } from '../data/compounds'

export type Lens = 'compounds' | 'chemical' | 'physical' | 'geo'

export const LENSES: { id: Lens; label: string; short: string; how: string }[] = [
  {
    id: 'compounds', label: 'היסטוריה כימית', short: 'תרכובות',
    how: 'שני יסודות קרובים כשהם מופיעים באותן "תבניות" של תרכובות. למשל NaCl ו-KCl: אם מחליפים Na ב-K, התבנית "_Cl" נשמרת. הדמיון הוא חלק התבניות המשותפות מכלל התבניות (מדד Jaccard). זו השיטה של מחקר מקס פלאנק, על מדגם קטן יותר.',
  },
  {
    id: 'chemical', label: 'התנהגות כימית', short: 'כימי',
    how: 'מרחק בין יסודות לפי אלקטרושליליות, מספר אלקטרוני ערכיות ואנרגיית יינון: התכונות שקובעות איך יסוד נקשר. כל תכונה מנורמלת לפני החישוב.',
  },
  {
    id: 'physical', label: 'גודל ואנרגיה', short: 'פיזיקלי',
    how: 'מרחק לפי רדיוס קוולנטי ואנרגיית יינון בלבד: יסודות בגודל דומה שמחזיקים את האלקטרונים שלהם בעוצמה דומה. זה הבסיס הפיזיקלי להחלפה בסריג גבישי.',
  },
  {
    id: 'geo', label: 'גיאוכימיה', short: 'סלעים',
    how: 'קשר רק בין יסודות מאותה משפחה של Goldschmidt: ליתופילים (בסלע), סידרופילים (בברזל), כלקופילים (בגופרות) ואטמופילים (באוויר). בתוך משפחה, כל יסוד נקשר לשכניו הקרובים בתכונות. כך נראה אילו יסודות נמצאים יחד בטבע.',
  },
]

// ---------- compound contexts (the "chemical history" lens) ----------

const contexts = new Map<string, Set<string>>()
const display = new Map<string, string>() // template key -> readable form, e.g. "□Cl2"
for (const c of COMPOUNDS) {
  c.parts.forEach(([sym, n], i) => {
    const tpl = c.parts.map(([s, k], j) => (j === i ? `_${n}` : `${s}${k}`)).join('·')
    display.set(tpl, c.parts.map(([s, k], j) => (j === i ? '□' : s) + (k > 1 ? k : '')).join(''))
    if (!contexts.has(sym)) contexts.set(sym, new Set())
    contexts.get(sym)!.add(tpl)
  })
}

export function contextCount(sym: string) {
  return contexts.get(sym)?.size ?? 0
}

export function compoundSim(a: string, b: string) {
  const A = contexts.get(a), B = contexts.get(b)
  if (!A || !B || a === b) return 0
  let shared = 0
  for (const t of A) if (B.has(t)) shared++
  return shared / (A.size + B.size - shared)
}

export function sharedTemplates(a: string, b: string): string[] {
  const A = contexts.get(a), B = contexts.get(b)
  if (!A || !B) return []
  return [...A].filter((t) => B.has(t)).map((t) => display.get(t)!)
}

// ---------- property lenses ----------

type Feat = 'en' | 'radius' | 'ie' | 'valence'
const FEATS: Feat[] = ['en', 'radius', 'ie', 'valence']
const stats = Object.fromEntries(
  FEATS.map((f) => {
    const v = ELEMENTS.filter((e) => e.known).map((e) => e[f]).filter((x): x is number => x !== null)
    const mean = v.reduce((a, b) => a + b, 0) / v.length
    const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length)
    return [f, { mean, sd }]
  }),
) as Record<Feat, { mean: number; sd: number }>

const WEIGHTS: Record<'chemical' | 'physical', Partial<Record<Feat, number>>> = {
  chemical: { en: 1.5, valence: 1.2, ie: 1 },
  physical: { radius: 1.5, ie: 1 },
}

function propDistance(a: Element, b: Element, w: Partial<Record<Feat, number>>) {
  let sum = 0, wsum = 0
  for (const f of FEATS) {
    const wf = w[f]
    if (!wf) continue
    const x = a[f], y = b[f]
    if (x === null || y === null) continue
    sum += wf * ((x - y) / stats[f].sd) ** 2
    wsum += wf
  }
  return wsum ? Math.sqrt(sum / wsum) : Infinity
}

export function propSim(a: Element, b: Element, kind: 'chemical' | 'physical' = 'chemical') {
  if (a === b || !a.known || !b.known) return 0
  return Math.exp(-(propDistance(a, b, WEIGHTS[kind]) ** 2) / 0.5)
}

export function sim(lens: Lens, a: Element, b: Element) {
  switch (lens) {
    case 'compounds': return compoundSim(a.sym, b.sym)
    case 'chemical': return propSim(a, b, 'chemical')
    case 'physical': return propSim(a, b, 'physical')
    case 'geo': return a.geo === b.geo && a.geo !== 'synthetic' ? propSim(a, b, 'chemical') : 0
  }
}

export function lensNodes(lens: Lens): Element[] {
  if (lens === 'compounds') return ELEMENTS.filter((e) => contextCount(e.sym) >= 2)
  if (lens === 'geo') return ELEMENTS.filter((e) => e.geo !== 'synthetic' && e.known)
  return ELEMENTS.filter((e) => e.known)
}

export interface Edge { a: string; b: string; w: number }

/** k nearest neighbours per element (union), above a floor. */
export function buildEdges(lens: Lens, k = 3): Edge[] {
  const nodes = lensNodes(lens)
  const floor = lens === 'compounds' ? 0.12 : 0.25
  const seen = new Map<string, Edge>()
  for (const a of nodes) {
    const ranked = nodes
      .map((b) => ({ b, w: sim(lens, a, b) }))
      .filter((x) => x.w > floor)
      .sort((x, y) => y.w - x.w)
      .slice(0, k)
    for (const { b, w } of ranked) {
      const key = a.z < b.z ? `${a.sym}|${b.sym}` : `${b.sym}|${a.sym}`
      if (!seen.has(key)) seen.set(key, { a: a.sym, b: b.sym, w })
    }
  }
  return [...seen.values()]
}

export function neighbours(lens: Lens, sym: string, n = 8) {
  const a = BY_SYM.get(sym)!
  return lensNodes(lens)
    .filter((b) => b !== a)
    .map((b) => ({ el: b, w: sim(lens, a, b) }))
    .filter((x) => x.w > 0)
    .sort((x, y) => y.w - x.w)
    .slice(0, n)
}

/** Distance in the classic table (columns + rows, f-block counted as group 3). */
export function tableDistance(a: Element, b: Element) {
  const g = (e: Element) => e.group ?? 3
  return Math.abs(g(a) - g(b)) + Math.abs(a.period - b.period)
}

/** Strong links between elements that sit far apart in the classic table. */
export function surprises(lens: Lens, n = 10) {
  return buildEdges(lens, 3)
    .map((e) => {
      const A = BY_SYM.get(e.a)!, B = BY_SYM.get(e.b)!
      return { ...e, dist: tableDistance(A, B), score: e.w * tableDistance(A, B) }
    })
    .filter((e) => e.dist >= 4)
    .sort((x, y) => y.score - x.score)
    .slice(0, n)
}
