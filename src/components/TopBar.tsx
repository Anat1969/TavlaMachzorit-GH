// סרגל עליון קבוע: שם האפליקציה (לבית), ניווט תוכן, וכפתור הלוגו A&I בלבד.
import { useMemo, useRef } from "react";
import AIMenu, { type MenuItem } from "./AIMenu";
import { useApp } from "../state";
import { exportFile, parseImport } from "../data/store";
import { href } from "../lib/router";
import { useInstall } from "../lib/install";

const NAV = [
  { id: "", he: "בית" },
  { id: "lab", he: "מעבדה" },
  { id: "research", he: "מחקר" },
  { id: "table", he: "טבלת יסודות" },
];

export default function TopBar({ current }: { current: string }) {
  const { editing, setEditing, data, update, notify, theme, setTheme, toast } = useApp();
  const file = useRef<HTMLInputElement>(null);
  const install = useInstall();

  const items: MenuItem[] = useMemo(() => [
    { label: editing ? "יציאה ממצב עריכה" : "מצב עריכה", hint: "הערות אישיות ליסודות", pressed: editing, onSelect: () => setEditing(!editing) },
    { label: theme === "dark" ? "מצב בהיר" : "מצב כהה", hint: "ערכת צבעים", onSelect: () => setTheme(theme === "dark" ? "light" : "dark") },
    { label: "ייצוא גיבוי", hint: `${Object.keys(data.notes).length} הערות · ${data.starred.length} מסומנים`, onSelect: () => exportFile(data) },
    { label: "שחזור מגיבוי", hint: "קובץ JSON", onSelect: () => file.current?.click() },
    ...(install.can ? [{ label: "התקנת האפליקציה", hint: "מסך הבית", onSelect: install.prompt }] : []),
  ], [editing, setEditing, theme, setTheme, data, install]);

  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      const d = parseImport(await f.text());
      await update(() => d, "הגיבוי שוחזר");
    } catch (e) {
      notify({ kind: "error", text: "השחזור נכשל: " + (e as Error).message });
    }
    if (file.current) file.current.value = "";
  };

  const status = toast?.kind === "saving" ? "שומר" : editing ? "מצב עריכה פעיל" : "";

  return (
    <header className="topbar">
      <a className="brand" href={href("")} aria-label="טבלה מחזורית, לדף הבית">
        <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={30} height={30} />
        <span className="brand-name">טבלה מחזורית<small>מעבדת הצורות</small></span>
      </a>
      <nav className="nav" aria-label="ניווט ראשי">
        {NAV.map((n) => (
          <a key={n.id} href={href(n.id)} className={current === n.id ? "on" : ""} aria-current={current === n.id ? "page" : undefined}>{n.he}</a>
        ))}
      </nav>
      <AIMenu items={items} status={status} />
      <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </header>
  );
}
