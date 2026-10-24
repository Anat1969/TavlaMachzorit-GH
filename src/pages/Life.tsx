import { lazy, Suspense, useMemo, useRef } from 'react'
import { PeriodicGrid } from '../components/PeriodicGrid'
import { ElementPanel } from '../components/ElementPanel'
import { BY_SYM } from '../data/elements'
import { EVERYDAY, THINGS } from '../data/everyday'
import { colorOf } from '../lib/colors'
import { setParam, href } from '../lib/router'
import { useCellBoxes } from '../lib/motion'

const Shelf3D = lazy(() => import('../three/Shelf3D'))

// Every everyday object is a hyperedge: a set of elements that meet inside it.
const pairs = THINGS.flatMap((a, i) => THINGS.slice(i + 1).map((b) => {
  const shared = a.els.filter((s) => b.els.includes(s))
  return { a, b, shared, j: shared.length / new Set([...a.els, ...b.els]).size }
})).sort((x, y) => y.j - x.j)

export function Life({ params }: { params: URLSearchParams }) {
  const A = THINGS.find((t) => t.id === params.get('a')) ?? THINGS[0]
  const B = THINGS.find((t) => t.id === params.get('b') && t.id !== A.id) ?? null
  const sel = params.get('el')
  const shared = useMemo(() => (B ? A.els.filter((s) => B.els.includes(s)) : []), [A, B])
  const shown = B ? shared : A.els
  const hl = new Set(B ? [...A.els, ...B.els] : A.els)
  const ref = useRef<HTMLDivElement>(null)
  const boxes = useCellBoxes(ref)

  const choose = (id: string) => {
    if (id === A.id) { if (B) { setParam('a', B.id); setParam('b', null) } return }
    if (B?.id === id) { setParam('b', null); return }
    if (!params.get('a')) { setParam('a', A.id) }
    setParam('b', id)
  }

  // rings: the common denominator glows, each side keeps its own outline
  const overlay = (
    <svg className="rel-svg life-rings" aria-hidden key={A.id + (B?.id ?? '')}>
      {[...hl].map((s, i) => {
        const p = boxes.get(s)
        if (!p) return null
        const both = !!B && shared.includes(s)
        const cls = both ? 'both' : A.els.includes(s) ? 'side-a' : 'side-b'
        return <rect key={s} className={cls} x={p.x - p.w / 2 - 2} y={p.y - p.h / 2 - 2} width={p.w + 4} height={p.h + 4} style={{ animationDelay: `${i * 25}ms` }} />
      })}
    </svg>
  )

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">בחיים</div>
          <h1>איפה היסודות פוגשים אותנו</h1>
          <p>כל חפץ יומיומי הוא קבוצה של יסודות שנפגשים בתוכו, בדיוק כמו תרכובת בהיפר־גרף. בחרו חפץ, ואז חפץ שני: מה שמשותף לשניהם הוא המכנה המשותף, היסודות שהעולם המודרני נשען עליהם.</p>
        </div>
      </div>

      <div className="things">
        {THINGS.map((t) => (
          <button key={t.id} className={`thing glass${t.id === A.id ? ' is-a' : ''}${t.id === B?.id ? ' is-b' : ''}`} aria-pressed={t.id === A.id || t.id === B?.id} onClick={() => choose(t.id)}>
            <span className="eyebrow">{t.id === A.id ? 'חפץ א' : t.id === B?.id ? 'חפץ ב' : `${t.els.length} יסודות`}</span>
            <b>{t.name}</b>
          </button>
        ))}
      </div>

      <div className="split">
        <div className="stack">
          <div className="glass panel">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>{B ? <>המכנה המשותף: {A.name} ו{B.name}</> : A.name}</h2>
              <span className="mono small faint">{B ? `${shared.length} משותפים מתוך ${hl.size}` : `${A.els.length} יסודות`}</span>
            </div>
            <p className="small muted" style={{ marginTop: 4 }}>{B ? 'הדגימות על המדף הן היסודות שנמצאים בשני החפצים. לחצו על דגימה כדי לראות מה היא עושה בכל אחד מהם.' : A.about}</p>
            <Suspense fallback={<div className="shelf3d loading">טוען דגימות</div>}>
              <Shelf3D syms={shown.slice(0, 8)} sel={sel} onPick={(s) => setParam('el', s)} />
            </Suspense>
            {shown.length > 8 && <p className="small faint" style={{ margin: '6px 0 0' }}>על המדף 8 הראשונים. כל {shown.length} מסומנים בטבלה.</p>}
          </div>
          <div className="glass panel">
            <PeriodicGrid ref={ref} selected={sel} highlight={hl} overlay={overlay} onPick={(s) => setParam('el', s === sel ? null : s)} />
            <div className="legend" style={{ marginTop: 10 }}>
              <span><i className="lg-a" />{A.name}</span>
              {B && <><span><i className="lg-b" />{B.name}</span><span><i className="lg-both" />בשניהם</span></>}
            </div>
          </div>
        </div>
        <div className="stack">
          {sel && BY_SYM.has(sel) ? <ElementPanel sym={sel} lens="compounds" onPick={(s) => setParam('el', s)} /> : (
            <div className="glass panel">
              <h3>{B ? 'מה כל יסוד משותף עושה' : 'מה כל יסוד עושה כאן'}</h3>
              {shown.map((s) => (
                <div key={s} className="nb">
                  <button className="chip sym-chip" style={{ ['--cell' as string]: colorOf(BY_SYM.get(s)!) }} onClick={() => setParam('el', s)}>{s}</button>
                  <span className="small">{EVERYDAY.get(s)?.uses[0]}</span>
                </div>
              ))}
            </div>
          )}
          <div className="glass panel">
            <h3>החפצים הקרובים ביותר זה לזה</h3>
            <p className="small muted" style={{ marginTop: 0 }}>לפי חלק היסודות המשותפים. זה אותו מדד שמחבר יסודות ברשת, רק הפוך: כאן החפצים הם הצמתים.</p>
            {pairs.slice(0, 6).map((p) => (
              <a key={p.a.id + p.b.id} className="pair" href={href('life', { a: p.a.id, b: p.b.id })}>
                <span>{p.a.name} ו{p.b.name}</span>
                <span className="mono small faint" dir="ltr">{p.shared.slice(0, 6).join(' ')}</span>
                <span className="bar"><b style={{ width: `${p.j * 100}%` }} /></span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
