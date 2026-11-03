// The book of rules: ten lessons, each a rule of chemistry in three moves —
// predict (you choose), test (the app looks it up), prove (a number from the app's own data).
// The shape follows "Every Joule", a 3D physics book where every diagram lifts off the page.
import { lazy, Suspense, useMemo, useState } from 'react'
import { href, setParam } from '../lib/router'
import { FORMULA_SET, parseFormula, prettyFormula } from '../data/compounds'
import { BY_SYM } from '../data/elements'
import { RELIABILITY } from '../lib/mayan'
import { SCORE } from '../lib/insights'
import { evaluate } from '../lib/rulegen'
import { CALIBRATION, propsOf } from '../lib/stability'
import { waterReaction } from '../data/reactivity'
import { Rich, LayerTag } from '../components/Rich'

const Book3D = lazy(() => import('../three/Book3D'))
const pct = (x: number) => `${Math.round(x * 100)}%`
const en = (s: string) => BY_SYM.get(s)?.en ?? 0
const gapOf = (f: string) => propsOf(parseFormula(f))?.gap
const pgOf = (f: string) => propsOf(parseFormula(f))

interface Lesson {
  id: string; n: string; rule: string; plain: string; city: string
  ask: string; options: string[]; answer: number
  test: () => string     // what the app looks up when you answer
  proof: () => string    // the measured number behind the rule
  layer: 'fact' | 'calc'
  page: string; pageLabel: string
}

const LESSONS: Lesson[] = [
  {
    id: 'charge', n: 'איזון מטענים', rule: '==מה שאחד נותן, השני לוקח.==', plain: 'אלומיניום נותן 3 אלקטרונים, חמצן לוקח 2. הנוסחה היא היחס שמאזן ביניהם.', city: 'כמו חשבון חניות: כל רכב צריך מקום אחד, וכל מקום מקבל רכב אחד.',
    ask: 'איזו נוסחה תצא מאלומיניום וחמצן?', options: ['AlO', 'Al2O3', 'AlO2', 'Al3O2'], answer: 1,
    test: () => ['AlO', 'Al2O3', 'AlO2', 'Al3O2'].map((f) => `${prettyFormula(f)} ${FORMULA_SET.has(f) ? 'במאגר' : 'לא במאגר'}`).join(' · '),
    proof: () => { const c = evaluate(['charge']); return `כלל המטענים מנבא נכון ${RELIABILITY.hit} מתוך ${RELIABILITY.tested} נוסחאות. כמסנן להחלפות הוא צודק פי ${c.lift.toFixed(1)} מניחוש.` },
    layer: 'calc', page: 'rings', pageLabel: 'מעגלים',
  },
  {
    id: 'column', n: 'משפחה בטור', rule: '==יסודות באותו טור מחליפים זה את זה.==', plain: 'בכל טור יש אותו מספר אלקטרונים חיצוניים. הגודל גדל כשיורדים, אבל ההתנהגות דומה.', city: 'כמו דירות באותו קו אנכי בבניין: אותה תוכנית, קומה אחרת.',
    ask: 'במלח NaCl, מי יחליף את הנתרן הכי טוב?', options: ['אשלגן (K)', 'מגנזיום (Mg)', 'כלור (Cl)', 'ניאון (Ne)'], answer: 0,
    test: () => ['KCl', 'MgCl', 'Cl2', 'NeCl'].map((f, i) => `${['K', 'Mg', 'Cl', 'Ne'][i]}: ${FORMULA_SET.has(f) ? 'תרכובת ידועה' : 'לא ידועה'}`).join(' · '),
    proof: () => `השכן בטור נותן תרכובת אמיתית ב-${pct(SCORE.group.rate1)} מההחלפות. ניחוש עיוור: ${pct(SCORE.random.rate1)}.`,
    layer: 'calc', page: 'matrix', pageLabel: 'מטריצה',
  },
  {
    id: 'size', n: 'גודל וידיים', rule: '==גודל דומה לא מספיק. צריך גם אותן ידיים.==', plain: 'הכלל הקלאסי אומר: יסוד יחליף יסוד אם הגודל שלהם שונה בפחות מ-15%. המכונה בדקה, וגילתה שבלי מספר קשרים זהה זה כמעט לא עובד.', city: 'לבנה בגודל הנכון עדיין צריכה את אותם חיבורים לקיר.',
    ask: 'שני יסודות באותו גודל. האם הם יחליפו זה את זה?', options: ['כמעט תמיד', 'רק אם יש להם אותו מספר קשרים'], answer: 1,
    test: () => { const a = evaluate(['r15']), b = evaluate(['r15', 'val']); return `גודל לבד: ${pct(a.precision)} · גודל ועוד ידיים: ${pct(b.precision)}` },
    proof: () => { const a = evaluate(['r15']); return `כלל ה-15% (Hume-Rothery, 1934) צודק פי ${a.lift.toFixed(1)} מניחוש בלבד.` },
    layer: 'calc', page: 'rules', pageLabel: 'מחולל כללים',
  },
  {
    id: 'bonds', n: 'שלושה סוגי קשר', rule: '==הפרש המשיכה קובע את סוג הקשר.==', plain: 'הפרש גדול במשיכת אלקטרונים: אחד לוקח, הקשר יוני (מלח). הפרש קטן: הם חולקים (מולקולה). מתכות: ענן אלקטרונים משותף.', city: 'מכירה, שותפות, או קואופרטיב.',
    ask: 'איזה מהשלושה קשור בקשר יוני?', options: ['NaCl, מלח', 'Cl₂, גז כלור', 'Cu, נחושת'], answer: 0,
    test: () => `הפרש המשיכה: נתרן וכלור ${(en('Cl') - en('Na')).toFixed(2)} · כלור וכלור 0 · נחושת ונחושת 0`,
    proof: () => `לפי סולם פאולינג, הפרש מעל כ-1.7 נחשב יוני. ב-NaCl ההפרש ${(en('Cl') - en('Na')).toFixed(2)}.`,
    layer: 'fact', page: 'matrix', pageLabel: 'מטריצה לפי משיכה',
  },
  {
    id: 'structure', n: 'המבנה קובע', rule: '==אותם אטומים, סידור אחר, חומר אחר.==', plain: 'ביהלום כל אטום פחמן קשור לארבעה בכיוונים שונים, ולכן הוא קשה. בגרפיט האטומים בשכבות שטוחות שמחליקות זו על זו.', city: 'אותן לבנים: קמרון או ערימה.',
    ask: 'יהלום וגרפיט שניהם פחמן טהור. מי מהם רך מספיק לכתוב בו?', options: ['יהלום', 'גרפיט'], answer: 1,
    test: () => 'יהלום: רשת תלת־ממדית. גרפיט: שכבות שמחליקות. רואים את זה באיור שעל הדף.',
    proof: () => 'יהלום הוא החומר הטבעי הקשה ביותר בסולם מוס (10). גרפיט נמצא ב-1 עד 2.',
    layer: 'fact', page: 'life', pageLabel: 'בחיים',
  },
  {
    id: 'stability', n: 'קיים או לא', rule: '==נוסחה מאוזנת היא לא הבטחה.==', plain: 'חומר נשאר רק אם אין צירוף אחר של אותם אטומים שנמוך ממנו באנרגיה. כמו כדור שמתגלגל לעמק הנמוך.', city: 'מגרש בשיפוע: הכדור לא נשאר באמצע.',
    ask: 'נוסחה עם מטענים מאוזנים. האם החומר בטוח קיים?', options: ['כן', 'לא בהכרח'], answer: 1,
    test: () => { const c = evaluate(['charge']); return `מכל ההחלפות שהמטען שלהן מאוזן, רק ${pct(c.reality)} ידועות או יציבות בחישוב.` },
    proof: () => `השופט השני (Materials Project) מסכים עם ${pct(CALIBRATION.agree)} מהחומרים הידועים, אבל ${CALIBRATION.unstable} חומרים אמיתיים נראים לו לא יציבים.`,
    layer: 'calc', page: 'open', pageLabel: 'השערות פתוחות',
  },
  {
    id: 'piezo', n: 'סימטריה וחשמל', rule: '==גביש בלי מרכז סימטריה הופך לחץ לחשמל.==', plain: 'כשלוחצים על גביש סימטרי, המטענים זזים באופן שווה ומתקזזים. בגביש לא סימטרי, הם נפרדים, ונוצר מתח.', city: 'כמו מדרכה שמייצרת חשמל מצעדים.',
    ask: 'מי ייצר חשמל בלחיצה?', options: ['NaCl, מלח (קובייה)', 'AlN (גביש משושה)'], answer: 1,
    test: () => { const a = pgOf('NaCl'), b = pgOf('AlN'); return `NaCl: סימטריה ${a?.pointGroup ?? 'אין נתון'} · AlN: סימטריה ${b?.pointGroup ?? 'אין נתון'}${b?.piezo != null ? `, מקדם ${b.piezo} C/m²` : ''}` },
    proof: () => 'מתוך 32 מחלקות הגבישים, 21 בלי מרכז סימטריה, ו-20 מהן יכולות להיות פייזואלקטריות.',
    layer: 'fact', page: 'nature', pageLabel: 'מהטבע לחומר',
  },
  {
    id: 'gap', n: 'צבע ואור', rule: '==הפער קובע איזה אור נבלע.==', plain: 'לכל חומר יש "פער אנרגיה". אור שהאנרגיה שלו קטנה מהפער עובר או מוחזר, ולכן חומר עם פער גדול לבן. חומר עם פער קטן בולע את השמש, ולכן הוא שחור וטוב לפאנל סולארי.', city: 'קיר לבן מקרר, גג שחור אוסף חום.',
    ask: 'מי מהשניים לבן?', options: ['Al₂O₃, ספיר', 'CdTe, פאנל סולארי'], answer: 0,
    test: () => `פער מחושב: Al₂O₃ ${gapOf('Al2O3') ?? '?'} eV · CdTe ${gapOf('CdTe') ?? '?'} eV`,
    proof: () => 'אור נראה מגיע עד כ-3.1 eV. מעל זה החומר לא בולע אור נראה. הערכים המחושבים נמוכים מהאמת, ולכן משווים חומר לחומר.',
    layer: 'calc', page: 'nature', pageLabel: 'מהטבע לחומר',
  },
  {
    id: 'water', n: 'מבחן המים', rule: '==חומר בניין צריך לשרוד גשם.==', plain: 'חלק מהחומרים מגיבים עם מים ומשחררים גז. AlP, למשל, משחרר פוספין רעיל, ולכן משמש כחומר הדברה.', city: 'חומר שמתפרק בגשם לא נכנס לחזית.',
    ask: 'מה קורה ל-AlP במגע עם מים?', options: ['כלום', 'משתחרר גז רעיל'], answer: 1,
    test: () => ['AlP', 'AlN', 'CaO', 'SiO2'].map((f) => `${prettyFormula(f)}: ${waterReaction(f)?.text ?? 'לא מגיב'}`).join(' · '),
    proof: () => 'הכללים לפי משפחות (Greenwood ו-Earnshaw): זרחנים, הידרידים, קרבידים וגופרות של מתכות פעילות מגיבים עם מים.',
    layer: 'fact', page: 'nature', pageLabel: 'מהטבע לחומר',
  },
  {
    id: 'giver', n: 'מחליפים את המתכת', rule: '==בהמצאה, מחליפים את הנותן ושומרים את הלוקח.==', plain: 'החמצן, הגופרית או הכלור הם השלד. המתכת היא החלק שאפשר להחליף.', city: 'שומרים את המבנה, מחליפים את החיפוי.',
    ask: 'ב-MgO, מה עדיף להחליף?', options: ['את המגנזיום', 'את החמצן'], answer: 0,
    test: () => { const g = evaluate(['giver']), t = evaluate(['taker']); return `החלפת הנותן: ${pct(g.reality)} · החלפת הלוקח: ${pct(t.reality)}` },
    proof: () => { const g = evaluate(['giver']), t = evaluate(['taker']); return `לפי שני השופטים, החלפת הנותן מצליחה פי ${(g.reality / t.reality).toFixed(1)}. במדגם לבד הפער נראה פי 3: מדגם קטן מגזים.` },
    layer: 'calc', page: 'rules', pageLabel: 'מחולל כללים',
  },
]

export function Book({ params }: { params: URLSearchParams }) {
  const idx = Math.max(0, LESSONS.findIndex((l) => l.id === params.get('l')))
  const l = LESSONS[idx]
  const [pick, setPick] = useState<Record<string, number>>({})
  const chosen = pick[l.id]
  const answered = chosen !== undefined
  const test = useMemo(() => (answered ? l.test() : ''), [answered, l])
  const proof = useMemo(() => (answered ? l.proof() : ''), [answered, l])
  const go = (i: number) => setParam('l', LESSONS[(i + LESSONS.length) % LESSONS.length].id)
  const score = LESSONS.filter((x) => pick[x.id] === x.answer).length

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">ספר החוקים</div>
          <h1>עשרה חוקים בכימיה. כל אחד קם מהדף.</h1>
          <p><Rich text="בכל שיעור: ==מנבאים, בודקים ומוכיחים==. ההוכחה היא מספר מהנתונים של האפליקציה עצמה." /></p>
        </div>
        <div className="row">
          <span className="mono small faint">ניחושים נכונים: <b>{score}</b> מתוך {Object.keys(pick).length}</span>
        </div>
      </div>

      <div className="book-wrap">
        <div className="glass book-stage">
          <Suspense fallback={<div className="boot">פותח את הספר</div>}>
            <Book3D page={{ id: l.id, n: idx + 1, title: l.n, rule: l.rule.replace(/==/g, '') }} />
          </Suspense>
          <div className="book-nav">
            <button className="btn" onClick={() => go(idx - 1)}>הקודם</button>
            <span className="mono small">שיעור {idx + 1} מתוך {LESSONS.length}</span>
            <button className="btn primary" onClick={() => go(idx + 1)}>הבא</button>
          </div>
        </div>

        <article className="glass panel stack lesson" key={l.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="eyebrow">שיעור {idx + 1} · {l.n}</span>
            <LayerTag id={l.layer} />
          </div>
          <h2 className="lesson-rule"><Rich text={l.rule} /></h2>
          <p style={{ margin: 0 }}>{l.plain}</p>
          <p className="small muted" style={{ margin: 0 }}><span className="eyebrow">בעיר</span> {l.city}</p>

          <div className="pt-step">
            <span className="eyebrow">1 · נבאי</span>
            <b>{l.ask}</b>
            <div className="row">
              {l.options.map((o, i) => (
                <button key={o} className={`chip predict${answered && i === l.answer ? ' right' : ''}${answered && i === chosen && i !== l.answer ? ' wrong' : ''}`}
                  aria-pressed={chosen === i} disabled={answered} onClick={() => setPick((p) => ({ ...p, [l.id]: i }))}>
                  <bdi>{o.replace(/(\d)/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[+d])}</bdi>
                </button>
              ))}
            </div>
          </div>
          {answered && (
            <>
              <div className="pt-step">
                <span className="eyebrow">2 · בדקי</span>
                <span className={chosen === l.answer ? 'sig-good' : 'sig-bad'}>{chosen === l.answer ? 'נכון.' : `לא בדיוק. התשובה: ${l.options[l.answer]}.`}</span>
                <span className="small mono" dir="auto">{test}</span>
              </div>
              <div className="pt-step">
                <span className="eyebrow">3 · הוכיחי</span>
                <span className="small">{proof}</span>
                <a className="chip" href={href(l.page)}>לדף: {l.pageLabel}</a>
              </div>
            </>
          )}
        </article>
      </div>

      <nav className="lesson-index" aria-label="תוכן העניינים">
        {LESSONS.map((x, i) => (
          <button key={x.id} className="chip" aria-pressed={i === idx} onClick={() => go(i)}>
            {i + 1}. {x.n}{pick[x.id] !== undefined ? (pick[x.id] === x.answer ? ' · נכון' : ' · נלמד') : ''}
          </button>
        ))}
      </nav>
      <p className="small faint" style={{ margin: 0 }}>המבנה בהשראת "Every Joule", ספר פיזיקה תלת־ממדי על אנרגיה (iamtechartist.com), שבו כל איור עולה מהדף כדי לנבא, לבדוק ולהוכיח.</p>
    </>
  )
}
