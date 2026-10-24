// A curated sample of well-known binary compounds — a miniature of the
// "chemical history" used by Leal, Restrepo, Stadler & Jost (Max Planck, 2019–2020),
// who used thousands of binary compounds. Grouped only for readability.

const RAW = `
H2O Li2O Na2O K2O Rb2O Cs2O Cu2O Ag2O Tl2O
BeO MgO CaO SrO BaO ZnO CdO NiO CoO FeO MnO CuO PbO SnO HgO EuO TiO VO
B2O3 Al2O3 Ga2O3 In2O3 Sc2O3 Y2O3 La2O3 Cr2O3 Fe2O3 V2O3 Ti2O3 Bi2O3 Sb2O3 As2O3 Tl2O3 Nd2O3 Gd2O3 Er2O3 Lu2O3 Sm2O3 Eu2O3 Dy2O3 Yb2O3 Pr2O3 Ho2O3 Tb2O3 Tm2O3 Ce2O3 Mn2O3 Rh2O3 Au2O3
CO2 SiO2 GeO2 SnO2 TiO2 ZrO2 HfO2 CeO2 ThO2 UO2 MnO2 PbO2 RuO2 IrO2 OsO2 TeO2 SeO2 MoO2 WO2 NbO2 VO2 SO2 PuO2 NpO2 PaO2 CrO2 ReO2 PtO2 TbO2 PrO2
P2O5 As2O5 Sb2O5 V2O5 Nb2O5 Ta2O5 N2O5 Cl2O7 Mn2O7 Re2O7 Tc2O7 I2O5
CrO3 MoO3 WO3 SO3 SeO3 ReO3 TeO3 UO3
OsO4 RuO4 XeO4
LiCl NaCl KCl RbCl CsCl AgCl CuCl TlCl HCl
BeCl2 MgCl2 CaCl2 SrCl2 BaCl2 ZnCl2 CdCl2 HgCl2 FeCl2 CoCl2 NiCl2 MnCl2 CuCl2 PbCl2 SnCl2 EuCl2 VCl2 CrCl2 PdCl2 PtCl2 GeCl2 SmCl2 YbCl2
BCl3 AlCl3 GaCl3 InCl3 ScCl3 YCl3 LaCl3 CeCl3 NdCl3 GdCl3 FeCl3 CrCl3 PCl3 AsCl3 SbCl3 BiCl3 TiCl3 VCl3 AuCl3 NCl3 RuCl3 RhCl3 IrCl3 PrCl3 SmCl3 EuCl3 DyCl3 ErCl3 YbCl3 LuCl3 UCl3 PuCl3 TlCl3 MoCl3
CCl4 SiCl4 GeCl4 SnCl4 TiCl4 ZrCl4 HfCl4 PbCl4 ThCl4 UCl4 TeCl4 SeCl4 VCl4 PtCl4 NpCl4
PCl5 NbCl5 TaCl5 MoCl5 SbCl5 ReCl5 WCl5 UCl5
WCl6 UCl6
LiF NaF KF RbF CsF AgF TlF HF
MgF2 CaF2 SrF2 BaF2 ZnF2 PbF2 FeF2 CoF2 NiF2 MnF2 CdF2 EuF2 BeF2 CuF2 SnF2 HgF2 KrF2 XeF2 OF2 CrF2 VF2
AlF3 BF3 GaF3 InF3 ScF3 YF3 LaF3 CeF3 FeF3 CrF3 NF3 BiF3 PF3 AsF3 SbF3 ClF3 BrF3 VF3 TiF3 CoF3 MnF3 NdF3 GdF3 SmF3 ErF3 LuF3 UF3 PuF3 AuF3 TlF3 RhF3 IrF3
CF4 SiF4 GeF4 SF4 ZrF4 HfF4 ThF4 UF4 XeF4 SeF4 TeF4 TiF4 SnF4 PbF4 CeF4 PuF4 NpF4 PtF4 PdF4 MnF4 VF4
PF5 AsF5 SbF5 NbF5 TaF5 BrF5 IF5 ClF5 VF5 BiF5 MoF5 UF5 AuF5
SF6 SeF6 TeF6 WF6 MoF6 UF6 ReF6 IrF6 PtF6 XeF6 OsF6 RuF6 RhF6 NpF6 PuF6 TcF6
IF7 ReF7
LiBr NaBr KBr RbBr CsBr AgBr CuBr TlBr HBr
MgBr2 CaBr2 SrBr2 BaBr2 ZnBr2 CdBr2 HgBr2 PbBr2 FeBr2 NiBr2 CoBr2 MnBr2 SnBr2 CuBr2
AlBr3 GaBr3 InBr3 BBr3 PBr3 AsBr3 SbBr3 BiBr3 FeBr3 LaBr3 YBr3 CeBr3
CBr4 SiBr4 GeBr4 SnBr4 TiBr4 ZrBr4
LiI NaI KI RbI CsI AgI CuI TlI HI
MgI2 CaI2 SrI2 BaI2 ZnI2 CdI2 HgI2 PbI2 FeI2 NiI2 SnI2 GeI2 SmI2 YbI2 EuI2
AlI3 GaI3 InI3 BI3 PI3 AsI3 SbI3 BiI3 LaI3
CI4 SiI4 GeI4 SnI4 TiI4 ZrI4
Li2S Na2S K2S Rb2S Cs2S Cu2S Ag2S Tl2S H2S
ZnS CdS HgS PbS FeS NiS CoS MnS MgS CaS SrS BaS CuS SnS GeS EuS YbS SmS PdS
Ga2S3 In2S3 Al2S3 As2S3 Sb2S3 Bi2S3 B2S3 La2S3 Ce2S3 Y2S3 Sc2S3 Gd2S3
FeS2 MoS2 WS2 SnS2 TiS2 ZrS2 HfS2 CS2 SiS2 GeS2 ReS2 PtS2 NbS2 TaS2 RuS2 OsS2 CoS2 NiS2 MnS2 TcS2
Li2Se Na2Se K2Se Cu2Se Ag2Se H2Se
ZnSe CdSe PbSe HgSe SnSe GeSe MgSe CaSe SrSe BaSe MnSe EuSe
In2Se3 Ga2Se3 Bi2Se3 Sb2Se3 As2Se3 Al2Se3
MoSe2 WSe2 SnSe2 TiSe2 ZrSe2 HfSe2 NbSe2 TaSe2 PtSe2
Li2Te Na2Te K2Te Ag2Te Cu2Te H2Te
ZnTe CdTe PbTe HgTe SnTe GeTe MgTe CaTe SrTe BaTe MnTe EuTe
Bi2Te3 Sb2Te3 In2Te3 Ga2Te3 Al2Te3
MoTe2 WTe2 TiTe2 ZrTe2 HfTe2 NbTe2 TaTe2 PtTe2
BN AlN GaN InN ScN TiN ZrN HfN VN NbN TaN CrN YN LaN UN CeN ThN GdN
BP AlP GaP InP ScP YP LaP
BAs AlAs GaAs InAs ScAs YAs LaAs
BSb AlSb GaSb InSb YSb LaSb
Li3N Na3N Li3P Na3P K3P Li3As Na3As K3As Li3Sb Na3Sb K3Sb Cs3Sb
Mg3N2 Ca3N2 Be3N2 Zn3N2 Sr3N2 Ba3N2 Cd3N2 Mg3P2 Ca3P2 Zn3P2 Cd3P2 Mg3As2 Zn3As2 Cd3As2 Mg3Sb2 Zn3Sb2
Si3N4 Ge3N4 C3N4 Sn3N4
SiC TiC ZrC HfC VC NbC TaC WC MoC ThC UC
B4C Al4C3 Be2C
CaC2 SrC2 BaC2 MgC2 LaC2 YC2 UC2 ThC2
LiH NaH KH RbH CsH
MgH2 CaH2 SrH2 BaH2 BeH2 TiH2 ZrH2 HfH2 YH2 VH2
AlH3 GaH3 YH3 LaH3 UH3
CH4 SiH4 GeH4 SnH4
NH3 PH3 AsH3 SbH3 BiH3
TiB2 ZrB2 HfB2 MgB2 AlB2 CrB2 VB2 NbB2 TaB2 ScB2
LaB6 CeB6 CaB6 SrB6 BaB6 YB6 EuB6 SmB6
MoSi2 WSi2 TiSi2 CrSi2 CoSi2 NiSi2 ZrSi2 TaSi2 NbSi2 VSi2
Mg2Si Mg2Ge Mg2Sn Mg2Pb Ca2Si Ca2Sn
`

export interface Compound {
  formula: string
  parts: [string, number][] // [symbol, count]
}

export function parseFormula(f: string): [string, number][] {
  const out: [string, number][] = []
  for (const m of f.matchAll(/([A-Z][a-z]?)(\d*)/g)) out.push([m[1], m[2] ? Number(m[2]) : 1])
  return out
}

export const COMPOUNDS: Compound[] = [...new Set(RAW.split(/\s+/).filter(Boolean))].map((formula) => ({
  formula,
  parts: parseFormula(formula),
}))

export const FORMULA_SET = new Set(COMPOUNDS.map((c) => c.formula))

/** Write a formula canonically: same element order as the template compound. */
export function formatFormula(parts: [string, number][]) {
  return parts.map(([s, n]) => s + (n > 1 ? n : '')).join('')
}

/** Show digits as subscripts. */
export function prettyFormula(f: string) {
  const sub = '₀₁₂₃₄₅₆₇₈₉'
  return f.replace(/\d/g, (d) => sub[Number(d)])
}
