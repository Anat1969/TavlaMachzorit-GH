import { useEffect, useMemo, useState } from 'react'
import { href, setParam } from '../lib/router'
import { prettyFormula } from '../data/compounds'
import { useHypotheses } from '../lib/store'
import { reducedMotion } from '../lib/motion'
import { ATOMS, ATOM, EXPERIMENT, evaluate, search, pareto, predictions, ruleText, type RuleResult } from '../lib/rulegen'
import { MP_URL } from '../lib/insights'
import { CALIBRATION, MP_COUNT, MP_BUILD, META_LIMIT, STATUS_LABEL, mpLink } from '../lib/stability'
import { StabilityView } from '../components/Stability'
import type { Prediction } from '../lib/rulegen'
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
  const judged = strongest.mpOk + strongest.mpBad
  return [
    {
      title: 'השופט השני מאשר',
      body: `הכלל החזק ביותר המציא ${strongest.outside} נוסחאות שאינן במדגם. ${judged} מהן כבר חושבו ב-Materials Project, ו-${strongest.mpOk} מהן יציבות או כמעט יציבות: ==${pct(strongest.mpOk / Math.max(1, judged))} אישור מחישוב בלתי תלוי.==`,
      meaning: `כשסופרים גם את מה שהחישוב מאשר, הכלל צודק ב-${pct(strongest.reality)} במקום ${pct(strongest.precision)}. המדגם הקטן הסתיר את רוב ההצלחות.`,
      ids: strongest.ids,
    },
    {
      title: 'החליפי את המתכת, שמרי את החבר',
      body: `במדגם, החלפת הנותן מצליחה ב-${pct(giver.precision)} והחלפת הלוקח ב-${pct(taker.precision)}. עם השופט השני: ${pct(giver.reality)} מול ${pct(taker.reality)}.`,
      meaning: `==הכלל נכון, אבל הפער קטן משנראה: פי ${(giver.reality / taker.reality).toFixed(1)} ולא פי ${Math.round(giver.precision / taker.precision)}.== מדגם קטן מגזים בפערים. לכן כל ממצא נבדק פעמיים.`,
      ids: ['giver'],
    },
    {
      title: 'ידיים ועוד מתכת שוות לטור, ברוחב כפול',
      body: `"אותה ערכיות" ועוד "רק המתכת" צודק ב-${pct(valGiver.reality)} מול המציאות המורחבת. "אותו טור": ${pct(group.reality)}. אבל הוא מתיר פי ${(valGiver.allowed / group.allowed).toFixed(1)} יותר החלפות.`,
      meaning: '==אותו דיוק, יותר אפשרויות.== לממציאה זה הכלל הטוב ביותר להתחיל ממנו.',
      ids: ['val', 'giver'],
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
  const preds = useMemo(() => predictions(ids, 6), [ids.join('+')])
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
              <Meter label="דיוק במדגם" sub="מההחלפות שהכלל מתיר, כמה נמצאות במדגם" v={mine.precision} />
              <Meter label="דיוק מול החישוב" sub="כולל מה ש-Materials Project מחשב כיציב" v={mine.reality} />
              <Meter label="כיסוי" sub="מכל ההחלפות האמיתיות במדגם, כמה הוא מוצא" v={mine.recall} />
            </div>
            <p className="small" style={{ margin: 0 }}>
              פי <b>{mine.lift.toFixed(1)}</b> מניחוש עיוור. הכלל מתיר <b>{mine.allowed.toLocaleString('he-IL')}</b> החלפות, ו-<b>{mine.hits.toLocaleString('he-IL')}</b> מהן אמיתיות.
              {mine.allowed < 150 && <span className="sig-bad"> פחות מ-150 החלפות: זו אנקדוטה, לא כלל.</span>}
            </p>
            <div className="ex-grid small">
              <span className="eyebrow">הכלל צדק</span><span className="eyebrow">הכלל טעה, לפי החישוב</span>
              <span className="sig-good" dir="ltr">{mine.examples.map((e) => `${prettyFormula(e.from)}→${prettyFormula(e.to)}`).join('   ') || '—'}</span>
              <span className="sig-bad" dir="ltr">{mine.misses.map((e) => `${prettyFormula(e.from)}→${prettyFormula(e.to)}`).join('   ') || '—'}</span>
            </div>
          </div>
        </div>
        <Predictions ids={ids} precision={mine.precision} preds={preds} />
      </section>

      <section className="stack">
        <h2 className="home-h2">השופט השני: כמה אפשר לסמוך עליו</h2>
        <div className="glass panel stack">
          <p className="small muted" style={{ margin: 0 }}>
            <Rich text={`לפני שסומכים על שופט, בודקים אותו על מה שכבר ידוע. כך נראות ${CALIBRATION.total} התרכובות הידועות של המדגם בעיני החישוב:`} />
          </p>
          <div className="calib">
            <div style={{ ['--jc' as string]: 'var(--st-ok)' }}><b>{CALIBRATION.stable}</b><span className="small">יציבות</span></div>
            <div style={{ ['--jc' as string]: 'var(--st-ok)' }}><b>{CALIBRATION.meta}</b><span className="small">כמעט יציבות</span></div>
            <div style={{ ['--jc' as string]: 'var(--st-bad)' }}><b>{CALIBRATION.unstable}</b><span className="small">"לא יציבות", אף שהן קיימות</span></div>
            <div style={{ ['--jc' as string]: 'var(--st-open)' }}><b>{CALIBRATION.absent}</b><span className="small">לא חושבו</span></div>
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            <Rich text={`==השופט מסכים עם המציאות ב-${pct(CALIBRATION.agree)} מהמקרים שהוא מכיר.== הטעויות שלו הן חומרים אמיתיים שקיימים למרות שאינם במצב האנרגיה הנמוך ביותר, כמו ${CALIBRATION.unstableExamples.map(prettyFormula).join(', ')}. לכן "החישוב דוחה" הוא סימן אזהרה, לא פסק דין.`} />
          </p>
          <p className="small faint" style={{ margin: 0 }}>
            המקור: Materials Project, אוסף thermo, גרסת {MP_BUILD}, {MP_COUNT.toLocaleString('he-IL')} תרכובות בינאריות. התקן: חישובי DFT (GGA/GGA+U/r2SCAN) ומרחק מקו היציבות (energy above hull). הסף של {Math.round(META_LIMIT * 1000)} meV לאטום נשען על Sun ואחרים, Science Advances, 2016.
          </p>
        </div>
      </section>

      <section className="glass panel stack">
        <h3>על מה הבדיקה נשענת, ואיך היא מודדת את עצמה</h3>
        <p className="small muted" style={{ margin: 0 }}>
          <b>המדדים:</b> דיוק (precision), כיסוי (recall) ויחס לניחוש (lift), המדדים המקובלים לבדיקת מסווגים.
          <br /><b>הכללים המוכרים שנבדקו:</b> כלל ה-15% בגודל (Hume-Rothery, 1934) וכללי ההחלפה של Goldschmidt (1926), שנבנו במקור לסגסוגות ולמינרלים.
          <br /><b>אין דליפה:</b> הכללים משתמשים רק בתכונות מדודות, לא בהיסטוריה של התרכובות, ולכן אינם יכולים "לזכור" את התשובה.
          <br /><b>שני שופטים:</b> הראשון הוא המדגם, {EXPERIMENT.compounds} תרכובות ידועות. השני הוא חישוב היציבות של Materials Project, שבודק גם נוסחאות שאינן במדגם.
          <br /><b>המגבלה:</b> "לא חושב" אינו "לא קיים", ו"לא יציב" אינו "בלתי אפשרי". חומר יכול להתקיים במצב שאינו הנמוך ביותר באנרגיה.
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
  if (!preds.total) return null
  const cols: { key: 'ok' | 'bad' | 'open'; title: string; about: string; list: Prediction[]; n: number; color: string }[] = [
    { key: 'ok', title: 'החישוב מאשר', about: 'חסרים במדגם, אבל יציבים או כמעט יציבים בחישוב. הכלל צדק.', list: preds.ok, n: preds.okN, color: 'var(--st-ok)' },
    { key: 'open', title: 'פתוח באמת', about: 'אף אחד עוד לא חישב אותם. אלה ההשערות החדשות.', list: preds.open, n: preds.openN, color: 'var(--st-open)' },
    { key: 'bad', title: 'החישוב דוחה', about: 'החישוב מראה שהם יתפרקו. כאן הכלל טעה.', list: preds.bad, n: preds.badN, color: 'var(--st-bad)' },
  ]
  return (
    <div className="glass panel stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>מה הכלל ממציא, ומה השופט השני אומר</h3>
        <LayerTag id="guess" />
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        הכלל מתיר <b>{preds.total.toLocaleString('he-IL')}</b> נוסחאות שלא נמצאות במדגם. כל אחת נבדקה מול חישובי היציבות של Materials Project.
      </p>
      <div className="judges">
        {cols.map((c) => (
          <div key={c.key} className="judge-col" style={{ ['--jc' as string]: c.color }}>
            <h4>{c.title} · <span className="mono">{c.n.toLocaleString('he-IL')}</span></h4>
            <p className="small muted" style={{ margin: 0 }}>{c.about}</p>
            {c.list.map((p) => <PredCard key={p.to} p={p} precision={precision} />)}
          </div>
        ))}
      </div>
      <p className="small faint" style={{ margin: 0 }}>הכלל: {ruleText(ids)}.</p>
    </div>
  )
}

function PredCard({ p, precision }: { p: Prediction; precision: number }) {
  const hyp = useHypotheses()
  const saved = hyp.list.some((h) => h.formula === p.to)
  return (
    <div className="pred">
      <span className="big-formula" dir="ltr">{prettyFormula(p.to)}</span>
      <span className="small faint mono" dir="ltr">{prettyFormula(p.from)} · {p.x}→{p.y}</span>
      <StabilityView e={p.mp} s={p.st} label={STATUS_LABEL[p.st]} link={p.mp ? mpLink(p.mp.id) : null} full />
      <div className="row small">
        {!p.mp && <a className="chip" href={MP_URL(p.to)} target="_blank" rel="noreferrer">חפש ב-Materials Project</a>}
        <a className="chip" href={href('lab', { f: p.from, el: p.x })}>מעבדה</a>
        <button className="chip" disabled={saved} onClick={() => hyp.add({ formula: p.to, template: p.from, replaced: p.x, by: p.y, score: precision })}>{saved ? 'נשמר' : 'שמור'}</button>
      </div>
    </div>
  )
}
