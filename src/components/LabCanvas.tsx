// עטיפת React למנוע התלת-ממד. three נטען רק כשהרכיב מוצג. בלי WebGL מוצגת הודעה, והטבלה השטוחה ממשיכה לעבוד.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Lab } from "../scene/Lab";
import type { ModelId } from "../data/models";

export type Layers = { thread: boolean; families: boolean; links: boolean; guides: boolean };
export type LabHandle = { focus: (z: number) => void; reset: () => void };
type Props = {
  model: ModelId; colors: string[]; dim: boolean[] | null; selected: number | null; layers: Layers;
  autoRotate?: boolean; interactive?: boolean; onSelect?: (z: number | null) => void; onHover?: (z: number | null) => void;
  label: string;
};

export const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
function hasWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

const LabCanvas = forwardRef<LabHandle, Props>(function LabCanvas(p, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const lab = useRef<Lab | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "nogl" | "error">(() => (hasWebGL() ? "loading" : "nogl"));
  const cb = useRef({ onSelect: p.onSelect, onHover: p.onHover });
  cb.current = { onSelect: p.onSelect, onHover: p.onHover };
  const first = useRef(p);

  useEffect(() => {
    if (state === "nogl" || !canvas.current) return;
    let alive = true;
    import("../scene/Lab").then(({ Lab }) => {
      if (!alive || !canvas.current) return;
      const f = first.current;
      const l = new Lab(canvas.current, {
        reducedMotion: reducedMotion(), autoRotate: f.autoRotate, interactive: f.interactive,
        onSelect: (z) => cb.current.onSelect?.(z), onHover: (z) => cb.current.onHover?.(z),
      });
      lab.current = l;
      setState("ready");
    }).catch(() => alive && setState("error"));
    return () => { alive = false; lab.current?.dispose(); lab.current = null; };
  }, [state === "nogl"]); // eslint-disable-line

  const ready = state === "ready";
  useEffect(() => { if (ready) lab.current?.setModel(p.model, true); }, [ready, p.model]);
  useEffect(() => { if (ready) lab.current?.setColors(p.colors); }, [ready, p.colors]);
  useEffect(() => { if (ready) lab.current?.setDim(p.dim); }, [ready, p.dim]);
  useEffect(() => { if (ready) lab.current?.setSelected(p.selected); }, [ready, p.selected]);
  useEffect(() => { if (ready) lab.current?.setLayers(p.layers); }, [ready, p.layers]);
  useEffect(() => { if (ready) lab.current?.setAutoRotate(!!p.autoRotate); }, [ready, p.autoRotate]);

  useImperativeHandle(ref, () => ({ focus: (z) => lab.current?.focus(z), reset: () => lab.current?.resetView() }), []);

  return (
    <div className="lab-canvas">
      {state !== "nogl" && <canvas ref={canvas} role="img" aria-label={p.label} tabIndex={-1} />}
      {state === "loading" && <div className="lab-msg">בונה את המרחב התלת-ממדי</div>}
      {state === "nogl" && <div className="lab-msg">הדפדפן או המכשיר לא תומכים בתלת-ממד (WebGL). כל המידע זמין בתצוגת הטבלה ובטבלת היסודות.</div>}
      {state === "error" && <div className="lab-msg">טעינת התלת-ממד נכשלה. רעננו את הדף, או עברו לתצוגת טבלה.</div>}
    </div>
  );
});
export default LabCanvas;
