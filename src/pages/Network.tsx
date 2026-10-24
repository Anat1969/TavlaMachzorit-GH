import { useEffect, useMemo, useState } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY, type SimulationNodeDatum } from 'd3-force'
import { BY_SYM } from '../data/elements'
import { colorOf, type ColorBy } from '../lib/colors'
import { LENSES, buildEdges, lensNodes, surprises, neighbours, sharedTemplates, type Lens } from '../lib/similarity'
import { setParam } from '../lib/router'
import { prettyFormula } from '../data/compounds'
import { Chips } from '../components/Chips'
import { Legend } from '../components/Legend'
import { ElementPanel } from '../components/ElementPanel'

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
  const pad = 30
  const box = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2]
  return { nodes, edges, pos: new Map(nodes.map((n) => [n.id, n])), box }
}

export function Network({ params }: { params: URLSearchParams }) {
  const lens = (params.get('lens') as Lens) || 'compounds'
  const colorBy = (params.get('color') as ColorBy) || (lens === 'geo' ? 'geo' : 'cat')
  const sel = params.get('el')
  const narrow = useNarrow()
  const L0 = useMemo(() => layout(lens), [lens])
  // on a portrait phone screen, turn a landscape layout on its side so nodes stay readable
  const L = useMemo(() => {
    if (!narrow || L0.box[2] <= L0.box[3]) return L0
    const nodes = L0.nodes.map((n) => ({ ...n, x: n.y, y: n.x }))
    return { ...L0, nodes, pos: new Map(nodes.map((n) => [n.id, n])), box: [L0.box[1], L0.box[0], L0.box[3], L0.box[2]] }
  }, [L0, narrow])
  const surp = useMemo(() => surprises(lens, 8), [lens])
  const surpKeys = new Set(surp.map((s) => s.a + '|' + s.b))
  const near = sel && L.pos.has(sel) ? new Set([sel, ...neighbours(lens, sel, 6).map((n) => n.el.sym)]) : null
  const info = LENSES.find((l) => l.id === lens)!
  const pick = (s: string) => setParam('el', s === sel ? null : s)

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">סידור 2: רשת</div>
          <h1>כל יסוד הוא צומת, כל קו הוא דמיון</h1>
          <p>כל יסוד מחובר לשלושת השכנים הדומים לו ביותר. קווים מקווקווים כתומים הם <b>קשרים מפתיעים</b>: דמיון חזק בין יסודות שרחוקים זה מזה בטבלה.</p>
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
          <svg className="net-svg" viewBox={L.box.join(' ')} role="img" aria-label={`רשת היסודות לפי ${info.label}: ${L.nodes.length} יסודות, ${L.edges.length} קשרים`}>
            {L.edges.map((e) => {
              const a = L.pos.get(e.a)!, b = L.pos.get(e.b)!
              const hot = !!sel && (e.a === sel || e.b === sel)
              const sp = surpKeys.has(e.a + '|' + e.b)
              return <line key={e.a + e.b} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={0.6 + e.w * 2.4} className={hot ? 'hot' : sp ? 'surprise' : ''} />
            })}
            {L.nodes.map((n) => {
              const el = BY_SYM.get(n.id)!
              const r = 10 + Math.min(6, n.deg)
              return (
                <g key={n.id} className={`node${sel === n.id ? ' sel' : ''}${near && !near.has(n.id) ? ' dim' : ''}`} transform={`translate(${n.x},${n.y})`}
                  onClick={() => pick(n.id)} role="button" tabIndex={0} aria-label={el.he} onKeyDown={(ev) => ev.key === 'Enter' && pick(n.id)}>
                  <title>{`${el.he}: ${n.deg} קשרים`}</title>
                  <circle r={r} fill={colorOf(el, colorBy)} />
                  <text>{n.id}</text>
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
            <p className="small muted" style={{ marginTop: 0 }}>הדמיון כפול המרחק בטבלה הקלאסית. אלה הקשרים שהטבלה מסתירה.</p>
            <div className="surp">
              {surp.map((s) => (
                <SurpriseRow key={s.a + s.b} a={s.a} b={s.b} w={s.w} d={s.dist} lens={lens} colorBy={colorBy} onPick={pick} />
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

function SurpriseRow({ a, b, w, d, lens, colorBy, onPick }: { a: string; b: string; w: number; d: number; lens: Lens; colorBy: ColorBy; onPick: (s: string) => void }) {
  const A = BY_SYM.get(a)!, B = BY_SYM.get(b)!
  const shared = lens === 'compounds' ? sharedTemplates(a, b).slice(0, 4).map(prettyFormula).join(' ') : ''
  return (
    <>
      <button className="chip sym-chip" style={{ ['--cell' as string]: colorOf(A, colorBy) }} onClick={() => onPick(a)}>{a}</button>
      <button className="chip sym-chip" style={{ ['--cell' as string]: colorOf(B, colorBy) }} onClick={() => onPick(b)}>{b}</button>
      <span className="small">{A.he} ו{B.he} <span className="mono faint">· דמיון {w.toFixed(2)} · מרחק {d}</span>{shared && <><br /><span className="mono faint" dir="ltr">{shared}</span></>}</span>
    </>
  )
}
