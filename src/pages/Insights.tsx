import { useMemo, useState } from 'react'
import { href } from '../lib/router'
import { prettyFormula, parseFormula } from '../data/compounds'
import { BY_SYM, CAT_LABEL } from '../data/elements'
import { COMPOUND_LIFE } from '../data/everyday'
import { colorOf } from '../lib/colors'
import { useHypotheses } from '../lib/store'
import { RELIABILITY } from '../lib/mayan'
import {
  BACKTEST, SCORE, SWAP_SLOTS, NETWORK_VS_TABLE, farFriends, disagreements, chameleons, blankSpots,
  inventionsFor, NEEDS, MP_URL, SCHOLAR_URL, type Invention,
} from '../lib/insights'
import { Rich, LayerTag, LayerLegend } from '../components/Rich'

const pct = (x: number) => Math.round(x * 100)

function Sym({ s }: { s: string }) {
  const e = BY_SYM.get(s)!
  return <a className="chip sym-chip" href={href('network', { el: s, lens: 'compounds' })} style={{ ['--cell' as string]: colorOf(e) }} title={`${e.he} ברשת`}>{s}</a>
}

// Elements the rings rule misreads: the metals that give in the missed compounds.
const ringMissers = [...new Set(RELIABILITY.misses.map((f) => parseFormula(f)[0][0]))]

const THUMBS: { line: string; why: string; layer: 'calc'; link: string; linkLabel: string }[] = [
  {
    line: '==הטור הקלאסי הוא נקודת פתיחה טובה==',
    why: `השכן בטור נותן תרכובת אמיתית ב-${pct(SCORE.group.rate1)}% מההחלפות. ניחוש עיוור: ${pct(SCORE.random.rate1)}%.`,
    layer: 'calc', link: href('matrix'), linkLabel: 'למטריצה',
  },
  {
    line: '==הרשת רואה מה שהטור מפספס==',
    why: `ב-${NETWORK_VS_TABLE.netOnly} החלפות הרשת צדקה והטור טעה. בכיוון ההפוך: ${NETWORK_VS_TABLE.tableOnly}. שני הסידורים משלימים זה את זה.`,
    layer: 'calc', link: href('network', { lens: 'compounds' }), linkLabel: 'לרשת',
  },
  {
    line: '==שלוש הצעות עדיפות על אחת==',
    why: `ההצעה הראשונה של המעבדה נכונה ב-${pct(SCORE.lab.rate1)}%. אחת משלוש הראשונות: ${pct(SCORE.lab.rate3)}%. תמיד בודקים שלוש.`,
    layer: 'calc', link: href('lab'), linkLabel: 'למעבדה',
  },
  {
    line: '==גודל לבדו לא מספיק==',
    why: `החלפה לפי גודל בלבד צודקת ב-${pct(SCORE.physical.rate1)}%. כשמוסיפים משיכת אלקטרונים וערכיות: ${pct(SCORE.chemical.rate1)}%.`,
    layer: 'calc', link: href('network', { lens: 'chemical' }), linkLabel: 'לעדשת ההתנהגות',
  },
  {
    line: '==קשר מפורסם אינו כלל אצבע==',
    why: `האלכסון נכון לזוגות מוכרים כמו Li ו-Mg, אבל ככלל כללי צודק רק ב-${pct(SCORE.diagonal.rate1)}%. ${SCORE.diagonal.rate1 <= SCORE.random.rate1 * 1.2 ? 'בערך כמו ניחוש.' : 'מעט יותר מניחוש.'}`,
    layer: 'calc', link: href('secondary', { type: 'diagonal' }), linkLabel: 'לקשרים האלכסוניים',
  },
  {
    line: '==ספירת קפיצות מנבאת את היחס==',
    why: `כלל הטבעות מנבא נכון ${RELIABILITY.hit} מתוך ${RELIABILITY.tested} תרכובות. הוא נכשל דווקא ב-${ringMissers.slice(0, 3).join(', ')}.`,
    layer: 'calc', link: href('rings'), linkLabel: 'לטבעות',
  },
  {
    line: '==כשכלל נכשל, סידור אחר מסביר==',
    why: `הכישלונות של כלל הטבעות הם בדיוק "אפקט הזוג האדיש" שמוסבר במחזוריות המשנית: ${ringMissers.slice(0, 3).join(', ')} מעדיפים מטען נמוך.`,
    layer: 'calc', link: href('secondary', { type: 'secondary' }), linkLabel: 'למחזוריות המשנית',
  },
]

export function Insights() {
  const far = useMemo(() => farFriends('compounds', 6), [])
  const dis = useMemo(() => disagreements(4), [])
  const metals = useMemo(() => chameleons(8, true), [])
  const partners = useMemo(() => chameleons(4), [])
  const blanks = useMemo(() => blankSpots(12), [])
  const [needIdx, setNeedIdx] = useState(0)
  const need = NEEDS[needIdx]
  const ideas = useMemo(() => inventionsFor(need.parent, 8), [need.parent])
  const shown = [...ideas.filter((i) => i.agree), ...ideas.filter((i) => !i.agree)].slice(0, 4)
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">תובנות</div>
          <h1>מה הסידור החדש מלמד</h1>
          <p>כל מספר בדף הזה חושב מתוך הנתונים של האפליקציה. כללי האצבע נבדקו מול <b>{SWAP_SLOTS}</b> החלפות אמיתיות, וההמצאות נשארות מסומנות כהשערה עד שמישהו בודק אותן.</p>
        </div>
        <div className="row" role="navigation" aria-label="פרקים בדף">
          <button className="chip" onClick={() => go('thumbs')}>כללי אצבע</button>
          <button className="chip" onClick={() => go('seen')}>תובנות</button>
          <button className="chip" onClick={() => go('invent')}>המצאות</button>
        </div>
      </div>
      <div className="glass panel"><LayerLegend /></div>

      {/* ---------- rules of thumb ---------- */}
      <section id="thumbs" className="stack">
        <h2 className="home-h2">כללי אצבע, אחרי בדיקה</h2>
        <p className="muted lead">
          השאלה בכל כלל זהה: לוקחים תרכובת ידועה, מחליפים בה יסוד אחד לפי הכלל, ובודקים אם יצאה תרכובת שגם היא קיימת.
          <br />כך מודדים את כל הסידורים באותו סרגל.
        </p>
        <div className="glass panel stack anchor">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>כמה פעמים כל סידור צודק</h3>
            <div className="legend"><span><i className="sw-1" />ההצעה הראשונה</span><span><i className="sw-3" />אחת משלוש</span><span><i className="sw-base" />ניחוש עיוור</span></div>
          </div>
          <div className="rule-bars">
            {BACKTEST.map((r, idx) => (
              <a key={r.id} className="rule-row" href={href(r.page)} style={{ animationDelay: `${idx * 90}ms` }}>
                <div>
                  <b>{r.name}</b>
                  <div className="small faint mono">{r.arrangement}</div>
                </div>
                <div className="rule-track" aria-label={`${r.name}: ${pct(r.rate1)}% בהצעה הראשונה, ${pct(r.rate3)}% באחת משלוש`}>
                  <span className="r3" style={{ width: `${r.rate3 * 100}%` }} />
                  <span className="r1" style={{ width: `${r.rate1 * 100}%` }} />
                  <span className="base" style={{ insetInlineStart: `${SCORE.random.rate1 * 100}%` }} />
                </div>
                <div className="mono rule-num"><b>{pct(r.rate1)}%</b> <span className="faint">/ {pct(r.rate3)}%</span></div>
                <p className="small muted rule-plain">{r.plain}{r.coverage < 0.99 && <span className="faint"> הכלל חל על {pct(r.coverage)}% מההחלפות.</span>}</p>
              </a>
            ))}
          </div>
          <p className="small faint" style={{ margin: 0 }}>
            שיטת הבדיקה: בדיקה לאחור (backtest) עם השמטת התשובה (leave-one-out). בעדשת ההיסטוריה, התרכובת שנבדקת מוצאת מהחישוב, כדי שהכלל לא "יציץ" בתשובה.
            המגבלה: "לא במאגר" לא אומר "לא קיים", כי המאגר הוא מדגם. לכן כל האחוזים הם <b>גבול תחתון</b>.
          </p>
        </div>

        <div className="thumbs">
          {THUMBS.map((t, i) => (
            <a key={i} className="glass thumb" href={t.link} style={{ animationDelay: `${i * 70}ms` }}>
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="eyebrow">כלל {i + 1}</span><LayerTag id={t.layer} /></div>
              <h3><Rich text={t.line} /></h3>
              <p className="small muted"><Rich text={t.why} /></p>
              <span className="small faint">{t.linkLabel}</span>
            </a>
          ))}
        </div>

        {NETWORK_VS_TABLE.examples.length > 0 && (
          <div className="glass panel stack">
            <h3>איפה הרשת צדקה והטור טעה</h3>
            <div className="vs-grid">
              <span className="eyebrow">מתחילים מ</span><span className="eyebrow">הטור מציע</span><span className="eyebrow">הרשת מציעה</span>
              {NETWORK_VS_TABLE.examples.map((x) => (
                <FragmentRow key={x.from} a={x.from} b={x.table} c={x.net} />
              ))}
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              <span className="sig-bad">ההצעה של הטור לא נמצאת במאגר.</span> <span className="sig-good">ההצעה של הרשת היא תרכובת ידועה.</span>
              <br />הרשת "זוכרת" שתליום מתנהג כמו רובידיום, ולא כמו אינדיום שמעליו.
            </p>
          </div>
        )}
      </section>

      {/* ---------- insights ---------- */}
      <section id="seen" className="stack">
        <h2 className="home-h2">תובנות שהסידור חושף</h2>
        <div className="insight-grid">
          <div className="glass panel stack">
            <div className="row" style={{ justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>חברים רחוקים</h3><LayerTag id="calc" /></div>
            <p className="small muted" style={{ margin: 0 }}><Rich text="==רחוקים בטבלה, קרובים בהתנהגות.== הזוגות שהמרחק ביניהם בטבלה הכי גדול, והדמיון בתרכובות הכי חזק." /></p>
            {far.map((p) => (
              <div key={p.a.sym + p.b.sym} className="pair">
                <Sym s={p.a.sym} /><Sym s={p.b.sym} />
                <div style={{ minWidth: 0 }}>
                  <div className="small"><b>{p.a.he}</b> ו<b>{p.b.he}</b>: <b>{p.dist}</b> צעדים בטבלה, דמיון <b>{p.w.toFixed(2)}</b></div>
                  <div className="small faint" dir="ltr">{p.evidence.map(prettyFormula).join('   ')}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass panel stack">
            <div className="row" style={{ justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>כשהשכבות חלוקות</h3><LayerTag id="calc" /></div>
            <p className="small muted" style={{ margin: 0 }}><Rich text="==אותה נוסחה, אופי אחר.== ההיסטוריה מחברת יסודות שהתכונות שלהם שונות מאוד: הם חולקים רק את מספר הקשרים." /></p>
            {dis.historyWins.map((x) => (
              <div key={x.a.sym + x.b.sym} className="pair">
                <Sym s={x.a.sym} /><Sym s={x.b.sym} />
                <div className="small mono">היסטוריה <b>{x.h.toFixed(2)}</b> · תכונות <b>{x.p.toFixed(2)}</b></div>
              </div>
            ))}
            <p className="small muted" style={{ margin: 0 }}><Rich text="==התכונות דומות, אף אחד לא בדק.== כאן ההפך: תכונות כמעט זהות, ואפס תבניות משותפות במאגר. זה השטח הפתוח להמצאה." /></p>
            {dis.propertyWins.map((x) => (
              <div key={x.a.sym + x.b.sym} className="pair">
                <Sym s={x.a.sym} /><Sym s={x.b.sym} />
                <div className="small mono">תכונות <b>{x.p.toFixed(2)}</b> · היסטוריה <b>0</b></div>
              </div>
            ))}
          </div>

          <div className="glass panel stack">
            <div className="row" style={{ justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>חומרי הבניין הגמישים</h3><LayerTag id="fact" /></div>
            <p className="small muted" style={{ margin: 0 }}><Rich text="==מעט שותפים מחזיקים את כל הבניין.== ארבעה יסודות מופיעים בחלק גדול מהתבניות, כמו בטון וזכוכית בעיר." /></p>
            <div className="row">{partners.map((c) => <span key={c.e.sym} className="row" style={{ gap: 4 }}><Sym s={c.e.sym} /><span className="mono small"><b>{c.n}</b></span></span>)}</div>
            <p className="small muted" style={{ margin: 0 }}>בין המתכות, אלה נכנסות להכי הרבה תבניות שונות:</p>
            <div className="row">{metals.map((c) => <span key={c.e.sym} className="row" style={{ gap: 4 }}><Sym s={c.e.sym} /><span className="mono small"><b>{c.n}</b></span></span>)}</div>
            <p className="small faint" style={{ margin: 0 }}>המספר: כמה תבניות שונות היסוד ממלא במאגר.</p>
          </div>

          <div className="glass panel stack">
            <div className="row" style={{ justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>כתמים לבנים במפה</h3><LayerTag id="fact" /></div>
            <p className="small muted" style={{ margin: 0 }}><Rich text="==יסוד שנמדד, אבל כמעט לא מופיע.== לכל אלה יש תכונות מדודות, ובמאגר יש להם תבנית אחת לכל היותר. כאן המדגם עיוור, ולכן כל הצעה עליהם חלשה." /></p>
            <div className="row">{blanks.length ? blanks.map((e) => <span key={e.sym} title={CAT_LABEL[e.cat]}><Sym s={e.sym} /></span>) : <span className="small faint">אין כאלה במדגם.</span>}</div>
          </div>
        </div>
      </section>

      {/* ---------- inventions ---------- */}
      <section id="invent" className="stack">
        <h2 className="home-h2">המצאות: מצורך לחומר</h2>
        <p className="muted lead">
          מתחילים מצורך, לא מכימיה. בוחרים צורך, והאפליקציה מוצאת את החומר שעונה עליו היום, ומחליפה בו יסוד אחד לפי הרשת.
          <br />התוצאה היא <b>השערה</b>: נוסחה שלא נמצאת במאגר, עם ההיגיון שלה ועם הדרך לבדוק אותה.
        </p>
        <div className="glass panel stack">
          <div className="row" role="group" aria-label="בחירת צורך">
            <span className="eyebrow">אני צריכה</span>
            {NEEDS.map((n, i) => <button key={n.parent} className="chip" aria-pressed={i === needIdx} onClick={() => setNeedIdx(i)}>{n.need}</button>)}
          </div>
          <div className="parent-card">
            <div>
              <span className="eyebrow">החומר שעושה את זה היום</span>
              <div className="big-formula" dir="ltr">{prettyFormula(need.parent)}</div>
            </div>
            <p className="muted"><LayerTag id="fact" /> {COMPOUND_LIFE[need.parent]}</p>
          </div>
          <div className="ideas">
            {shown.length === 0 && <p className="small faint">אין הצעה מעל הסף לחומר הזה. נסו צורך אחר.</p>}
            {shown.map((x, i) => <Idea key={x.formula} x={x} i={i} />)}
          </div>
          <p className="small faint" style={{ margin: 0 }}>
            מה ההשערה לא בודקת: יציבות, רעילות, מחיר וזמינות. Materials Project הוא מאגר פתוח של חישובי יציבות לחומרים (Lawrence Berkeley National Laboratory). אם החומר מופיע שם, יש עליו כבר חישוב.
          </p>
        </div>
      </section>

      <section className="glass panel haiku-card">
        <div className="eyebrow">הייקו</div>
        <p className="haiku">אבן מחליפה אבן<br />הקשת נשארת<br />החומר אחר</p>
        <p className="small muted" style={{ margin: 0 }}>זה ההיגיון של כל הדף: <b>התבנית נשמרת והחומר מתחלף</b>, כמו קשת שנבנית מאבן אחרת.</p>
      </section>
    </>
  )
}

function FragmentRow({ a, b, c }: { a: string; b: string; c: string }) {
  return (
    <>
      <span className="mono" dir="ltr">{prettyFormula(a)}</span>
      <span className="mono sig-bad" dir="ltr">{prettyFormula(b)}</span>
      <span className="mono sig-good" dir="ltr">{prettyFormula(c)}</span>
    </>
  )
}

function Idea({ x, i }: { x: Invention; i: number }) {
  const hyp = useHypotheses()
  const saved = hyp.list.some((h) => h.formula === x.formula)
  const from = BY_SYM.get(x.replaced)!, to = BY_SYM.get(x.by)!
  return (
    <div className="glass idea" style={{ animationDelay: `${i * 120}ms` }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="big-formula" dir="ltr">{prettyFormula(x.formula)}</span>
        <LayerTag id="guess" />
      </div>
      <p className="small" style={{ margin: 0 }}>
        מחליפים את <b>{from.he}</b> ב<b>{to.he}</b>.
        <br />{x.evidence.length ? <>הם כבר החליפו זה את זה ב-<span dir="ltr">{x.evidence.map(prettyFormula).join(', ')}</span>.</> : 'ההצעה נשענת רק על דמיון בתכונות.'}
      </p>
      <div className="layers" aria-label={`היסטוריה ${x.history.toFixed(2)}, תכונות ${x.property.toFixed(2)}`}><i style={{ width: `${x.history * 100}%` }} /><b style={{ width: `${x.property * 100}%` }} /></div>
      <div className="small faint mono">היסטוריה {x.history.toFixed(2)} · תכונות {x.property.toFixed(2)} · ציון {x.score.toFixed(2)}</div>
      {x.agree ? <span className="small sig-good">שתי השכבות מסכימות</span> : <span className="small sig-bad">רק שכבה אחת תומכת. השערה חלשה.</span>}
      <div className="row">
        <a className="btn" href={href('lab', { f: x.parent, el: x.replaced })}>פתח במעבדה</a>
        <button className="btn" disabled={saved} onClick={() => hyp.add({ formula: x.formula, template: x.parent, replaced: x.replaced, by: x.by, score: x.score })}>{saved ? 'נשמר' : 'שמור השערה'}</button>
      </div>
      <div className="row small">
        <a className="chip" href={MP_URL(x.formula)} target="_blank" rel="noreferrer">בדוק ב-Materials Project</a>
        <a className="chip" href={SCHOLAR_URL(x.formula)} target="_blank" rel="noreferrer">חפש מאמרים</a>
      </div>
    </div>
  )
}
