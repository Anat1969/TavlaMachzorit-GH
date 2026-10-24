// מקור נתונים יחיד: כל תצוגה (טבלה, תלת-ממד, דף יסוד, טבלת סיכום) נגזרת מכאן.
import raw from "./elements.json";

export type Quantum = { n: number; l: number; ml: number; ms: number; k: number };
export type Category =
  | "alkali" | "alkaline" | "transition" | "post" | "metalloid" | "nonmetal"
  | "halogen" | "noble" | "lanthanide" | "actinide";

export type Element = {
  z: number; sym: string; he: string; en: string; mass: number;
  cat: Category; pred: boolean; group: number; period: number; x: number; y: number;
  shells: number[]; conf: string; confS: string;
  eneg: number | null; melt: number | null; boil: number | null; density: number | null;
  phase: string; ie1: number | null; ea: number | null; radius: number | null;
  cpk: string | null; disc: string | null; q: Quantum;
};

export const ELEMENTS = raw as Element[];
export const byZ = (z: number) => ELEMENTS[z - 1];

export const BLOCK = ["s", "p", "d", "f"] as const;
/** הבלוק לפי האלקטרון המבדיל בכלל מדלונג (כמו בטבלת ג'אנה ו-ADOMAH). */
export const blockOf = (e: Element) => BLOCK[e.q.l];

export const CATEGORIES: Record<Category, { he: string; color: string }> = {
  alkali: { he: "מתכות אלקליות", color: "#ff6b6b" },
  alkaline: { he: "מתכות אלקליות עפרוריות", color: "#ffa94d" },
  transition: { he: "מתכות מעבר", color: "#ffd43b" },
  post: { he: "מתכות בתר-מעבריות", color: "#8ce99a" },
  metalloid: { he: "מטלואידים", color: "#38d9a9" },
  nonmetal: { he: "אל-מתכות", color: "#4dabf7" },
  halogen: { he: "הלוגנים", color: "#74c0fc" },
  noble: { he: "גזים אצילים", color: "#b197fc" },
  lanthanide: { he: "לנתנידים", color: "#f783ac" },
  actinide: { he: "אקטינידים", color: "#e599f7" },
};

export const BLOCK_COLORS: Record<string, string> = { s: "#ff6b6b", p: "#4dabf7", d: "#ffd43b", f: "#e599f7" };
export const BLOCK_HE: Record<string, string> = {
  s: "בלוק s · אורביטל כדורי",
  p: "בלוק p · שלוש אונות",
  d: "בלוק d · מתכות מעבר",
  f: "בלוק f · לנתנידים ואקטינידים",
};
export const PHASE_HE: Record<string, string> = { solid: "מוצק", liquid: "נוזל", gas: "גז" };
export const PHASE_COLORS: Record<string, string> = { solid: "#adb5bd", liquid: "#4dabf7", gas: "#ffd43b" };

/** מצבי צביעה: אותו מקור צבע משמש את התלת-ממד, הטבלה והמקרא. */
export type ColorMode = "category" | "block" | "eneg" | "mass" | "radius" | "ie1" | "phase" | "melt";
export const COLOR_MODES: { id: ColorMode; he: string; unit?: string }[] = [
  { id: "category", he: "משפחה כימית" },
  { id: "block", he: "בלוק אורביטלי" },
  { id: "eneg", he: "אלקטרושליליות", unit: "פאולינג" },
  { id: "ie1", he: "אנרגיית יינון ראשונה", unit: "kJ/mol" },
  { id: "radius", he: "רדיוס אטומי", unit: "pm" },
  { id: "mass", he: "מסה אטומית", unit: "u" },
  { id: "melt", he: "נקודת התכה", unit: "K" },
  { id: "phase", he: "מצב צבירה ב-0°C" },
];

const NUMERIC: Partial<Record<ColorMode, (e: Element) => number | null>> = {
  eneg: (e) => e.eneg, mass: (e) => e.mass, radius: (e) => e.radius, ie1: (e) => e.ie1, melt: (e) => e.melt,
};

export function range(mode: ColorMode): [number, number] | null {
  const f = NUMERIC[mode];
  if (!f) return null;
  const v = ELEMENTS.map(f).filter((x): x is number => x != null);
  return [Math.min(...v), Math.max(...v)];
}

// סולם רציף אחיד (כחול עמוק -> טורקיז -> צהוב -> אדום), עוצמה מדודה ולא צבעים אקראיים.
const RAMP = ["#1c3d8f", "#2f7fd8", "#22b8cf", "#94d82d", "#fcc419", "#ff6b3d", "#e03131"];
function ramp(t: number) {
  const x = Math.max(0, Math.min(1, t)) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  return mix(RAMP[i], RAMP[i + 1], x - i);
}
export const RAMP_CSS = `linear-gradient(90deg, ${RAMP.join(",")})`;
function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

export const NO_DATA = "#3b4253";
const ranges = new Map<ColorMode, [number, number] | null>();
export function colorOf(e: Element, mode: ColorMode): string {
  if (mode === "category") return CATEGORIES[e.cat].color;
  if (mode === "block") return BLOCK_COLORS[blockOf(e)];
  if (mode === "phase") return PHASE_COLORS[e.phase] || NO_DATA;
  const f = NUMERIC[mode]!;
  const v = f(e);
  if (v == null) return NO_DATA;
  if (!ranges.has(mode)) ranges.set(mode, range(mode));
  const [lo, hi] = ranges.get(mode)!;
  const t = mode === "mass" || mode === "melt" ? (v - lo) / (hi - lo) : Math.sqrt((v - lo) / (hi - lo));
  return ramp(t);
}

/** ערך תצוגה לשדה במצב צביעה, לטבלה ולתוויות. */
export function valueOf(e: Element, mode: ColorMode): string {
  switch (mode) {
    case "category": return CATEGORIES[e.cat].he;
    case "block": return blockOf(e);
    case "phase": return PHASE_HE[e.phase] || "לא ידוע";
    default: {
      const v = NUMERIC[mode]!(e);
      return v == null ? "אין נתון" : String(+v.toFixed(2));
    }
  }
}

/** תצורת אלקטרונים מלאה כרשימת תת-קליפות, לתרשים התיבות. */
export function subshells(e: Element) {
  return e.conf.split(" ").map((s) => {
    const m = s.match(/^(\d)([spdf])(\d+)$/);
    if (!m) return null;
    return { n: +m[1], l: "spdf".indexOf(m[2]), label: m[1] + m[2], count: +m[3] };
  }).filter((x): x is { n: number; l: number; label: string; count: number } => !!x);
}

/** האם התצורה בפועל חורגת מכלל מדלונג (למשל כרום ונחושת). */
const idealConf = (() => {
  const order: [number, number][] = [];
  for (let s = 1; s <= 8; s++) for (let n = s; n >= 1; n--) { const l = s - n; if (l < n && l <= 3) order.push([n, l]); }
  return (z: number) => {
    const out: string[] = []; let left = z;
    for (const [n, l] of order) { if (!left) break; const c = Math.min(left, 2 * (2 * l + 1)); out.push(`${n}${"spdf"[l]}${c}`); left -= c; }
    return out;
  };
})();
export function isMadelungException(e: Element) {
  const a = new Set(e.conf.split(" "));
  const b = idealConf(e.z);
  return b.length !== a.size || b.some((s) => !a.has(s));
}

/** קשרים משניים: דוגמאות מוכרות בספרות, לא רשימה ממצה. */
export const LINKS: { a: number; b: number; kind: "diagonal" | "knight"; he: string }[] = [
  { a: 3, b: 12, kind: "diagonal", he: "יחס אלכסוני: ליתיום ומגנזיום, ניטרידים ופחמות דומים" },
  { a: 4, b: 13, kind: "diagonal", he: "יחס אלכסוני: בריליום ואלומיניום, תחמוצות אמפוטריות" },
  { a: 5, b: 14, kind: "diagonal", he: "יחס אלכסוני: בור וצורן, תחמוצות זכוכיתיות וחומצות חלשות" },
  { a: 30, b: 50, kind: "knight", he: "מהלך הפרש: אבץ ובדיל(II)" },
  { a: 48, b: 82, kind: "knight", he: "מהלך הפרש: קדמיום ועופרת(II)" },
  { a: 47, b: 81, kind: "knight", he: "מהלך הפרש: כסף ותליום(I)" },
];
