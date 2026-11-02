// The explorer. For each challenge from BIOMATIC, the machine takes the materials that answer it
// today, tries every one-element swap, and passes each idea through four gates:
//   1. charge: the new element can carry the charge the formula needs
//   2. existence: the sample or the stability calculation says it can exist (or it is still open)
//   3. function: it has the physical property the challenge needs, measured with the same
//      instrument as the parent (computed band gaps are too low in absolute terms, so ideas
//      are compared with the parent, not with textbook values)
//   4. safety and availability: no restricted or radioactive element, and how common the rarest one is
import { BY_SYM } from '../data/elements'
import { FORMULA_SET, parseFormula } from '../data/compounds'
import { CHALLENGES, type Challenge } from '../data/challenges'
import { AVAIL, ROHS, TOXIC, availability, type Avail } from '../data/availability'
import { swapsFrom, allows, pairRecord, BASE_REALITY, type Prediction } from './rulegen'
import { RULES_USED, PRIOR_WEIGHT } from './worklist'
import { propsOf, canBePiezo, type Props } from './stability'

const NONMETAL = new Set(['nonmetal', 'halogen', 'noble'])
const RANK: Record<Avail, number> = { common: 4, available: 3, scarce: 2, rare: 1, unknown: 0 }

function risk(formula: string) {
  const out: string[] = []
  for (const [s] of parseFormula(formula)) {
    const he = BY_SYM.get(s)?.he ?? s
    if (AVAIL[s]?.[1]) out.push(`${he} רדיואקטיבי`)
    else if (ROHS.has(s) || TOXIC.has(s)) out.push(`${he} רעיל`)
  }
  return out
}
/** The rarest element decides how available a material is. */
function scarcity(formula: string): Avail {
  return parseFormula(formula).map(([s]) => availability(s)).sort((a, b) => RANK[a] - RANK[b])[0]
}

type Verdict = { ok: boolean | null; why: string }
const near = (v: number, ref: number) => Math.abs(v - ref) <= Math.max(0.5, 0.4 * ref)
const ENsOf = (f: string) => parseFormula(f).map(([s]) => ({ s, en: BY_SYM.get(s)?.en ?? null }))

/** The function gate for each challenge. null: no data to judge; the idea stays, marked unknown. */
const FUNCTION: Record<string, (p: Props | null, parent: Props | null, formula: string) => Verdict> = {
  cool: (p, r) => p?.gap == null || r?.gap == null ? { ok: null, why: 'אין חישוב פער אנרגיה' }
    : { ok: p.gap >= 0.75 * r.gap && p.gap >= 3, why: `פער ${p.gap} eV מול ${r.gap} בחומר המוצא` },
  'clean-air': (p, r) => p?.gap == null || r?.gap == null ? { ok: null, why: 'אין חישוב פער אנרגיה' }
    : { ok: p.gap > 0.3 && near(p.gap, r.gap), why: `פער ${p.gap} eV מול ${r.gap} בחומר המוצא` },
  'clean-water': (p, r) => p?.gap == null || r?.gap == null ? { ok: null, why: 'אין חישוב פער אנרגיה' }
    : { ok: p.gap > 0.3 && near(p.gap, r.gap), why: `פער ${p.gap} eV מול ${r.gap} בחומר המוצא` },
  sun: (p, r) => p?.gap == null || r?.gap == null ? { ok: null, why: 'אין חישוב פער אנרגיה' }
    : { ok: p.gap > 0.1 && near(p.gap, r.gap), why: `פער ${p.gap} eV מול ${r.gap} בחומר המוצא` },
  press: (p) => !p?.pointGroup ? { ok: null, why: 'אין מבנה גבישי מחושב' }
    : { ok: canBePiezo(p.pointGroup) && (p.gap ?? 0) > 0.3, why: `סימטריה ${p.pointGroup}${canBePiezo(p.pointGroup) ? ', בלי מרכז' : ', עם מרכז: לא פייזואלקטרי'}${p.piezo != null ? `, מקדם מחושב ${p.piezo} C/m²` : ''}` },
  light: (p, r) => p?.density == null || r?.density == null ? { ok: null, why: 'אין חישוב צפיפות' }
    : { ok: p.density <= 1.2 * r.density && (p.shear == null || p.shear >= 100), why: `צפיפות ${p.density} מול ${r.density}${p.shear != null ? `, קשיחות ${p.shear} GPa` : ''}` },
  carbon: (_p, _r, f) => {
    const els = ENsOf(f), metal = els.find((e) => e.s !== 'O')
    if (!els.some((e) => e.s === 'O') || !metal?.en) return { ok: false, why: 'לא תחמוצת' }
    return { ok: metal.en <= 1.35, why: `משיכת אלקטרונים של המתכת ${metal.en}` }
  },
  dry: (_p, _r, f) => {
    const els = ENsOf(f), metal = els.find((e) => e.s !== 'Cl')
    if (!els.some((e) => e.s === 'Cl') || !metal?.en) return { ok: false, why: 'לא מלח כלורי' }
    return { ok: metal.en <= 1.3, why: `משיכת אלקטרונים של המתכת ${metal.en}` }
  },
}

export interface Idea {
  s: Prediction
  confidence: number
  kind: 'lab' | 'computed' | 'open'   // known in experiment, only computed, nobody checked
  fn: Verdict
  avail: Avail
  risks: string[]
  better: string[]
  score: number
}


export function ideasFor(challengeId: string, parent: string) {
  const parentParts = parseFormula(parent)
  const ref = propsOf(parentParts)
  const pRisk = risk(parent), pAvail = scarcity(parent)
  const fnTest = FUNCTION[challengeId]
  const counts = { tried: 0, charge: 0, exist: 0, fn: 0, safe: 0 }
  const out: Idea[] = []
  const seen = new Set<string>([parent])
  for (const { s, k } of swapsFrom(parent)) {
    const y = BY_SYM.get(s.y)
    if (seen.has(s.to) || !y?.known) continue
    seen.add(s.to)
    counts.tried++
    // a building material is a solid: all-nonmetal formulas (CO2, CCl4) are gases or liquids, and noble gases do not bond
    if (!s.charge || y.cat === 'noble' || parseFormula(s.to).every(([e]) => NONMETAL.has(BY_SYM.get(e)!.cat))) continue
    counts.charge++
    const p = propsOf(parseFormula(s.to))
    const exists = s.hit || s.st === 'stable' || s.st === 'meta'
    if (!exists && s.st !== 'absent') continue
    counts.exist++
    const fn = fnTest(p, ref, s.to)
    if (fn.ok === false) continue
    counts.fn++
    const risks = risk(s.to)
    if (risks.length) continue
    counts.safe++
    const best = RULES_USED.filter((r) => allows(r.ids, k)).reduce((m, r) => Math.max(m, r.reality), BASE_REALITY)
    const pair = pairRecord(s.x, s.y, s.role)
    const confidence = exists ? 1 : (pair.ok + PRIOR_WEIGHT * best) / (pair.judged + PRIOR_WEIGHT)
    const avail = scarcity(s.to)
    const better: string[] = []
    if (pRisk.length) better.push(`בלי ${pRisk.map((r) => r.split(' ')[0]).join(' ו')}`)
    if (RANK[avail] > RANK[pAvail]) better.push('מיסודות נפוצים יותר')
    const kind: Idea['kind'] = p?.experimental || s.hit ? 'lab' : exists ? 'computed' : 'open'
    const score = confidence * (fn.ok ? 1 : 0.6) * (1 + 0.4 * better.length) * (0.6 + 0.1 * RANK[avail])
    out.push({ s, confidence, kind, fn, avail, risks, better, score })
  }
  const by = (k: Idea['kind']) => out.filter((i) => i.kind === k && (k !== 'open' || i.confidence >= 0.5)).sort((a, b) => b.score - a.score).slice(0, 3)
  return { lab: by('lab'), computed: by('computed'), open: by('open'), counts, ref, pRisk, pAvail }
}

export interface Report {
  c: Challenge
  parents: { f: string; does: string; ideas: ReturnType<typeof ideasFor> }[]
  headline: { text: string; idea: Idea; parent: string } | null
  funnel: { tried: number; charge: number; exist: number; fn: number; safe: number }
}

export const REPORTS: Report[] = CHALLENGES.map((c) => {
  const parents = c.parents.filter((p) => FORMULA_SET.has(p.f)).map((p) => ({ ...p, ideas: ideasFor(c.id, p.f) }))
  const funnel = parents.reduce((a, p) => ({ tried: a.tried + p.ideas.counts.tried, charge: a.charge + p.ideas.counts.charge, exist: a.exist + p.ideas.counts.exist, fn: a.fn + p.ideas.counts.fn, safe: a.safe + p.ideas.counts.safe }), { tried: 0, charge: 0, exist: 0, fn: 0, safe: 0 })
  // headline: prefer an idea that improves on the parent and passed the function test with data
  const all = parents.flatMap((p) => [...p.ideas.lab, ...p.ideas.computed, ...p.ideas.open].map((idea) => ({ idea, parent: p.f })))
  const pick = all.sort((a, b) => (Number(b.idea.fn.ok === true) - Number(a.idea.fn.ok === true)) || (b.idea.better.length - a.idea.better.length) || (b.idea.score - a.idea.score))[0]
  const he = (s: string) => BY_SYM.get(s)?.he ?? s
  const state = { lab: 'כבר נוצר במעבדה', computed: 'יציב בחישוב, ולא ידוע שנוצר', open: 'אף אחד עוד לא בדק' }
  const headline = pick ? {
    idea: pick.idea, parent: pick.parent,
    text: `${pick.idea.s.to}: ${he(pick.idea.s.y)} במקום ${he(pick.idea.s.x)}. ${state[pick.idea.kind]}${pick.idea.better.length ? `, ${pick.idea.better.join(' ו')}` : ''}.`,
  } : null
  return { c, parents, headline, funnel }
})
