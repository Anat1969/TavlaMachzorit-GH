// Substitution logic: replace one element of a known compound with a close neighbour.
// Two transparent layers are kept separate so the user can judge each one.
import { ELEMENTS, BY_SYM } from '../data/elements'
import { FORMULA_SET, formatFormula } from '../data/compounds'
import { compoundSim, propSim, sharedTemplates } from './similarity'

export interface Candidate {
  sym: string
  formula: string
  known: boolean
  history: number   // shared compound templates (Jaccard)
  property: number  // chemical-property similarity
  score: number
  evidence: string[]
}

export const W_HISTORY = 0.6
export const W_PROPERTY = 0.4

export function candidates(parts: [string, number][], index: number, n = 10): Candidate[] {
  const orig = BY_SYM.get(parts[index][0])
  if (!orig) return []
  const inFormula = new Set(parts.map((p) => p[0]))
  return ELEMENTS.filter((e) => e.known && !inFormula.has(e.sym))
    .map((e) => {
      const history = compoundSim(orig.sym, e.sym)
      const property = propSim(orig, e, 'chemical')
      const next = parts.map((p, j) => (j === index ? [e.sym, p[1]] : p)) as [string, number][]
      const formula = formatFormula(next)
      return {
        sym: e.sym, formula, known: FORMULA_SET.has(formula), history, property,
        score: W_HISTORY * history + W_PROPERTY * property,
        evidence: sharedTemplates(orig.sym, e.sym).slice(0, 4),
      }
    })
    .filter((c) => c.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
}
