import { BY_SYM, CAT_LABEL, GEO_LABEL, GEO_NOTE } from '../data/elements'
import { colorOf, type ColorBy } from '../lib/colors'
import { LENSES, neighbours, sharedTemplates, type Lens } from '../lib/similarity'
import { href } from '../lib/router'
import { prettyFormula } from '../data/compounds'

interface Props { sym: string | null; lens?: Lens; colorBy?: ColorBy; onPick: (s: string) => void }

// One detail card used by every view: facts + nearest neighbours in the active lens.
export function ElementPanel({ sym, lens = 'compounds', colorBy = 'cat', onPick }: Props) {
  if (!sym)
    return (
      <div className="glass panel">
        <h2>בחרו יסוד</h2>
        <p className="muted small">לחיצה על יסוד מציגה את התכונות שלו ואת השכנים הקרובים ביותר שלו בעדשה שנבחרה. השכנים הם יסודות שעשויים להחליף אותו בחומר.</p>
      </div>
    )
  const e = BY_SYM.get(sym)!
  const lensInfo = LENSES.find((l) => l.id === lens)!
  const nb = neighbours(lens, sym, 6)
  return (
    <div className="glass panel">
      <div className="detail-head">
        <div className="big-tile" style={{ ['--cell' as string]: colorOf(e, colorBy) }}>{e.sym}</div>
        <div>
          <h2 style={{ margin: 0 }}>{e.he}</h2>
          <div className="mono small faint">Z={e.z} · מחזור {e.period} · {e.group ? `טור ${e.group}` : 'גוש f'}</div>
          <div className="small muted">{CAT_LABEL[e.cat]}</div>
        </div>
      </div>
      <dl className="facts">
        <dt>אלקטרושליליות</dt><dd>{e.en ?? 'אין נתון'}</dd>
        <dt>רדיוס קוולנטי</dt><dd>{e.radius ? `${e.radius} pm` : 'אין נתון'}</dd>
        <dt>אנרגיית יינון</dt><dd>{e.ie ? `${e.ie} eV` : 'אין נתון'}</dd>
        <dt>אלקטרוני ערכיות</dt><dd>{e.valence}</dd>
        <dt>גיאוכימיה</dt><dd style={{ fontFamily: 'inherit' }}>{GEO_LABEL[e.geo]}</dd>
      </dl>
      <p className="small muted" style={{ marginTop: 0 }}>{GEO_NOTE[e.geo]}</p>
      <h3>השכנים הקרובים: {lensInfo.label}</h3>
      {nb.length === 0 && <p className="small faint">ליסוד הזה אין מספיק נתונים בעדשה הזו.</p>}
      {nb.map(({ el, w }) => (
        <div key={el.sym} className="nb">
          <button className="chip sym-chip" style={{ ['--cell' as string]: colorOf(el, colorBy) }} onClick={() => onPick(el.sym)} title={`עבור ל${el.he}`}>{el.sym}</button>
          <span style={{ minWidth: 70 }}>{el.he}</span>
          <span className="bar"><b style={{ width: `${Math.round(w * 100)}%` }} /></span>
          <span className="mono small">{w.toFixed(2)}</span>
        </div>
      ))}
      {lens === 'compounds' && nb[0] && (
        <p className="small muted">
          תבניות משותפות עם {nb[0].el.sym}: <span className="mono" dir="ltr">{sharedTemplates(sym, nb[0].el.sym).slice(0, 8).map(prettyFormula).join(' ')}</span>
        </p>
      )}
      <div className="row" style={{ marginTop: 8 }}>
        <a className="btn" href={href('lab', { el: sym })}>נסו החלפות במעבדה</a>
        <a className="btn" href={href('network', { lens, el: sym })}>הצג ברשת</a>
      </div>
    </div>
  )
}
