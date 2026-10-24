import { ELEMENTS, CAT_LABEL } from '../data/elements'
import { colorOf, COLOR_BY, type ColorBy } from '../lib/colors'
import { setParam } from '../lib/router'
import { Chips } from '../components/Chips'
import { Legend } from '../components/Legend'
import { ElementPanel } from '../components/ElementPanel'

// Benfey-style spiral: one turn per period, so the table becomes one unbroken sequence.
const PERIOD_LEN = [2, 8, 8, 18, 18, 32, 32]
const START = [1, 3, 11, 19, 37, 55, 87]

function polar(z: number) {
  let p = 0
  while (p < 6 && z >= START[p + 1]) p++
  const idx = z - START[p]
  // align the end of each period (noble gases) on the same ray
  const frac = (idx + 1) / PERIOD_LEN[p]
  const ang = -Math.PI / 2 + frac * Math.PI * 2
  const r = 40 + p * 46 + frac * 46
  return { x: Math.cos(ang) * r, y: Math.sin(ang) * r, ang, size: Math.max(20, Math.min(40, (2 * Math.PI * r) / PERIOD_LEN[p] - 4)) }
}

export function Spiral({ params }: { params: URLSearchParams }) {
  const colorBy = (params.get('color') as ColorBy) || 'cat'
  const sel = params.get('el')
  const path = ELEMENTS.map((e) => polar(e.z)).map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">סידור 4: ספירלה</div>
          <h1>רצף אחד, בלי חיתוכים</h1>
          <p>בטבלה הרגילה כל שורה נחתכת, והלנתנידים "מוצאים החוצה". בספירלה כל מחזור הוא סיבוב, הגזים האצילים יושבים על קרן אחת למעלה, ומשפחות שלמות נפתחות כמו מניפה.</p>
        </div>
      </div>
      <div className="glass panel row" style={{ justifyContent: 'space-between' }}>
        <Chips label="צבע לפי" options={COLOR_BY} value={colorBy} onChange={(v) => setParam('color', v)} />
        <Legend by={colorBy} />
      </div>
      <div className="split fill">
        <div className="glass panel" style={{ minHeight: 0, display: 'flex' }}>
          <svg className="spiral-svg" viewBox="-385 -385 770 770" role="img" aria-label="ספירלה של היסודות לפי מספר אטומי">
            <path d={path} fill="none" stroke="var(--rim-strong)" strokeWidth="1.5" />
            {ELEMENTS.map((e) => {
              const p = polar(e.z), s = p.size
              return (
                <g key={e.sym} className="tile" transform={`translate(${p.x},${p.y})`} onClick={() => setParam('el', e.sym === sel ? null : e.sym)}
                  role="button" tabIndex={0} aria-label={`${e.he}, ${CAT_LABEL[e.cat]}`} onKeyDown={(ev) => ev.key === 'Enter' && setParam('el', e.sym)} opacity={sel && sel !== e.sym ? 0.55 : 1}>
                  <title>{e.he}</title>
                  <rect x={-s / 2} y={-s / 2} width={s} height={s} fill={colorOf(e, colorBy)} strokeWidth={sel === e.sym ? 3 : 1} stroke={sel === e.sym ? 'var(--ink)' : undefined} />
                  <text style={{ fontSize: Math.min(15, s * 0.46) }}>{e.sym}</text>
                </g>
              )
            })}
            <text x="0" y="0" style={{ fill: 'var(--ink-soft)', fontSize: 13, fontWeight: 300 }}>H → Og</text>
          </svg>
        </div>
        <div className="stack">
          <ElementPanel sym={sel} lens="chemical" colorBy={colorBy} onPick={(s) => setParam('el', s)} />
        </div>
      </div>
    </>
  )
}
