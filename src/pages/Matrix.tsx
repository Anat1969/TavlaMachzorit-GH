import { PeriodicGrid } from '../components/PeriodicGrid'
import { ElementPanel } from '../components/ElementPanel'
import { Legend } from '../components/Legend'
import { Chips } from '../components/Chips'
import { COLOR_BY, type ColorBy } from '../lib/colors'
import { LENSES, neighbours, type Lens } from '../lib/similarity'
import { setParam } from '../lib/router'

export function Matrix({ params }: { params: URLSearchParams }) {
  const colorBy = (params.get('color') as ColorBy) || 'cat'
  const lens = (params.get('lens') as Lens) || 'compounds'
  const sel = params.get('el')
  // the matrix also shows the network: a selected element lights up its nearest neighbours
  const hl = sel ? new Set([sel, ...neighbours(lens, sel, 6).map((n) => n.el.sym)]) : null
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">סידור 1: מטריצה</div>
          <h1>הטבלה שכולם מכירים</h1>
          <p>שורות לפי קליפות אלקטרונים, טורים לפי אלקטרוני ערכיות. בחרו יסוד, והשכנים שלו ברשת יידלקו: הם לא תמיד נמצאים לידו בטבלה.</p>
        </div>
      </div>
      <div className="split">
        <div className="stack">
          <div className="glass panel stack">
            <Chips label="צבע לפי" options={COLOR_BY} value={colorBy} onChange={(v) => setParam('color', v)} />
            <Chips label="שכנות לפי" options={LENSES.map((l) => ({ id: l.id, label: l.label }))} value={lens} onChange={(v) => setParam('lens', v)} />
          </div>
          <div className="glass panel">
            <PeriodicGrid colorBy={colorBy} selected={sel} highlight={hl} onPick={(s) => setParam('el', s === sel ? null : s)} />
            <div style={{ marginTop: 12 }}><Legend by={colorBy} /></div>
          </div>
        </div>
        <div className="stack">
          <ElementPanel sym={sel} lens={lens} colorBy={colorBy} onPick={(s) => setParam('el', s)} />
        </div>
      </div>
    </>
  )
}
