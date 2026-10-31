// The work list: every open hypothesis from the best rules, ranked by three things that
// a materials team would weigh — how often the rule that proposed it is right, whether the
// parent material already does something useful, and whether the new element is available and safe.
import { BY_SYM } from '../data/elements'
import { COMPOUND_LIFE } from '../data/everyday'
import { AVAIL, ROHS, TOXIC, availability, type Avail } from '../data/availability'
import { search, pareto, openPredictions, pairRecord, swapStats, ruleText } from './rulegen'
import { parseFormula } from '../data/compounds'
import { system } from './stability'

export const AVAIL_FACTOR: Record<Avail, number> = { common: 1, available: 0.9, scarce: 0.6, rare: 0.3, unknown: 0.3 }
export const HAZARD_FACTOR = 0.5
export const RADIO_FACTOR = 0.1
export const USE_BONUS = 1.15
/** Assumption, stated in the page: if Materials Project explored this element pair and did not list the formula, it is less likely. */
export const EXPLORED_FACTOR = 0.8
export const NON_IONIC_FACTOR = 0.6 // the rules were calibrated mostly on ionic compounds; borides and carbides carry real doubt
/** A hypothesis enters the list only with a track record and a minimum estimate. */
export const MIN_CONFIDENCE = 0.6
export const MIN_JUDGED = 3

export interface Work {
  formula: string; parent: string; x: string; y: string; ox: number[]
  confidence: number      // blended estimate: the rule's rate, corrected by this substitution's own record
  ruleRate: number; rule: string[]; ruleCount: number
  pair: { ok: number; judged: number }
  use: string; avail: Avail; ppm: number | null
  hazards: string[]
  neighbours: string[] // stable compounds already known in the same two-element system
  score: number
}

/** How many past verdicts weigh as much as the rule's general rate (empirical-Bayes shrinkage). */
export const PRIOR_WEIGHT = 5

export const RULES_USED = (() => pareto(search().all).filter((r) => r.mpOk + r.mpBad >= 30))()

function hazardsOf(formula: string) {
  const out = new Set<string>()
  for (const [sym] of parseFormula(formula)) {
    if (AVAIL[sym]?.[1]) out.add('רדיואקטיבי')
    if (ROHS.has(sym)) out.add('מוגבל ב-RoHS')
    if (TOXIC.has(sym)) out.add('רעיל')
  }
  return [...out]
}

/** Open formulas removed because the new element cannot carry the charge the formula needs. */
export const REJECTED = new Set<string>()

const ALL: Work[] = (() => {
  const best = new Map<string, Work>()
  for (const r of RULES_USED) {
    for (const s of openPredictions(r.ids)) {
      if (!s.charge) { REJECTED.add(s.to); continue }
      const prev = best.get(s.to)
      const count = (prev?.ruleCount ?? 0) + 1
      if (prev && r.reality <= prev.ruleRate) { prev.ruleCount = count; continue }
      const pair = pairRecord(s.x, s.y, s.role)
      const confidence = (pair.ok + PRIOR_WEIGHT * r.reality) / (pair.judged + PRIOR_WEIGHT)
      const hazards = hazardsOf(s.to)
      const avail = availability(s.y)
      const use = COMPOUND_LIFE[s.from] ?? ''
      if (confidence < MIN_CONFIDENCE || pair.judged < MIN_JUDGED) continue
      // confidence counts twice: a likely material matters more than a convenient one
      let score = confidence * confidence * AVAIL_FACTOR[avail] * (use ? USE_BONUS : 1)
      const [ea, eb] = parseFormula(s.to).map((p) => p[0])
      const neighbours = system(ea, eb).map((x) => x.formula).slice(0, 4)
      if (neighbours.length) score *= EXPLORED_FACTOR
      if (!s.ox.length) score *= NON_IONIC_FACTOR
      if (hazards.includes('רדיואקטיבי')) score *= RADIO_FACTOR
      else if (hazards.length) score *= HAZARD_FACTOR
      best.set(s.to, { formula: s.to, parent: s.from, x: s.x, y: s.y, ox: s.ox, confidence, ruleRate: r.reality, rule: r.ids, ruleCount: count, pair, use, avail, ppm: AVAIL[s.y]?.[0] ?? null, hazards, neighbours, score })
    }
  }
  return [...best.values()].filter((w) => BY_SYM.get(w.y)?.known).sort((a, b) => b.score - a.score)
})()

/** The ranked list, with variety: at most two entries per substitution and per parent compound. */
export function worklist(opts: { safeOnly?: boolean; usefulOnly?: boolean } = {}, n = 30): Work[] {
  const perPair = new Map<string, number>(), perParent = new Map<string, number>()
  const out: Work[] = []
  for (const w of ALL) {
    if (opts.safeOnly && w.hazards.length) continue
    if (opts.usefulOnly && !w.use) continue
    const pk = `${w.x}>${w.y}`
    if ((perPair.get(pk) ?? 0) >= 2 || (perParent.get(w.parent) ?? 0) >= 2) continue
    perPair.set(pk, (perPair.get(pk) ?? 0) + 1)
    perParent.set(w.parent, (perParent.get(w.parent) ?? 0) + 1)
    out.push(w)
    if (out.length >= n) break
  }
  return out
}

export const OPEN_TOTAL = ALL.length

/** The funnel from every imaginable swap to the ranked list: what each filter removed. */
export const FUNNEL = (() => {
  const st = swapStats()
  const proposed = new Set<string>()
  for (const r of RULES_USED) for (const s of openPredictions(r.ids)) proposed.add(s.to)
  return [
    { label: 'כל ההחלפות האפשריות', note: 'כל יסוד במקום כל יסוד, בכל תרכובת במדגם', n: st.swaps },
    { label: 'לא נמצאות במדגם', note: 'מה שהמדגם עוד לא מכיר', n: st.outside },
    { label: 'גם לא חושבו מעולם', note: 'Materials Project לא חישב אותן', n: st.outsideAbsent },
    { label: 'כלל טוב מציע אותן', note: `${RULES_USED.length} הכללים שאף כלל אחר לא עדיף עליהם`, n: proposed.size },
    { label: 'המטען אפשרי', note: 'היסוד החדש מכיר את דרגת החמצון הנדרשת', n: OPEN_TOTAL },
  ]
})()

export { ruleText }
