// המעבדה: סידור תלת-ממדי חי, צביעה לפי תכונה, שכבות, חיפוש, סיור מודרך ופרטי יסוד.
import { useEffect, useMemo, useRef, useState } from "react";
import LabCanvas, { type LabHandle, type Layers } from "../components/LabCanvas";
import PeriodicGrid from "../components/PeriodicGrid";
import ElementDetail from "../components/ElementDetail";
import Legend from "../components/Legend";
import { ELEMENTS, byZ, colorOf, valueOf, blockOf, COLOR_MODES, type ColorMode } from "../data/elements";
import { MODELS, modelById, type ModelId } from "../data/models";
import { TOUR } from "../data/tour";
import { go, type Route } from "../lib/router";
import { pref, setPref } from "../data/store";
import { useApp } from "../state";

const LAYER_LABELS: { id: keyof Layers; he: string; hint: string }[] = [
  { id: "thread", he: "חוט המספר האטומי", hint: "קו רציף מ-H עד Og" },
  { id: "families", he: "קווי משפחה", hint: "מחברים יסודות באותה קבוצה" },
  { id: "links", he: "קשרים משניים", hint: "אלכסוני ומהלך הפרש" },
  { id: "guides", he: "קווי עזר", hint: "גליל, טבעות, קומות" },
];

export default function LabPage({ route }: { route: Route }) {
  const { data } = useApp();
  const model = modelById(route.path[1] || pref<ModelId>("model", "classic"));
  const q = route.query;
  const color = (COLOR_MODES.find((m) => m.id === q.get("c"))?.id || "category") as ColorMode;
  const z = Number(q.get("z")) || null;
  const filter = q.get("f");
  const tourStep = q.get("tour") != null ? Math.max(0, Math.min(TOUR.length - 1, Number(q.get("tour")))) : null;
  const view = q.get("v") === "flat" ? "flat" : "3d";

  const [layers, setLayers] = useState<Layers>(() => pref("layers", { thread: false, families: false, links: false, guides: true }));
  const [rotate, setRotate] = useState(false);
  const [search, setSearch] = useState("");
  const [hover, setHover] = useState<number | null>(null);
  const [panel, setPanel] = useState(false);
  const [mini, setMini] = useState(() => pref("cardMini", false));
  useEffect(() => { setPref("cardMini", mini); }, [mini]);
  const lab = useRef<LabHandle>(null);

  const set = (patch: Record<string, string | number | null | undefined>, path = `lab/${model.id}`, replace = true) => {
    const cur = Object.fromEntries(q.entries());
    go(path, { ...cur, ...patch }, replace);
  };

  useEffect(() => { setPref("model", model.id); }, [model.id]);
  useEffect(() => { setPref("layers", layers); }, [layers]);

  // צעד בסיור קובע את כל המצב
  const step = tourStep != null ? TOUR[tourStep] : null;
  useEffect(() => {
    if (!step) return;
    setLayers((l) => ({ ...l, thread: false, families: false, links: false, ...step.layers }));
    if (step.model !== model.id || step.color !== color) set({ c: step.color, f: step.filter || null }, `lab/${step.model}`);
  }, [tourStep]); // eslint-disable-line

  const colors = useMemo(() => ELEMENTS.map((e) => colorOf(e, color)), [color]);

  const s = search.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!s) return null;
    return ELEMENTS.filter((e) => e.he.includes(search.trim()) || e.en.toLowerCase().startsWith(s) || e.sym.toLowerCase() === s || String(e.z) === s);
  }, [s, search]);

  const dim = useMemo(() => {
    if (step?.highlight) return ELEMENTS.map((e) => step.highlight!.includes(e.z));
    if (matches) return ELEMENTS.map((e) => matches.some((m) => m.z === e.z));
    if (!filter) return null;
    const [k, v] = filter.split(":");
    return ELEMENTS.map((e) => (k === "cat" ? e.cat === v : k === "block" ? blockOf(e) === v : k === "phase" ? e.phase === v : k === "star" ? data.starred.includes(e.z) : true));
  }, [filter, matches, step, data.starred]);

  const select = (nz: number | null) => set({ z: nz });
  const focusSel = () => z && lab.current?.focus(z);
  const sel = z ? byZ(z) : null;
  const hov = hover ? byZ(hover) : null;

  return (
    <div className={"lab" + (sel ? " has-drawer" : "") + (step ? " touring" : "") + (mini ? " card-mini" : "")}>
      <div className="lab-stage">
        {view === "3d" ? (
          <LabCanvas ref={lab} model={model.id} colors={colors} dim={dim} selected={z} layers={layers} autoRotate={rotate}
            onSelect={(nz) => nz && select(nz)} onHover={setHover}
            label={`${model.he}: ${model.summary}`} />
        ) : (
          <div className="flat-wrap"><PeriodicGrid colors={colors} dim={dim} selected={z} onSelect={select} /></div>
        )}
        {hov && view === "3d" && (
          <div className="hover-chip" aria-hidden="true">
            <b>{hov.sym}</b> {hov.he} <span className="mono">{hov.z}</span> · {valueOf(hov, color)}
          </div>
        )}
      </div>

      <aside className={"lab-panel glass" + (panel ? " open" : "")} aria-label="בקרת המעבדה">
        <div className="panel-sec">
          <h2 className="label">סידור</h2>
          <div className="models">
            {MODELS.map((m) => (
              <button key={m.id} className={"model-btn" + (m.id === model.id ? " on" : "")} aria-pressed={m.id === model.id}
                onClick={() => set({ tour: null }, `lab/${m.id}`)}>
                <span>{m.he}</span><small className="mono">{m.year}</small>
              </button>
            ))}
          </div>
        </div>
        <button className="btn panel-toggle" onClick={() => setPanel(!panel)} aria-expanded={panel}>{panel ? "סגירת הגדרות" : "צביעה, שכבות וחיפוש"}</button>
        <div className="panel-more">
          <div className="panel-sec">
            <label className="label" htmlFor="search">חיפוש יסוד</label>
            <input id="search" className="field" value={search} placeholder="שם, סמל או מספר: ברזל, Fe, 26"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && matches?.[0]) { select(matches[0].z); setSearch(""); } }} />
            {matches && <div className="search-res">{matches.length ? matches.slice(0, 6).map((m) => (
              <button key={m.z} className="chip-btn" onClick={() => { select(m.z); setSearch(""); }}>{m.sym} {m.he}</button>
            )) : <span className="muted">לא נמצא יסוד. נסו שם בעברית, סמל או מספר.</span>}</div>}
          </div>
          <div className="panel-sec">
            <h2 className="label">צביעה לפי</h2>
            <div className="seg">
              {COLOR_MODES.map((m) => (
                <button key={m.id} className={m.id === color ? "on" : ""} aria-pressed={m.id === color} onClick={() => set({ c: m.id, f: null })}>{m.he}</button>
              ))}
            </div>
          </div>
          <div className="panel-sec">
            <h2 className="label">שכבות</h2>
            {LAYER_LABELS.map((l) => (
              <label key={l.id} className="toggle">
                <input type="checkbox" checked={layers[l.id]} onChange={(e) => setLayers({ ...layers, [l.id]: e.target.checked })} />
                <span className="tg" /><span>{l.he}<small>{l.hint}</small></span>
              </label>
            ))}
            <label className="toggle">
              <input type="checkbox" checked={rotate} onChange={(e) => setRotate(e.target.checked)} />
              <span className="tg" /><span>סיבוב אוטומטי<small>הגוף מסתובב לאט</small></span>
            </label>
            {data.starred.length > 0 && (
              <button className={"btn ghost wide" + (filter === "star:1" ? " on" : "")} aria-pressed={filter === "star:1"} onClick={() => set({ f: filter === "star:1" ? null : "star:1" })}>
                הדגשת המסומנים שלי ({data.starred.length})
              </button>
            )}
          </div>
          <div className="panel-sec row">
            <button className="btn ghost" onClick={() => set({ v: view === "3d" ? "flat" : null })}>{view === "3d" ? "תצוגת טבלה נגישה" : "חזרה לתלת-ממד"}</button>
            {view === "3d" && <button className="btn ghost" onClick={() => lab.current?.reset()}>איפוס מבט</button>}
          </div>
        </div>
      </aside>

      <section className="model-card glass" aria-live="polite">
        {step ? (
          <div className="tour">
            <div className="label">סיור מודרך · {tourStep! + 1} מתוך {TOUR.length}</div>
            <h2>{step.title}</h2>
            <p>{step.text}</p>
            <div className="tour-dots" aria-hidden="true">{TOUR.map((_, i) => <i key={i} className={i === tourStep ? "on" : ""} />)}</div>
            <div className="row">
              <button className="btn" disabled={tourStep === 0} onClick={() => set({ tour: tourStep! - 1 })}>הקודם</button>
              {tourStep! < TOUR.length - 1
                ? <button className="btn primary" onClick={() => set({ tour: tourStep! + 1 })}>הבא</button>
                : <button className="btn primary" onClick={() => set({ tour: null })}>סיום הסיור</button>}
              <button className="btn ghost" onClick={() => set({ tour: null })}>יציאה</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mc-head">
              <div>
                <div className="label">{model.author} · <span className="mono">{model.year}</span></div>
                <h1>{model.he} <small>{model.en}</small></h1>
              </div>
              <div className="row">
                <span className={"badge f-" + (model.fidelity === "מדויק" ? "a" : model.fidelity === "שחזור עקרוני" ? "b" : "c")} title="רמת הנאמנות של השחזור למקור">{model.fidelity}</span>
                <button className="btn ghost mini-btn" aria-expanded={!mini} onClick={() => setMini(!mini)}>{mini ? "הרחבה" : "מזעור"}</button>
              </div>
            </div>
            <div className="mc-body">
            <p>{model.summary}</p>
            <details>
              <summary>מה לראות כאן, ואיך זה מחושב</summary>
              <p><b>מה לראות:</b> {model.insight}</p>
              <p className="muted"><b>חישוב:</b> {model.method}</p>
            </details>
            <div className="row">
              <button className="btn primary" onClick={() => set({ tour: 0 })}>סיור מודרך בשמונת הסידורים</button>
            </div>
            </div>
          </>
        )}
        <div className="mc-legend"><Legend mode={color} filter={filter} onFilter={(f) => set({ f })} /></div>
      </section>

      {sel && (
        <aside className="drawer glass" aria-label={`פרטי ${sel.he}`}>
          <div className="drawer-bar">
            <button className="btn ghost" onClick={focusSel} disabled={view !== "3d"}>התקרבות</button>
            <button className="btn ghost" onClick={() => select(null)} aria-label="סגירת פרטי היסוד">סגירה</button>
          </div>
          <ElementDetail e={sel} onPick={select} />
        </aside>
      )}
    </div>
  );
}
