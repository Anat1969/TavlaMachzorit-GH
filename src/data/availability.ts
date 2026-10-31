// How available each element is: abundance in Earth's crust (mg/kg, ppm) and radioactivity.
// Source: CRC Handbook of Chemistry and Physics, "Abundance of elements in the Earth's crust
// and in the sea", as packaged by the open mendeleev library (scripts/fetch-availability.py).
// null: not measured. Radioactive: no stable isotope.
export const AVAIL: Record<string, [number | null, 0 | 1]> = {
  H:[1400,0], He:[0.008,0], Li:[20,0], Be:[2.8,0], B:[10,0], C:[200,0], N:[19,0], O:[461000,0], F:[585,0], Ne:[0.005,0], Na:[23600,0], Mg:[23300,0], Al:[82300,0], Si:[282000,0], P:[1050,0], S:[350,0], Cl:[145,0], Ar:[3.5,0], K:[20900,0], Ca:[41500,0], Sc:[22,0], Ti:[5650,0], V:[120,0], Cr:[102,0], Mn:[950,0], Fe:[56300,0], Co:[25,0], Ni:[84,0], Cu:[60,0], Zn:[70,0], Ga:[19,0], Ge:[1.5,0], As:[1.8,0], Se:[0.05,0], Br:[2.4,0], Kr:[0.0001,0], Rb:[90,0], Sr:[370,0], Y:[33,0], Zr:[165,0], Nb:[20,0], Mo:[1.2,0], Tc:[null,1], Ru:[0.001,0], Rh:[0.001,0], Pd:[0.015,0], Ag:[0.075,0], Cd:[0.15,0], In:[0.25,0], Sn:[2.3,0], Sb:[0.2,0], Te:[0.001,0], I:[0.45,0], Xe:[3e-05,0], Cs:[3,0], Ba:[425,0], La:[39,0], Ce:[66.5,0], Pr:[9.2,0], Nd:[41.5,0], Pm:[null,1], Sm:[7.05,0], Eu:[2,0], Gd:[6.2,0], Tb:[1.2,0], Dy:[5.2,0], Ho:[1.3,0], Er:[3.5,0], Tm:[0.52,0], Yb:[3.2,0], Lu:[0.8,0], Hf:[3,0], Ta:[2,0], W:[1.25,0], Re:[0.0007,0], Os:[0.0015,0], Ir:[0.001,0], Pt:[0.005,0], Au:[0.004,0], Hg:[0.085,0], Tl:[0.85,0], Pb:[14,0], Bi:[0.0085,0], Po:[2e-10,1], At:[null,1], Rn:[4e-13,1], Fr:[null,1], Ra:[9e-07,1], Ac:[5.5e-10,1], Th:[9.6,1], Pa:[1.4e-06,1], U:[2.7,1], Np:[null,1], Pu:[null,1], Am:[null,1], Cm:[null,1], Bk:[null,1], Cf:[null,1], Es:[null,1], Fm:[null,1], Md:[null,1], No:[null,1], Lr:[null,1], Rf:[null,1], Db:[null,1], Sg:[null,1], Bh:[null,1], Hs:[null,1], Mt:[null,1], Ds:[null,1], Rg:[null,1], Cn:[null,1], Nh:[null,1], Fl:[null,1], Mc:[null,1], Lv:[null,1], Ts:[null,1], Og:[null,1],
}

/** Hazard from regulation, not opinion: EU RoHS restricts lead, mercury and cadmium in electronics. */
export const ROHS = new Set(['Pb', 'Hg', 'Cd'])
/** Acutely toxic elements commonly singled out in occupational-safety literature. */
export const TOXIC = new Set(['As', 'Tl', 'Be'])

export type Avail = 'common' | 'available' | 'scarce' | 'rare' | 'unknown'
export function availability(sym: string): Avail {
  const ppm = AVAIL[sym]?.[0]
  if (ppm === null || ppm === undefined) return 'unknown'
  if (ppm >= 1000) return 'common'
  if (ppm >= 10) return 'available'
  if (ppm >= 0.1) return 'scarce'
  return 'rare'
}
export const AVAIL_LABEL: Record<Avail, string> = { common: 'נפוץ מאוד', available: 'זמין', scarce: 'נדיר', rare: 'נדיר מאוד', unknown: 'אין נתון' }
