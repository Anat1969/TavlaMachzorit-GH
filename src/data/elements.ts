// Single source of element data. Every view derives from ELEMENTS.
// Values: Pauling electronegativity, covalent radius (Cordero et al. 2008, pm),
// first ionization energy (eV). Empty = not measured / not meaningful.

export type Category =
  | 'alkali' | 'alkaline' | 'transition' | 'post' | 'metalloid'
  | 'nonmetal' | 'halogen' | 'noble' | 'lanthanide' | 'actinide'

export type Geo = 'litho' | 'sidero' | 'chalco' | 'atmo' | 'synthetic'

export interface Element {
  z: number
  sym: string
  he: string
  period: number
  group: number | null // null for the f-block row
  col: number          // display column 1..18
  row: number          // display row 1..7, 9..10 for f-block
  block: 's' | 'p' | 'd' | 'f'
  cat: Category
  en: number | null
  radius: number | null
  ie: number | null
  valence: number      // valence electrons (chemical, simplified)
  geo: Geo
  known: boolean       // enough measured data to take part in property networks
}

const SYMS = ('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr ' +
  'Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu ' +
  'Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr ' +
  'Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og').split(' ')

const HE = ('מימן הליום ליתיום בריליום בור פחמן חנקן חמצן פלואור ניאון נתרן מגנזיום אלומיניום צורן זרחן גופרית כלור ארגון ' +
  'אשלגן סידן סקנדיום טיטניום ונדיום כרום מנגן ברזל קובלט ניקל נחושת אבץ גליום גרמניום ארסן סלניום ברום קריפטון ' +
  'רובידיום סטרונציום איטריום זירקוניום ניוביום מוליבדן טכנציום רותניום רודיום פלדיום כסף קדמיום אינדיום בדיל אנטימון טלוריום יוד קסנון ' +
  'צזיום בריום לנתן צריום פרזאודימיום נאודימיום פרומתיום סמריום אירופיום גדוליניום טרביום דיספרוסיום הולמיום ארביום תוליום איטרביום לוטציום ' +
  'הפניום טנטלום טונגסטן רניום אוסמיום אירידיום פלטינה זהב כספית תליום עופרת ביסמוט פולוניום אסטטין ראדון ' +
  'פרנציום רדיום אקטיניום תוריום פרוטקטיניום אורניום נפטוניום פלוטוניום אמריציום קיריום ברקליום קליפורניום איינשטייניום פרמיום מנדלביום נובליום לורנציום ' +
  'רתרפורדיום דובניום סיבורגיום בוהריום האסיום מייטנריום דרמשטטיום רנטגניום קופרניקיום ניהוניום פלרוביום מוסקוביום ליברמוריום טנסין אוגנסון').split(' ')

const EN = ('2.20 - 0.98 1.57 2.04 2.55 3.04 3.44 3.98 - 0.93 1.31 1.61 1.90 2.19 2.58 3.16 - ' +
  '0.82 1.00 1.36 1.54 1.63 1.66 1.55 1.83 1.88 1.91 1.90 1.65 1.81 2.01 2.18 2.55 2.96 3.00 ' +
  '0.82 0.95 1.22 1.33 1.6 2.16 1.9 2.2 2.28 2.20 1.93 1.69 1.78 1.96 2.05 2.1 2.66 2.6 ' +
  '0.79 0.89 1.10 1.12 1.13 1.14 1.13 1.17 1.2 1.2 1.1 1.22 1.23 1.24 1.25 1.1 1.27 ' +
  '1.3 1.5 2.36 1.9 2.2 2.20 2.28 2.54 2.00 1.62 2.33 2.02 2.0 2.2 2.2 ' +
  '0.7 0.9 1.1 1.3 1.5 1.38 1.36 1.28 1.13 1.28').split(' ')

const RAD = ('31 28 128 96 84 76 71 66 57 58 166 141 121 111 107 105 102 106 ' +
  '203 176 170 160 153 139 139 132 126 124 132 122 122 120 119 120 120 116 ' +
  '220 195 190 175 164 154 147 146 142 139 145 144 142 139 139 138 139 140 ' +
  '244 215 207 204 203 201 199 198 198 196 194 192 192 189 190 187 187 ' +
  '175 170 162 151 144 141 136 136 132 145 146 148 140 150 150 ' +
  '260 221 215 206 200 196 190 187 180 169').split(' ')

const IE = ('13.60 24.59 5.39 9.32 8.30 11.26 14.53 13.62 17.42 21.56 5.14 7.65 5.99 8.15 10.49 10.36 12.97 15.76 ' +
  '4.34 6.11 6.56 6.83 6.75 6.77 7.43 7.90 7.88 7.64 7.73 9.39 6.00 7.90 9.79 9.75 11.81 14.00 ' +
  '4.18 5.69 6.22 6.63 6.76 7.09 7.28 7.36 7.46 8.34 7.58 8.99 5.79 7.34 8.61 9.01 10.45 12.13 ' +
  '3.89 5.21 5.58 5.54 5.47 5.53 5.58 5.64 5.67 6.15 5.86 5.94 6.02 6.11 6.18 6.25 5.43 ' +
  '6.83 7.55 7.86 7.83 8.44 8.97 8.96 9.23 10.44 6.11 7.42 7.29 8.41 9.32 10.75 ' +
  '4.07 5.28 5.38 6.31 5.89 6.19 6.27 6.03 5.97 5.99').split(' ')

const GEO: Record<Geo, string> = {
  atmo: 'H He N Ne Ar Kr Xe',
  litho: 'Li Be B O F Na Mg Al Si P Cl K Ca Sc Ti V Cr Mn Br Rb Sr Y Zr Nb I Cs Ba La Ce Pr Nd Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta Th U',
  sidero: 'C Fe Co Ni Ge Mo Ru Rh Pd Sn W Re Os Ir Pt Au',
  chalco: 'S Cu Zn Ga As Se Ag Cd In Sb Te Hg Tl Pb Bi',
  synthetic: '',
}

const METALLOIDS = new Set(['B', 'Si', 'Ge', 'As', 'Sb', 'Te'])
const NONMETALS = new Set(['H', 'C', 'N', 'O', 'P', 'S', 'Se'])
const HALOGENS = new Set(['F', 'Cl', 'Br', 'I', 'At', 'Ts'])

const num = (s: string | undefined) => (s === undefined || s === '-' ? null : Number(s))

function place(z: number) {
  const starts = [1, 3, 11, 19, 37, 55, 87]
  let period = 1
  for (let i = 0; i < starts.length; i++) if (z >= starts[i]) period = i + 1
  if ((z >= 57 && z <= 71) || (z >= 89 && z <= 103)) {
    const base = z <= 71 ? 57 : 89
    return { period, group: null, col: 3 + (z - base), row: z <= 71 ? 9 : 10, block: 'f' as const }
  }
  let group: number
  if (z === 1) group = 1
  else if (z === 2) group = 18
  else if (period <= 3) {
    const i = z - starts[period - 1]
    group = i < 2 ? i + 1 : i + 11
  } else {
    let i = z - starts[period - 1]
    if (period >= 6 && i >= 2) i -= 14 // skip the f-block
    group = i + 1
  }
  const block = group <= 2 || z === 2 ? 's' : group >= 13 ? 'p' : 'd'
  return { period, group, col: group, row: period, block: block as 's' | 'p' | 'd' }
}

function category(sym: string, z: number, group: number | null, block: string): Category {
  if (z >= 57 && z <= 71) return 'lanthanide'
  if (z >= 89 && z <= 103) return 'actinide'
  if (group === 18) return 'noble'
  if (HALOGENS.has(sym)) return 'halogen'
  if (NONMETALS.has(sym)) return 'nonmetal'
  if (METALLOIDS.has(sym)) return 'metalloid'
  if (group === 1) return 'alkali'
  if (group === 2) return 'alkaline'
  if (block === 'd') return 'transition'
  return 'post'
}

function valence(z: number, group: number | null, block: string) {
  if (z === 2) return 2
  if (group === null) return 3
  if (block === 'p') return group - 10
  return group
}

const geoOf = new Map<string, Geo>()
for (const [g, list] of Object.entries(GEO)) for (const s of list.split(' ').filter(Boolean)) geoOf.set(s, g as Geo)

export const ELEMENTS: Element[] = SYMS.map((sym, i) => {
  const z = i + 1
  const p = place(z)
  const cat = category(sym, z, p.group, p.block)
  const en = num(EN[i]); const radius = num(RAD[i]); const ie = num(IE[i])
  return {
    z, sym, he: HE[i], ...p, cat, en, radius, ie,
    valence: valence(z, p.group, p.block),
    geo: geoOf.get(sym) ?? 'synthetic',
    known: radius !== null && ie !== null,
  }
})

export const BY_SYM = new Map(ELEMENTS.map((e) => [e.sym, e]))

export const CAT_LABEL: Record<Category, string> = {
  alkali: 'מתכות אלקליות', alkaline: 'מתכות אלקליות עפרוריות', transition: 'מתכות מעבר',
  post: 'מתכות אחרות', metalloid: 'מטלואידים', nonmetal: 'אל־מתכות', halogen: 'הלוגנים',
  noble: 'גזים אצילים', lanthanide: 'לנתנידים', actinide: 'אקטינידים',
}

export const GEO_LABEL: Record<Geo, string> = {
  litho: 'ליתופילים: אוהבי סלע', sidero: 'סידרופילים: אוהבי ברזל', chalco: 'כלקופילים: אוהבי גופרית',
  atmo: 'אטמופילים: אוהבי אוויר', synthetic: 'רדיואקטיביים או סינתטיים',
}

export const GEO_NOTE: Record<Geo, string> = {
  litho: 'נקשרים לחמצן ונשארים בקרום ובמעטפת, בסיליקטים ובתחמוצות.',
  sidero: 'מתמוססים בברזל מתכתי, ולכן שקעו ברובם אל ליבת כדור הארץ.',
  chalco: 'נקשרים לגופרית ויוצרים גופרות, מקור עיקרי למרבצי עפרות.',
  atmo: 'נדיפים, נמצאים באטמוספרה ובאוקיינוסים.',
  synthetic: 'אין להם מקום יציב במחזור הגיאוכימי.',
}
