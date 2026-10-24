// תרשימי אטום: מודל בוהר (קליפות) ותיבות אורביטלים לפי התצורה בפועל.
import { subshells, BLOCK_COLORS, type Element } from "../data/elements";

export function Bohr({ e, size = 180 }: { e: Element; size?: number }) {
  const c = size / 2, n = e.shells.length;
  const step = (c - 14) / (n + 0.6);
  return (
    <svg className="bohr" viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`קליפות: ${e.shells.join(", ")}`}>
      <defs>
        <radialGradient id="nuc"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#ff8a5c" /></radialGradient>
      </defs>
      <circle cx={c} cy={c} r={step * 0.55} fill="url(#nuc)" />
      {e.shells.map((cnt, k) => {
        const r = step * (k + 1.4);
        return (
          <g key={k} className="shell" style={{ animationDuration: `${8 + k * 5}s` }}>
            <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-strong)" strokeWidth="1" />
            {Array.from({ length: cnt }, (_, j) => {
              const a = (j / cnt) * Math.PI * 2;
              return <circle key={j} cx={c + r * Math.cos(a)} cy={c + r * Math.sin(a)} r={Math.max(1.6, 3.4 - n * 0.25)} fill="var(--accent)" />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

export function OrbitalBoxes({ e }: { e: Element }) {
  const subs = subshells(e).sort((a, b) => a.n - b.n || a.l - b.l);
  return (
    <div className="orbitals" dir="ltr">
      {subs.map((s) => {
        const boxes = 2 * s.l + 1;
        const up = Math.min(s.count, boxes), down = Math.max(0, s.count - boxes);
        return (
          <div className="orb-row" key={s.label}>
            <span className="orb-label" style={{ color: BLOCK_COLORS["spdf"[s.l]] }}>{s.label}</span>
            <span className="orb-boxes">
              {Array.from({ length: boxes }, (_, i) => (
                <span className="orb-box" key={i} style={{ borderColor: BLOCK_COLORS["spdf"[s.l]] }}>
                  {i < up ? "↑" : ""}{i < down ? "↓" : ""}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
