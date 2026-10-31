import { useEffect, useMemo, useState } from 'react'
import { href, setParam } from '../lib/router'
import { prettyFormula } from '../data/compounds'
import { useHypotheses } from '../lib/store'
import { reducedMotion } from '../lib/motion'
import { ATOMS, ATOM, EXPERIMENT, evaluate, search, pareto, predictions, ruleText, type RuleResult } from '../lib/rulegen'
import { MP_URL } from '../lib/insights'
import { Rich, LayerTag } from '../components/Rich'

const pct = (x: number) => `${Math.round(x * 100)}%`
const TABLE_ATOMS = new Set(['group', 'period', 'near', 'block'])

// Everything the machine reports is computed here, from the search, so the words follow the numbers.
function findings(all: RuleResult[]) {
  const by = (ids: string[]) => evaluate(ids)
  const front = pareto(all)
  const strongest = front[0]
  const balanced = [...all].sort((a, b) => b.f1 - a.f1)[0]
  const noTable = all.filter((r) => !r.ids.some((id) => TABLE_ATOMS.has(id))).sort((a, b) => b.precision - a.precision)[0]
  const giver = by(['giver']), taker = by(['taker'])
  const size = by(['r15']), sizeVal = by(['r15', 'val'])
  const geo = by(['geo']), group = by(['group']), groupGeo = by(['group', 'geo'])
  const val = by(['val']), valGiver = by(['val', 'giver'])
  return [
    {
      title: 'החליפי את המתכת, שמרי את החבר',
      body: `החלפה במקום של הנותן מצליחה ב-${pct(giver.precision)}. במקום של הלוקח: ${pct(taker.precision)}. ==הפרש של פי ${Math.round(giver.precision / taker.precision)}.==`,
      meaning: 'בהמצאה מתחילים מהחומר, ומחליפים את המתכת. את החמצן, הגופרית או הכלור משאירים.',
      ids: ['giver'],
    },
    {
      title: 'מספר הידיים חשוב יותר מהמקום',
      body: `"אותה ערכיות" לבדה מוצאת ${pct(val.recall)} מכל ההחלפות האמיתיות, פי ${val.lift.toFixed(1)} מניחוש. "אותו טור" מוצא רק ${pct(group.recall)}.`,
      meaning: `==הכלל המאוזן ביותר שנמצא: ${ruleText(balanced.ids)}.== "אותה ערכיות" עם "רק המתכת" מגיע ל-${pct(valGiver.precision)} דיוק.`,
      ids: ['val', 'giver'],
    },
    {
      title: 'גודל לבדו הוא כלל חלש',
      body: `כלל ה-15% הקלאסי (Hume-Rothery) צודק כאן ב-${pct(size.precision)}, פי ${size.lift.toFixed(1)} מניחוש. כשמוסיפים אותה ערכיות: ${pct(sizeVal.precision)}.`,
      meaning: '==גודל הוא תנאי מסנן, לא סיבה.== לבנה בגודל הנכון עדיין צריכה את אותם חיבורים.',
      ids: ['r15', 'val'],
    },
    {
      title: 'השכונה בטבע מחדדת',
      body: `"אותה שכונה בטבע" לבדה כמעט חסרת ערך: פי ${geo.lift.toFixed(1)} מניחוש. אבל מעל "אותו טור" היא מעלה את הדיוק מ-${pct(group.precision)} ל-${pct(groupGeo.precision)}.`,
      meaning: '==תכונה חלשה לבדה יכולה להיות מסננת חזקה.== כך עובד גם תכנון עירוני: שכבה אחת לא מחליטה, הצטלבות שכבות כן.',
      ids: ['group', 'geo'],
    },
    {
      title: 'הכלל החזק ביותר',
      body: `${ruleText(strongest.ids)}: ${pct(strongest.precision)} מההחלפות שהוא מתיר הן תרכובות ידועות. פי ${strongest.lift.toFixed(1)} מניחוש.`,
      meaning: `המחיר: הוא מוצא רק ${pct(strongest.recall)} מההחלפות האמיתיות. ==כלל מדויק הוא כלל צר.==`,
      ids: strongest.ids,
    },
    {
      title: 'אפשר לשחזר את הטבלה בלי הטבלה',
      body: noTable ? `בלי מיקום בטבלה בכלל: ${ruleText(noTable.ids)} מגיע ל-${pct(noTable.precision)}, כמעט כמו הכלל החזק ביותר.` : '',
      meaning: '==התכונות מכילות את הטבלה.== הטבלה היא סיכום של משיכה, ידיים ושכונה, ולא להפך.',
      ids: noTable?.ids ?? [],
    },
  ].filter((f) => f.body)
}

export function Rules({ params }: { params: URLSearchParams }) {
  const res = useMemo(() => search(), [])
  const front = useMemo(() => pareto(res.all), [res])
  const found = useMemo(() => findings(res.all), [res])
  const [count, setCount] = useState(reducedMotion() ? res.tested : 0)
  const done = count >= res.tested
  useEffect(() => {
    if (done) return
    const t = window.setInterval(() => setCount((c) => Math.min(res.tested, c + 9)), 16)
    return () => clearInterval(t)
  }, [done, res.tested])

  const picked = (params.get('r') ?? '').split('+').filter((id) => ATOM.has(id))
  const ids = picked.length ? picked : ['group', 'geo']
  const mine = useMemo(() => evaluate(ids), [ids.join('+')])
  const preds = useMemo(() => predictions(ids, 8), [ids.join('+')])
  const toggle = (id: string) => setParam('r', (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]).join('+') || null)
  const load = (r: string[]) => { setParam('r', r.join('+')); document.getElementById('builder')?.scrollIntoView({ behavior: 'smooth' }) }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">מחולל כללים</div>
          <h1>המכונה מנסחת, בודקת ומדווחת</h1>
          <p>
            המכונה מרכיבה כללי אצבע מ-{ATOMS.length} אבני בניין, ובודקת כל כלל מול <b>{EXPERIMENT.swaps.toLocaleString('he-IL')}</b> החלפות אפשריות ב-{EXPERIMENT.compounds} תרכובות.
            <br />החלפה מצליחה כשהנוסחה שיצאה היא תרכובת ידועה. ניחוש עיוור מצליח ב-<b>{pct(EXPERIMENT.base)}</b>.
          </p>
        </div>
      </div>

      <div className="glass panel anchor run-strip" aria-live="polite">
        <span className="eyebrow">{done ? 'הניסוי הסתיים' : 'הניסוי רץ'}</span>
        <b className="run-count mono">{count}</b>
        <span className="muted">כללים נבדקו מתוך {res.tested}</span>
        <div className="run-bar"><i style={{ width: `${(count / res.tested) * 100}%` }} /></div>
        <span className="small muted">{done ? <>נשארו <b>{res.all.length}</b> כללים שחלים על 150 החלפות לפחות. <b>{front.length}</b> מהם אינם נופלים מאף כלל אחר.</> : 'מצליב כל תנאי עם כל תנאי'}</span>
      </div>

      {done && (
        <>
          <section className="stack">
            <h2 className="home-h2">מצאתי</h2>
            <div className="thumbs">
              {found.map((f, i) => (
                <button key={f.title} className="glass thumb finding" style={{ animationDelay: `${i * 110}ms` }} onClick={() => load(f.ids)}>
                  <div className="row" style={{ justifyContent: 'space-between' }}><span className="eyebrow">ממצא {i + 1}</span><LayerTag id="calc" /></div>
                  <h3>{f.title}</h3>
                  <p className="small"><Rich text={f.body} /></p>
                  <p className="small muted"><Rich text={f.meaning} /></p>
                  <span className="small faint">לחצו כדי לפתוח את הכלל</span>
                </button>
              ))}
            </div>
          </section>

          <section className="stack">
            <h2 className="home-h2">המפה של כל הכללים</h2>
            <p className="muted lead">
              כל נקודה היא כלל. למעלה: מדויק. ימינה: מוצא הרבה.
              <br /><Rich text="==אין כלל שגם מדויק וגם רחב.== הקו מחבר את הכללים הטובים ביותר לכל רמת דיוק, והוא תפריט הבחירות הכן." />
            </p>
            <RuleMap all={res.all} front={front} current={mine} onPick={load} />
          </section>
        </>
      )}

      <section id="builder" className="stack">
        <h2 className="home-h2">נסחי כלל משלך</h2>
        <div className="split rules-split">
          <div className="glass panel stack">
            {[...new Set(ATOMS.map((a) => a.family))].map((fam) => (
              <div key={fam} className="row">
                <span className="eyebrow fam">{fam}</span>
                {ATOMS.filter((a) => a.family === fam).map((a) => (
                  <button key={a.id} className="chip" aria-pressed={ids.includes(a.id)} onClick={() => toggle(a.id)}>{a.label}</button>
                ))}
              </div>
            ))}
            <p className="small faint" style={{ margin: 0 }}>כל תנאי שנבחר מצמצם את הכלל: Y יכול להחליף את X רק אם כל התנאים מתקיימים.</p>
          </div>
          <div className="glass panel stack">
            <div className="eyebrow">הכלל</div>
            <b className="rule-name">{ruleText(ids)}</b>
            <div className="meters">
              <Meter label="דיוק" sub="מההחלפות שהכלל מתיר, כמה אמיתיות" v={mine.precision} />
              <Meter label="כיסוי" sub="מכל ההחלפות האמיתיות, כמה הוא מוצא" v={mine.recall} />
            </div>
            <p className="small" style={{ margin: 0 }}>
              פי <b>{mine.lift.toFixed(1)}</b> מניחוש עיוור. הכלל מתיר <b>{mine.allowed.toLocaleString('he-IL')}</b> החלפות, ו-<b>{mine.hits.toLocaleString('he-IL')}</b> מהן אמיתיות.
              {mine.allowed < 150 && <span className="sig-bad"> פחות מ-150 החלפות: זו אנקדוטה, לא כלל.</span>}
            </p>
            <div className="ex-grid small">
              <span className="eyebrow">הכלל צדק</span><span className="eyebrow">הכלל טעה, לפי המאגר</span>
              <span className="sig-good" dir="ltr">{mine.examples.map((e) => `${prettyFormula(e.from)}→${prettyFormula(e.to)}`).join('   ') || '—'}</span>
              <span className="sig-bad" dir="ltr">{mine.misses.map((e) => `${prettyFormula(e.from)}→${prettyFormula(e.to)}`).join('   ') || '—'}</span>
            </div>
          </div>
        </div>
        <Predictions ids={ids} precision={mine.precision} preds={preds} />
      </section>

      <section className="glass panel stack">
        <h3>על מה הבדיקה נשענת, ואיך היא מודדת את עצמה</h3>
        <p className="small muted" style={{ margin: 0 }}>
          <b>המדדים:</b> דיוק (precision), כיסוי (recall) ויחס לניחוש (lift), המדדים המקובלים לבדיקת מסווגים.
          <br /><b>הכללים המוכרים שנבדקו:</b> כלל ה-15% בגודל (Hume-Rothery, 1934) וכללי ההחלפה של Goldschmidt (1926), שנבנו במקור לסגסוגות ולמינרלים.
          <br /><b>אין דליפה:</b> הכללים משתמשים רק בתכונות מדודות, לא בהיסטוריה של התרכובות, ולכן אינם יכולים "לזכור" את התשובה.
          <br /><b>המגבלה:</b> המאגר הוא מדגם. "טעה לפי המאגר" אומר "לא במדגם", וחלק מהטעויות הן תרכובות אמיתיות. לכן הדיוק הוא <b>גבול תחתון</b>.
        </p>
      </section>
    </>
  )
}

function Meter({ label, sub, v }: { label: string; sub: string; v: number }) {
  return (
    <div className="meter">
      <div className="row" style={{ justifyContent: 'space-between' }}><b>{label}</b><b className="mono">{pct(v)}</b></div>
      <div className="rule-track"><span className="r1" style={{ width: `${v * 100}%` }} /><span className="base" style={{ insetInlineStart: `${EXPERIMENT.base * 100}%` }} /></div>
      <span className="small faint">{sub}</span>
    </div>
  )
}

function RuleMap({ all, front, current, onPick }: { all: RuleResult[]; front: RuleResult[]; current: RuleResult; onPick: (ids: string[]) => void }) {
  const W = 720, H = 360, P = 36
  const maxR = Math.max(...all.map((r) => r.recall)), maxP = Math.max(...all.map((r) => r.precision))
  // RTL: more recall goes to the left, the way the page reads
  const x = (r: number) => W - P - (r / maxR) * (W - 2 * P)
  const y = (p: number) => H - P - (p / maxP) * (H - 2 * P)
  const frontSet = new Set(front)
  const line = [...front].sort((a, b) => a.recall - b.recall).map((r, i) => `${i ? 'L' : 'M'}${x(r.recall).toFixed(1)},${y(r.precision).toFixed(1)}`).join(' ')
  return (
    <div className="glass panel">
      <svg className="rule-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="מפת הכללים: דיוק מול כיסוי">
        <line className="axis" x1={P} y1={H - P} x2={W - P} y2={H - P} />
        <line className="axis" x1={W - P} y1={P} x2={W - P} y2={H - P} />
        <line className="base-line" x1={P} x2={W - P} y1={y(EXPERIMENT.base)} y2={y(EXPERIMENT.base)} />
        <text className="map-label" x={P + 4} y={y(EXPERIMENT.base) - 6} textAnchor="start">ניחוש עיוור</text>
        <text className="map-label" x={W - P - 6} y={P - 10}>דיוק</text>
        <text className="map-label" x={P} y={H - 10} textAnchor="start">כיסוי</text>
        <path className="front-line" d={line} pathLength={1} />
        {all.map((r) => (
          <circle key={r.ids.join('+')} className={`dot${frontSet.has(r) ? ' front' : ''}`} cx={x(r.recall)} cy={y(r.precision)} r={frontSet.has(r) ? 6 : 3.5} onClick={() => onPick(r.ids)}>
            <title>{`${ruleText(r.ids)}: דיוק ${pct(r.precision)}, כיסוי ${pct(r.recall)}`}</title>
          </circle>
        ))}
        <circle className="dot mine" cx={x(current.recall)} cy={y(current.precision)} r={9} />
      </svg>
      <div className="legend">
        <span><i style={{ background: 'var(--ink-faint)' }} />כלל שנבדק</span>
        <span><i style={{ background: 'var(--warn)' }} />כלל שאף כלל אחר לא עדיף עליו</span>
        <span><i style={{ background: 'var(--accent-lantern)' }} />הכלל שלך</span>
        <span><i className="sw-base" />ניחוש עיוור</span>
      </div>
    </div>
  )
}

function Predictions({ ids, precision, preds }: { ids: string[]; precision: number; preds: ReturnType<typeof predictions> }) {
  const hyp = useHypotheses()
  if (!preds.list.length) return null
  return (
    <div className="glass panel stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>מה הכלל ממציא</h3>
        <LayerTag id="guess" />
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        הכלל מתיר <b>{preds.total.toLocaleString('he-IL')}</b> נוסחאות שלא נמצאות במאגר. הנה דגימה מתרכובות מוצא שונות.
        <br /><Rich text={`==הערכה גסה: כ-${pct(precision)} מהן הן חומרים אמיתיים==, כי זה שיעור ההצלחה של הכלל על מה שכבר ידוע.`} />
      </p>
      <div className="pred-grid">
        {preds.list.map((p) => {
          const saved = hyp.list.some((h) => h.formula === p.to)
          return (
            <div key={p.to} className="pred">
              <span className="big-formula" dir="ltr">{prettyFormula(p.to)}</span>
              <span className="small faint mono" dir="ltr">{prettyFormula(p.from)} · {p.x}→{p.y}</span>
              <div className="row small">
                <a className="chip" href={MP_URL(p.to)} target="_blank" rel="noreferrer">בדוק ב-Materials Project</a>
                <a className="chip" href={href('lab', { f: p.from, el: p.x })}>מעבדה</a>
                <button className="chip" disabled={saved} onClick={() => hyp.add({ formula: p.to, template: p.from, replaced: p.x, by: p.y, score: precision })}>{saved ? 'נשמר' : 'שמור'}</button>
              </div>
            </div>
          )
        })}
      </div>
      <p className="small faint" style={{ margin: 0 }}>הכלל: {ruleText(ids)}.</p>
    </div>
  )
}
