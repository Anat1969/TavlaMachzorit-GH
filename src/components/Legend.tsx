import { CAT_LABEL, GEO_LABEL, type Category, type Geo } from '../data/elements'
import { RAMP_CSS, RANGE_LABEL, type ColorBy } from '../lib/colors'

const UNIT = { en: 'פאולינג', radius: 'pm', ie: 'eV' }

export function Legend({ by }: { by: ColorBy }) {
  if (by === 'cat')
    return <div className="legend">{(Object.keys(CAT_LABEL) as Category[]).map((c) => <span key={c}><i style={{ background: `var(--c-${c})` }} />{CAT_LABEL[c]}</span>)}</div>
  if (by === 'geo')
    return <div className="legend">{(Object.keys(GEO_LABEL) as Geo[]).map((g) => <span key={g}><i style={{ background: `var(--g-${g})` }} />{GEO_LABEL[g]}</span>)}</div>
  const [lo, hi] = RANGE_LABEL[by]
  return (
    <div className="legend" style={{ alignItems: 'center' }}>
      <span className="mono">{lo}</span>
      <span className="scale-bar" style={{ background: RAMP_CSS, transform: 'scaleX(-1)' }} />
      <span className="mono">{hi} {UNIT[by]}</span>
      <span><i style={{ background: 'var(--g-synthetic)' }} />אין נתון</span>
    </div>
  )
}
