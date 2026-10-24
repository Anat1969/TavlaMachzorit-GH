// A row of square toggle chips: one choice out of several.
export function Chips<T extends string>({ options, value, onChange, label }: {
  options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string
}) {
  return (
    <div className="row" role="group" aria-label={label}>
      <span className="eyebrow">{label}</span>
      {options.map((o) => (
        <button key={o.id} className="chip" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}
