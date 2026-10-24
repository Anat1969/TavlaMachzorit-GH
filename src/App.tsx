import { useEffect, useState } from 'react'
import { href, useRoute } from './lib/router'
import { useToast } from './lib/store'
import { Home } from './pages/Home'
import { Matrix } from './pages/Matrix'
import { Network } from './pages/Network'
import { Secondary } from './pages/Secondary'
import { Spiral } from './pages/Spiral'
import { Lab } from './pages/Lab'
import { TablePage } from './pages/TablePage'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX { interface IntrinsicElements { 'ai-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { project?: string } } }
}

export const PAGES = [
  { id: 'matrix', label: 'מטריצה' },
  { id: 'network', label: 'רשת' },
  { id: 'secondary', label: 'מחזוריות משנית' },
  { id: 'spiral', label: 'ספירלה' },
  { id: 'lab', label: 'מעבדת חומרים' },
  { id: 'table', label: 'טבלת נתונים' },
]

export function App() {
  const route = useRoute()
  const t = useToast()
  const [theme, setTheme] = useState<string | null>(() => { try { return localStorage.getItem('tavla.theme') } catch { return null } })
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme
    else delete document.documentElement.dataset.theme
  }, [theme])
  useEffect(() => { window.scrollTo(0, 0) }, [route.page])
  const toggleTheme = () => {
    const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    const next = dark ? 'light' : 'dark'
    setTheme(next)
    try { localStorage.setItem('tavla.theme', next) } catch { /* theme is a convenience only */ }
  }
  const p = route.params
  const page = (() => {
    switch (route.page) {
      case 'matrix': return <Matrix params={p} />
      case 'network': return <Network params={p} />
      case 'secondary': return <Secondary params={p} />
      case 'spiral': return <Spiral params={p} />
      case 'lab': return <Lab params={p} />
      case 'table': return <TablePage />
      default: return <Home />
    }
  })()
  return (
    <div className={`shell${route.page === 'home' || route.page === 'lab' || route.page === 'table' ? '' : ' fit'}`}>
      <div className="orbs" aria-hidden><span /><span /><span /></div>
      <header className="topbar">
        <a className="brand" href={href('home')} aria-label="טבלה מחזורית כרשת, דף הבית">
          <AppMark />
          <span>טבלה מחזורית כרשת</span>
        </a>
        <nav className="nav" aria-label="ניווט ראשי">
          {PAGES.map((pg) => (
            <a key={pg.id} href={href(pg.id)} aria-current={route.page === pg.id ? 'page' : undefined}>{pg.label}</a>
          ))}
        </nav>
        <div className="top-tools">
          <button className="chip" onClick={toggleTheme} title="מעבר בין מצב בהיר לכהה">בהיר / כהה</button>
          <ai-menu project="TavlaMachzorit-GH"><span className="logo-btn">אד' ענת שטיבלמן A&amp;I</span></ai-menu>
        </div>
      </header>
      <main id="main">{page}</main>
      {t && <div className={`toast glass${t.err ? ' err' : ''}`} role="status">{t.text}</div>}
    </div>
  )
}

export function AppMark() {
  // the app icon: a small molecule-like network on a tile
  const pts = [[8, 22], [16, 8], [24, 22], [16, 16]]
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden>
      <rect x="1" y="1" width="30" height="30" fill="url(#bm)" />
      <defs><linearGradient id="bm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6fa8ff" /><stop offset="1" stopColor="#c79bff" /></linearGradient></defs>
      {[[0, 3], [1, 3], [2, 3], [0, 1], [1, 2]].map(([a, b], i) => <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke="#0b1020" strokeWidth="1.6" />)}
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 3 ? 3.2 : 2.6} fill="#fff" stroke="#0b1020" strokeWidth="1.2" />)}
    </svg>
  )
}
