// פרטי יסוד: עובדות, תצורת אלקטרונים, מספרים קוונטיים, מיקום בכל סידור, והערה אישית (במצב עריכה).
import { useEffect, useState } from "react";
import { byZ, blockOf, CATEGORIES, BLOCK_HE, PHASE_HE, isMadelungException, LINKS, type Element } from "../data/elements";
import { MODELS } from "../data/models";
import { Bohr, OrbitalBoxes } from "./Atom";
import { href } from "../lib/router";
import { useApp } from "../state";

const fmt = (v: number | null | undefined, unit = "", d = 2) => (v == null ? "אין נתון" : `${+v.toFixed(d)}${unit ? " " + unit : ""}`);
const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
export const pretty = (c: string) => c.replace(/([spdf])(\d+)/g, (_, l, n) => l + String(n).split("").map((x) => SUP[x]).join(""));

export default function ElementDetail({ e, onPick, full }: { e: Element; onPick?: (z: number) => void; full?: boolean }) {
  const { data, update, editing } = useApp();
  const starred = data.starred.includes(e.z);
  const exc = isMadelungException(e);
  const links = LINKS.filter((l) => l.a === e.z || l.b === e.z);
  const prev = e.z > 1 ? byZ(e.z - 1) : null, next = e.z < 118 ? byZ(e.z + 1) : null;
  const { n, l, ml, ms } = e.q;

  return (
    <article className="detail" aria-labelledby={`el-${e.z}`}>
      <header className="detail-head" style={{ ["--c" as string]: CATEGORIES[e.cat].color }}>
        <div className="big-tile" aria-hidden="true">
          <span className="bt-z">{e.z}</span><span className="bt-sym">{e.sym}</span><span className="bt-mass">{fmt(e.mass, "", 3)}</span>
        </div>
        <div className="detail-title">
          <h2 id={`el-${e.z}`}>{e.he}</h2>
          <div className="en">{e.en}</div>
          <div className="chips">
            <span className="chip" style={{ ["--c" as string]: CATEGORIES[e.cat].color }}>{CATEGORIES[e.cat].he}{e.pred ? " (משוער)" : ""}</span>
            <span className="chip">{BLOCK_HE[blockOf(e)]}</span>
          </div>
        </div>
        <button className={"btn star" + (starred ? " on" : "")} aria-pressed={starred}
          onClick={() => update((d) => ({ ...d, starred: starred ? d.starred.filter((z) => z !== e.z) : [...d.starred, e.z] }), starred ? "הסימון הוסר" : "סומן")}>
          {starred ? "מסומן" : "סימון"}
        </button>
      </header>

      <dl className="facts">
        <div><dt>מסה אטומית</dt><dd>{fmt(e.mass, "u", 3)}</dd></div>
        <div><dt>קבוצה · מחזור</dt><dd>{e.cat === "lanthanide" || e.cat === "actinide" ? "f" : e.group} · {e.period}</dd></div>
        <div><dt>אלקטרושליליות</dt><dd>{fmt(e.eneg)}</dd></div>
        <div><dt>יינון ראשון</dt><dd>{fmt(e.ie1, "kJ/mol", 1)}</dd></div>
        <div><dt>רדיוס</dt><dd>{fmt(e.radius, "pm", 0)}</dd></div>
        <div><dt>מצב צבירה</dt><dd>{PHASE_HE[e.phase] || "לא ידוע"}</dd></div>
        <div><dt>התכה · רתיחה</dt><dd>{fmt(e.melt, "", 0)} · {fmt(e.boil, "K", 0)}</dd></div>
        <div><dt>צפיפות</dt><dd>{fmt(e.density, "g/cm³")}</dd></div>
      </dl>

      <section className="detail-sec">
        <h3>תצורת אלקטרונים</h3>
        <p className="conf" dir="ltr">{pretty(e.confS)}</p>
        {exc && <p className="note-exc">חריגה מכלל מדלונג: התצורה בפועל שונה מסדר המילוי הצפוי, כי תת-קליפה מלאה או חצי מלאה יציבה יותר.</p>}
        <div className="atom-row">
          <Bohr e={e} size={full ? 220 : 160} />
          <OrbitalBoxes e={e} />
        </div>
      </section>

      <section className="detail-sec">
        <h3>האלקטרון המבדיל · ארבעה מספרים קוונטיים</h3>
        <div className="qn" dir="ltr">
          <span><b>n</b>{n}</span><span><b>l</b>{l} ({"spdf"[l]})</span><span><b>m</b>{ml}</span><span><b>s</b>{ms > 0 ? "+½" : "−½"}</span>
        </div>
        <p className="muted">מחושב לפי כלל מדלונג וכלל הונד. אלה הקואורדינטות שמציבות את היסוד במגדל של סטו ובפירמידת ADOMAH.</p>
      </section>

      {links.length > 0 && (
        <section className="detail-sec">
          <h3>קשרים משניים</h3>
          {links.map((k) => {
            const o = byZ(k.a === e.z ? k.b : k.a);
            return <button key={k.he} className="link-row" onClick={() => onPick?.(o.z)}>{k.he}<span className="mono">{o.sym}</span></button>;
          })}
        </section>
      )}

      <section className="detail-sec">
        <h3>היסוד בכל סידור</h3>
        <div className="model-links">
          {MODELS.map((m) => <a key={m.id} className="btn ghost" href={href(`lab/${m.id}`, { z: e.z })}>{m.he}</a>)}
        </div>
      </section>

      <Note z={e.z} text={data.notes[e.z] || ""} editing={editing} />

      <nav className="prevnext" aria-label="יסוד קודם והבא">
        {prev ? <button className="btn ghost" onClick={() => onPick?.(prev.z)}>{prev.z} {prev.he}</button> : <span />}
        {!full && <a className="btn" href={href(`element/${e.z}`)}>דף היסוד המלא</a>}
        {next ? <button className="btn ghost" onClick={() => onPick?.(next.z)}>{next.z} {next.he}</button> : <span />}
      </nav>
    </article>
  );
}

function Note({ z, text, editing }: { z: number; text: string; editing: boolean }) {
  const { update } = useApp();
  const [v, setV] = useState(text);
  useEffect(() => setV(text), [text, z]);
  if (!editing && !text) return null;
  const commit = () => {
    if (v === text) return;
    update((d) => {
      const notes = { ...d.notes };
      if (v.trim()) notes[z] = v; else delete notes[z];
      return { ...d, notes };
    }, "ההערה נשמרה");
  };
  return (
    <section className="detail-sec">
      <h3>הערה אישית</h3>
      {editing ? (
        <>
          <textarea className="field" value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} rows={4}
            placeholder="מה חשוב לזכור על היסוד הזה? נשמר כשיוצאים מהשדה." />
          <div className="row-end">
            <button className="btn" onClick={commit} disabled={v === text}>שמירה</button>
            {text && <button className="btn ghost" onClick={() => { setV(""); update((d) => { const notes = { ...d.notes }; delete notes[z]; return { ...d, notes }; }, "ההערה נמחקה"); }}>מחיקת ההערה</button>}
          </div>
        </>
      ) : <p className="note-text">{text}</p>}
    </section>
  );
}
