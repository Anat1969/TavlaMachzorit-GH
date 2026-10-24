// סקירת המחקר: הגישות, ציר זמן, והשוואה בין הטבלה הדו-ממדית לתלת-ממדית. כל מודל מקושר למעבדה.
import MiniModel from "../components/MiniModel";
import { MODELS, modelById, type ModelId } from "../data/models";
import { href } from "../lib/router";
import { ELEMENTS, isMadelungException } from "../data/elements";

const EXCEPTIONS = ELEMENTS.filter(isMadelungException);

const GROUPS: { title: string; lead: string; ids: ModelId[] }[] = [
  { title: "מודלים מבוססי מכניקת הקוונטים", lead: "סידור לפי האורביטלים ותצורת האלקטרונים של האטום, ולא רק לפי תכונות כימיות מאקרוסקופיות.", ids: ["adomah", "stowe", "janet"] },
  { title: "מודלים ספירליים וגליליים", lead: "שומרים על רצף מלא של המספר האטומי, בלי קפיצה משורה לשורה.", ids: ["chancourtois", "benfey"] },
  { title: "מודלים גיאומטריים וחינוכיים", lead: "מקלים על תפיסה חזותית ומוחשית של הקשרים בין המשפחות הכימיות.", ids: ["stedman", "tree"] },
];

const COMPARE = [
  ["רצף המספר האטומי", "קטוע: נשבר בכל סוף שורה", "רציף: ספירלה או מגדל", "benfey"],
  ["מיקום הלנתנידים והאקטינידים", "מופרדים לתחתית הדף מטעמי מקום", "משולבים ברצף המבני", "stedman"],
  ["ייצוג מכניקת הקוונטים", "חלקי: דורש הבנה מוקדמת של הבלוקים", "מובנה בגיאומטריה: אורך, רוחב וגובה", "stowe"],
  ["קשרים משניים", "נראים רק לשכנים צמודים", "נחשפים בין שכבות", "tree"],
  ["שימושיות מעשית", "קלה להדפסה ולספרי לימוד", "דורשת דגם פיזי או תוכנה, כמו זו", "classic"],
] as const;

const TIMELINE = [...MODELS].filter((m) => /^\d{4}/.test(m.year)).sort((a, b) => parseInt(a.year) - parseInt(b.year));

export default function Research() {
  return (
    <div className="page research">
      <header className="page-head">
        <span className="label">סקירת מחקר</span>
        <h1>הטבלה המחזורית בתלת-ממד</h1>
        <p className="lead">המחקר על סידורים תלת-ממדיים נועד לפתור את המגבלות של הטבלה הדו-ממדית: רצף שנקטע במעברי שורות, וגושי לנתנידים ואקטינידים שנשלפים לתחתית הדף. מודלים תלת-ממדיים מציגים רצף רציף, מבטאים את חוקי הקוונטים ומבליטים קשרים מחזוריים משניים.</p>
      </header>

      <section className="timeline" aria-label="ציר זמן">
        {TIMELINE.map((m) => (
          <a key={m.id} className="tl-item" href={href("lab/" + m.id)}>
            <span className="tl-year mono">{m.year}</span>
            <span className="tl-dot" />
            <span className="tl-name">{m.he}</span>
            <small>{m.author}</small>
          </a>
        ))}
      </section>

      {GROUPS.map((g, gi) => (
        <section className="sec" key={g.title}>
          <div className="sec-head"><span className="label mono">{gi + 1}</span><h2>{g.title}</h2><p>{g.lead}</p></div>
          <div className="research-cards">
            {g.ids.map((id) => {
              const m = modelById(id);
              return (
                <article key={id} className="rcard glass">
                  <MiniModel id={id} size={130} />
                  <div>
                    <div className="label">{m.author} <span dir="ltr">({m.authorEn})</span> · <span className="mono">{m.year}</span></div>
                    <h3>{m.he} <small>{m.en}</small></h3>
                    <p>{m.summary}</p>
                    <p className="muted">{m.insight}</p>
                    <div className="row">
                      <a className="btn" href={href("lab/" + id)}>פתיחה במעבדה</a>
                      <span className="badge">{m.fidelity}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <section className="sec">
        <div className="sec-head"><span className="label">השוואה</span><h2>דו-ממד מול תלת-ממד</h2></div>
        <div className="table-wrap glass">
          <table className="cmp">
            <thead><tr><th>מאפיין</th><th>טבלה דו-ממדית</th><th>טבלה תלת-ממדית</th><th>לראות</th></tr></thead>
            <tbody>
              {COMPARE.map(([a, b, c, id]) => (
                <tr key={a}><th scope="row">{a}</th><td>{b}</td><td>{c}</td><td><a className="btn ghost" href={href("lab/" + id, { tour: undefined })}>{modelById(id).he}</a></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead small">לסיכום: הטבלה הדו-ממדית נשארת הכלי המעשי ביותר לעבודה יומיומית, והסידורים התלת-ממדיים הם כלי מפתח בחינוך כימי מתקדם ובהבנת הסימטריה המתמטית והקוונטית של חוקי הטבע.</p>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="label">שקיפות</span><h2>מה מחושב ומה מפורש</h2></div>
        <ul className="plain">
          <li><b>מדויק:</b> הטבלה המוכרת, הבורג הטלורי (16 יחידות מסה לסיבוב) וטבלת ג'אנה (שורה לפי n+l) מחושבים ישירות מהגדרתם.</li>
          <li><b>שחזור עקרוני:</b> הקונוס, המגדל הקוונטי ופירמידת ADOMAH בנויים לפי העיקרון שפורסם, אבל המרווחים והפרופורציות נקבעו כאן.</li>
          <li><b>פרשנות:</b> הספירלה של בנפיי מורמת לתלת-ממד, ועץ היסודות הוא פרשנות חזותית לרעיון של דופור ולא שחזור של הדגם הפיזי.</li>
          <li>המספרים הקוונטיים מחושבים לפי כלל מדלונג. ל-{EXCEPTIONS.length} יסודות התצורה בפועל שונה ({EXCEPTIONS.slice(0, 8).map((e) => e.sym).join(", ")} ועוד), וזה מסומן בדף היסוד.</li>
        </ul>
      </section>
    </div>
  );
}
