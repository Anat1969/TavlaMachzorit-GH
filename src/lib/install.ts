// כפתור התקנה: מופיע רק כש-Chrome מציע התקנה (beforeinstallprompt).
import { useEffect, useState } from "react";

type BIP = Event & { prompt: () => Promise<void> };
let deferred: BIP | null = null;
const subs = new Set<() => void>();
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as BIP; subs.forEach((f) => f()); });
window.addEventListener("appinstalled", () => { deferred = null; subs.forEach((f) => f()); });

export function useInstall() {
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick((x) => x + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  return { can: !!deferred, prompt: async () => { await deferred?.prompt(); deferred = null; tick((x) => x + 1); } };
}
