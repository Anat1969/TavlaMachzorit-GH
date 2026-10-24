// מקרא למצב הצביעה. בקטגוריות: לחיצה מסננת. בערכים רציפים: סולם עם קצוות.
import { CATEGORIES, BLOCK_COLORS, PHASE_COLORS, PHASE_HE, RAMP_CSS, COLOR_MODES, range, type ColorMode, type Category } from "../data/elements";

type Props = { mode: ColorMode; filter: string | null; onFilter: (f: string | null) => void };

export default function Legend({ mode, filter, onFilter }: Props) {
  const chips: { id: string; he: string; c: string }[] =
    mode === "category" ? (Object.keys(CATEGORIES) as Category[]).map((k) => ({ id: "cat:" + k, he: CATEGORIES[k].he, c: CATEGORIES[k].color }))
    : mode === "block" ? Object.entries(BLOCK_COLORS).map(([k, c]) => ({ id: "block:" + k, he: "בלוק " + k, c }))
    : mode === "phase" ? Object.entries(PHASE_COLORS).map(([k, c]) => ({ id: "phase:" + k, he: PHASE_HE[k], c }))
    : [];
  if (chips.length)
    return (
      <div className="legend" role="group" aria-label="מקרא וסינון">
        {chips.map((ch) => (
          <button key={ch.id} className={"lchip" + (filter === ch.id ? " on" : "")} aria-pressed={filter === ch.id}
            style={{ ["--c" as string]: ch.c }} onClick={() => onFilter(filter === ch.id ? null : ch.id)}>
            <i />{ch.he}
          </button>
        ))}
      </div>
    );
  const r = range(mode)!;
  const unit = COLOR_MODES.find((m) => m.id === mode)?.unit;
  return (
    <div className="legend ramp">
      <span className="mono">{+r[0].toFixed(1)}</span>
      <span className="ramp-bar" style={{ background: RAMP_CSS }} />
      <span className="mono">{+r[1].toFixed(1)} {unit}</span>
    </div>
  );
}
