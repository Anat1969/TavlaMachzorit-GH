// The rule generator: the machine proposes rules of thumb, tests every one of them
// against the compound sample, and reports what it found.
//
// A "swap" is one known compound, one element X in it, and one candidate Y.
// The swap is a hit when the formula with Y in place of X is also a known compound.
// A rule is a condition on the pair (X, Y). It is judged like any classifier:
// precision (of the swaps it allows, how many are real), recall (of all real swaps,
// how many it finds), and lift (how many times better than a blind pick).
// Rules use only measured properties, never the compound history, so there is no leakage.
import { ELEMENTS, BY_SYM, type Element } from '../data/elements'
import { COMPOUNDS, FORMULA_SET, formatFormula } from '../data/compounds'
import { hops } from './mayan'

export interface Atom { id: string; label: string; family: string; test: (x: Element, y: Element, role: Role, partner: Element) => boolean }
type Role = 'giver' | 'taker' // X is the less (giver) or more (taker) electronegative partner

const relR = (x: Element, y: Element) => (x.radius !== null && y.radius !== null ? Math.abs(x.radius - y.radius) / Math.max(x.radius, y.radius) : Infinity)
const dEN = (x: Element, y: Element) => (x.en !== null && y.en !== null ? Math.abs(x.en - y.en) : Infinity)
const dIE = (x: Element, y: Element) => (x.ie !== null && y.ie !== null ? Math.abs(x.ie - y.ie) : Infinity)

export const ATOMS: Atom[] = [
  { id: 'group', family: 'מיקום בטבלה', label: 'אותו טור', test: (x, y) => x.group !== null && x.group === y.group },
  { id: 'period', family: 'מיקום בטבלה', label: 'אותה שורה', test: (x, y) => x.period === y.period },
  { id: 'near', family: 'מיקום בטבלה', label: 'שורה אחת למעלה או למטה', test: (x, y) => Math.abs(x.period - y.period) <= 1 },
  { id: 'block', family: 'מיקום בטבלה', label: 'אותו גוש (s, p, d, f)', test: (x, y) => x.block === y.block },
  { id: 'cat', family: 'משפחה', label: 'אותה משפחה כימית', test: (x, y) => x.cat === y.cat },
  { id: 'geo', family: 'משפחה', label: 'אותה שכונה בטבע (Goldschmidt)', test: (x, y) => x.geo === y.geo },
  { id: 'val', family: 'קשר', label: 'אותו מספר ידיים (ערכיות)', test: (x, y) => x.valence === y.valence },
  { id: 'hops', family: 'קשר', label: 'אותו מספר קפיצות בטבעות', test: (x, y) => { const a = hops(x), b = hops(y); return !!a && !!b && a.n === b.n } },
  { id: 'en02', family: 'משיכה', label: 'משיכת אלקטרונים קרובה (עד 0.2)', test: (x, y) => dEN(x, y) <= 0.2 },
  { id: 'en05', family: 'משיכה', label: 'משיכת אלקטרונים דומה (עד 0.5)', test: (x, y) => dEN(x, y) <= 0.5 },
  { id: 'r08', family: 'גודל', label: 'גודל כמעט זהה (עד 8%)', test: (x, y) => relR(x, y) <= 0.08 },
  { id: 'r15', family: 'גודל', label: 'גודל דומה (עד 15%)', test: (x, y) => relR(x, y) <= 0.15 },
  { id: 'r30', family: 'גודל', label: 'גודל באותו סדר (עד 30%)', test: (x, y) => relR(x, y) <= 0.3 },
  { id: 'ie1', family: 'אחיזה', label: 'אחיזה דומה באלקטרונים (עד 1 eV)', test: (x, y) => dIE(x, y) <= 1 },
  // the role holds for both: X gives in the original compound, and Y would give to the same partner
  { id: 'giver', family: 'תפקיד', label: 'רק במקום של הנותן (המתכת)', test: (_x, y, r, o) => r === 'giver' && (y.en ?? 0) < (o.en ?? 0) },
  { id: 'taker', family: 'תפקיד', label: 'רק במקום של הלוקח', test: (_x, y, r, o) => r === 'taker' && (y.en ?? 9) > (o.en ?? 0) },
]
export const ATOM = new Map(ATOMS.map((a) => [a.id, a]))

// ---------- the experiment table: every possible swap, computed once ----------

interface Swap { from: string; to: string; x: string; y: string; hit: boolean }
// Helium, neon and argon have no stable compounds, so they are not candidates for any swap.
const pool = ELEMENTS.filter((e) => e.known && !['He', 'Ne', 'Ar'].includes(e.sym))
const SWAPS: Swap[] = []
const ROLE: Role[] = []
const PARTNER: Element[] = []
for (const c of COMPOUNDS) {
  if (c.parts.length !== 2) continue
  const [[s0], [s1]] = c.parts
  const e0 = BY_SYM.get(s0)!, e1 = BY_SYM.get(s1)!
  c.parts.forEach(([s], i) => {
    const x = BY_SYM.get(s)
    if (!x?.known) return
    const other = i === 0 ? e1 : e0
    const role: Role = (x.en ?? 0) <= (other.en ?? 0) ? 'giver' : 'taker'
    for (const y of pool) {
      if (y.sym === s0 || y.sym === s1) continue
      const to = formatFormula(c.parts.map((p, j) => (j === i ? [y.sym, p[1]] : p)) as [string, number][])
      SWAPS.push({ from: c.formula, to, x: s, y: y.sym, hit: FORMULA_SET.has(to) })
      ROLE.push(role)
      PARTNER.push(other)
    }
  })
}
const N = SWAPS.length
const HITS = SWAPS.reduce((a, s) => a + (s.hit ? 1 : 0), 0)
export const EXPERIMENT = { swaps: N, hits: HITS, base: HITS / N, compounds: COMPOUNDS.filter((c) => c.parts.length === 2).length }

// one bit-column per atom
const COLS = new Map<string, Uint8Array>()
for (const a of ATOMS) {
  const col = new Uint8Array(N)
  for (let k = 0; k < N; k++) col[k] = a.test(BY_SYM.get(SWAPS[k].x)!, BY_SYM.get(SWAPS[k].y)!, ROLE[k], PARTNER[k]) ? 1 : 0
  COLS.set(a.id, col)
}

export interface RuleResult {
  ids: string[]
  allowed: number   // swaps the rule permits
  hits: number      // of those, real compounds
  precision: number
  recall: number
  lift: number
  f1: number
  examples: { from: string; to: string }[]
  misses: { from: string; to: string }[]
}

export function evaluate(ids: string[]): RuleResult {
  const cols = ids.map((id) => COLS.get(id)!).filter(Boolean)
  let allowed = 0, hits = 0
  const examples: RuleResult['examples'] = [], misses: RuleResult['misses'] = []
  for (let k = 0; k < N; k++) {
    let ok = true
    for (const c of cols) if (!c[k]) { ok = false; break }
    if (!ok) continue
    allowed++
    const s = SWAPS[k]
    if (s.hit) { hits++; if (examples.length < 6 && k % 7 === 0) examples.push({ from: s.from, to: s.to }) }
    else if (misses.length < 6 && k % 11 === 0) misses.push({ from: s.from, to: s.to })
  }
  const precision = allowed ? hits / allowed : 0
  const recall = hits / HITS
  return { ids, allowed, hits, precision, recall, lift: precision / EXPERIMENT.base, f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0, examples, misses }
}

// ---------- the search: every single condition, every pair, the best triples ----------

const MIN_ALLOWED = 150 // a rule that allows fewer swaps is an anecdote, not a rule

export function search() {
  const singles = ATOMS.map((a) => evaluate([a.id]))
  const pairs: RuleResult[] = []
  for (let i = 0; i < ATOMS.length; i++) for (let j = i + 1; j < ATOMS.length; j++) {
    if (ATOMS[i].family === ATOMS[j].family) continue
    pairs.push(evaluate([ATOMS[i].id, ATOMS[j].id]))
  }
  const seeds = [...pairs].filter((r) => r.allowed >= MIN_ALLOWED).sort((a, b) => b.f1 - a.f1).slice(0, 12)
  const triples: RuleResult[] = []
  const seen = new Set<string>()
  for (const s of seeds) for (const a of ATOMS) {
    if (s.ids.includes(a.id) || s.ids.some((id) => ATOM.get(id)!.family === a.family)) continue
    const ids = [...s.ids, a.id].sort()
    const key = ids.join('+')
    if (seen.has(key)) continue
    seen.add(key)
    triples.push(evaluate(ids))
  }
  const all = [...singles, ...pairs, ...triples].filter((r) => r.allowed >= MIN_ALLOWED)
  return { singles, all, tested: singles.length + pairs.length + triples.length }
}

/** Rules that no other rule beats on both precision and recall: the honest menu of trade-offs. */
export function pareto(rules: RuleResult[]) {
  // identical results: keep the simplest wording of the rule
  const best = new Map<string, RuleResult>()
  for (const r of rules) { const k = `${r.allowed}|${r.hits}`; const o = best.get(k); if (!o || r.ids.length < o.ids.length) best.set(k, r) }
  rules = [...best.values()]
  return rules
    .filter((r) => !rules.some((o) => o !== r && o.precision >= r.precision && o.recall >= r.recall && (o.precision > r.precision || o.recall > r.recall)))
    .sort((a, b) => b.precision - a.precision)
}

export const ruleText = (ids: string[]) => ids.map((id) => ATOM.get(id)?.label ?? id).join(' + ')

/** What a rule predicts that the sample does not contain: its inventions, with the rule's own hit rate as the estimate. */
export function predictions(ids: string[], n = 8) {
  const cols = ids.map((id) => COLS.get(id)!).filter(Boolean)
  const out: { from: string; to: string; x: string; y: string }[] = []
  const seen = new Set<string>()
  for (let k = 0; k < N; k++) {
    if (SWAPS[k].hit) continue
    let ok = true
    for (const c of cols) if (!c[k]) { ok = false; break }
    if (!ok || seen.has(SWAPS[k].to)) continue
    seen.add(SWAPS[k].to)
    out.push(SWAPS[k])
  }
  // spread the list over many parent compounds instead of twelve variants of one
  const byParent = new Map<string, typeof out>()
  for (const p of out) { if (!byParent.has(p.from)) byParent.set(p.from, []); byParent.get(p.from)!.push(p) }
  const spread: typeof out = []
  for (let round = 0; spread.length < n && round < 4; round++) for (const list of byParent.values()) { if (list[round] && spread.length < n) spread.push(list[round]) }
  return { total: out.length, list: spread }
}
