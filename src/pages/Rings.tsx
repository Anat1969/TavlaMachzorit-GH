import { ELEMENTS, BY_SYM, CAT_LABEL, type Element } from '../data/elements'
import { colorOf, COLOR_BY, type ColorBy } from '../lib/colors'
import { setParam } from '../lib/router'
import { Chips } from '../components/Chips'
import { Legend } from '../components/Legend'
import { ElementPanel } from '../components/ElementPanel'
import { prettyFormula } from '../data/compounds'
import { ringPos, hops, predict, arcPath, RING_R, VIEW, RELIABILITY } from '../lib/mayan'

const SIDE_LABEL = { give: 'נותן אלקטרונים', take: 'מקבל אלקטרונים', both: 'יכול לתת או לקבל' }

/** The path an element walks to the noble-gas line, and the numbered s/p stops on the way. */
function walk(e: Element, side: 'give' | 'take') {
  const p = ringPos(e)
  const top = side === 'give' ? -Math.PI / 2 : (3 * Math.PI) / 2
  const passed = ELEMENTS.filter((x) => x.period === e.period && (side === 'give' ? x.z < e.z : x.z > e.z) && hops(x) && x.cat !== 'noble')
    .sort((a, b) => (side === 'give' ? b.z - a.z : a.z - b.z))
  const r = RING_R(e.period)
  const stops = [...passed.map((x) => ringPos(x)), { x: 0, y: -r }]
  return { d: arcPath(e.period, p.ang, top), stops }
}

export function Rings({ params }: { params: URLSearchParams }) {
  const colorBy = (params.get('color') as ColorBy) || 'cat'
  const heat = params.get('heat') === '1'
  const A = BY_SYM.get(params.get('a') ?? '') ?? null
  const B = BY_SYM.get(params.get('b') ?? '') ?? null
  const pred = A && B ? predict(A, B) : null

  const pick = (s: string) => {
    if (!A || (A && B)) { setParam('b', null); setParam('a', s === A?.sym && !B ? null : s) }
    else if (s === A.sym) setParam('a', null)
    else setParam('b', s)
  }
  const roleOf = (e: Element | null) => (e && pred ? (e === pred.giver ? 'give' : 'take') : e ? hops(e)?.side : undefined)
  const walks = [A, B].map((e, i) => {
    const side = roleOf(e)
    if (!e || !side || (side === 'both' && !pred) || !hops(e)?.n) return null
    const s: 'give' | 'take' = side === 'both' ? (ringPos(e).x >= 0 ? 'give' : 'take') : side
    return { e, side: s, cls: i ? 'side-b' : 'side-a', ...walk(e, s) }
  })

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">סידור 5: מעגלים</div>
          <h1>כל מחזור הוא טבעת</h1>
          <p>כל יסוד "רוצה" להיות גז אציל, עם קליפה חיצונית מלאה. כאן כל מחזור הוא טבעת, והגזים האצילים עומדים על קו אחד מעל המרכז. מימין לקו יושבים יסודות עם אלקטרון עודף, ומשמאלו יסודות שחסר להם אלקטרון. מספר הקפיצות עד הקו מסביר כמה היסוד מגיב, ובאיזה יחס הוא יתרכב. בחרו שני יסודות.</p>
        </div>
      </div>
      <div className="glass panel row" style={{ justifyContent: 'space-between' }}>
        <div className="row">
          <Chips label="צבע לפי" options={COLOR_BY} value={colorBy} onChange={(v) => setParam('color', v)} />
          <button className="chip" aria-pressed={heat} onClick={() => setParam('heat', heat ? null : '1')}>תגובתיות</button>
        </div>
        <Legend by={colorBy} />
      </div>
      <div className="split fill">
        <div className="glass panel" style={{ minHeight: 0, display: 'flex' }}>
          <svg className="spiral-svg rings-svg" viewBox={`${-VIEW} ${-VIEW - 14} ${VIEW * 2} ${VIEW * 2 + 14}`} role="img" aria-label="הטבלה המחזורית כטבעות: כל מחזור הוא טבעת, הגזים האצילים על קו אחד למעלה">
            {[1, 2, 3, 4, 5, 6, 7].map((p) => <circle key={p} className="ring" r={RING_R(p)} style={{ animationDelay: `${p * 80}ms` }} />)}
            {/* the anchor of the screen: the line every element is trying to reach */}
            <line className="noble-line" x1="0" y1={-RING_R(1) + 18} x2="0" y2={-RING_R(7) - 22} pathLength={1} />
            <text className="noble-label" x="0" y={-RING_R(7) - 28}>גזים אצילים</text>
            {ELEMENTS.map((e) => {
              const p = ringPos(e), s = p.size
              const on = e === A || e === B
              // closer to the noble line = more eager to react
              const op = heat && e.cat !== 'noble' ? Math.max(0.25, 1 - (p.ringHops - 1) * 0.11) : 1
              return (
                <g key={e.sym} className="tile" transform={`translate(${p.x},${p.y})`} onClick={() => pick(e.sym)} opacity={(A || B) && !on ? Math.min(op, 0.55) : op}
                  role="button" tabIndex={0} aria-label={`${e.he}, ${CAT_LABEL[e.cat]}`} onKeyDown={(ev) => ev.key === 'Enter' && pick(e.sym)}>
                  <title>{`${e.he} · מחזור ${e.period} · ${p.ringHops} קפיצות על הטבעת`}</title>
                  <g className={`pop${on ? ' lit' : ''}`} key={on ? e.sym + 'on' : e.sym} style={{ animationDelay: on ? '0ms' : `${e.z * 6}ms` }}>
                    <rect x={-s / 2} y={-s / 2} width={s} height={s} rx="3" fill={colorOf(e, colorBy)} strokeWidth={on ? 3 : 1} stroke={on ? (e === A ? 'var(--glow)' : 'var(--warn)') : undefined} />
                    <text style={{ fontSize: Math.min(14, s * 0.46) }}>{e.sym}</text>
                  </g>
                </g>
              )
            })}
            {walks.map((w) => w && (
              <g key={w.cls + w.e.sym + w.side} className={`walk ${w.cls}`}>
                <path d={w.d} pathLength={1} />
                {w.stops.map((s, i) => (
                  <g key={i} className="stop" transform={`translate(${s.x + 15},${s.y - 15})`} style={{ animationDelay: `${300 + i * 220}ms` }}>
                    <circle r="9" /><text>{i + 1}</text>
                  </g>
                ))}
              </g>
            ))}
          </svg>
        </div>
        <div className="stack">
          <div className="glass panel">
            <h3>שני יסודות, יחס אחד</h3>
            {!A && <p className="small muted" style={{ margin: 0 }}>בחרו יסוד ראשון בטבעות, ואז יסוד שני. כדאי להתחיל מזוג קרוב לקו, כמו נתרן וכלור, או אלומיניום וחמצן.</p>}
            {A && <PickRow e={A} cls="side-a" />}
            {B && <PickRow e={B} cls="side-b" />}
            {A && !B && <p className="small muted" style={{ marginBottom: 0 }}>עכשיו בחרו יסוד שני.</p>}
            {A && B && !pred && <p className="small muted" style={{ marginBottom: 0 }}>הכלל לא חל על הזוג הזה: צריך יסוד אחד שנותן ויסוד אחד שמקבל, ושניהם מהגושים s ו-p. למתכות המעבר יש כמה מצבי חמצון, והקפיצות לא מנבאות אותם.</p>}
            {pred && (
              <div className="prediction">
                <div className="balance mono" dir="ltr">{pred.gh} × {pred.parts[0][1]} = {pred.th} × {pred.parts[1][1]}</div>
                <p className="small muted">{pred.giver.he} נותן {pred.gh}, {pred.taker.he} מקבל {pred.th}. כדי שהקפיצות יתאזנו משני צדי הקו, צריך {pred.parts[0][1]} של {pred.giver.he} ו-{pred.parts[1][1]} של {pred.taker.he}.</p>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="swap-formula" dir="ltr" key={pred.formula}><span className="slot swapped">{prettyFormula(pred.formula)}</span></span>
                  <span className={`tag ${pred.known ? 'known' : 'new'}`}>{pred.known ? 'נמצא במאגר התרכובות' : 'לא במאגר: השערה'}</span>
                </div>
              </div>
            )}
            {(A || B) && <button className="btn" style={{ marginTop: 10 }} onClick={() => { setParam('a', null); setParam('b', null) }}>ניקוי הבחירה</button>}
          </div>
          <div className="glass panel">
            <h3>מה הטבעות מראות טוב יותר</h3>
            <ol className="small muted rings-points">
              <li><b>תגובתיות.</b> יסודות שקרובים לקו כמעט גזים אצילים, ולכן הם להוטים להגיב: חסר או עודף להם אלקטרון אחד. ככל שמתרחקים לאורך הטבעת, התגובתיות יורדת. הכפתור "תגובתיות" מעמעם את הרחוקים.</li>
              <li><b>יחס בתרכובת.</b> יסוד אחד מימין לקו ויסוד אחד משמאלו. מספר הקפיצות של שניהם צריך להיות שווה, ולכן Al₂O₃: שני אטומי אלומיניום של שלוש קפיצות, מול שלושה אטומי חמצן של שתיים.</li>
              <li><b>מתכות המעבר משולבות.</b> בטבלה הרגילה הן גוש נפרד, וכאן הן חלק מהטבעת. גם הלנתנידים והאקטינידים יושבים בתוך הטבעות 6 ו-7, בלי "אי" מתחת לטבלה.</li>
            </ol>
          </div>
          <div className="glass panel">
            <h3>כמה הכלל אמין</h3>
            <p className="small muted" style={{ marginTop: 0 }}>
              מתוך {RELIABILITY.total} התרכובות במאגר, הכלל חל על {RELIABILITY.tested}. מהן הוא חוזה בדיוק את היחס ב-<b>{RELIABILITY.hit}</b> ({Math.round((RELIABILITY.hit / RELIABILITY.tested) * 100)}%).
              הוא טועה כשליסוד יש יותר ממצב חמצון אחד, למשל:
            </p>
            <p className="mono small faint" dir="ltr" style={{ margin: 0, textAlign: 'right' }}>{RELIABILITY.misses.map(prettyFormula).join(' ')}</p>
            <p className="small faint" style={{ marginBottom: 0 }}>בטבעות 4 עד 7 נספרים רק צעדים בגושים s ו-p. אחרת גליום היה מקבל חמש קפיצות במקום שלוש.</p>
          </div>
          {(B ?? A) && <ElementPanel sym={(B ?? A)!.sym} lens="chemical" colorBy={colorBy} onPick={pick} />}
          <p className="small faint" style={{ margin: 0 }}>
            הסידור מבוסס על <a className="src-link" href="https://www.mayanperiodic.com/" target="_blank" rel="noreferrer">Mayan Periodic Chart of the Elements</a> של Mitch Fincher (רישיון Creative Commons ייחוס־לא מסחרי 3.0). השם בא מהדמיון ללוח השנה של המאיה.
          </p>
        </div>
      </div>
    </>
  )
}

function PickRow({ e, cls }: { e: Element; cls: string }) {
  const h = hops(e)
  return (
    <div className={`pick-row ${cls}`}>
      <span className="sym-chip chip" style={{ ['--cell' as string]: colorOf(e, 'cat') }}>{e.sym}</span>
      <span className="small">{e.he} <span className="faint">· {h ? (h.n === 0 ? 'כבר גז אציל' : `${h.n} קפיצות · ${SIDE_LABEL[h.side]}`) : 'מתכת מעבר: הכלל לא חל'}</span></span>
    </div>
  )
}
