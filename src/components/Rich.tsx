// Rich text: **bold** for parameters and numbers, ==text== for the insight marker.
// Numbers outside markers are bolded automatically, as the design standard asks.
import { Fragment } from 'react'

export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|==[^=]+==)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**')) return <b key={i}>{p.slice(2, -2)}</b>
        if (p.startsWith('==')) return <mark key={i} className="hl">{p.slice(2, -2)}</mark>
        return <Fragment key={i}>{p.split(/(\d+(?:\.\d+)?%?)/g).map((q, j) => (/^\d/.test(q) ? <b key={j}>{q}</b> : q))}</Fragment>
      })}
    </>
  )
}

/** The three layers of knowledge, shown as one legend wherever they mix. */
export const LAYERS = [
  { id: 'fact', label: 'נתון', about: 'נמדד או מתועד בספרות, ונמצא במאגר של האפליקציה.' },
  { id: 'calc', label: 'חישוב', about: 'האפליקציה חישבה אותו מהנתונים, לפי כלל גלוי.' },
  { id: 'guess', label: 'השערה', about: 'הצעה שלא נבדקה. צריך לאמת אותה בספרות או בניסוי.' },
] as const

export type LayerId = (typeof LAYERS)[number]['id']

export function LayerTag({ id }: { id: LayerId }) {
  return <span className={`ktag k-${id}`}>{LAYERS.find((l) => l.id === id)!.label}</span>
}

export function LayerLegend() {
  return (
    <div className="legend" aria-label="מקרא שכבות הידע">
      {LAYERS.map((l) => <span key={l.id}><LayerTag id={l.id} /> {l.about}</span>)}
    </div>
  )
}
