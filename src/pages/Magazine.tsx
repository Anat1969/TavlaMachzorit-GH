// The magazine: one article for every discovery, in two series.
// Articles are static A4 pages built by articles/build.mjs, each with a PDF and a Word version.
import { useEffect, useState } from 'react'
import { Rich } from '../components/Rich'

interface Entry { id: string; no: number; kicker: string; title: [string, string]; dek: string; cover: { img: string; caption: string; kind: string } }
const SERIES = [
  { key: 'tavla', name: 'טבלה מחזורית כרשת', about: 'כתבות מחקר: הכללים שהמכונה גילתה, ואיך היא בדקה אותם.', index: 'articles/index.json', base: new URL('articles/', document.baseURI).href },
  { key: 'biomatic', name: 'BIOMATIC · מהטבע לחומר', about: 'מהטבע, דרך החומר, אל הבניין. כתבה לכל אתגר.', index: 'articles/biomatic-index.json', base: 'https://biomatic-weld.vercel.app/articles/' },
]

export function Magazine() {
  const [data, setData] = useState<Record<string, Entry[] | 'error'>>({})
  useEffect(() => {
    SERIES.forEach((s) => fetch(s.index).then((r) => r.json()).then((d) => setData((x) => ({ ...x, [s.key]: d }))).catch(() => setData((x) => ({ ...x, [s.key]: 'error' }))))
  }, [])
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">כתבות</div>
          <h1>כתבה לכל תגלית</h1>
          <p><Rich text="כל כתבה מפרידה בין ==מה התגלה, מה ידוע כבר, ומה עוד פתוח==. כל מספר בה חושב במנועי האפליקציה. לכל כתבה יש PDF להורדה וגרסת Word לעריכה." /></p>
        </div>
      </div>
      {SERIES.map((s) => {
        const list = data[s.key]
        return (
          <section key={s.key} className="stack">
            <h2 className="home-h2">{s.name}</h2>
            <p className="muted lead">{s.about}</p>
            {list === 'error' && <p className="glass panel sig-bad">לא הצלחתי לטעון את רשימת הכתבות. נסו לרענן את הדף.</p>}
            {!list && <p className="small faint">טוען</p>}
            {Array.isArray(list) && (
              <div className="mag-grid">
                {list.map((a, i) => {
                  const url = (f: string) => new URL(f, s.base).href
                  return (
                    <article key={a.id} className="glass mag-card" style={{ animationDelay: `${i * 70}ms` }}>
                      <a className="mag-cover" href={url(`${a.id}.html`)} target="_blank" rel="noreferrer">
                        <img src={url(a.cover.img)} alt={a.cover.caption} loading="lazy" />
                        <span className="mag-tag">{a.cover.kind}</span>
                      </a>
                      <div className="mag-body">
                        <span className="eyebrow">{a.kicker}</span>
                        <h3><span className="thin">{a.title[0]}</span> {a.title[1]}</h3>
                        <p className="small muted">{a.dek}</p>
                        <div className="row">
                          <a className="btn primary" href={url(`${a.id}.html`)} target="_blank" rel="noreferrer">קריאה</a>
                          <a className="btn" href={url(`${a.id}.pdf`)} target="_blank" rel="noreferrer">PDF</a>
                          <a className="btn" href={url(`${a.id}.docx`)} download>Word</a>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}
