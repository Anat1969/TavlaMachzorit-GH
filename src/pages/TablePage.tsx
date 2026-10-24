import { useMemo, useState } from 'react'
import { ELEMENTS, CAT_LABEL, GEO_LABEL, type Category, type Element } from '../data/elements'
import { colorOf } from '../lib/colors'
import { contextCount, neighbours } from '../lib/similarity'
import { href } from '../lib/router'

type Key = 'z' | 'sym' | 'he' | 'period' | 'group' | 'en' | 'radius' | 'ie' | 'valence' | 'geo' | 'ctx' | 'nb'
const COLS: { k: Key; label: string }[] = [
  { k: 'z', label: 'Z' }, { k: 'sym', label: 'סמל' }, { k: 'he', label: 'שם' }, { k: 'period', label: 'מחזור' }, { k: 'group', label: 'טור' },
  { k: 'en', label: 'אלקטרושליליות' }, { k: 'radius', label: 'רדיוס pm' }, { k: 'ie', label: 'יינון eV' }, { k: 'valence', label: 'ערכיות' },
  { k: 'geo', label: 'גיאוכימיה' }, { k: 'ctx', label: 'תבניות במאגר' }, { k: 'nb', label: 'השכן הקרוב (תרכובות)' },
]

function val(e: Element, k: Key): string | number | null {
  if (k === 'ctx') return contextCount(e.sym)
  if (k === 'nb') return neighbours('compounds', e.sym, 1)[0]?.el.sym ?? null
  if (k === 'geo') return GEO_LABEL[e.geo]
  return e[k]
}

export function TablePage() {
  const [sort, setSort] = useState<{ k: Key; dir: 1 | -1 }>({ k: 'z', dir: 1 })
  const [closed, setClosed] = useState<Set<Category>>(new Set())
  const rows = useMemo(() => {
    const cmp = (a: Element, b: Element) => {
      const x = val(a, sort.k), y = val(b, sort.k)
      if (x === null) return 1
      if (y === null) return -1
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'he')) * sort.dir
    }
    return (Object.keys(CAT_LABEL) as Category[]).map((c) => ({ c, list: ELEMENTS.filter((e) => e.cat === c).sort(cmp) }))
  }, [sort])
  const toggle = (c: Category) => setClosed((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n })
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">טבלת נתונים</div>
          <h1>כל היסודות, כל התכונות</h1>
          <p>מקובצים לפי משפחה. לחיצה על כותרת עמודה ממיינת (לחיצה נוספת הופכת את הכיוון), ולחיצה על שורת משפחה מכווצת אותה. הסמל פותח את היסוד במטריצה, והשכן פותח את הרשת.</p>
        </div>
        <div className="row">
          <button className="chip" onClick={() => setClosed(new Set())}>הרחב הכל</button>
          <button className="chip" onClick={() => setClosed(new Set(Object.keys(CAT_LABEL) as Category[]))}>כווץ הכל</button>
        </div>
      </div>
      <div className="glass scroll fill" style={{ maxHeight: '75vh' }}>
        <table className="dtable">
          <thead>
            <tr>{COLS.map((c) => (
              <th key={c.k} onClick={() => setSort((s) => ({ k: c.k, dir: s.k === c.k ? (-s.dir as 1 | -1) : 1 }))} aria-sort={sort.k === c.k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                {c.label} {sort.k === c.k ? (sort.dir === 1 ? '▲' : '▼') : ''}
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {rows.map(({ c, list }) => [
              <tr key={c} className="grp" onClick={() => toggle(c)}>
                <td colSpan={COLS.length}><span style={{ display: 'inline-block', width: 10, height: 10, background: `var(--c-${c})`, marginInlineEnd: 8 }} />{CAT_LABEL[c]} <span className="faint mono">({list.length}) {closed.has(c) ? '+' : '−'}</span></td>
              </tr>,
              ...(closed.has(c) ? [] : list.map((e) => {
                const nb = val(e, 'nb') as string | null
                return (
                  <tr key={e.sym}>
                    <td className="mono">{e.z}</td>
                    <td><a href={href('matrix', { el: e.sym })} style={{ fontWeight: 600, color: colorOf(e) }}>{e.sym}</a></td>
                    <td><a href={href('spiral', { el: e.sym })}>{e.he}</a></td>
                    <td className="mono">{e.period}</td>
                    <td className="mono">{e.group ?? 'f'}</td>
                    <td className="mono">{e.en ?? '–'}</td>
                    <td className="mono">{e.radius ?? '–'}</td>
                    <td className="mono">{e.ie ?? '–'}</td>
                    <td className="mono">{e.valence}</td>
                    <td><a href={href('matrix', { el: e.sym, color: 'geo' })}>{GEO_LABEL[e.geo].split(':')[0]}</a></td>
                    <td className="mono">{contextCount(e.sym) ? <a href={href('lab', { el: e.sym })}>{contextCount(e.sym)}</a> : '–'}</td>
                    <td>{nb ? <a href={href('network', { el: e.sym, lens: 'compounds' })}>{nb}</a> : '–'}</td>
                  </tr>
                )
              })),
            ])}
          </tbody>
        </table>
      </div>
    </>
  )
}
