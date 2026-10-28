import { href } from '../lib/router'
import { COMPOUNDS } from '../data/compounds'
import { RELATIONS } from '../data/relations'
import { HeroNet } from '../components/HeroNet'

const VIEWS = [
  { id: 'matrix', t: 'מטריצה', d: 'הטבלה הקלאסית, צבועה לפי תכונה. בחירת יסוד מדליקה את השכנים שלו ברשת, גם אם הם רחוקים בטבלה.' },
  { id: 'network', t: 'רשת', d: 'אותם יסודות כצמתים, וקווים לפי דמיון. ארבע עדשות: היסטוריה כימית, התנהגות כימית, גודל ואנרגיה, גיאוכימיה.' },
  { id: 'secondary', t: 'מחזוריות משנית', d: 'קשרים אלכסוניים, מהלך פרש, n ו-n+10, וחריגות של השורה הרביעית. כל קשר עם הסבר כימי.' },
  { id: 'spiral', t: 'ספירלה', d: 'הטבלה כרצף אחד בלי שבירות: כל מחזור הוא סיבוב, והמשפחות יוצרות קרניים.' },
  { id: 'rings', t: 'מעגלים', d: 'כל מחזור הוא טבעת, והגזים האצילים על קו אחד. מספר הקפיצות עד הקו מנבא תגובתיות ויחס בתרכובת, כמו Al₂O₃.' },
  { id: 'lab', t: 'מעבדת חומרים', d: 'בוחרים תרכובת ידועה, והמערכת מציעה החלפות לפי הרשת. מה שלא נמצא במאגר הוא השערה לחומר חדש.' },
  { id: 'table', t: 'טבלת נתונים', d: 'כל היסודות והתכונות בטבלה אחת. ממיינים לפי כל עמודה, ומכל תא אפשר לעבור לתצוגה.' },
]

export function Home() {
  return (
    <>
      <section className="hero anchor">
        <div>
          <div className="eyebrow">מעבר לרשימה</div>
          <h1>הטבלה המחזורית<br />כרשת של קשרים</h1>
          <p>
            הטבלה הרגילה מסדרת את היסודות לפי מספר פרוטונים. כשמסדרים אותם לפי איך שהם <b>מתנהגים בפועל בתוך תרכובות</b>,
            נחשפים קשרים שלא רואים בשורות ובטורים: נתרן וכסף, רובידיום ותליום, גליום ולנתן.
          </p>
          <p>
            המטרה כאן היא לא רק ידע, אלא היגיון: להבין <b>למה</b> שני יסודות יכולים להחליף זה את זה. מתוך ההבנה הזו אפשר להציע חומרים שעוד לא נוצרו.
          </p>
          <div className="row" style={{ marginTop: 16 }}>
            <a className="btn primary" href={href('network')}>פתחו את הרשת</a>
            <a className="btn" href={href('lab')}>נסו להמציא חומר</a>
          </div>
        </div>
        <div className="hero-art" aria-hidden><HeroNet /></div>
      </section>

      <section className="stack">
        <h2 className="home-h2">שבעה סידורים לאותם 118 יסודות</h2>
        <div className="cards">
          {VIEWS.map((v, i) => (
            <a key={v.id} className="card glass" href={href(v.id)}>
              <span className="eyebrow">סידור {i + 1}</span>
              <h3>{v.t}</h3>
              <p>{v.d}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="stack">
        <h2 className="home-h2">איך נבנית הרשת</h2>
        <div className="steps">
          <div className="glass"><h3>אוספים היסטוריה כימית</h3><p className="muted small">{COMPOUNDS.length} תרכובות בינאריות מוכרות, כמו NaCl, GaAs ו-MoS₂.</p></div>
          <div className="glass"><h3>מחלצים תבניות</h3><p className="muted small">מכל תרכובת מוציאים יסוד אחד ומשאירים תבנית: NaCl נותן "□Cl". יסודות שממלאים אותן תבניות הם שכנים.</p></div>
          <div className="glass"><h3>מודדים דמיון</h3><p className="muted small">כמה תבניות משותפות יש לשני יסודות, מתוך כל התבניות שלהם. לצד זה מחשבים גם דמיון לפי תכונות פיזיקליות.</p></div>
          <div className="glass"><h3>מציעים חומר חדש</h3><p className="muted small">מחליפים יסוד בתרכובת ידועה בשכן קרוב שלו. אם התוצאה לא נמצאת במאגר, זו השערה שאפשר לבדוק.</p></div>
        </div>
      </section>

      <section className="glass panel">
        <h3>מקורות ומגבלות</h3>
        <p className="small muted" style={{ margin: 0 }}>
          השיטה נשענת על עבודתם של Leal, Restrepo, Stadler ו-Jost (מכון מקס פלאנק למתמטיקה במדעים, לייפציג, 2019–2020). הם בנו היפר־גרף של יסודות מתוך אלפי תרכובות בינאריות.
          כאן זהו מדגם של {COMPOUNDS.length} תרכובות שנבחרו ידנית, ולכן הרשת היא <b>הדגמה של השיטה ולא שחזור של התוצאות</b>.
          התכונות: אלקטרושליליות לפי פאולינג, רדיוס קוולנטי לפי Cordero ואחרים (2008), אנרגיית יינון ראשונה, וסיווג גיאוכימי לפי Goldschmidt.
          {` ${RELATIONS.length}`} הקשרים במחזוריות המשנית לקוחים מספרות הכימיה האי־אורגנית (Rayner-Canham, Laing).
          ההצעות במעבדה הן השערות בלבד: הן לא בודקות יציבות תרמודינמית, ויש לאמת כל אחת מהן בחישוב או בניסוי.
        </p>
      </section>
    </>
  )
}
