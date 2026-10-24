// דף הבית: חזון, מטרה, כלים ותוצאות. ברקע הגוף התלת-ממדי עובר בין הסידורים בעצמו.
import { useEffect, useMemo, useState } from "react";
import LabCanvas, { reducedMotion } from "../components/LabCanvas";
import MiniModel from "../components/MiniModel";
import { ELEMENTS, colorOf } from "../data/elements";
import { MODELS } from "../data/models";
import { href } from "../lib/router";

const CYCLE = ["benfey", "chancourtois", "stedman", "adomah", "stowe", "tree", "janet", "classic"] as const;

export default function Home() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reducedMotion()) return;
    const t = setInterval(() => setI((x) => (x + 1) % CYCLE.length), 6000);
    return () => clearInterval(t);
  }, []);
  const colors = useMemo(() => ELEMENTS.map((e) => colorOf(e, "category")), []);
  const m = MODELS.find((x) => x.id === CYCLE[i])!;
  const layers = useMemo(() => ({ thread: true, families: false, links: false, guides: true }), []);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-canvas" aria-hidden="true">
          <LabCanvas model={m.id} colors={colors} dim={null} selected={null} layers={layers} autoRotate interactive={false} label={m.he} />
        </div>
        <div className="hero-text">
          <div className="label">118 יסודות · 8 סידורים · מרחב אחד</div>
          <h1>הטבלה המחזורית<br /><span className="grad">היא לא רק טבלה</span></h1>
          <p className="lead">
            הטבלה המוכרת קוטעת את רצף המספרים האטומיים ושולפת את הלנתנידים לתחתית הדף.
            כאן אותם 118 יסודות עוברים בין ספירלה, גליל, קונוס, פירמידה קוונטית ועץ, ומראים מה כל סידור חושף.
          </p>
          <div className="row">
            <a className="btn primary big" href={href("lab/" + m.id, { tour: 0 })}>סיור מודרך</a>
            <a className="btn big" href={href("lab/" + m.id)}>כניסה למעבדה</a>
          </div>
          <div className="now-showing" aria-live="polite">
            <span className="label">מוצג עכשיו</span> {m.he} · <span className="mono">{m.author}, {m.year}</span>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-head">
          <span className="label">חזון</span>
          <h2>מחזוריות היא צורה, לא רשימה</h2>
          <p>כל סידור הוא טענה על הטבע. הספירלה טוענת שהרצף רציף, הפירמידה טוענת שהקוונטים קובעים את המבנה, והעץ טוען שיש קשרים מעבר לשכנים. כשמשווים ביניהם רואים מה נשאר קבוע ומה הוא רק מוסכמה של דף מודפס.</p>
        </div>
        <div className="pillars">
          <div className="pillar glass"><b>רצף</b><p>חוט המספר האטומי עובר בין כל היסודות. בטבלה הוא נקטע, ובספירלה הוא רציף.</p></div>
          <div className="pillar glass"><b>קוונטים</b><p>ארבעת המספרים הקוונטיים של האלקטרון המבדיל מחושבים לכל יסוד, והם הצירים של המגדל והפירמידה.</p></div>
          <div className="pillar glass"><b>קשרים</b><p>משפחות, יחסים אלכסוניים ומהלך הפרש מוצגים כקווים בכל אחד מהסידורים.</p></div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-head">
          <span className="label">הכלים</span>
          <h2>שמונה סידורים, נתונים אחד</h2>
          <p>כל כרטיס הוא הטלה של אותם מיקומים שמוצגים במעבדה. לחיצה פותחת את הסידור בתלת-ממד.</p>
        </div>
        <div className="model-grid">
          {MODELS.map((mm) => (
            <a key={mm.id} className="model-tile glass" href={href("lab/" + mm.id)}>
              <MiniModel id={mm.id} />
              <div>
                <div className="label mono">{mm.year} · {mm.shape}</div>
                <h3>{mm.he}</h3>
                <p>{mm.summary}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="sec">
        <div className="sec-head">
          <span className="label">תוצאות</span>
          <h2>מה אפשר לעשות כאן</h2>
        </div>
        <div className="pillars four">
          <a className="pillar glass link" href={href("lab/classic", { c: "eneg" })}><b>לצבוע</b><p>לפי משפחה, בלוק, אלקטרושליליות, יינון, רדיוס, מסה, התכה ומצב צבירה.</p></a>
          <a className="pillar glass link" href={href("element/26")}><b>להעמיק</b><p>דף לכל יסוד: מודל בוהר, תיבות אורביטלים, מספרים קוונטיים וחריגות ממדלונג.</p></a>
          <a className="pillar glass link" href={href("research")}><b>להשוות</b><p>סקירת המחקר: מי, מתי ומה כל סידור פותר, לעומת הטבלה הדו-ממדית.</p></a>
          <a className="pillar glass link" href={href("table")}><b>לסכם</b><p>טבלת כל היסודות, ממוינת ומקובצת, עם קישור מכל תא לתצוגה.</p></a>
        </div>
      </section>
      <footer className="foot muted">
        נתוני היסודות: Periodic-Table-JSON (CC BY-SA 3.0). השחזורים מסומנים לפי רמת נאמנות למקור: מדויק, שחזור עקרוני או פרשנות.
      </footer>
    </div>
  );
}
