// טבלת סיכום: כל היסודות, כל עמודה ממוינת, מקובץ לפי משפחה עם כיווץ, וקישור מכל תא לתצוגה המתאימה.
import { useMemo, useState } from "react";
import { ELEMENTS, CATEGORIES, blockOf, PHASE_HE, type Element, type Category } from "../data/elements";
import { href } from "../lib/router";
import { useApp } from "../state";

type Col = { id: string; he: string; get: (e: Element) => number | string | null; link: (e: Element) => string; num?: boolean };
const COLS: Col[] = [
  { id: "z", he: "Z", get: (e) => e.z, link: (e) => href(`element/${e.z}`), num: true },
  { id: "sym", he: "סמל", get: (e) => e.sym, link: (e) => href(`element/${e.z}`) },
  { id: "he", he: "שם", get: (e) => e.he, link: (e) => href(`element/${e.z}`) },
  { id: "mass", he: "מסה", get: (e) => e.mass, link: (e) => href("lab/chancourtois", { z: e.z, c: "mass" }), num: true },
  { id: "period", he: "מחזור", get: (e) => e.period, link: (e) => href("lab/stedman", { z: e.z }), num: true },
  { id: "group", he: "קבוצה", get: (e) => (e.cat === "lanthanide" || e.cat === "actinide" ? null : e.group), link: (e) => href("lab/classic", { z: e.z }), num: true },
  { id: "block", he: "בלוק", get: (e) => blockOf(e), link: (e) => href("lab/adomah", { z: e.z, c: "block" }) },
  { id: "eneg", he: "אלקטרושליליות", get: (e) => e.eneg, link: (e) => href("lab/classic", { z: e.z, c: "eneg" }), num: true },
  { id: "ie1", he: "יינון ראשון", get: (e) => e.ie1, link: (e) => href("lab/benfey", { z: e.z, c: "ie1" }), num: true },
  { id: "radius", he: "רדיוס", get: (e) => e.radius, link: (e) => href("lab/classic", { z: e.z, c: "radius" }), num: true },
  { id: "phase", he: "מצב", get: (e) => PHASE_HE[e.phase] || "", link: (e) => href("lab/classic", { z: e.z, c: "phase" }) },
  { id: "conf", he: "תצורה", get: (e) => e.confS, link: (e) => href("lab/stowe", { z: e.z, c: "block" }) },
];

export default function TablePage() {
  const { data } = useApp();
  const [sort, setSort] = useState<{ id: string; dir: 1 | -1 }>({ id: "z", dir: 1 });
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [byGroup, setByGroup] = useState(true);

  const col = COLS.find((c) => c.id === sort.id)!;
  const sorted = useMemo(() => [...ELEMENTS].sort((a, b) => {
    const x = col.get(a), y = col.get(b);
    if (x == null) return 1;
    if (y == null) return -1;
    return (typeof x === "number" ? x - (y as number) : String(x).localeCompare(String(y), "he")) * sort.dir;
  }), [col, sort.dir]);

  const groups = byGroup
    ? (Object.keys(CATEGORIES) as Category[]).map((k) => ({ id: k, he: CATEGORIES[k].he, c: CATEGORIES[k].color, rows: sorted.filter((e) => e.cat === k) }))
    : [{ id: "all", he: "כל היסודות", c: "var(--accent)", rows: sorted }];

  const toggle = (id: string) => setClosed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="page">
      <header className="page-head">
        <span className="label">טבלת סיכום</span>
        <h1>כל 118 היסודות</h1>
        <p className="lead small">לחיצה על כותרת עמודה ממיינת (פעם שנייה הופכת כיוון). כל תא מקשר לתצוגה המתאימה: מסה לבורג הטלורי, בלוק לפירמידה, אלקטרושליליות לטבלה צבועה.</p>
        <div className="row">
          <button className={"btn" + (byGroup ? " on" : "")} aria-pressed={byGroup} onClick={() => setByGroup(!byGroup)}>קיבוץ לפי משפחה</button>
          {byGroup && <button className="btn ghost" onClick={() => setClosed(closed.size ? new Set() : new Set(Object.keys(CATEGORIES)))}>{closed.size ? "פתיחת כל הקבוצות" : "כיווץ כל הקבוצות"}</button>}
        </div>
      </header>
      <div className="table-wrap glass">
        <table className="data">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.id} aria-sort={sort.id === c.id ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button onClick={() => setSort({ id: c.id, dir: sort.id === c.id ? (-sort.dir as 1 | -1) : 1 })}>
                    {c.he}<span className="sort mono">{sort.id === c.id ? (sort.dir === 1 ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
              ))}
              <th>הערה</th>
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.id}>
              {byGroup && (
                <tr className="grp" style={{ ["--c" as string]: g.c }}>
                  <th colSpan={COLS.length + 1}>
                    <button onClick={() => toggle(g.id)} aria-expanded={!closed.has(g.id)}>
                      <i />{g.he} <span className="mono">{g.rows.length}</span><span className="muted">{closed.has(g.id) ? "הרחבה" : "כיווץ"}</span>
                    </button>
                    <a className="grp-link" href={href("lab/classic", { f: "cat:" + g.id })}>הצגה במעבדה</a>
                  </th>
                </tr>
              )}
              {!closed.has(g.id) && g.rows.map((e) => (
                <tr key={e.z}>
                  {COLS.map((c) => {
                    const v = c.get(e);
                    return <td key={c.id} className={c.num ? "num mono" : c.id === "conf" ? "mono ltr" : ""}><a href={c.link(e)}>{v == null || v === "" ? "–" : typeof v === "number" ? +v.toFixed(3) : v}</a></td>;
                  })}
                  <td className="note-cell">{data.notes[e.z] ? <a href={href(`element/${e.z}`)}>{data.notes[e.z].slice(0, 40)}</a> : ""}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
