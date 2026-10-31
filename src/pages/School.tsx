import { useState } from 'react'
import { href } from '../lib/router'
import { Rich, LayerTag } from '../components/Rich'

// What chemistry gave the world: one change per line, each with a date and a name that can be checked.
const GIFTS: { field: string; what: string; who: string; city: string }[] = [
  { field: 'מזון', what: 'אמוניה מחנקן שבאוויר, ומכאן דשן זול בכמויות תעשייתיות. לפי הערכה מקובלת, כמחצית מאוכלוסיית העולם ניזונה ממזון שגדל בזכותו.', who: 'תהליך Haber–Bosch, 1909–1913. ההערכה: Erisman ואחרים, Nature Geoscience, 2008', city: 'העיר הצפופה אפשרית כי השדה שמסביבה מניב יותר.' },
  { field: 'מים', what: 'הכלרה רציפה של מי שתייה הורידה בחדות את התמותה ממחלות שמועברות במים.', who: 'Jersey City, ארצות הברית, 1908', city: 'רשת המים העירונית היא מוצר כימי לא פחות מהנדסי.' },
  { field: 'בנייה', what: 'צמנט פורטלנד: אבן גיר וחרסית שנשרפות יחד והופכות לדבק שמתקשה במים. הבסיס לבטון המודרני.', who: 'Joseph Aspdin, פטנט באנגליה, 1824', city: 'קו הרקיע של כל עיר מודרנית יצוק מתגובה כימית.' },
  { field: 'רפואה', what: 'תרופות מסונתזות ואנטיביוטיקה הפכו מחלות קטלניות למחלות שמטפלים בהן.', who: 'אספירין: Felix Hoffmann, Bayer, 1897. פניצילין: Alexander Fleming, 1928', city: 'בית החולים הוא מעבדה כימית שבה גרים.' },
  { field: 'חומרים', what: 'הפלסטיק הסינתטי הראשון פתח את עידן החומרים שמתכננים במקום לחצוב.', who: 'בקליט: Leo Baekeland, 1907', city: 'מתכנון מבנה לתכנון החומר שממנו הוא בנוי.' },
  { field: 'אנרגיה', what: 'סוללת ליתיום־יון: אחסון חשמל קל ונטען, בטלפון, ברכב ובבית.', who: 'פרס נובל לכימיה 2019: Goodenough, Whittingham, Yoshino', city: 'העיר החשמלית תלויה ביכולת לאגור את השמש לשעות הלילה.' },
]

// The trade secrets: the ideas a materials inventor uses every day, each tied to a screen in the app.
const SECRETS: { idea: string; plain: string; example: string; page: string; params?: Record<string, string>; pageLabel: string }[] = [
  { idea: 'המבנה קובע את התכונה', plain: 'אותם אטומים בסידור אחר נותנים חומר אחר לגמרי.', example: 'יהלום וגרפיט הם שניהם פחמן טהור. אחד הקשה בחומרים, השני רך מספיק כדי לכתוב בו.', page: 'life', pageLabel: 'בחיים' },
  { idea: 'שלושה סוגי קשר', plain: 'כשיסוד אחד מושך אלקטרונים הרבה יותר מהשני, הקשר יוני (מלח). כשהמשיכה דומה, הקשר משותף (מולקולה, גביש קשה). מתכות חולקות ענן אלקטרונים משותף.', example: 'NaCl יוני ונמס ב-801°C. מים קוולנטיים. נחושת מתכתית ומוליכה.', page: 'matrix', params: { color: 'en' }, pageLabel: 'מטריצה לפי משיכה' },
  { idea: 'איזון מטענים קובע את הנוסחה', plain: 'מה שיסוד אחד נותן, השני לוקח. היחס בנוסחה הוא היחס שמאזן ביניהם.', example: 'אלומיניום נותן 3 וחמצן לוקח 2, ולכן Al₂O₃.', page: 'rings', pageLabel: 'מעגלים' },
  { idea: 'התאמת גודל ותפקיד', plain: 'יסוד יכול להחליף יסוד אחר בגביש אם הוא בגודל דומה וממלא אותו תפקיד. זה הבסיס של כל החלפה.', example: 'גליום מחליף אלומיניום במינרלים, כי שניהם נותנים 3 ובגודל דומה.', page: 'rules', params: { r: 'r15+val' }, pageLabel: 'מחולל כללים' },
  { idea: 'יציבות: האם החומר ירצה להתקיים', plain: 'חומר נשאר רק אם אין צירוף אחר של אותם אטומים עם אנרגיה נמוכה יותר. זה מה ש-Materials Project מחשב.', example: 'נוסחה יכולה להיות "נכונה" במטענים, ועדיין להתפרק מעצמה לשני חומרים אחרים.', page: 'insights', pageLabel: 'המצאות' },
  { idea: 'הדרך חשובה כמו היעד', plain: 'גם חומר יציב צריך מסלול ייצור: טמפרטורה, לחץ, ממס, זמן. וחומר לא יציב יכול להחזיק מעמד אם הוא נלכד.', example: 'יהלום פחות יציב מגרפיט בתנאי החדר, ובכל זאת לא הופך לגרפיט, כי המעבר איטי מאוד.', page: 'lab', pageLabel: 'מעבדה' },
  { idea: 'מעט משנה הרבה', plain: 'כמות זעירה של יסוד זר בגביש (סימום) משנה את התכונות שלו מן היסוד.', example: 'קורטוב זרחן או בור בצורן הוא מה שהופך אותו לשבב.', page: 'network', params: { lens: 'physical' }, pageLabel: 'רשת לפי גודל' },
  { idea: 'טיפולוגיה של גבישים', plain: 'יש מספר קטן של "תבניות בניין" לגבישים, וכל אחת מתמלאת ביסודות רבים.', example: 'מבנה המלח (NaCl) חוזר ב-MgO, ב-PbS ובעשרות חומרים אחרים.', page: 'network', params: { lens: 'compounds' }, pageLabel: 'רשת לפי היסטוריה' },
]

// A study path from words to inventions. Each stage: what to learn, where in the app, and one open source.
const PATH: { stage: string; learn: string; app: string; appLabel: string; source: string; url: string; check: string; answer: string }[] = [
  { stage: 'השפה', learn: 'יסוד, תרכובת, נוסחה, מספר חמצון.', app: 'guide', appLabel: 'מדריך', source: 'LibreTexts Chemistry, פרקי מבוא', url: 'https://chem.libretexts.org', check: 'למה המים הם H₂O ולא HO?', answer: 'חמצן לוקח שני אלקטרונים, וכל מימן נותן אחד. צריך שניים כדי לאזן.' },
  { stage: 'הקשר', learn: 'אלקטרושליליות, שלושת סוגי הקשר, למה מלח נמס בחום גבוה.', app: 'matrix', appLabel: 'מטריצה', source: 'Khan Academy, Chemistry', url: 'https://www.khanacademy.org/science/chemistry', check: 'למה NaCl מוצק ו-HCl גז?', answer: 'NaCl יוני ובונה גביש ענק. HCl קוולנטי ובונה מולקולות קטנות שכמעט לא נמשכות זו לזו.' },
  { stage: 'המחזוריות', learn: 'מגמות בטבלה, וחריגות כמו הזוג האדיש וקשרים אלכסוניים.', app: 'secondary', appLabel: 'מחזוריות משנית', source: 'Rayner-Canham, Descriptive Inorganic Chemistry', url: 'https://scholar.google.com/scholar?q=Rayner-Canham+Descriptive+Inorganic+Chemistry', check: 'למה עופרת מעדיפה מטען 2 ולא 4?', answer: 'שני אלקטרוני ה-s שלה מוחזקים חזק מדי ולא משתתפים בקשר (אפקט הזוג האדיש).' },
  { stage: 'חומר מוצק', learn: 'גבישים, פגמים, סימום, ואיך מבנה הופך לתכונה.', app: 'life', appLabel: 'בחיים', source: 'MIT OpenCourseWare 3.091, Introduction to Solid-State Chemistry', url: 'https://ocw.mit.edu/courses/3-091-introduction-to-solid-state-chemistry-fall-2018/', check: 'למה צורן טהור כמעט לא מוליך, וצורן עם זרחן כן?', answer: 'לזרחן יש אלקטרון אחד יותר. בתוך גביש הצורן הוא נשאר חופשי ונושא זרם.' },
  { stage: 'יציבות', learn: 'אנרגיית היווצרות, ו"קמור היציבות" (convex hull).', app: 'insights', appLabel: 'תובנות', source: 'Materials Project, מדריכים', url: 'https://docs.materialsproject.org', check: 'נוסחה מאוזנת במטענים. האם היא בהכרח חומר שקיים?', answer: 'לא. ייתכן שצירוף אחר של אותם אטומים יציב יותר, והחומר יתפרק אליו.' },
  { stage: 'המצאה', learn: 'כלל החלפה, השערה, בדיקה במאגר חישובי, ושיחה עם מעבדה.', app: 'rules', appLabel: 'מחולל כללים', source: 'Materials Project, חיפוש לפי נוסחה', url: 'https://next-gen.materialsproject.org', check: 'מה הצעד הראשון אחרי שהמחולל הציע נוסחה?', answer: 'לבדוק אם היא כבר מוכרת, ואם יש לה חישוב יציבות. רק אחר כך פונים למעבדה.' },
]

export function School() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">יסודות המקצוע</div>
          <h1>מה הכימיה נתנה לעולם, ואיך לומדים אותה</h1>
          <p><Rich text="==כימיה היא אדריכלות בקנה מידה של אטומים.== היא עוסקת במה שקורה כשחומרים נפגשים, ובאיך לתכנן את המפגש מראש." /></p>
        </div>
      </div>

      <section className="stack">
        <h2 className="home-h2">שש מתנות</h2>
        <div className="gifts">
          {GIFTS.map((g, i) => (
            <article key={g.field} className="glass gift" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="eyebrow">{g.field}</span><LayerTag id="fact" /></div>
              <p>{g.what}</p>
              <p className="small faint">{g.who}</p>
              <p className="small gift-city"><span className="eyebrow">בעיר</span> {g.city}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="stack">
        <h2 className="home-h2">רזי המקצוע</h2>
        <p className="muted lead">שמונה רעיונות שכל ממציא חומרים משתמש בהם. לכל רעיון יש מסך באפליקציה שבו רואים אותו פועל.</p>
        <ol className="secrets">
          {SECRETS.map((s, i) => (
            <li key={s.idea} className="glass secret">
              <span className="secret-n mono">{String(i + 1).padStart(2, '0')}</span>
              <div className="stack" style={{ gap: 6 }}>
                <h3><mark className="hl">{s.idea}</mark></h3>
                <p className="small">{s.plain}</p>
                <p className="small muted">{s.example}</p>
              </div>
              <a className="btn" href={href(s.page, s.params)}>{s.pageLabel}</a>
            </li>
          ))}
        </ol>
      </section>

      <section className="stack">
        <h2 className="home-h2">מסלול לימוד בשישה שלבים</h2>
        <p className="muted lead">
          כל שלב: מה ללמוד, איפה לראות את זה באפליקציה, מקור פתוח אחד, ושאלה אחת לבדיקה עצמית.
          <br />את השאלה פותרים לפני שמסתכלים בתשובה.
        </p>
        <ol className="path">
          {PATH.map((p, i) => (
            <li key={p.stage} className="glass step">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="eyebrow">שלב {i + 1}</span>
                <a className="chip" href={href(p.app)}>{p.appLabel}</a>
              </div>
              <h3>{p.stage}</h3>
              <p className="small">{p.learn}</p>
              <a className="small src-link" href={p.url} target="_blank" rel="noreferrer">{p.source}</a>
              <button className="check" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span className="small"><b>בדיקה:</b> {p.check}</span>
                {open === i ? <span className="small sig-good">{p.answer}</span> : <span className="small faint">לחצו לתשובה</span>}
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="glass panel haiku-card">
        <div className="eyebrow">הייקו</div>
        <p className="haiku">אוויר נעשה לחם<br />חול נעשה חלון<br />אותם אטומים</p>
      </section>
    </>
  )
}
