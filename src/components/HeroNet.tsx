import { useMemo } from 'react'
import { BY_SYM } from '../data/elements'
import { colorOf } from '../lib/colors'

// A small, fixed constellation from the real compound network, for the home page.
const NODES: [string, number, number][] = [
  ['Na', 120, 140], ['K', 70, 210], ['Li', 170, 80], ['Ag', 230, 170], ['Tl', 180, 250], ['Rb', 110, 290],
  ['Ga', 300, 90], ['Al', 360, 150], ['In', 330, 230], ['La', 270, 300], ['Y', 380, 300],
  ['Fe', 230, 380], ['Co', 300, 400], ['Ni', 170, 420], ['Si', 380, 380], ['Ge', 330, 460],
]
const EDGES = [['Na', 'K'], ['Na', 'Li'], ['Na', 'Ag'], ['K', 'Rb'], ['Rb', 'Tl'], ['Ag', 'Tl'], ['Li', 'Ga'], ['Ga', 'Al'], ['Ga', 'In'], ['Al', 'In'],
  ['In', 'La'], ['La', 'Y'], ['Al', 'Y'], ['Fe', 'Co'], ['Fe', 'Ni'], ['Co', 'Ni'], ['La', 'Fe'], ['Si', 'Ge'], ['Y', 'Si'], ['Co', 'Ge'], ['Ag', 'In']]

export function HeroNet() {
  const pos = useMemo(() => new Map(NODES.map(([s, x, y]) => [s, [x, y]])), [])
  return (
    <svg viewBox="30 40 400 460">
      <defs>
        <radialGradient id="hg" cx="35%" cy="30%"><stop offset="0" stopColor="#fff" stopOpacity="0.7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      {EDGES.map(([a, b]) => {
        const [x1, y1] = pos.get(a)!, [x2, y2] = pos.get(b)!
        const far = (a === 'Na' && b === 'Ag') || (a === 'Rb' && b === 'Tl') || (a === 'In' && b === 'La')
        return <line key={a + b} x1={x1} y1={y1} x2={x2} y2={y2} stroke={far ? 'var(--warn)' : 'var(--ink-faint)'} strokeOpacity={far ? 0.9 : 0.45} strokeWidth={far ? 2.2 : 1.4} strokeDasharray={far ? '5 4' : undefined} />
      })}
      {NODES.map(([s, x, y]) => (
        <g key={s}>
          <circle cx={x} cy={y + 6} r={19} fill="#000" opacity="0.25" />
          <circle cx={x} cy={y} r={19} fill={colorOf(BY_SYM.get(s)!)} stroke="rgba(0,0,0,.35)" />
          <circle cx={x} cy={y} r={19} fill="url(#hg)" />
          <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="600" fill="#0b1020">{s}</text>
        </g>
      ))}
    </svg>
  )
}
