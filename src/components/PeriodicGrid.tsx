// הטבלה המוכרת כ-HTML: נגישה למקלדת ולקורא מסך, ומשמשת גם כחלופה כשאין תלת-ממד.
import { ELEMENTS, type Element } from "../data/elements";

type Props = { colors: string[]; dim: boolean[] | null; selected: number | null; onSelect: (z: number) => void; compact?: boolean };

export default function PeriodicGrid({ colors, dim, selected, onSelect, compact }: Props) {
  return (
    <div className={"pgrid" + (compact ? " compact" : "")} role="grid" aria-label="הטבלה המחזורית">
      {ELEMENTS.map((e: Element, i) => (
        <button
          key={e.z}
          className={"cell" + (selected === e.z ? " sel" : "") + (dim && !dim[i] ? " dim" : "")}
          style={{ gridColumn: e.x, gridRow: e.y > 7 ? e.y + 1 : e.y, ["--c" as string]: colors[i] }}
          onClick={() => onSelect(e.z)}
          aria-label={`${e.he}, ${e.sym}, מספר אטומי ${e.z}`}
          aria-pressed={selected === e.z}
        >
          <span className="cell-z">{e.z}</span>
          <span className="cell-sym">{e.sym}</span>
          {!compact && <span className="cell-he">{e.he}</span>}
        </button>
      ))}
      <div className="pgrid-gap" style={{ gridRow: 8, gridColumn: "1 / -1" }} />
    </div>
  );
}
