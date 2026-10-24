// שמירת מידע המשתמש: הערות אישיות ליסודות ויסודות מסומנים.
// אחסון כפול: IndexedDB ראשי, localStorage גיבוי. כל שמירה מחכה לשניהם ומדווחת מצב.
export type UserData = {
  notes: Record<number, string>;
  starred: number[];
  updatedAt: number;
};

const DB = "tavla-machzorit", STORE = "kv", KEY = "user", LS = "tavla-user";
const empty = (): UserData => ({ notes: {}, starred: [], updatedAt: 0 });

function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    if (!("indexedDB" in window)) return rej(new Error("הדפדפן לא תומך ב-IndexedDB"));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function idbGet(): Promise<UserData | null> {
  const db = await idb();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
    t.onsuccess = () => res((t.result as UserData) || null);
    t.onerror = () => rej(t.error);
  });
}

async function idbPut(d: UserData) {
  const db = await idb();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(d, KEY);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

function lsGet(): UserData | null {
  try { const s = localStorage.getItem(LS); return s ? JSON.parse(s) : null; } catch { return null; }
}

/** טעינה: לוקחים את העותק העדכני מבין שני המאגרים. */
export async function load(): Promise<{ data: UserData; error?: string }> {
  const ls = lsGet();
  try {
    const db = await idbGet();
    const best = [db, ls].filter(Boolean).sort((a, b) => b!.updatedAt - a!.updatedAt)[0];
    return { data: { ...empty(), ...(best || {}) } };
  } catch (e) {
    return { data: { ...empty(), ...(ls || {}) }, error: "המאגר הראשי לא זמין, נטען הגיבוי: " + (e as Error).message };
  }
}

/** שמירה לשני המאגרים. זורק שגיאה אם שניהם נכשלו, ומחזיר אזהרה אם רק אחד. */
export async function save(d: UserData): Promise<string | undefined> {
  const data = { ...d, updatedAt: Date.now() };
  let lsErr: string | undefined, dbErr: string | undefined;
  try { localStorage.setItem(LS, JSON.stringify(data)); } catch (e) { lsErr = (e as Error).message; }
  try { await idbPut(data); } catch (e) { dbErr = (e as Error).message; }
  if (lsErr && dbErr) throw new Error(`השמירה נכשלה: ${dbErr}`);
  if (dbErr) return "נשמר רק בגיבוי המקומי: " + dbErr;
  if (lsErr) return "נשמר רק במאגר הראשי: " + lsErr;
}

export function exportFile(d: UserData) {
  const blob = new Blob([JSON.stringify({ app: "tavla-machzorit", version: 1, ...d }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `tavla-machzorit-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function parseImport(text: string): UserData {
  const j = JSON.parse(text);
  if (j.app !== "tavla-machzorit") throw new Error("הקובץ אינו גיבוי של האפליקציה הזו");
  return { notes: j.notes || {}, starred: Array.isArray(j.starred) ? j.starred : [], updatedAt: Date.now() };
}

// העדפות תצוגה (לא מידע משתמש): נשמרות ב-localStorage בלבד.
export function pref<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem("tavla-pref-" + key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
export function setPref(key: string, v: unknown) {
  try { localStorage.setItem("tavla-pref-" + key, JSON.stringify(v)); } catch { /* העדפה בלבד */ }
}
