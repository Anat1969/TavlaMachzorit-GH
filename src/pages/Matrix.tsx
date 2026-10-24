import { useRef } from 'react'
import { PeriodicGrid } from '../components/PeriodicGrid'
import { useCellBoxes } from '../lib/motion'
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
  const nb = sel ? neighbours(lens, sel, 6) : []
  const hl = sel ? new Set([sel, ...nb.map((n) => n.el.sym)]) : null
  const ref = useRef<HTMLDivElement>(null)
  const boxes = useCellBoxes(ref)
  const from = sel ? boxes.get(sel) : undefined
  // threads from the chosen element to its nearest neighbours, drawn in order of strength
  const overlay = from && (
    // rank badges: 1 is the closest neighbour
    <svg className="rel-svg threads" aria-hidden key={sel + lens}>
      {nb.map(({ el, w }, i) => {
        const to = boxes.get(el.sym)
        if (!to) return null
        const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2 - Math.hypot(to.x - from.x, to.y - from.y) * 0.18
        return (
          <g key={el.sym} style={{ animationDelay: `${i * 140}ms` }}>
            <path d={`M${from.x},${from.y} Q${mx},${my} ${to.x},${to.y}`} pathLength={1} strokeWidth={1 + w * 3.5} style={{ animationDelay: `${i * 140}ms` }} />
            <rect className="ring" x={to.x - to.w / 2 - 2} y={to.y - to.h / 2 - 2} width={to.w + 4} height={to.h + 4} style={{ animationDelay: `${i * 140 + 500}ms` }} />
            <g className="rank" transform={`translate(${to.x + to.w / 2 - 2},${to.y - to.h / 2 + 2})`} style={{ animationDelay: `${i * 140 + 600}ms` }}>
              <rect x={-8} y={-8} width={16} height={16} /><text>{i + 1}</text>
            </g>
          </g>
        )
      })}
    </svg>
  )
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">סידור 1: מטריצה</div>
          <h1>הטבלה שכולם מכירים</h1>
          <p>שורות לפי קליפות אלקטרונים, טורים לפי אלקטרוני ערכיות. בחרו יסוד: חוטים יימתחו ממנו אל השכנים הקרובים לו ברשת, לפי סדר החוזק, והמספר בפינה הוא הדירוג. רוב החוטים חוצים את הטבלה. כשמחליפים צביעה, הצבע זורם לפי המספר האטומי וחושף את המגמה המחזורית.</p>
        </div>
      </div>
      <div className="split">
        <div className="stack">
          <div className="glass panel stack">
            <Chips label="צבע לפי" options={COLOR_BY} value={colorBy} onChange={(v) => setParam('color', v)} />
            <Chips label="שכנות לפי" options={LENSES.map((l) => ({ id: l.id, label: l.label }))} value={lens} onChange={(v) => setParam('lens', v)} />
          </div>
          <div className="glass panel">
            <PeriodicGrid ref={ref} colorBy={colorBy} selected={sel} highlight={hl} overlay={overlay} onPick={(s) => setParam('el', s === sel ? null : s)} />
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
