import { useState } from 'react'
import { href } from '../lib/router'
import { COMPOUNDS } from '../data/compounds'
import { RELATIONS } from '../data/relations'
import { RELIABILITY } from '../lib/mayan'
import { SCORE, SWAP_SLOTS } from '../lib/insights'
import { Rich, LayerLegend } from '../components/Rich'

const pct = (x: number) => Math.round(x * 100)

// Chemistry words, each with a plain meaning and a picture from architecture and the city.
const WORDS: { term: string; plain: string; city: string }[] = [
  { term: 'יסוד', plain: 'חומר שאי אפשר לפרק לחומר פשוט יותר. יש 118, וכל אחד מוגדר במספר הפרוטונים שלו.', city: 'חומר גלם: אבן, עץ, פלדה.' },
  { term: 'תרכובת', plain: 'שני יסודות או יותר שקשורים יחד ביחס קבוע. NaCl הוא נתרן וכלור, אחד לאחד.', city: 'פרט בניין: קיר שהוא אבן וטיח, תמיד באותו סדר.' },
  { term: 'תבנית', plain: 'תרכובת שהוצא ממנה יסוד אחד. NaCl נותן "□Cl", וכל יסוד שנכנס למשבצת ממלא את אותה תבנית.', city: 'טיפולוגיה: "בית חצר" נשאר בית חצר, בין שנבנה מאבן ובין שמבטון.' },
  { term: 'החלפה', plain: 'מכניסים יסוד אחר למשבצת של תבנית ידועה. אם התוצאה קיימת, שני היסודות דומים בפועל.', city: 'החלפת חומר בפרט קיים: אותו חלון, מסגרת מאלומיניום במקום עץ.' },
  { term: 'עדשה', plain: 'הגדרה אחת של "קרבה" בין יסודות. כל עדשה מציירת רשת אחרת מאותם יסודות.', city: 'שכבה במפת GIS: אותה עיר, פעם לפי תחבורה ופעם לפי צל.' },
  { term: 'אלקטרושליליות', plain: 'כמה חזק יסוד מושך אליו אלקטרונים בקשר. פלואור מושך הכי חזק, צזיום מהחלשים.', city: 'כוח משיכה של מרכז עירוני: מי מושך אליו את התנועה.' },
  { term: 'רדיוס', plain: 'גודל האטום כשהוא קשור לאטום אחר. נמדד בפיקומטרים (pm).', city: 'מידת הלבנה: לבנה גדולה לא נכנסת לקיר של לבנים קטנות.' },
  { term: 'אנרגיית יינון', plain: 'כמה אנרגיה צריך כדי לתלוש מהאטום אלקטרון אחד. נמדד באלקטרון־וולט (eV).', city: 'כמה קשה לפנות דייר: יש שעוזבים בקלות ויש שנאחזים.' },
  { term: 'ערכיות', plain: 'האלקטרונים בקליפה החיצונית, אלה שמשתתפים בקשרים. הם קובעים כמה קשרים היסוד יוצר.', city: 'מספר הכניסות לבניין: כמה רחובות יכולים להתחבר אליו.' },
  { term: 'משפחה גיאוכימית', plain: 'איפה היסוד מתרכז בכדור הארץ, לפי Goldschmidt: בסלע, בליבת הברזל, בגופרות או באוויר.', city: 'שכונה: איפה החומר "גר" בטבע, ועם מי.' },
]

const MAP: { id: string; t: string; q: string; see: string; read: string; trust: string }[] = [
  { id: 'school', t: 'יסודות המקצוע', q: 'מה הכימיה נתנה לעולם, ואיך לומדים אותה?', see: 'שש מתנות, שמונה רזי מקצוע, ומסלול לימוד בשישה שלבים.', read: 'כל רעיון מקושר למסך שבו רואים אותו פועל.', trust: 'עובדות עם שם ותאריך שאפשר לבדוק.' },
  { id: 'rules', t: 'מחולל כללים', q: 'איזה כלל אצבע באמת עובד?', see: 'המכונה בודקת מאות כללים ומדווחת "מצאתי". אפשר גם להרכיב כלל לבד.', read: 'דיוק: כמה מההצעות נכונות. כיסוי: כמה מהאפשרויות נמצאו.', trust: 'כל כלל מוצג עם דיוק, כיסוי ויחס לניחוש.' },
  { id: 'insights', t: 'תובנות', q: 'מה אפשר ללמוד מהסידור, ומה אפשר להמציא?', see: 'כללי אצבע עם אחוז הצלחה, זוגות מפתיעים, והמצאות לפי צורך.', read: 'כל כלל נבדק מול המאגר. האחוז הוא כמה פעמים הכלל צדק.', trust: `נבדק על ${SWAP_SLOTS} החלפות.` },
  { id: 'matrix', t: 'מטריצה', q: 'איפה היסוד יושב בטבלה, ומי באמת דומה לו?', see: 'הטבלה הרגילה. בחירת יסוד מדליקה את השכנים שלו לפי העדשה.', read: 'חוטים ממוספרים: 1 הוא השכן הקרוב ביותר.', trust: `השכן בטור צודק ב-${pct(SCORE.group.rate1)}%.` },
  { id: 'network', t: 'רשת', q: 'איך נראים היסודות כשמסדרים אותם לפי התנהגות?', see: 'צמתים וקווים. יסודות דומים מתקבצים לאשכולות.', read: 'קו עבה הוא דמיון חזק. קו מקווקו הוא "חבר רחוק" מהטבלה.', trust: `עדשת ההיסטוריה צודקת ב-${pct(SCORE.history.rate1)}%.` },
  { id: 'secondary', t: 'מחזוריות משנית', q: 'אילו קשרים חוצים שורות וטורים?', see: `${RELATIONS.length} קשרים מתועדים, כל אחד עם הסבר.`, read: 'הצעדים הממוספרים מראים מאיפה לאן הדמיון עובר.', trust: 'מבוסס ספרות (Rayner-Canham, Laing), לא חישוב.' },
  { id: 'spiral', t: 'ספירלה', q: 'מה קורה כשהטבלה היא רצף אחד, בלי שבירות?', see: 'כל מחזור הוא סיבוב, והמשפחות יוצרות קרניים.', read: 'קרן אחת היא משפחה אחת.', trust: 'סידור חזותי, בלי ניבוי.' },
  { id: 'rings', t: 'מעגלים', q: 'באיזה יחס שני יסודות יתחברו?', see: 'טבעות, והגזים האצילים על קו אחד.', read: 'סופרים קפיצות עד הקו. הקפיצות מאזנות זו את זו בנוסחה.', trust: `צודק ב-${RELIABILITY.hit} מתוך ${RELIABILITY.tested}.` },
  { id: 'life', t: 'בחיים', q: 'איפה אני פוגשת את היסודות ביום־יום?', see: 'חפצים כקבוצות יסודות, ומדף דגימות בתלת־ממד.', read: 'שני חפצים עם יסודות משותפים קרובים זה לזה.', trust: 'נתונים מתועדים.' },
  { id: 'lab', t: 'מעבדת חומרים', q: 'איך מגיעים מחומר קיים לחומר חדש?', see: 'תרכובת, יסוד להחלפה, ורשימת מועמדים מדורגת.', read: 'פס עליון: היסטוריה. פס תחתון: תכונות. שני פסים ארוכים הם הצעה חזקה.', trust: `אחת משלוש ההצעות הראשונות נכונה ב-${pct(SCORE.lab.rate3)}%.` },
  { id: 'table', t: 'טבלת נתונים', q: 'מה בדיוק נמדד?', see: 'כל היסודות וכל הערכים בטבלה אחת.', read: 'תא ריק הוא "אין נתון". שום ערך לא הומצא.', trust: 'מקורות: Pauling, Cordero 2008, Goldschmidt.' },
]

const ROUTES: { want: string; to: string; params?: Record<string, string> }[] = [
  { want: 'להבין את רזי המקצוע מההתחלה', to: 'school' },
  { want: 'לתת למכונה למצוא כלל אצבע', to: 'rules' },
  { want: 'למצוא תחליף לחומר שאני מכירה', to: 'lab' },
  { want: 'לקבל רעיון לחומר חדש לפי צורך', to: 'insights' },
  { want: 'להבין למה שני יסודות דומים', to: 'network', params: { lens: 'compounds' } },
  { want: 'לנבא איזו נוסחה תצא', to: 'rings' },
  { want: 'לראות יסוד בעולם האמיתי', to: 'life' },
  { want: 'לבדוק מה נמדד ומה לא', to: 'table' },
]

const BUILT: { date: string; what: string }[] = [
  { date: '24.10', what: `**בנייה ראשונה.** מאגר של ${COMPOUNDS.length} תרכובות, ארבע עדשות של קרבה, ומעבדה ששומרת השערות.` },
  { date: '24.10', what: '**תנועה שמסבירה.** יסודות עפים מהטבלה לאשכולות ובחזרה, כדי לראות מאיפה כל קשר מגיע.' },
  { date: '24.10', what: '**העולם הפיזי.** לכל יסוד מראה אמיתי, מצב צבירה ושימושים, ודגימה בתלת־ממד.' },
  { date: '28.10', what: '**שפת העיצוב "סמטת הדמדומים"**, וסידור הטבעות עם ניבוי יחס ובדיקת אמינות.' },
  { date: '31.10', what: '**דף התובנות ודף המדריך.** כל כלל נבדק מול המאגר, וכל המצאה מגיעה עם דרך לבדוק אותה.' },
  { date: '31.10', what: '**מחולל הכללים ויסודות המקצוע.** המכונה מנסחת כללים בעצמה ומדווחת מה מצאה, ולצדה מסלול לימוד מסודר.' },
]

export function Guide() {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">מדריך</div>
          <h1>כימיה בלי לדעת כימיה</h1>
          <p><Rich text="==לא צריך לזכור כימיה. צריך לקרוא סידור.== כמו שאדריכלית קוראת עיר לפי שכבות, האפליקציה מסדרת את אותם 118 יסודות בכמה דרכים, וכל סידור עונה על שאלה אחרת." /></p>
        </div>
      </div>

      <section className="stack">
        <h2 className="home-h2">מה את רוצה לעשות</h2>
        <div className="routes">
          {ROUTES.map((r, i) => (
            <a key={r.want} className={`glass route${i === 0 ? ' anchor' : ''}`} href={href(r.to, r.params)}>
              <span className="eyebrow">{MAP.find((m) => m.id === r.to)?.t}</span>
              <b>{r.want}</b>
            </a>
          ))}
        </div>
      </section>

      <section className="stack">
        <h2 className="home-h2">מפת האפליקציה</h2>
        <p className="muted lead">לכל דף: השאלה שהוא עונה עליה, מה רואים, איך קוראים, וכמה אפשר לסמוך עליו.</p>
        <div className="glass map-table" role="table" aria-label="מפת הדפים">
          <div className="map-row head" role="row"><span role="columnheader">דף</span><span role="columnheader">השאלה</span><span role="columnheader">מה רואים</span><span role="columnheader">איך קוראים</span><span role="columnheader">אמינות</span></div>
          {MAP.map((m) => (
            <a key={m.id} className="map-row" role="row" href={href(m.id)}>
              <b role="cell">{m.t}</b>
              <span role="cell">{m.q}</span>
              <span role="cell" className="muted">{m.see}</span>
              <span role="cell" className="muted">{m.read}</span>
              <span role="cell" className="small"><Rich text={m.trust} /></span>
            </a>
          ))}
        </div>
      </section>

      <section className="stack">
        <h2 className="home-h2">המילון</h2>
        <p className="muted lead">עשר מילים מספיקות כדי לקרוא כל מסך באפליקציה. לחצו על מילה כדי לראות את המקבילה מהעיר.</p>
        <div className="words">
          {WORDS.map((w) => (
            <button key={w.term} className="glass word" aria-expanded={open === w.term} onClick={() => setOpen(open === w.term ? null : w.term)}>
              <b className="word-term">{w.term}</b>
              <span className="small">{w.plain}</span>
              {open === w.term && <span className="small word-city"><span className="eyebrow">בעיר</span> {w.city}</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="stack">
        <h2 className="home-h2">שלוש שכבות של ידע</h2>
        <div className="glass panel stack">
          <p className="small muted" style={{ margin: 0 }}>האפליקציה מפרידה תמיד בין מה שידוע, מה שחושב, ומה שמוצע. כל תוצאה מסומנת באחת מהשלוש.</p>
          <LayerLegend />
        </div>
      </section>

      <section className="stack">
        <h2 className="home-h2">מה נבנה עד עכשיו</h2>
        <ol className="timeline">
          {BUILT.map((b, i) => (
            <li key={i} style={{ animationDelay: `${i * 90}ms` }}>
              <span className="mono small faint">{b.date}</span>
              <span><Rich text={b.what} /></span>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
