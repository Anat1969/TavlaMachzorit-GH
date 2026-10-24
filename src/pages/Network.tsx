import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY, type SimulationNodeDatum } from 'd3-force'
import { BY_SYM } from '../data/elements'
import { colorOf, type ColorBy } from '../lib/colors'
import { LENSES, buildEdges, lensNodes, surprises, neighbours, sharedTemplates, type Lens } from '../lib/similarity'
import { setParam } from '../lib/router'
import { prettyFormula } from '../data/compounds'
import { Chips } from '../components/Chips'
import { Legend } from '../components/Legend'
import { ElementPanel } from '../components/ElementPanel'
import { useTween } from '../lib/motion'

const Network3D = lazy(() => import('../three/Network3D'))

interface N extends SimulationNodeDatum { id: string; deg: number }

// Deterministic layout: the same lens always gives the same picture.
function layout(lens: Lens) {
  const edges = buildEdges(lens, 3)
  const deg = new Map<string, number>()
  for (const e of edges) { deg.set(e.a, (deg.get(e.a) ?? 0) + 1); deg.set(e.b, (deg.get(e.b) ?? 0) + 1) }
  const els = lensNodes(lens)
  const nodes: N[] = els.map((e, i) => ({
    id: e.sym, deg: deg.get(e.sym) ?? 0,
    // seed from the classic position so families start near each other
    x: ((e.group ?? 3) - 9.5) * 30 + (i % 3), y: (e.period - 4) * 40 + (e.row > 8 ? 60 : 0),
  }))
  const links = edges.map((e) => ({ source: e.a, target: e.b, w: e.w }))
  const sim = forceSimulation(nodes)
    .force('link', forceLink<N, (typeof links)[number]>(links).id((d) => d.id).distance((l) => 30 + 50 * (1 - l.w)).strength((l) => 0.3 + l.w * 0.7))
    .force('charge', forceManyBody().strength(-120))
    .force('collide', forceCollide(16))
    .force('x', forceX(0).strength(0.04))
    .force('y', forceY(0).strength(0.06))
    .force('center', forceCenter(0, 0))
    .stop()
  for (let i = 0; i < 400; i++) sim.tick()
  const xs = nodes.map((n) => n.x!), ys = nodes.map((n) => n.y!)
  const pad = 30, top = 60 // room for the mode switch above the drawing
  const box = [Math.min(...xs) - pad, Math.min(...ys) - top, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad + top]
  return { nodes, edges, pos: new Map(nodes.map((n) => [n.id, n])), box }
}

// Classic-table coordinates inside the same drawing box, so nodes can fly between arrangements.
function tableLayout(ids: string[], box: number[]) {
  const [x0, y0, w, h] = box
  const cell = Math.min(w / 18, h / 10.6)
  const ox = x0 + (w - 18 * cell) / 2, oy = y0 + (h - 10.6 * cell) / 2
  return new Map(ids.map((id) => {
    const e = BY_SYM.get(id)!
    const r = e.row > 8 ? e.row - 0.4 : e.row
    return [id, { x: ox + (e.col - 0.5) * cell, y: oy + (r - 0.5) * cell }]
  }))
}

export function Network({ params }: { params: URLSearchParams }) {
  const lens = (params.get('lens') as Lens) || 'compounds'
  const colorBy = (params.get('color') as ColorBy) || (lens === 'geo' ? 'geo' : 'cat')
  const sel = params.get('el')
  const view = (['table', '3d'].includes(params.get('view') ?? '') ? params.get('view') : 'net') as 'net' | 'table' | '3d'
  const narrow = useNarrow()
  const L0 = useMemo(() => layout(lens), [lens])
  // on a portrait phone screen, turn a landscape layout on its side so nodes stay readable
  const L = useMemo(() => {
    if (!narrow || L0.box[2] <= L0.box[3]) return L0
    const nodes = L0.nodes.map((n) => ({ ...n, x: n.y, y: n.x }))
    return { ...L0, nodes, pos: new Map(nodes.map((n) => [n.id, n])), box: [L0.box[1], L0.box[0], L0.box[3], L0.box[2]] }
  }, [L0, narrow])
  const tablePos = useMemo(() => tableLayout(L.nodes.map((n) => n.id), L.box), [L])
  const netPos = useMemo(() => new Map(L.nodes.map((n) => [n.id, { x: n.x!, y: n.y! }])), [L])
  // first visit: elements leave their seats in the table and gather into the network
  const shown = useTween(view === 'table' ? tablePos : netPos, 1400, tablePos)
  const ids = useMemo(() => L0.nodes.map((n) => n.id), [L0])
  const cellR = Math.min(L.box[2] / 18, L.box[3] / 10.6) * 0.42

  const surp = useMemo(() => surprises(lens, 8), [lens])
  const surpKeys = new Set(surp.map((s) => s.a + '|' + s.b))
  const [focusPair, setFocusPair] = useState<string | null>(null)
  const ranked = sel && L.pos.has(sel) ? neighbours(lens, sel, 6).map((n) => n.el.sym) : []
  const rank = new Map(ranked.map((s, i) => [s, i]))
  const near = sel && L.pos.has(sel) ? new Set([sel, ...ranked]) : null
  const pairNodes = focusPair ? new Set(focusPair.split('|')) : null
  const info = LENSES.find((l) => l.id === lens)!
  const pick = (s: string) => setParam('el', s === sel ? null : s)
  const at = (id: string) => shown.get(id) ?? netPos.get(id)!

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">סידור 2: רשת</div>
          <h1>כל יסוד הוא צומת, כל קו הוא דמיון</h1>
          <p>היסודות יוצאים מהמקום שלהם בטבלה ומתקבצים לפי דמיון. כל יסוד מחובר לשלושת השכנים הדומים לו ביותר. קווים כתומים זורמים הם <b>קשרים מפתיעים</b>: דמיון חזק בין יסודות שרחוקים בטבלה.</p>
        </div>
      </div>
      <div className="glass panel stack">
        <Chips label="עדשה" options={LENSES.map((l) => ({ id: l.id, label: l.label }))} value={lens} onChange={(v) => { setParam('lens', v); setParam('color', null) }} />
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <Chips label="צבע" options={[{ id: 'cat' as ColorBy, label: 'משפחה' }, { id: 'geo' as ColorBy, label: 'גיאוכימיה' }, { id: 'en' as ColorBy, label: 'אלקטרושליליות' }]} value={colorBy} onChange={(v) => setParam('color', v)} />
          <Legend by={colorBy} />
        </div>
      </div>
      <div className="split fill">
        <div className="glass net-box">
          <div className="net-mode">
            <div className="row" role="group" aria-label="אופן תצוגה">
              <button className="chip" aria-pressed={view === 'net'} onClick={() => setParam('view', null)}>רשת</button>
              <button className="chip" aria-pressed={view === 'table'} onClick={() => setParam('view', 'table')}>על הטבלה</button>
              <button className="chip" aria-pressed={view === '3d'} onClick={() => setParam('view', '3d')}>תלת־ממד</button>
            </div>
            <span className="small muted">{view === 'table' ? 'אותם קשרים, על הטבלה הרגילה: כל קו ארוך הוא דמיון שהטבלה מפרידה.' : view === '3d' ? 'כל כדור עשוי מהחומר האמיתי של היסוד: מתכת מלוטשת, זכוכית עם גז זוהר. גררו כדי לסובב.' : 'המיקום נקבע רק לפי דמיון. יסודות דומים נמשכים זה לזה.'}</span>
          </div>
          {view === '3d' && (
            <Suspense fallback={<div className="net3d loading">טוען תלת־ממד</div>}>
              <Network3D ids={ids} edges={L0.edges} sel={sel && L.pos.has(sel) ? sel : null} near={near} surprise={surpKeys} colorBy={colorBy} onPick={pick} />
            </Suspense>
          )}
          <svg style={view === '3d' ? { display: 'none' } : undefined} className={`net-svg${view === 'table' ? ' as-table' : ''}`} viewBox={L.box.join(' ')} role="img" aria-label={`רשת היסודות לפי ${info.label}: ${L.nodes.length} יסודות, ${L.edges.length} קשרים`}>
            <defs>
              {/* a spherical highlight: light from the upper left, shade toward the lower right */}
              <radialGradient id="gloss" cx="35%" cy="30%" r="75%">
                <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
                <stop offset="0.35" stopColor="#fff" stopOpacity="0.12" />
                <stop offset="0.8" stopColor="#000" stopOpacity="0.1" />
                <stop offset="1" stopColor="#000" stopOpacity="0.35" />
              </radialGradient>
            </defs>
            {L.edges.map((e) => {
              const a = at(e.a), b = at(e.b)
              const key = e.a + '|' + e.b
              const hot = !!sel && (e.a === sel || e.b === sel)
              const sp = surpKeys.has(key)
              const focus = focusPair === key
              const cls = focus ? 'focus' : hot ? 'hot' : sp ? 'surprise' : focusPair ? 'faded' : ''
              const other = e.a === sel ? e.b : e.a
              return (
                <line key={key + (hot ? sel : '') + (focus ? 'f' : '')} x1={a.x} y1={a.y} x2={b.x} y2={b.y} pathLength={1}
                  strokeWidth={0.6 + e.w * 2.4} className={cls}
                  style={hot ? { animationDelay: `${(rank.get(other) ?? 0) * 90}ms` } : undefined} />
              )
            })}
            {L.nodes.map((n, i) => {
              const el = BY_SYM.get(n.id)!
              const p = at(n.id)
              const r = view === 'table' ? cellR : 10 + Math.min(6, n.deg)
              const lit = rank.has(n.id)
              const dim = (near && !near.has(n.id)) || (pairNodes && !pairNodes.has(n.id))
              return (
                <g key={n.id} className={`node${sel === n.id ? ' sel' : ''}${dim ? ' dim' : ''}`} transform={`translate(${p.x},${p.y})`}
                  onClick={() => pick(n.id)} role="button" tabIndex={0} aria-label={el.he} onKeyDown={(ev) => ev.key === 'Enter' && pick(n.id)}>
                  <title>{`${el.he}: ${n.deg} קשרים`}</title>
                  {sel === n.id && <><circle key={'r1' + sel} className="ripple" r={r} /><circle key={'r2' + sel} className="ripple late" r={r} /></>}
                  <g className={`pop${lit ? ' lit' : ''}`} style={{ animationDelay: lit ? `${250 + rank.get(n.id)! * 90}ms` : `${i * 6}ms` }} key={lit ? n.id + sel : n.id}>
                    <circle r={r} fill={colorOf(el, colorBy)} />
                    <circle r={r} fill="url(#gloss)" className="gloss" />
                    <text style={{ fontSize: Math.max(7, Math.min(10, r * 0.9)) }}>{n.id}</text>
                  </g>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="stack">
          <div className="glass panel">
            <h3>איך נמדד הדמיון בעדשה הזו</h3>
            <p className="small muted" style={{ margin: 0 }}>{info.how}</p>
            <p className="small faint mono" style={{ marginBottom: 0 }}>{L.nodes.length} יסודות · {L.edges.length} קשרים</p>
          </div>
          <ElementPanel sym={sel && L.pos.has(sel) ? sel : null} lens={lens} colorBy={colorBy} onPick={(s) => setParam('el', s)} />
          <div className="glass panel">
            <h3>הקשרים המפתיעים ביותר</h3>
            <p className="small muted" style={{ marginTop: 0 }}>הדמיון כפול המרחק בטבלה הקלאסית. רחפו על קשר כדי לראות אותו ברשת.</p>
            <div className="surp">
              {surp.map((s) => (
                <SurpriseRow key={s.a + s.b} a={s.a} b={s.b} w={s.w} d={s.dist} lens={lens} colorBy={colorBy} onPick={pick}
                  onFocus={(on) => setFocusPair(on ? s.a + '|' + s.b : null)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function useNarrow() {
  const q = '(max-width: 768px)'
  const [m, setM] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const mq = matchMedia(q), on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}

function SurpriseRow({ a, b, w, d, lens, colorBy, onPick, onFocus }: { a: string; b: string; w: number; d: number; lens: Lens; colorBy: ColorBy; onPick: (s: string) => void; onFocus: (on: boolean) => void }) {
  const A = BY_SYM.get(a)!, B = BY_SYM.get(b)!
  const shared = lens === 'compounds' ? sharedTemplates(a, b).slice(0, 4).map(prettyFormula).join(' ') : ''
  const hover = { onMouseEnter: () => onFocus(true), onMouseLeave: () => onFocus(false), onFocus: () => onFocus(true), onBlur: () => onFocus(false) }
  return (
    <>
      <button className="chip sym-chip" {...hover} style={{ ['--cell' as string]: colorOf(A, colorBy) }} onClick={() => onPick(a)}>{a}</button>
      <button className="chip sym-chip" {...hover} style={{ ['--cell' as string]: colorOf(B, colorBy) }} onClick={() => onPick(b)}>{b}</button>
      <span className="small" {...hover}>{A.he} ו{B.he} <span className="mono faint">· דמיון {w.toFixed(2)} · מרחק {d}</span>{shared && <><br /><span className="mono faint" dir="ltr">{shared}</span></>}</span>
    </>
  )
}
