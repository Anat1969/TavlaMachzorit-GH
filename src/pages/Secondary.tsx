import { useRef } from 'react'
import { useCellBoxes, type Box } from '../lib/motion'
import { PeriodicGrid } from '../components/PeriodicGrid'
import { ElementPanel } from '../components/ElementPanel'
import { BY_SYM } from '../data/elements'
import { RELATIONS, REL_TYPES, type RelType } from '../data/relations'
import { setParam } from '../lib/router'


export function Secondary({ params }: { params: URLSearchParams }) {
  const type = (params.get('type') as RelType | null) ?? null
  const relIdx = params.get('rel') ? Number(params.get('rel')) : null
  const sel = params.get('el')
  const ref = useRef<HTMLDivElement>(null)
  const pos = useCellBoxes(ref)

  const shown = RELATIONS.map((r, i) => ({ ...r, i })).filter((r) => !type || r.type === type)
  const active = relIdx !== null ? RELATIONS[relIdx] : null
  const hl = active ? new Set([active.a, active.b]) : type ? new Set(shown.flatMap((r) => [r.a, r.b])) : null

  const overlay = (
    <svg className="rel-svg" aria-hidden key={(type ?? 'all') + (relIdx ?? '')}>
      {shown.map((r, k) => {
        const a = pos.get(r.a), b = pos.get(r.b)
        if (!a || !b) return null
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
        const dx = b.x - a.x, dy = b.y - a.y
        const bend = 0.25
        const d = `M${a.x},${a.y} Q${mx - dy * bend},${my + dx * bend} ${b.x},${b.y}`
        const on = !active || active === RELATIONS[r.i]
        return <path key={r.i} className="arc" d={d} pathLength={1} stroke={`var(--r-${r.type})`} opacity={on ? 1 : 0.06} style={{ animationDelay: `${k * 70}ms` }} />
      })}
      {active && <Logic rel={active} pos={pos} />}
    </svg>
  )

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">סידור 3: מחזוריות משנית</div>
          <h1>קשרים באלכסון, בקפיצה ובעומק</h1>
          <p>הטבלה מבטיחה דמיון לאורך טור. בפועל יש קשרים חזקים גם באלכסון, ב"מהלך פרש", בין טורים שרחוקים 10 מקומות, וחריגות בתוך הטור עצמו. לחצו על קשר כדי לראות אותו ולקרוא את ההסבר.</p>
        </div>
      </div>
      <div className="split fill">
        <div className={`stack${active ? ' has-caption' : ''}`}>
          <div className="glass panel row">
            <span className="eyebrow">סוג קשר</span>
            <button className="chip" aria-pressed={!type} onClick={() => { setParam('type', null); setParam('rel', null) }}>הכל</button>
            {REL_TYPES.map((t) => (
              <button key={t.id} className="chip" aria-pressed={type === t.id} onClick={() => { setParam('type', t.id); setParam('rel', null) }}
                style={{ borderInlineStart: `4px solid var(--r-${t.id})` }}>{t.label}</button>
            ))}
          </div>
          {active && <LogicCaption rel={active} />}
          <div className="glass panel">
            <PeriodicGrid ref={ref} selected={sel} highlight={hl} onPick={(s) => setParam('el', s === sel ? null : s)} overlay={overlay} />
          </div>
          {type && !active && <div className="glass panel small muted">{REL_TYPES.find((t) => t.id === type)!.about}</div>}
        </div>
        <div className="stack">
          {sel && <ElementPanel sym={sel} lens="chemical" onPick={(s) => setParam('el', s)} />}
          {shown.map((r) => {
            const A = BY_SYM.get(r.a)!, B = BY_SYM.get(r.b)!
            const t = REL_TYPES.find((x) => x.id === r.type)!
            return (
              <button key={r.i} className="glass rel-card" style={{ ['--rc' as string]: `var(--r-${r.type})` }} aria-pressed={relIdx === r.i}
                onClick={() => setParam('rel', relIdx === r.i ? null : String(r.i))}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <b style={{ fontWeight: 600 }}>{A.sym} ↔ {B.sym}</b>
                  <span className="eyebrow" style={{ color: `var(--r-${r.type})` }}>{t.label}</span>
                </div>
                <div className="small">{A.he} ו{B.he}</div>
                <div className="small muted">{r.why}</div>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

type Step = { d: string; mx: number; my: number }

// The reasoning behind each kind of relation, as ordered steps plus a conclusion.
function reasoning(rel: (typeof RELATIONS)[number]) {
  const ca = BY_SYM.get(rel.a)!, cb = BY_SYM.get(rel.b)!
  const wide = Math.abs(ca.col - cb.col) > 2
  switch (rel.type) {
    case 'diagonal': return {
      steps: ['שורה אחת למטה: האטום גדל', 'טור אחד ימינה: המטען גדל'],
      verdict: 'השינויים מתקזזים, וצפיפות המטען יוצאת דומה',
      note: wide ? 'בטבלה הקצרה של 8 טורים זה צעד אחד באלכסון. בטבלה הארוכה גוש d מפריד ביניהם.' : '',
    }
    case 'knight': return { steps: ['שורה אחת למטה', 'שני טורים ימינה'], verdict: 'אותו מטען ואותו גודל יוני בערך', note: '' }
    case 'ten': return { steps: ['עשרה טורים ימינה, מגוש d לגוש p'], verdict: 'אותה דרגת חמצון מרבית, ולכן אותו מבנה של תרכובות', note: '' }
    default: return { steps: ['יורדים שורה בתוך הטור'], verdict: 'והמגמה הצפויה נשברת', note: '' }
  }
}

function stepPaths(rel: (typeof RELATIONS)[number], a: Box, b: Box): Step[] {
  const seg = (x1: number, y1: number, x2: number, y2: number) => ({ d: `M${x1},${y1} L${x2},${y2}`, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 })
  if (rel.type === 'diagonal' || rel.type === 'knight') return [seg(a.x, a.y, a.x, b.y), seg(a.x, b.y, b.x, b.y)]
  if (rel.type === 'ten') {
    const [lo, hi] = a.x < b.x ? [a, b] : [b, a]
    return [{ d: `M${lo.x},${lo.y} L${hi.x},${lo.y} L${hi.x},${hi.y}`, mx: (lo.x + hi.x) / 2, my: lo.y }]
  }
  return [seg(a.x, a.y, b.x, b.y)]
}

// The path itself, drawn step by step over the grid, with numbered markers.
function Logic({ rel, pos }: { rel: (typeof RELATIONS)[number]; pos: Map<string, Box> }) {
  const a = pos.get(rel.a), b = pos.get(rel.b)
  if (!a || !b) return null
  const steps = stepPaths(rel, a, b)
  return (
    <g className="logic" style={{ ['--rc' as string]: `var(--r-${rel.type})` }}>
      {steps.map((s, i) => (
        <g key={i}>
          <path className="step" d={s.d} pathLength={1} style={{ animationDelay: `${300 + i * 600}ms` }} />
          <g className="badge" style={{ animationDelay: `${600 + i * 600}ms` }} transform={`translate(${s.mx},${s.my})`}>
            <rect x={-10} y={-10} width={20} height={20} />
            <text>{i + 1}</text>
          </g>
        </g>
      ))}
      {[a, b].map((p, i) => <rect key={i} className="ring" x={p.x - p.w / 2 - 3} y={p.y - p.h / 2 - 3} width={p.w + 6} height={p.h + 6} style={{ animationDelay: `${i ? 300 + steps.length * 600 : 0}ms` }} />)}
    </g>
  )
}

function LogicCaption({ rel }: { rel: (typeof RELATIONS)[number] }) {
  const r = reasoning(rel)
  return (
    <div className="glass panel logic-caption" key={rel.a + rel.b} style={{ ['--rc' as string]: `var(--r-${rel.type})` }}>
      <div className="row">
        <b className="mono">{rel.a}</b>
        {r.steps.map((t, i) => <span key={i} className="lstep" style={{ animationDelay: `${600 + i * 600}ms` }}><i>{i + 1}</i>{t}</span>)}
        <b className="mono">{rel.b}</b>
      </div>
      <div className="lverdict" style={{ animationDelay: `${600 + r.steps.length * 600}ms` }}>{r.verdict}</div>
      {r.note && <div className="small muted">{r.note}</div>}
    </div>
  )
}
