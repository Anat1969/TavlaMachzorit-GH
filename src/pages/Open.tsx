import { useMemo } from 'react'
import { href, setParam } from '../lib/router'
import { prettyFormula } from '../data/compounds'
import { BY_SYM } from '../data/elements'
import { AVAIL_LABEL } from '../data/availability'
import { useHypotheses, toast } from '../lib/store'
import { MP_URL, SCHOLAR_URL } from '../lib/insights'
import { worklist, FUNNEL, RULES_USED, PRIOR_WEIGHT, AVAIL_FACTOR, USE_BONUS, HAZARD_FACTOR, RADIO_FACTOR, NON_IONIC_FACTOR, EXPLORED_FACTOR, MIN_CONFIDENCE, MIN_JUDGED, ruleText, type Work } from '../lib/worklist'
import { Rich, LayerTag } from '../components/Rich'

const pct = (x: number) => `${Math.round(x * 100)}%`
const he = (s: string) => BY_SYM.get(s)?.he ?? s
const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`)

// What each parent material does, in the letter's language.
const USE_EN: Record<string, string> = {
  GaAs: 'high-frequency chips and space solar cells', MoS2: 'dry lubricants and atomically thin transistors', NaCl: 'table salt',
  TiO2: 'white pigment and sunscreen', MgB2: 'low-cost superconducting wires', CdTe: 'thin-film solar panels',
  LaB6: 'electron sources in electron microscopes', SiC: 'abrasives and power electronics', Bi2Te3: 'thermoelectric cooling',
  Li3N: 'solid lithium-ion conductors', ZnO: 'sunscreen', Fe2O3: 'red pigment', CaCO3: 'chalk and marble', SiO2: 'glass',
  Al2O3: 'sapphire and abrasives', GaN: 'white LEDs and fast chargers', WC: 'cutting tools and drill bits', CdSe: 'quantum dots in displays',
}

/** The outreach letter: written in English, because computational groups read English. */
function letter(top: Work[]) {
  const lines = top.map((w, i) =>
    `${i + 1}. ${w.formula}: derived from ${w.parent}${USE_EN[w.parent] ? ` (used for ${USE_EN[w.parent]})` : ''} by replacing ${w.x} with ${w.y}. ` +
    `Estimated plausibility ${pct(w.confidence)} (rule hit rate ${pct(w.ruleRate)}; this substitution confirmed in ${w.pair.ok} of ${w.pair.judged} other compounds).` +
    (w.neighbours.length ? ` Known in this system: ${w.neighbours.join(', ')}.` : ' No compound of this pair is listed in Materials Project.'))
  return [
    'Subject: Five candidate binary compounds for a stability calculation',
    '',
    'Dear colleagues,',
    '',
    'I am an architect and researcher exploring how rearranging the periodic table can suggest new materials.',
    'I built an open tool that tests substitution rules against known compounds and against the Materials Project stability data.',
    'The five binaries below are proposed by the best rules, pass a charge-balance check, and have no entry in Materials Project yet.',
    'Where Materials Project already lists other compounds of the same two elements, I note them, since those systems are partly explored.',
    '',
    ...lines,
    '',
    'Would your group consider a quick DFT relaxation and convex-hull check for any of them?',
    'I will gladly share the method, the code and the full ranked list.',
    '',
    'With thanks,',
    'Anat',
    'https://tavla-machzorit.vercel.app/#/open',
  ].join('\n')
}

export function Open({ params }: { params: URLSearchParams }) {
  const safeOnly = params.get('safe') !== '0'
  const usefulOnly = params.get('useful') !== '0'
  const list = useMemo(() => worklist({ safeOnly, usefulOnly }, 20), [safeOnly, usefulOnly])
  const top = list.slice(0, 5)
  const text = useMemo(() => letter(top), [top.map((w) => w.formula).join()])
  const max = FUNNEL[0].n

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">השערות פתוחות</div>
          <h1>רשימת העבודה של הממציאה</h1>
          <p><Rich text={`מכל ההחלפות האפשריות נשארו ${FUNNEL[FUNNEL.length - 1].n.toLocaleString('he-IL')} נוסחאות ש==אף אחד עוד לא בדק==. הן מדורגות לפי הסיכוי שיתקיימו, הזמינות של היסוד, והשימוש של חומר המוצא.`} /></p>
        </div>
      </div>

      <section className="glass panel stack anchor">
        <h3 style={{ margin: 0 }}>המשפך: מה כל מסננת השאירה</h3>
        <div className="funnel">
          {FUNNEL.map((f, i) => (
            <div key={f.label} className="funnel-row" style={{ animationDelay: `${i * 120}ms` }}>
              <div><b>{f.label}</b><div className="small faint">{f.note}</div></div>
              <div className="funnel-track"><span style={{ width: `${(f.n / max) * 100}%` }} /></div>
              <b className="mono funnel-n">{f.n.toLocaleString('he-IL')}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 className="home-h2" style={{ margin: 0 }}>20 הראשונות</h2>
          <div className="row" role="group" aria-label="סינון">
            <button className="chip" aria-pressed={usefulOnly} onClick={() => setParam('useful', usefulOnly ? '0' : null)}>רק מחומרים שכבר בשימוש</button>
            <button className="chip" aria-pressed={safeOnly} onClick={() => setParam('safe', safeOnly ? '0' : null)}>בלי יסודות רעילים או רדיואקטיביים</button>
          </div>
        </div>
        <div className="glass work-table">
          {list.map((w, i) => <WorkRow key={w.formula} w={w} i={i} />)}
          {!list.length && <p className="panel muted">אין השערות שעוברות את הסינון. נסו להסיר מסנן.</p>}
        </div>
      </section>

      {top.length > 0 && (
        <section className="stack">
          <h2 className="home-h2">המכתב: חמש הראשונות לקבוצת מחקר</h2>
          <div className="split letter-split">
            <div className="glass panel stack">
              <p className="small muted" style={{ margin: 0 }}>
                <Rich text="==הצעד שבו ההמצאה יוצאת מהאפליקציה.== קבוצת מחקר חישובית יכולה לחשב יציבות לחמש נוסחאות בכמה ימים." />
                <br />המכתב באנגלית, כי זו שפת התחום. הוא מציג את השיטה, את חמש ההשערות ואת הביטחון בכל אחת, ומבקש בקשה אחת.
                <br />למי לפנות: קבוצות שמפרסמות חישובי יציבות בגישה פתוחה, למשל קבוצת Materials Project ב-Lawrence Berkeley National Laboratory, או קבוצת OQMD ב-Northwestern University.
              </p>
              <ol className="small letter-list">
                {top.map((w) => <li key={w.formula}><b dir="ltr">{prettyFormula(w.formula)}</b> מתוך <span dir="ltr">{prettyFormula(w.parent)}</span>{w.use ? `, ${w.use}` : ''}</li>)}
              </ol>
              <button className="btn primary" onClick={() => navigator.clipboard.writeText(text).then(() => toast('המכתב הועתק'), () => toast('ההעתקה נכשלה. סמנו את הטקסט והעתיקו ידנית.', true))}>העתק את המכתב</button>
            </div>
            <pre className="glass panel letter" dir="ltr">{text}</pre>
          </div>
        </section>
      )}

      <section className="glass panel stack">
        <h3>איך נקבע הדירוג, ואיך הוא מודד את עצמו</h3>
        <p className="small muted" style={{ margin: 0 }}>
          <b>ביטחון</b> = (אישורים של ההחלפה הזו + {PRIOR_WEIGHT} × דיוק הכלל) ÷ (שיפוטים של ההחלפה + {PRIOR_WEIGHT}). זו הערכה בייסיאנית אמפירית: כשיש להחלפה היסטוריה, היא קובעת. כשאין, הכלל קובע.
          <br /><b>סף כניסה:</b> ביטחון של {pct(MIN_CONFIDENCE)} לפחות, ו-{MIN_JUDGED} שיפוטים קודמים לפחות של אותה החלפה.
          <br /><b>ציון</b> = ביטחון² × זמינות (נפוץ {AVAIL_FACTOR.common}, זמין {AVAIL_FACTOR.available}, נדיר {AVAIL_FACTOR.scarce}, נדיר מאוד {AVAIL_FACTOR.rare}) × {USE_BONUS} לחומר מוצא שכבר בשימוש. סיכון: × {HAZARD_FACTOR}, רדיואקטיבי: × {RADIO_FACTOR}. קשר לא יוני, שבו אי אפשר לבדוק מטען: × {NON_IONIC_FACTOR}.
          <br /><b>הנחה:</b> אם Materials Project כבר חקר את צמד היסודות ולא מצא את הנוסחה, הסיכוי שלה קטן, ולכן × {EXPLORED_FACTOR}. זו הערכה שלי, לא מדידה. השערות בשכונה שאף אחד לא חקר עולות בדירוג.
          <br /><b>מקורות:</b> שכיחות בקרום כדור הארץ לפי CRC Handbook of Chemistry and Physics. דרגות חמצון לפי ספריית mendeleev. הגבלות לפי הנחיית RoHS של האיחוד האירופי (2011/65/EU) לעופרת, כספית וקדמיום.
          <br /><b>הכללים:</b> {RULES_USED.length} כללים מחזית המחולל, שכל אחד מהם נשפט על 30 נוסחאות לפחות. הכלל המדויק ביותר: {ruleText(RULES_USED[0].ids)}.
          <br /><b>המגבלה:</b> הדירוג מעריך סבירות, לא מוכיח קיום. רק חישוב או ניסוי מכריעים.
          <br /><b>בדיקה ראשונה:</b> חלק מההשערות הן חומרים מוכרים שפשוט חסרים ב-Materials Project, למשל תרכובות של איטרביום (YbF₃, Yb₂S₃). לכן לפני כל דבר אחר לוחצים "מאמרים".
        </p>
      </section>
    </>
  )
}

function WorkRow({ w, i }: { w: Work; i: number }) {
  const hyp = useHypotheses()
  const saved = hyp.list.some((h) => h.formula === w.formula)
  return (
    <div className="work-row" style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}>
      <span className="mono work-rank">{i + 1}</span>
      <div className="stack" style={{ gap: 2 }}>
        <span className="big-formula" dir="ltr">{prettyFormula(w.formula)}</span>
        <span className="small faint">{he(w.y)} במקום {he(w.x)}, מתוך <span dir="ltr">{prettyFormula(w.parent)}</span></span>
      </div>
      <div className="stack" style={{ gap: 4 }}>
        <div className="row small" style={{ justifyContent: 'space-between' }}><span>ביטחון</span><b className="mono">{pct(w.confidence)}</b></div>
        <div className="rule-track"><span className="r1" style={{ width: `${w.confidence * 100}%` }} /></div>
        <span className="small faint">הכלל {pct(w.ruleRate)} · ההחלפה אושרה ב-{w.pair.ok} מתוך {w.pair.judged}</span>
      </div>
      <div className="stack small" style={{ gap: 2 }}>
        {w.use ? <span><LayerTag id="fact" /> {w.use}</span> : <span className="faint">חומר המוצא אינו בשימוש מוכר</span>}
        <span>{he(w.y)}: <b>{AVAIL_LABEL[w.avail]}</b>{w.ppm !== null && <span className="faint mono"> · <bdi dir="ltr">{w.ppm} ppm</bdi></span>}</span>
        <span className="faint">{w.ox.length ? <>מטען <bdi dir="ltr">{w.ox.map(sign).join(' / ')}</bdi>, כמו במקור</> : 'קשר לא יוני: אי אפשר לבדוק מטען'}</span>
        {w.neighbours.length
          ? <span className="faint">השכונה נחקרה: <bdi dir="ltr">{w.neighbours.map(prettyFormula).join(', ')}</bdi></span>
          : <span style={{ color: 'var(--st-open)' }}>שכונה שאף אחד לא חקר</span>}
        {w.hazards.length > 0 && <span className="sig-bad">{w.hazards.join(', ')}</span>}
      </div>
      <div className="row work-actions">
        <a className="chip" href={href('lab', { f: w.parent, el: w.x })}>מעבדה</a>
        <a className="chip" href={MP_URL(w.formula)} target="_blank" rel="noreferrer">Materials Project</a>
        <a className="chip" href={SCHOLAR_URL(w.formula)} target="_blank" rel="noreferrer">מאמרים</a>
        <button className="chip" disabled={saved} onClick={() => hyp.add({ formula: w.formula, template: w.parent, replaced: w.x, by: w.y, score: w.confidence })}>{saved ? 'נשמר' : 'שמור'}</button>
      </div>
    </div>
  )
}
