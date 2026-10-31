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
import { lookup, status, type Status, type MPEntry } from './stability'
import { OX } from '../data/oxidation'

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
  // computed per swap, from the parent compound's charges (see CHARGE below)
  { id: 'charge', family: 'מטען', label: 'היסוד החדש נושא את אותו מטען', test: () => true },
  { id: 'taker', family: 'תפקיד', label: 'רק במקום של הלוקח', test: (_x, y, r, o) => r === 'taker' && (y.en ?? 9) > (o.en ?? 0) },
]
export const ATOM = new Map(ATOMS.map((a) => [a.id, a]))

// ---------- the experiment table: every possible swap, computed once ----------

interface Swap { from: string; to: string; x: string; y: string; hit: boolean; mp: MPEntry | null; st: Status; role: Role; charge: boolean; ox: number[] }
// Helium, neon and argon have no stable compounds, so they are not candidates for any swap.
const pool = ELEMENTS.filter((e) => e.known && !['He', 'Ne', 'Ar'].includes(e.sym))
/**
 * The charge X carries in its parent compound, read from its partner's common charges:
 * in Al2O3, oxygen is -2, so each Al carries +3. Only charges X is known to take are kept.
 * An empty list means the compound is not ionic enough for this reading (borides, carbides).
 */
function chargesOf(parts: [string, number][], i: number, role: Role): number[] {
  const [xs, nx] = parts[i], [ps, np] = parts[1 - i]
  const partner = (OX[ps]?.[0] ?? []).filter((v) => (role === 'giver' ? v < 0 : v > 0))
  const known = OX[xs]?.[1] ?? []
  return [...new Set(partner.map((v) => -(np * v) / nx))].filter((v) => Number.isInteger(v) && v !== 0 && known.includes(v))
}
// Y must know the charge as one of its common states; the full list of exotic states let NaCl→NaAl through
const chargeOk = (ox: number[], y: string) => !ox.length || ox.some((v) => (OX[y]?.[0] ?? []).includes(v))

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
    const ox = chargesOf(c.parts, i, role)
    for (const y of pool) {
      if (y.sym === s0 || y.sym === s1) continue
      const parts = c.parts.map((p, j) => (j === i ? [y.sym, p[1]] : p)) as [string, number][]
      const to = formatFormula(parts)
      const mp = lookup(parts)
      SWAPS.push({ from: c.formula, to, x: s, y: y.sym, hit: FORMULA_SET.has(to), mp, st: status(mp), role, charge: chargeOk(ox, y.sym), ox })
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
  if (a.id === 'charge') { for (let k = 0; k < N; k++) col[k] = SWAPS[k].charge ? 1 : 0; COLS.set(a.id, col); continue }
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
  // the second judge: of the swaps outside the sample, what the stability calculation says
  outside: number; mpOk: number; mpBad: number; mpAbsent: number
  reality: number // (sample hits + computed stable or near-stable) / allowed
}

export function evaluate(ids: string[]): RuleResult {
  const cols = ids.map((id) => COLS.get(id)!).filter(Boolean)
  let allowed = 0, hits = 0, mpOk = 0, mpBad = 0, mpAbsent = 0
  const examples: RuleResult['examples'] = [], misses: RuleResult['misses'] = []
  for (let k = 0; k < N; k++) {
    let ok = true
    for (const c of cols) if (!c[k]) { ok = false; break }
    if (!ok) continue
    allowed++
    const s = SWAPS[k]
    if (s.hit) { hits++; if (examples.length < 6 && k % 7 === 0) examples.push({ from: s.from, to: s.to }) }
    else if (s.st === 'stable' || s.st === 'meta') mpOk++
    else if (s.st === 'unstable') mpBad++
    else mpAbsent++
    if (!s.hit && s.st === 'unstable' && misses.length < 6 && k % 3 === 0) misses.push({ from: s.from, to: s.to })
  }
  const precision = allowed ? hits / allowed : 0
  const recall = hits / HITS
  return {
    ids, allowed, hits, precision, recall, lift: precision / EXPERIMENT.base, f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0, examples, misses,
    outside: allowed - hits, mpOk, mpBad, mpAbsent, reality: allowed ? (hits + mpOk) / allowed : 0,
  }
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

/** What a rule predicts outside the sample, sorted by what the stability calculation says about each formula. */
export function predictions(ids: string[], n = 6) {
  const cols = ids.map((id) => COLS.get(id)!).filter(Boolean)
  const out: Swap[] = []
  const seen = new Set<string>()
  for (let k = 0; k < N; k++) {
    if (SWAPS[k].hit) continue
    let ok = true
    for (const c of cols) if (!c[k]) { ok = false; break }
    if (!ok || seen.has(SWAPS[k].to)) continue
    seen.add(SWAPS[k].to)
    out.push(SWAPS[k])
  }
  // spread each list over many parent compounds instead of twelve variants of one
  const spread = (list: Swap[]) => {
    const byParent = new Map<string, Swap[]>()
    for (const p of list) { if (!byParent.has(p.from)) byParent.set(p.from, []); byParent.get(p.from)!.push(p) }
    const res: Swap[] = []
    for (let round = 0; res.length < n && round < 4; round++) for (const l of byParent.values()) if (l[round] && res.length < n) res.push(l[round])
    return res
  }
  const ok = out.filter((p) => p.st === 'stable' || p.st === 'meta')
  const bad = out.filter((p) => p.st === 'unstable').sort((a, b) => a.mp!.ehull - b.mp!.ehull)
  const open = out.filter((p) => p.st === 'absent')
  return { total: out.length, ok: spread(ok), okN: ok.length, bad: spread(bad), badN: bad.length, open: spread(open), openN: open.length }
}

export type Prediction = Swap

/** Every formula a rule allows that the sample lacks and no one has computed: the truly open questions. */
export function openPredictions(ids: string[]): Swap[] {
  const cols = ids.map((id) => COLS.get(id)!).filter(Boolean)
  const out: Swap[] = []
  for (let k = 0; k < N; k++) {
    const s = SWAPS[k]
    if (s.hit || s.st !== 'absent') continue
    let ok = true
    for (const c of cols) if (!c[k]) { ok = false; break }
    if (ok) out.push(s)
  }
  return out
}

/** The track record of one specific substitution X→Y across every parent compound that has a verdict. */
const PAIRS = (() => {
  const m = new Map<string, { ok: number; judged: number }>()
  for (const s of SWAPS) {
    const ok = s.hit || s.st === 'stable' || s.st === 'meta'
    if (!ok && s.st !== 'unstable') continue
    const k = `${s.x}>${s.y}|${s.role}`
    const r = m.get(k) ?? { ok: 0, judged: 0 }
    r.judged++
    if (ok) r.ok++
    m.set(k, r)
  }
  return m
})()
export const pairRecord = (x: string, y: string, role: Role) => PAIRS.get(`${x}>${y}|${role}`) ?? { ok: 0, judged: 0 }
export type { Role }

/** Counts of distinct formulas, for the funnel on the work-list page. */
export function swapStats() {
  const all = new Set<string>(), outside = new Set<string>(), absent = new Set<string>()
  for (const s of SWAPS) {
    all.add(s.to)
    if (!s.hit) { outside.add(s.to); if (s.st === 'absent') absent.add(s.to) }
  }
  return { swaps: all.size, outside: outside.size, outsideAbsent: absent.size }
}
