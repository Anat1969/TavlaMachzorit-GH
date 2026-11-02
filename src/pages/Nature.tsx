import { href, setParam } from '../lib/router'
import { prettyFormula } from '../data/compounds'
import { BY_SYM } from '../data/elements'
import { AVAIL_LABEL } from '../data/availability'
import { BIOMATIC_URL } from '../data/challenges'
import { useHypotheses } from '../lib/store'
import { MP_URL, SCHOLAR_URL } from '../lib/insights'
import { REPORTS, type Idea, type Report } from '../lib/nature'
import { Rich, LayerTag } from '../components/Rich'

const he = (s: string) => BY_SYM.get(s)?.he ?? s
const KIND = {
  lab: { title: 'כבר נוצר במעבדה', about: 'חומר אמיתי. אפשר לנסות אותו לתפקיד הזה מחר.', color: 'var(--st-ok)' },
  computed: { title: 'יציב בחישוב', about: 'המחשב אומר שהוא יכול להתקיים. לא ידוע שמישהו יצר אותו.', color: 'var(--warn)' },
  open: { title: 'אף אחד עוד לא בדק', about: 'השערה חדשה באמת. צריך חישוב או ניסוי.', color: 'var(--st-open)' },
} as const

export function Nature({ params }: { params: URLSearchParams }) {
  const active = REPORTS.find((r) => r.c.id === params.get('ch')) ?? null
  const totalTried = REPORTS.reduce((n, r) => n + r.funnel.tried, 0)
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">מהטבע לחומר</div>
          <h1>בחרי אתגר. המכונה עושה את השאר.</h1>
          <p>
            <Rich text={`האתגרים מגיעים מ-BIOMATIC: מה הטבע כבר פתר. המכונה מוצאת את החומר שעושה את זה היום, מחליפה בו יסוד אחד, ובודקת כל רעיון בארבעה שערים: ==מטען, קיום, תפקוד ובטיחות==.`} />
            <br />בסבב הזה היא ניסתה <b>{totalTried.toLocaleString('he-IL')}</b> רעיונות.
          </p>
        </div>
      </div>

      <section className="challenge-grid">
        {REPORTS.map((r, i) => (
          <button key={r.c.id} className={`glass challenge${active?.c.id === r.c.id ? ' anchor' : ''}`} aria-pressed={active?.c.id === r.c.id} style={{ animationDelay: `${i * 70}ms` }}
            onClick={() => { setParam('ch', r.c.id); requestAnimationFrame(() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })) }}>
            <span className="eyebrow">{r.c.nature}</span>
            <h3>{r.c.title}</h3>
            {r.headline ? (
              <span className="small"><b>מצאתי:</b> <bdi dir="ltr" className="formula-inline">{prettyFormula(r.headline.idea.s.to)}</bdi> {r.headline.text.split(': ')[1]}</span>
            ) : <span className="small faint">לא נמצא רעיון שעובר את כל השערים.</span>}
          </button>
        ))}
      </section>

      {active ? <Story r={active} /> : <p className="glass panel muted">לחצי על אתגר כדי לראות את הסיפור המלא: מה הטבע עושה, מה החומר צריך, ומה המכונה מצאה.</p>}

      <section className="glass panel stack">
        <h3>מה המכונה עושה, בארבעה שערים</h3>
        <ol className="small muted gates-list">
          <li><b>מטען:</b> היסוד החדש יכול לשאת את אותו מטען. הכלל הזה לבדו צודק פי 3 מניחוש.</li>
          <li><b>קיום:</b> החומר נמצא במדגם, או יציב בחישובי Materials Project, או שאף אחד עוד לא בדק אותו. מה שהחישוב דוחה, יוצא.</li>
          <li><b>תפקוד:</b> לחומר יש התכונה שהאתגר צריך, כמו פער אנרגיה לאור, סימטריה ללחץ או צפיפות לקלילות. המדידה נעשית באותו מכשיר כמו לחומר המוצא, כי פערי אנרגיה מחושבים נמוכים מהאמת, וההשוואה מבטלת את ההטיה.</li>
          <li><b>בטיחות:</b> בלי עופרת, כספית, קדמיום, ארסן, תליום, בריליום או יסוד רדיואקטיבי.</li>
        </ol>
        <p className="small faint" style={{ margin: 0 }}>
          המקורות: אתגרים ומקורות השראה מ-BIOMATIC. תכונות מחושבות מ-Materials Project (אוסף summary, גרסה 2026-09-28). "נוצר במעבדה" לפי סימון Materials Project למבנים שמופיעים במאגר הניסויי ICSD.
          <br />המגבלה: התפקוד נבדק דרך תכונה אחת. חומר שעובר את ארבעת השערים הוא מועמד, לא פתרון.
        </p>
      </section>
    </>
  )
}

function Story({ r }: { r: Report }) {
  const f = r.funnel
  const steps = [
    { label: 'רעיונות', n: f.tried }, { label: 'מטען', n: f.charge }, { label: 'קיום', n: f.exist }, { label: 'תפקוד', n: f.fn }, { label: 'בטיחות', n: f.safe },
  ]
  return (
    <section id="story" className="stack">
      <div className="story glass panel anchor">
        <div className="station-s">
          <span className="eyebrow">1 · הטבע</span>
          <b>{r.c.nature}</b>
          <span className="small muted">{r.c.trick}</span>
          <a className="chip" href={BIOMATIC_URL(r.c.path)} target="_blank" rel="noreferrer">ב-BIOMATIC</a>
        </div>
        <div className="arrow" aria-hidden />
        <div className="station-s">
          <span className="eyebrow">2 · מה החומר צריך</span>
          <b>{r.c.needs}</b>
          <span className="small muted">הבדיקה: {r.c.test}</span>
        </div>
        <div className="arrow" aria-hidden />
        <div className="station-s">
          <span className="eyebrow">3 · מי עושה את זה היום</span>
          {r.parents.map((p) => <span key={p.f} className="small"><bdi dir="ltr" className="formula-inline">{prettyFormula(p.f)}</bdi> {p.does}</span>)}
        </div>
      </div>

      <div className="glass panel stack">
        <h3 style={{ margin: 0 }}>4 · מה המכונה מצאה</h3>
        <div className="gate-row" aria-label="כמה רעיונות עברו כל שער">
          {steps.map((s, i) => (
            <div key={s.label} className="gate" style={{ ['--w' as string]: `${Math.max(6, (s.n / steps[0].n) * 100)}%` }}>
              <span className="eyebrow">{i === 0 ? 'ניסתה' : `עברו ${s.label}`}</span>
              <b className="mono">{s.n}</b>
              <i />
            </div>
          ))}
        </div>
        {r.parents.map((p) => (
          <div key={p.f} className="stack" style={{ gap: 8 }}>
            <span className="small">מתוך <bdi dir="ltr" className="formula-inline">{prettyFormula(p.f)}</bdi>{p.ideas.pRisk.length > 0 && <span className="sig-bad"> · בחומר המוצא: {p.ideas.pRisk.join(', ')}</span>}</span>
            {p.ideas.lab.length + p.ideas.computed.length + p.ideas.open.length === 0 ? <span className="small faint">אף רעיון מתוכו לא עבר את כל ארבעת השערים.</span> : <div className="judges">
              {(['lab', 'computed', 'open'] as const).map((k) => (
                <div key={k} className="judge-col" style={{ ['--jc' as string]: KIND[k].color }}>
                  <h4>{KIND[k].title}</h4>
                  <p className="small muted" style={{ margin: 0 }}>{KIND[k].about}</p>
                  {p.ideas[k].length ? p.ideas[k].map((i) => <IdeaCard key={i.s.to} i={i} />) : <span className="small faint">אין</span>}
                </div>
              ))}
            </div>}
          </div>
        ))}
      </div>
    </section>
  )
}

function IdeaCard({ i }: { i: Idea }) {
  const hyp = useHypotheses()
  const saved = hyp.list.some((h) => h.formula === i.s.to)
  return (
    <div className="pred">
      <span className="big-formula" dir="ltr">{prettyFormula(i.s.to)}</span>
      <span className="small">{he(i.s.y)} במקום {he(i.s.x)}</span>
      <span className="small faint">{i.fn.ok === null ? 'תפקוד: אין נתון לבדיקה' : `תפקוד: ${i.fn.why}`}</span>
      <span className="small">זמינות: <b>{AVAIL_LABEL[i.avail]}</b></span>
      {i.better.length > 0 && <span className="small sig-good">{i.better.join(', ')}</span>}
      {i.kind === 'open' && <span className="small"><LayerTag id="guess" /> ביטחון {Math.round(i.confidence * 100)}%</span>}
      <div className="row small">
        <a className="chip" href={href('lab', { f: i.s.from, el: i.s.x })}>מעבדה</a>
        <a className="chip" href={i.kind === 'open' ? MP_URL(i.s.to) : SCHOLAR_URL(i.s.to)} target="_blank" rel="noreferrer">{i.kind === 'open' ? 'Materials Project' : 'מאמרים'}</a>
        <button className="chip" disabled={saved} onClick={() => hyp.add({ formula: i.s.to, template: i.s.from, replaced: i.s.x, by: i.s.y, score: i.confidence })}>{saved ? 'נשמר' : 'שמור'}</button>
      </div>
    </div>
  )
}
