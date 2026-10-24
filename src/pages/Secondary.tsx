import { useLayoutEffect, useRef, useState } from 'react'
import { PeriodicGrid } from '../components/PeriodicGrid'
import { ElementPanel } from '../components/ElementPanel'
import { BY_SYM } from '../data/elements'
import { RELATIONS, REL_TYPES, type RelType } from '../data/relations'
import { setParam } from '../lib/router'

type Pt = { x: number; y: number }

export function Secondary({ params }: { params: URLSearchParams }) {
  const type = (params.get('type') as RelType | null) ?? null
  const relIdx = params.get('rel') ? Number(params.get('rel')) : null
  const sel = params.get('el')
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Map<string, Pt>>(new Map())

  // measure cell centres so the arcs follow the grid at any screen size
  useLayoutEffect(() => {
    const box = ref.current
    if (!box) return
    const measure = () => {
      const r0 = box.getBoundingClientRect()
      const m = new Map<string, Pt>()
      box.querySelectorAll<HTMLElement>('[data-sym]').forEach((c) => {
        const r = c.getBoundingClientRect()
        m.set(c.dataset.sym!, { x: r.left - r0.left + r.width / 2, y: r.top - r0.top + r.height / 2 })
      })
      setPos(m)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  const shown = RELATIONS.map((r, i) => ({ ...r, i })).filter((r) => !type || r.type === type)
  const active = relIdx !== null ? RELATIONS[relIdx] : null
  const hl = active ? new Set([active.a, active.b]) : type ? new Set(shown.flatMap((r) => [r.a, r.b])) : null

  const overlay = (
    <svg className="rel-svg" aria-hidden>
      {shown.map((r) => {
        const a = pos.get(r.a), b = pos.get(r.b)
        if (!a || !b) return null
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
        const dx = b.x - a.x, dy = b.y - a.y
        const bend = 0.25
        const d = `M${a.x},${a.y} Q${mx - dy * bend},${my + dx * bend} ${b.x},${b.y}`
        const on = !active || active === RELATIONS[r.i]
        return <path key={r.i} d={d} stroke={`var(--r-${r.type})`} opacity={on ? 1 : 0.12} />
      })}
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
        <div className="stack">
          <div className="glass panel row">
            <span className="eyebrow">סוג קשר</span>
            <button className="chip" aria-pressed={!type} onClick={() => { setParam('type', null); setParam('rel', null) }}>הכל</button>
            {REL_TYPES.map((t) => (
              <button key={t.id} className="chip" aria-pressed={type === t.id} onClick={() => { setParam('type', t.id); setParam('rel', null) }}
                style={{ borderInlineStart: `4px solid var(--r-${t.id})` }}>{t.label}</button>
            ))}
          </div>
          <div className="glass panel">
            <PeriodicGrid ref={ref} selected={sel} highlight={hl} onPick={(s) => setParam('el', s === sel ? null : s)} overlay={overlay} />
          </div>
          {type && <div className="glass panel small muted">{REL_TYPES.find((t) => t.id === type)!.about}</div>}
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
