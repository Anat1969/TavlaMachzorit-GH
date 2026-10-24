// ניתוב בכתובת: #/lab/benfey?z=26&c=block. כל מצב חשוב נשמר בכתובת, כך ש"העתקת קישור" משחזרת אותו.
import { useEffect, useState } from "react";

export type Route = { path: string[]; query: URLSearchParams };

export function parse(hash = location.hash): Route {
  const h = hash.replace(/^#\/?/, "");
  const [p, q = ""] = h.split("?");
  return { path: p.split("/").filter(Boolean), query: new URLSearchParams(q) };
}

export function href(path: string, query?: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) if (v != null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return "#/" + path.replace(/^\//, "") + (s ? "?" + s : "");
}

export function go(path: string, query?: Record<string, string | number | undefined | null>, replace = false) {
  const h = href(path, query);
  if (replace) history.replaceState(null, "", h);
  else location.hash = h;
  if (replace) window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function useRoute() {
  const [r, setR] = useState(parse);
  useEffect(() => {
    const f = () => setR(parse());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return r;
}
