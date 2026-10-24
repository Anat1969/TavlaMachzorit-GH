// מצב גלובלי: מידע המשתמש, שמירה עם חיווי, מצב עריכה וערכת צבע.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { load, save, type UserData } from "./data/store";

type Toast = { kind: "saving" | "saved" | "error" | "info"; text: string } | null;
type Ctx = {
  data: UserData; ready: boolean; editing: boolean; setEditing: (v: boolean) => void;
  update: (fn: (d: UserData) => UserData, label?: string) => Promise<void>;
  toast: Toast; notify: (t: Toast) => void;
  theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void;
};
const C = createContext<Ctx>(null!);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<UserData>({ notes: {}, starred: [], updatedAt: 0 });
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [theme, setThemeS] = useState<"dark" | "light">(() => (document.documentElement.dataset.theme as "dark" | "light") || "dark");
  const timer = useRef<number>(0);
  const ref = useRef(data);

  const notify = useCallback((t: Toast) => {
    setToast(t);
    clearTimeout(timer.current);
    if (t && t.kind !== "saving" && t.kind !== "error") timer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    load().then(({ data, error }) => {
      ref.current = data; setData(data); setReady(true);
      if (error) notify({ kind: "error", text: error });
    });
  }, [notify]);

  const update = useCallback(async (fn: (d: UserData) => UserData, label = "נשמר") => {
    const next = fn(ref.current);
    ref.current = next; setData(next);
    notify({ kind: "saving", text: "שומר" });
    try {
      const warn = await save(next);
      notify(warn ? { kind: "error", text: warn } : { kind: "saved", text: label });
    } catch (e) {
      notify({ kind: "error", text: (e as Error).message + ". נסו שוב, או ייצאו גיבוי מתפריט A&I." });
    }
  }, [notify]);

  const setTheme = (t: "dark" | "light") => {
    setThemeS(t); document.documentElement.dataset.theme = t;
    try { localStorage.setItem("tavla-theme", t); } catch { /* העדפה בלבד */ }
  };

  return <C.Provider value={{ data, ready, editing, setEditing, update, toast, notify, theme, setTheme }}>{children}</C.Provider>;
}
