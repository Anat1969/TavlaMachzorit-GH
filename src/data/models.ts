// שמונת הסידורים: מטא-נתונים (מי, מתי, מה רואים) ופונקציית מיקום תלת-ממדית לכל יסוד.
// כל מיקום מחושב מהנתונים (מסה, קבוצה, מחזור, מספרים קוונטיים) ולא מוקלד ידנית.
import { ELEMENTS, type Element } from "./elements";

export type Vec = [number, number, number];
export type ModelId = "classic" | "chancourtois" | "stedman" | "benfey" | "janet" | "stowe" | "adomah" | "tree";

export type Model = {
  id: ModelId; he: string; en: string; author: string; authorEn: string; year: string;
  shape: string; summary: string; insight: string; method: string;
  fidelity: "מדויק" | "שחזור עקרוני" | "פרשנות";
  view: Vec; // כיוון מבט ברירת מחדל
};

export const MODELS: Model[] = [
  {
    id: "classic", he: "הטבלה המוכרת", en: "Standard 18-column table", author: "מנדלייב ואחריו IUPAC", authorEn: "Mendeleev / IUPAC", year: "1869 עד היום",
    shape: "דו-ממד", fidelity: "מדויק", view: [0, 0.05, 1],
    summary: "18 טורים ו-7 שורות. הלנתנידים והאקטינידים נשלפים לשתי שורות בתחתית מטעמי מקום.",
    insight: "הפעילו את חוט המספר האטומי: הוא נקטע בסוף כל שורה וקופץ לתחתית בלנתן ובאקטיניום. זו המגבלה שכל המודלים האחרים מנסים לפתור.",
    method: "מיקום לפי קבוצה ומחזור, כמו בכל ספר לימוד.",
  },
  {
    id: "chancourtois", he: "הבורג הטלורי", en: "Telluric screw", author: "אלכסנדר-אמיל בגייה דה שנקורטואה", authorEn: "A.-E. Béguyer de Chancourtois", year: "1862",
    shape: "סליל על גליל", fidelity: "מדויק", view: [1, 0.35, 0.9],
    summary: "הסידור המחזורי הראשון, שבע שנים לפני מנדלייב. היסודות כרוכים על סליל סביב גליל, ו-16 יחידות מסה משלימות סיבוב אחד.",
    insight: "צבעו לפי משפחה: ליתיום, נתרן ואשלגן נופלים כמעט על אותו קו אנכי. בהמשך הסליל ההתאמה נשברת, כי המחזורים מתארכים ל-18 ול-32.",
    method: "זווית = 2π × מסה ÷ 16, גובה יורד יחד עם המסה. לשם השוואה מוצגים כל 118 היסודות, גם אלה שלא היו ידועים ב-1862.",
  },
  {
    id: "stedman", he: "הקונוס", en: "Periodic cone", author: "דון סטדמן", authorEn: "Don Stedman", year: "1947",
    shape: "קונוס", fidelity: "שחזור עקרוני", view: [0.7, 0.75, 1],
    summary: "המימן בקודקוד, וכל מחזור הוא טבעת רחבה יותר מקודמתה. המשפחות יורדות לאורך קווי המעטפת של הקונוס.",
    insight: "סובבו את הקונוס: כל קבוצה ראשית היא קו ישר מהקודקוד כלפי מטה, ומתכות המעבר והלנתנידים פותחים מגזר רחב רק במחזורים שבהם הם מופיעים.",
    method: "זווית לפי מקום במחזור (8 קבוצות ראשיות, 10 מקומות d ו-15 מקומות f), רדיוס הטבעת לפי מספר המחזור.",
  },
  {
    id: "benfey", he: "החלזון המחזורי", en: "Periodic spiral", author: "תאודור בנפיי", authorEn: "Theodor Benfey", year: "1964",
    shape: "ספירלה", fidelity: "פרשנות", view: [0, 1, 0.55],
    summary: "ספירלה רציפה מהמימן במרכז והחוצה. כל סיבוב הוא מחזור, ומתכות המעבר והלנתנידים בולטים כחצאי איים בלי לקטוע את הרצף.",
    insight: "חוט המספר האטומי רציף לגמרי, מ-H עד Og. שמונה הקבוצות הראשיות הן שמונה קרניים קבועות, וחצאי האיים גדלים: 10 יסודות, ואחר כך 15.",
    method: "רדיוס גדל בהתמדה עם הזווית. בתלת-ממד חצאי האיים מורמים כקשתות כדי שלא יכסו את הסיבוב הבא, ובשרטוט המקורי הם שטוחים.",
  },
  {
    id: "janet", he: "טבלת הצעד השמאלי", en: "Left-step table", author: "שרל ז'אנה", authorEn: "Charles Janet", year: "1928",
    shape: "דו-ממד", fidelity: "מדויק", view: [0, 0.05, 1],
    summary: "כל שורה היא ערך אחד של n+l (כלל מדלונג). הבלוקים מסודרים f, d, p, s, וההליום יושב מעל הבריליום.",
    insight: "צבעו לפי בלוק: כל בלוק הוא מלבן מלא, בלי חורים ובלי שורות נשלפות. זו התשתית של טבלת ADOMAH.",
    method: "שורה = n+l של האלקטרון המבדיל, טור = בלוק ואחר כך מקום בתוך תת-הקליפה.",
  },
  {
    id: "stowe", he: "המגדל הקוונטי", en: "Physicist's table", author: "טימותי סטו", authorEn: "Timothy Stowe", year: "1989",
    shape: "מגדל", fidelity: "שחזור עקרוני", view: [0.9, 0.5, 1],
    summary: "שלושה צירים לשלושה מספרים קוונטיים: גובה = n (קליפה), עומק = l (סוג אורביטל), רוחב = m (מספר מגנטי).",
    insight: "כל קומה היא קליפה אחת, וכל קומה מכילה בדיוק 2n² מקומות. הקומות התחתונות מתמלאות לפני שהעליונות נגמרות: זה הפער בין n לבין סדר המילוי.",
    method: "האלקטרון המבדיל של כל יסוד לפי כלל מדלונג וכלל הונד: (n, l, m, s). בני זוג בספין הפוך יושבים זה לצד זה.",
  },
  {
    id: "adomah", he: "פירמידת ADOMAH", en: "ADOMAH tetrahedron", author: "ולרי צימרמן", authorEn: "Valery Tsimmerman", year: "2006",
    shape: "טטרהדרון", fidelity: "שחזור עקרוני", view: [0.85, 0.65, 1],
    summary: "פירמידה משכבות. כל שכבה היא ערך של n+l, וכל שורה בשכבה היא סוג אורביטל. השכבות באות בזוגות ומתרחבות: 2, 8, 18, 32.",
    insight: "הביטו מלמעלה: כל שכבה היא משולש של שורות s, p, d, f. מכאן קוראים ישירות את תצורת האלקטרונים, בלי לזכור את סדר המילוי.",
    method: "שכבה = n+l, שורה בשכבה = l, מקום בשורה = מספר האלקטרון בתת-הקליפה. השכבות ממורכזות ויוצרות טטרהדרון.",
  },
  {
    id: "tree", he: "עץ היסודות", en: "ElemenTree", author: "פרננדו דופור", authorEn: "Fernando Dufour", year: "לא מתוארך",
    shape: "עץ שכבות", fidelity: "פרשנות", view: [0.12, 1, 0.4],
    summary: "שכבות שקופות זו מעל זו, אחת לכל מחזור. במבט מלמעלה היסודות של מחזורים שונים נערמים, וקשרים סמויים נחשפים.",
    insight: "הפעילו קשרים משניים והביטו מלמעלה: יחסים אלכסוניים (Li-Mg, Be-Al, B-Si) ו'מהלך הפרש' (Zn-Sn, Cd-Pb) מתחברים בין שכבות סמוכות.",
    method: "שכבה לכל מחזור, זרוע לכל קבוצה, והלנתנידים והאקטינידים כענף חיצוני. הסידור הוא פרשנות חזותית לרעיון, לא שחזור של הדגם הפיזי.",
  },
];

export const modelById = (id: string) => MODELS.find((m) => m.id === id) || MODELS[0];

// --- עזרים ---
const TAU = Math.PI * 2;
/** משפחה במעגל: 8 קבוצות ראשיות, 10 מקומות d, 15 מקומות f. */
function family(e: Element): { kind: "m" | "d" | "f"; i: number } {
  if (e.cat === "lanthanide") return { kind: "f", i: e.z - 57 };
  if (e.cat === "actinide") return { kind: "f", i: e.z - 89 };
  if (e.group >= 3 && e.group <= 12) return { kind: "d", i: e.group - 3 };
  return { kind: "m", i: e.group <= 2 ? e.group - 1 : e.group - 10 };
}

/** חלק מהמעגל לפי סדר: m0 m1 | f0..f14 | d0..d9 | m2..m7. משקלות: ראשיות 0.4, d 0.25, f 0.35. */
function stedmanAngle(e: Element) {
  const f = family(e);
  const M = 0.4 / 8, D = 0.25 / 10, F = 0.35 / 15;
  let a: number;
  if (f.kind === "m") a = f.i < 2 ? (f.i + 0.5) * M : 2 * M + 0.35 + 0.25 + (f.i - 2 + 0.5) * M;
  else if (f.kind === "f") a = 2 * M + (f.i + 0.5) * F;
  else a = 2 * M + 0.35 + (f.i + 0.5) * D;
  return a * TAU;
}

function classic(e: Element): Vec {
  const lower = e.y > 7 ? 0.55 : 0;
  return [(e.x - 9.5) * 1.06, -(e.y - 5.5 + lower) * 1.06, 0];
}

function chancourtois(e: Element): Vec {
  const turns = e.mass / 16;
  const a = turns * TAU, R = 7;
  return [R * Math.sin(a), 11 - turns * 1.25, R * Math.cos(a)];
}

const CONE_R = [0, 2.6, 3.4, 4.2, 6.2, 6.9, 7.6, 8.3];
function stedman(e: Element): Vec {
  const a = stedmanAngle(e), r = CONE_R[e.period];
  return [r * Math.sin(a), 7 - (e.period - 1) * 2.3, r * Math.cos(a)];
}

const spiralR = (theta: number) => 1.5 + 2.35 * (theta / TAU);
function benfey(e: Element): Vec {
  const f = family(e);
  const base = TAU * (e.period - 1);
  const spoke = TAU / 8;
  if (f.kind === "m") {
    const th = base + f.i * spoke;
    const r = spiralR(th);
    return [r * Math.cos(th), 0, -r * Math.sin(th)];
  }
  // חצאי איים: בין קרן הקבוצה השנייה לקרן הקבוצה ה-13, מורמים כקשת.
  const n = f.kind === "d" ? 10 : 15;
  const t = (f.i + 0.5) / n;
  const thc = base + 1.5 * spoke;
  const w = spoke * (f.kind === "d" ? 0.78 : 0.95);
  const th = thc + (t - 0.5) * w;
  const r = spiralR(thc) + (f.kind === "f" ? 1.1 : 0.2);
  const h = (f.kind === "d" ? 3.2 : 5.6) * Math.sin(Math.PI * t);
  return [r * Math.cos(th), h, -r * Math.sin(th)];
}

function janetCol(e: Element) {
  const { l, k } = e.q;
  return [30, 24, 14, 0][l] + k;
}
function janet(e: Element): Vec {
  const row = e.q.n + e.q.l;
  return [(janetCol(e) - 15.5) * 1.02, -(row - 4.5) * 1.06, 0];
}

function stowe(e: Element): Vec {
  const { n, l, ml, ms } = e.q;
  const j = 2 * (ml + l) + (ms > 0 ? 0 : 1);
  return [(j - (4 * l + 1) / 2) * 0.98, (n - 4) * 2.1, (l - 1.5) * 1.45];
}

function adomah(e: Element): Vec {
  const { n, l, k } = e.q;
  const layer = n + l;
  return [(k - (4 * l + 1) / 2) * 0.98, 7.5 - layer * 1.9, (l - 1.5) * 1.45];
}

function tree(e: Element): Vec {
  const f = family(e);
  const y = 6.5 - (e.period - 1) * 2.1;
  const r = 2.4 + e.period * 0.95;
  const spoke = (g: number) => ((g - 1) / 18) * TAU;
  if (f.kind === "f") {
    const a = spoke(3) + (f.i - 7) * 0.095;
    const rr = r + 1.8;
    return [rr * Math.sin(a), y - 0.7, rr * Math.cos(a)];
  }
  const a = spoke(e.group);
  return [r * Math.sin(a), y, r * Math.cos(a)];
}

const FN: Record<ModelId, (e: Element) => Vec> = { classic, chancourtois, stedman, benfey, janet, stowe, adomah, tree };

const cache = new Map<ModelId, Vec[]>();
/** מיקומי כל היסודות בסידור, ממורכזים סביב הראשית. */
export function positions(id: ModelId): Vec[] {
  if (cache.has(id)) return cache.get(id)!;
  const p = ELEMENTS.map(FN[id]);
  const c = [0, 1, 2].map((i) => (Math.min(...p.map((v) => v[i])) + Math.max(...p.map((v) => v[i]))) / 2);
  const out = p.map((v) => [v[0] - c[0], v[1] - c[1], v[2] - c[2]] as Vec);
  cache.set(id, out);
  return out;
}

/** קווי עזר לכל סידור (גליל, טבעות, קומות), באותה מערכת צירים ממורכזת. */
export function guides(id: ModelId): Vec[][] {
  const p = ELEMENTS.map(FN[id]);
  const c = [0, 1, 2].map((i) => (Math.min(...p.map((v) => v[i])) + Math.max(...p.map((v) => v[i]))) / 2);
  const sh = (v: Vec): Vec => [v[0] - c[0], v[1] - c[1], v[2] - c[2]];
  const circle = (r: number, y: number, seg = 96) =>
    Array.from({ length: seg + 1 }, (_, i) => sh([r * Math.sin((i / seg) * TAU), y, r * Math.cos((i / seg) * TAU)]));
  const lines: Vec[][] = [];
  if (id === "chancourtois") {
    const turns = 300 / 16, R = 7;
    lines.push(Array.from({ length: 1200 }, (_, i) => { const t = (i / 1199) * turns; return sh([R * Math.sin(t * TAU), 11 - t * 1.25, R * Math.cos(t * TAU)]); }));
    for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; lines.push([sh([R * Math.sin(a), 11.5, R * Math.cos(a)]), sh([R * Math.sin(a), 11 - turns * 1.25, R * Math.cos(a)])]); }
  } else if (id === "stedman") {
    for (let p = 1; p <= 7; p++) lines.push(circle(CONE_R[p], 7 - (p - 1) * 2.3));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; lines.push([sh([0, 9.5, 0]), sh([CONE_R[7] * 1.05 * Math.sin(a), 7 - 6 * 2.3 - 0.6, CONE_R[7] * 1.05 * Math.cos(a)])]); }
  } else if (id === "benfey") {
    lines.push(Array.from({ length: 900 }, (_, i) => { const th = (i / 899) * TAU * 7; const r = spiralR(th); return sh([r * Math.cos(th), 0, -r * Math.sin(th)]); }));
    for (let k = 0; k < 8; k++) { const a = k * (TAU / 8); lines.push([sh([0, 0, 0]), sh([18.5 * Math.cos(a), 0, -18.5 * Math.sin(a)])]); }
  } else if (id === "stowe") {
    for (let n = 1; n <= 7; n++) {
      const y = (n - 4) * 2.1 - 0.55, lmax = Math.min(n - 1, 3), w = (4 * lmax + 2) * 0.49 + 0.4;
      const z0 = -1.5 * 1.45 - 0.8, z1 = (lmax - 1.5) * 1.45 + 0.8;
      lines.push([sh([-w, y, z0]), sh([w, y, z0]), sh([w, y, z1]), sh([-w, y, z1]), sh([-w, y, z0])]);
    }
  } else if (id === "adomah") {
    for (let L = 1; L <= 7; L++) {
      const lmax = Math.min(Math.floor((L - 1) / 2), 3), y = 7.5 - L * 1.9 - 0.55;
      const z0 = -1.5 * 1.45 - 0.7, z1 = (lmax - 1.5) * 1.45 + 0.7, w0 = 1.5, w1 = (4 * lmax + 2) * 0.49 + 0.6;
      lines.push([sh([-w0, y, z0]), sh([w0, y, z0]), sh([w1, y, z1]), sh([-w1, y, z1]), sh([-w0, y, z0])]);
    }
  } else if (id === "tree") {
    lines.push([sh([0, 9, 0]), sh([0, 6.5 - 6 * 2.1 - 2, 0])]);
    for (let p = 1; p <= 7; p++) lines.push(circle(2.4 + p * 0.95, 6.5 - (p - 1) * 2.1 - 0.1));
  }
  return lines;
}
