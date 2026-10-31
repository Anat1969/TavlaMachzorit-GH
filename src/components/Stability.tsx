import type { MPEntry, Status } from '../lib/stability'
import { useStability } from '../lib/useStability'
import { prettyFormula } from '../data/compounds'

/** The second judge on any formula: what the Materials Project calculation says. */
export function StabilityBadge({ parts, full = false }: { parts: [string, number][]; full?: boolean }) {
  const m = useStability()
  if (!m) return <span className="st st-wait small">בודק יציבות</span>
  const e = m.lookup(parts)
  const s = m.status(e)
  return <StabilityView e={e} s={s} label={m.STATUS_LABEL[s]} link={e ? m.mpLink(e.id) : null} full={full} about={m.STATUS_ABOUT[s]} />
}

export function StabilityView({ e, s, label, link, full, about }: { e: MPEntry | null; s: Status; label: string; link: string | null; full?: boolean; about?: string }) {
  return (
    <span className={`st st-${s} small`} title={about}>
      {link ? <a href={link} target="_blank" rel="noreferrer">{label}</a> : label}
      {e && full && <span className="faint"> · <bdi className="mono" dir="ltr">{Math.round(e.ehull * 1000)} meV</bdi></span>}
      {e && full && s === 'unstable' && e.decomposes.length > 0 && <span className="faint"> · מתפרק ל: <bdi dir="ltr">{e.decomposes.map(prettyFormula).join(' + ')}</bdi></span>}
    </span>
  )
}
