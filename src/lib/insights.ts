// Rules of thumb, insights and inventions, all derived from the app's own data.
// Nothing here is written by hand: every rule is tested against the compound sample,
// and every number on the insights page comes from these functions.
import { ELEMENTS, BY_SYM, type Element } from '../data/elements'
import { COMPOUNDS, FORMULA_SET, formatFormula } from '../data/compounds'
import { COMPOUND_LIFE } from '../data/everyday'
import { compoundSim, propSim, sharedTemplates, surprises, contextCount, tableDistance, type Lens } from './similarity'
import { W_HISTORY, W_PROPERTY } from './substitute'

// ---------- the backtest ----------
// For every known compound and every element in it: a rule names the one element that should
// replace it. A hit means the swapped formula is itself a known compound in the sample.
// The history lens is computed with the answer removed (leave-one-out), so it cannot cheat.

export type RuleId = 'random' | 'group' | 'diagonal' | 'physical' | 'chemical' | 'history' | 'lab'

export interface RuleDef { id: RuleId; name: string; arrangement: string; page: string; plain: string }

export const RULES: RuleDef[] = [
  { id: 'random', name: 'ניחוש עיוור', arrangement: 'בלי סידור', page: 'table', plain: 'בוחרים יסוד אקראי. זה קו האפס: כל כלל צריך לעבור אותו.' },
  { id: 'group', name: 'השכן בטור', arrangement: 'הטבלה הקלאסית', page: 'matrix', plain: 'מחליפים ביסוד שמעליו או מתחתיו באותו טור. כך מלמדים בבית הספר.' },
  { id: 'diagonal', name: 'השכן באלכסון', arrangement: 'מחזוריות משנית', page: 'secondary', plain: 'מחליפים ביסוד שורה אחת למטה וטור אחד הצידה, כמו ליתיום ומגנזיום.' },
  { id: 'physical', name: 'אותו גודל', arrangement: 'רשת: גודל ואנרגיה', page: 'network', plain: 'מחליפים ביסוד בגודל דומה, שמחזיק את האלקטרונים שלו בעוצמה דומה.' },
  { id: 'chemical', name: 'אותה התנהגות', arrangement: 'רשת: התנהגות כימית', page: 'network', plain: 'מחליפים ביסוד שמושך אלקטרונים באותה עוצמה ויש לו אותו מספר ידיים לקשר.' },
  { id: 'history', name: 'אותה היסטוריה', arrangement: 'רשת: היסטוריה כימית', page: 'network', plain: 'מחליפים ביסוד שכבר הופיע באותן תבניות של תרכובות אחרות.' },
  { id: 'lab', name: 'השילוב של המעבדה', arrangement: 'מעבדת חומרים', page: 'lab', plain: `${W_HISTORY} היסטוריה ועוד ${W_PROPERTY} התנהגות. זה הכלל שמדרג את ההצעות במעבדה.` },
]

/** Jaccard of compound templates, with one template removed from b (the answer under test). */
function historyLOO(a: string, b: string, drop: boolean) {
  const s = compoundSim(a, b)
  if (!drop || s === 0) return s
  // undo one shared template: s = k / (A + B - k)  ->  (k - 1) / (A + B - k)
  const k = sharedTemplates(a, b).length
  const union = contextCount(a) + contextCount(b) - k
  return k <= 1 ? 0 : (k - 1) / union
}

const pool = ELEMENTS.filter((e) => e.known)

function swap(parts: [string, number][], i: number, sym: string) {
  return formatFormula(parts.map((p, j) => (j === i ? [sym, p[1]] : p)) as [string, number][])
}

function rank(rule: RuleId, x: Element, parts: [string, number][], i: number): Element[] {
  const inFormula = new Set(parts.map((p) => p[0]))
  const cands = pool.filter((e) => !inFormula.has(e.sym))
  const by = (f: (e: Element) => number) =>
    cands.map((e) => ({ e, v: f(e) })).filter((c) => c.v > 0).sort((a, b) => b.v - a.v).map((c) => c.e)
  switch (rule) {
    case 'group':
      if (x.group === null) return []
      return cands.filter((e) => e.group === x.group)
        .sort((a, b) => Math.abs(a.period - x.period) - Math.abs(b.period - x.period) || a.z - b.z)
    case 'diagonal':
      if (x.group === null) return []
      return cands.filter((e) => e.group !== null && Math.abs(e.period - x.period) === 1 && e.group - x.group! === e.period - x.period)
        .sort((a, b) => Math.abs((a.en ?? 9) - (x.en ?? 0)) - Math.abs((b.en ?? 9) - (x.en ?? 0)))
    case 'physical': return by((e) => propSim(x, e, 'physical'))
    case 'chemical': return by((e) => propSim(x, e, 'chemical'))
    case 'history': return by((e) => historyLOO(x.sym, e.sym, FORMULA_SET.has(swap(parts, i, e.sym))))
    case 'lab': return by((e) => W_HISTORY * historyLOO(x.sym, e.sym, FORMULA_SET.has(swap(parts, i, e.sym))) + W_PROPERTY * propSim(x, e, 'chemical'))
    default: return []
  }
}

export interface RuleScore extends RuleDef {
  tested: number      // swaps the rule could name an answer for
  hit1: number        // first suggestion is a known compound
  hit3: number        // one of the first three is
  rate1: number
  rate3: number
  coverage: number    // share of all swaps the rule can speak about
  example?: { from: string; to: string }
}

export const BACKTEST: RuleScore[] = (() => {
  const slots: { parts: [string, number][]; i: number; x: Element; formula: string }[] = []
  for (const c of COMPOUNDS) c.parts.forEach(([s], i) => { const x = BY_SYM.get(s); if (x?.known) slots.push({ parts: c.parts, i, x, formula: c.formula }) })
  return RULES.map((r) => {
    let tested = 0, hit1 = 0, hit3 = 0
    let example: RuleScore['example']
    if (r.id === 'random') {
      // expected hit rate of a blind pick, computed exactly instead of sampled
      let p1 = 0, p3 = 0
      for (const s of slots) {
        const inF = new Set(s.parts.map((p) => p[0]))
        const c = pool.filter((e) => !inF.has(e.sym))
        const k = c.filter((e) => FORMULA_SET.has(swap(s.parts, s.i, e.sym))).length
        p1 += k / c.length
        p3 += 1 - comb(c.length - k, 3) / comb(c.length, 3)
      }
      tested = slots.length; hit1 = Math.round(p1); hit3 = Math.round(p3)
    } else {
      for (const s of slots) {
        const top = rank(r.id, s.x, s.parts, s.i).slice(0, 3)
        if (!top.length) continue
        tested++
        const known = top.map((e) => FORMULA_SET.has(swap(s.parts, s.i, e.sym)))
        if (known[0]) { hit1++; if (!example && COMPOUND_LIFE[s.formula]) example = { from: s.formula, to: swap(s.parts, s.i, top[0].sym) } }
        if (known.some(Boolean)) hit3++
      }
    }
    return { ...r, tested, hit1, hit3, rate1: hit1 / Math.max(1, tested), rate3: hit3 / Math.max(1, tested), coverage: tested / slots.length, example }
  })
})()

function comb(n: number, k: number) {
  if (k > n) return 0
  let r = 1
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1)
  return r
}

export const SWAP_SLOTS = BACKTEST[0].tested
export const SCORE = Object.fromEntries(BACKTEST.map((r) => [r.id, r])) as Record<RuleId, RuleScore>

/** Swaps where the network names a real compound and the classic column does not, and the reverse. */
export const NETWORK_VS_TABLE = (() => {
  let netOnly = 0, tableOnly = 0
  const examples: { from: string; table: string; net: string }[] = []
  for (const c of COMPOUNDS) c.parts.forEach(([s], i) => {
    const x = BY_SYM.get(s)
    if (!x?.known) return
    const t = rank('group', x, c.parts, i)[0], h = rank('history', x, c.parts, i)[0]
    if (!t || !h) return
    const tk = FORMULA_SET.has(swap(c.parts, i, t.sym)), hk = FORMULA_SET.has(swap(c.parts, i, h.sym))
    if (hk && !tk) { netOnly++; if (examples.length < 6 && tableDistance(x, h) >= 3) examples.push({ from: c.formula, table: swap(c.parts, i, t.sym), net: swap(c.parts, i, h.sym) }) }
    if (tk && !hk) tableOnly++
  })
  return { netOnly, tableOnly, examples }
})()

// ---------- insights ----------

export interface Pair { a: Element; b: Element; w: number; dist: number; evidence: string[] }

/** Far apart in the classic table, close in what they actually do. */
export function farFriends(lens: Lens = 'compounds', n = 6): Pair[] {
  return surprises(lens, n).map((s) => ({ a: BY_SYM.get(s.a)!, b: BY_SYM.get(s.b)!, w: s.w, dist: s.dist, evidence: sharedTemplates(s.a, s.b).slice(0, 4) }))
}

/** The two layers disagree: a shared history the properties do not predict, or the reverse. */
export function disagreements(n = 5) {
  const nodes = ELEMENTS.filter((e) => e.known && contextCount(e.sym) >= 3)
  const pairs: { a: Element; b: Element; h: number; p: number }[] = []
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j]
    pairs.push({ a, b, h: compoundSim(a.sym, b.sym), p: propSim(a, b, 'chemical') })
  }
  const historyWins = pairs.filter((x) => x.h >= 0.3).sort((x, y) => (y.h - y.p) - (x.h - x.p)).slice(0, n)
  const propertyWins = pairs.filter((x) => x.p >= 0.8 && x.h === 0).sort((x, y) => y.p - x.p).slice(0, n)
  return { historyWins, propertyWins }
}

/** Elements that fit into many different templates: the most versatile building materials. */
export function chameleons(n = 8, metalsOnly = false) {
  const partner = new Set(['nonmetal', 'halogen', 'noble', 'metalloid'])
  return ELEMENTS.filter((e) => e.known && (!metalsOnly || !partner.has(e.cat))).map((e) => ({ e, n: contextCount(e.sym) })).sort((a, b) => b.n - a.n).slice(0, n)
}

/** Measured, ordinary elements the sample hardly knows: blank spots on the map. */
export function blankSpots(n = 10) {
  return ELEMENTS.filter((e) => e.known && e.geo !== 'synthetic' && e.cat !== 'noble' && contextCount(e.sym) <= 1).slice(0, n)
}

// ---------- inventions ----------

export interface Invention {
  parent: string; life: string; replaced: string; by: string; formula: string
  history: number; property: number; score: number; evidence: string[]; agree: boolean
}

/** For a material we already use, the closest formulas that are not in the sample. */
export function inventionsFor(parent: string, n = 4): Invention[] {
  const c = COMPOUNDS.find((x) => x.formula === parent)
  if (!c) return []
  const out: Invention[] = []
  c.parts.forEach(([sym], i) => {
    const x = BY_SYM.get(sym)
    if (!x?.known) return
    const inF = new Set(c.parts.map((p) => p[0]))
    for (const e of pool) {
      if (inF.has(e.sym)) continue
      const formula = swap(c.parts, i, e.sym)
      if (FORMULA_SET.has(formula)) continue
      const history = compoundSim(sym, e.sym), property = propSim(x, e, 'chemical')
      const score = W_HISTORY * history + W_PROPERTY * property
      if (score < 0.2) continue
      out.push({ parent, life: COMPOUND_LIFE[parent] ?? '', replaced: sym, by: e.sym, formula, history, property, score, evidence: sharedTemplates(sym, e.sym).slice(0, 3), agree: history >= 0.15 && property >= 0.4 })
    }
  })
  return out.sort((a, b) => b.score - a.score).slice(0, n)
}

/** A practical need, the material that answers it today, and the question the network asks. */
export const NEEDS: { need: string; parent: string }[] = [
  { need: 'להפיק חשמל מהשמש', parent: 'CdTe' },
  { need: 'להאיר בלי חום', parent: 'GaN' },
  { need: 'שבב מהיר לתקשורת', parent: 'GaAs' },
  { need: 'לקרר בלי מדחס', parent: 'Bi2Te3' },
  { need: 'לסוך בלי שמן', parent: 'MoS2' },
  { need: 'לחתוך חומר קשה', parent: 'WC' },
  { need: 'להוליך חשמל בלי התנגדות', parent: 'MgB2' },
  { need: 'לאגור אנרגיה בסוללה', parent: 'Li3N' },
  { need: 'להגן מהשמש', parent: 'ZnO' },
  { need: 'לבן שלא דוהה', parent: 'TiO2' },
  { need: 'צבע מסך חד', parent: 'CdSe' },
  { need: 'שבב לרכב חשמלי', parent: 'SiC' },
].filter((n) => FORMULA_SET.has(n.parent))

export const MP_URL = (formula: string) => `https://next-gen.materialsproject.org/materials?formula=${encodeURIComponent(formula)}`
export const SCHOLAR_URL = (formula: string) => `https://scholar.google.com/scholar?q=${encodeURIComponent(formula + ' synthesis')}`

export { tableDistance }
