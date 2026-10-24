// הטלה דו-ממדית של סידור, נגזרת מאותן פונקציות מיקום. משמשת ככרטיס תצוגה מקדימה קל משקל.
import { useMemo } from "react";
import { ELEMENTS, CATEGORIES } from "../data/elements";
import { MODELS, positions, type ModelId } from "../data/models";

export default function MiniModel({ id, size = 150 }: { id: ModelId; size?: number }) {
  const pts = useMemo(() => {
    const m = MODELS.find((x) => x.id === id)!;
    const v = norm(m.view);
    const upGuess: [number, number, number] = Math.abs(v[1]) > 0.9 ? [0, 0, -1] : [0, 1, 0];
    const right = norm(cross(upGuess, v));
    const up = cross(v, right);
    const p = positions(id).map((q, i) => ({ x: dot(q, right), y: -dot(q, up), d: dot(q, v), i }));
    const xs = p.map((a) => a.x), ys = p.map((a) => a.y);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const s = (size - 16) / Math.max(x1 - x0, y1 - y0);
    return p.sort((a, b) => a.d - b.d).map((a) => ({
      ...a, x: 8 + (a.x - x0) * s + ((size - 16) - (x1 - x0) * s) / 2, y: 8 + (a.y - y0) * s + ((size - 16) - (y1 - y0) * s) / 2, s,
    }));
  }, [id, size]);
  const r = Math.max(1.6, Math.min(4, pts[0].s * 0.36));
  return (
    <svg className="mini" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {pts.map((p) => (
        <rect key={p.i} x={p.x - r} y={p.y - r} width={r * 2} height={r * 2} fill={CATEGORIES[ELEMENTS[p.i].cat].color} opacity={0.55 + 0.45 * (p.i / 118)} />
      ))}
    </svg>
  );
}
type V = [number, number, number];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V): V => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
export type { ModelId };
