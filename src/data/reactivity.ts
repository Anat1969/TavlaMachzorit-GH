// Water and air: which binary compounds react with moisture, by textbook families
// (Greenwood & Earnshaw, Chemistry of the Elements). Rules, not a lookup table, so they
// cover new formulas too. Each rule names what comes out, because that is what decides the danger.
import { BY_SYM } from './elements'
import { parseFormula } from './compounds'

export interface Reaction { severity: 'toxic' | 'flammable' | 'reactive'; text: string }

const SALINE = new Set(['alkali', 'alkaline'])
const COVALENT_HALIDE_CENTRES = new Set(['B', 'Al', 'Si', 'P', 'Ti', 'Ge', 'Sn', 'Sb', 'As', 'Zr', 'Nb', 'Ta', 'Mo', 'W', 'V', 'Se', 'Te', 'S'])

export function waterReaction(formula: string): Reaction | null {
  const parts = parseFormula(formula)
  if (parts.length !== 2) return null
  const [[a, na], [b, nb]] = parts
  const A = BY_SYM.get(a), B = BY_SYM.get(b)
  if (!A || !B) return null
  // the giver is the less electronegative partner
  const [g, t, ng, nt] = (A.en ?? 0) <= (B.en ?? 0) ? [A, B, na, nb] : [B, A, nb, na]
  const salineOrAl = SALINE.has(g.cat) || g.sym === 'Al' || g.sym === 'Zn'
  if (t.sym === 'P' && (salineOrAl)) return { severity: 'toxic', text: 'משחרר במים גז פוספין רעיל' }
  if (t.sym === 'As' && salineOrAl) return { severity: 'toxic', text: 'משחרר במים גז ארסין רעיל' }
  if (t.sym === 'H' && (SALINE.has(g.cat) || g.sym === 'Al')) return { severity: 'flammable', text: 'משחרר במים מימן דליק' }
  if (t.sym === 'N' && (SALINE.has(g.cat))) return { severity: 'reactive', text: 'משחרר במים אמוניה' }
  if (t.sym === 'C' && (SALINE.has(g.cat) || g.sym === 'Al')) return { severity: 'flammable', text: 'משחרר במים גז דליק' }
  if (t.sym === 'S' && (SALINE.has(g.cat) || g.sym === 'Al')) return { severity: 'toxic', text: 'משחרר במים מימן גופרתי רעיל' }
  if (t.sym === 'Se' && (SALINE.has(g.cat) || g.sym === 'Al')) return { severity: 'toxic', text: 'משחרר במים מימן סלני רעיל' }
  if (t.sym === 'O' && ['B', 'P', 'S', 'Se', 'N', 'Cl', 'I'].includes(g.sym)) return { severity: 'reactive', text: 'סופג מים מהאוויר והופך לחומצה' }
  if (t.sym === 'O' && SALINE.has(g.cat) && !['Be', 'Mg'].includes(g.sym)) return { severity: 'reactive', text: 'מגיב עם מים בחום, כמו סיד חי' }
  if (['Cl', 'Br', 'I'].includes(t.sym) && COVALENT_HALIDE_CENTRES.has(g.sym) && nt / ng >= 2) return { severity: 'reactive', text: 'משחרר חומצה במגע עם לחות' }
  return null
}
