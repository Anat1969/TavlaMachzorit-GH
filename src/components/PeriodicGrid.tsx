import { forwardRef, type ReactNode } from 'react'
import { ELEMENTS, type Element } from '../data/elements'
import { colorOf, type ColorBy } from '../lib/colors'

interface Props {
  colorBy?: ColorBy
  selected?: string | null
  highlight?: Set<string> | null // when set, everything else is dimmed
  onPick: (sym: string) => void
  overlay?: ReactNode
}

// Reusable classic layout. Other views pass colour, highlight and an SVG overlay.
export const PeriodicGrid = forwardRef<HTMLDivElement, Props>(function PeriodicGrid(
  { colorBy = 'cat', selected, highlight, onPick, overlay }, ref,
) {
  const cells: ReactNode[] = []
  const at = new Map(ELEMENTS.map((e) => [`${e.row}-${e.col}`, e]))
  for (const row of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    if (row === 8) { cells.push(<div key="gap" className="fgap" />); continue }
    for (let col = 1; col <= 18; col++) {
      const e = at.get(`${row}-${col}`)
      if (e) cells.push(<Cell key={e.sym} e={e} colorBy={colorBy} sel={selected === e.sym} dim={!!highlight && !highlight.has(e.sym)} onPick={onPick} />)
      else if (col === 3 && (row === 6 || row === 7))
        cells.push(<div key={`f${row}`} className="cell empty" aria-hidden>{row === 6 ? '57–71' : '89–103'}</div>)
      else cells.push(<div key={`x${row}-${col}`} />)
    }
  }
  return (
    <div className="grid-wrap" ref={ref}>
      <div className="ptable" role="grid" aria-label="הטבלה המחזורית">{cells}</div>
      {overlay}
    </div>
  )
})

function Cell({ e, colorBy, sel, dim, onPick }: { e: Element; colorBy: ColorBy; sel: boolean; dim: boolean; onPick: (s: string) => void }) {
  return (
    <button
      className={`cell${sel ? ' sel' : ''}${dim ? ' dim' : ''}`}
      data-sym={e.sym}
      style={{ ['--cell' as string]: colorOf(e, colorBy), ['--i' as string]: e.z }}
      onClick={() => onPick(e.sym)}
      title={`${e.he} (${e.sym}), מספר אטומי ${e.z}`}
      aria-pressed={sel}
    >
      <span className="z">{e.z}</span>
      <span className="s">{e.sym}</span>
      <span className="n">{e.he}</span>
    </button>
  )
}
