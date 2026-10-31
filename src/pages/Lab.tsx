import { useMemo, useState } from 'react'
import { BY_SYM } from '../data/elements'
import { COMPOUNDS, FORMULA_SET, parseFormula, prettyFormula, formatFormula } from '../data/compounds'
import { candidates, W_HISTORY, W_PROPERTY } from '../lib/substitute'
import { colorOf } from '../lib/colors'
import { setParam, href } from '../lib/router'
import { useHypotheses, toast } from '../lib/store'
import { COMPOUND_LIFE } from '../data/everyday'
import { RealWorld } from '../components/ElementPanel'
import type { Candidate } from '../lib/substitute'
import { StabilityBadge } from '../components/Stability'

const STARTERS = ['GaAs', 'MoS2', 'NaCl', 'TiO2', 'MgB2', 'CdTe', 'LaB6', 'SiC', 'Bi2Te3', 'Li3N']

export function Lab({ params }: { params: URLSearchParams }) {
  const el = params.get('el')
  const fromEl = el ? COMPOUNDS.find((c) => c.parts.some((p) => p[0] === el))?.formula : undefined
  const formula = params.get('f') || fromEl || 'GaAs'
  const parts = useMemo(() => parseFormula(formula).filter(([s]) => BY_SYM.has(s)), [formula])
  const valid = parts.length >= 2 && formatFormula(parts) === formula
  const [pos, setPos] = useState(() => Math.max(0, parts.findIndex((p) => p[0] === el)))
  const index = Math.min(pos, Math.max(0, parts.length - 1))
  const cands = useMemo(() => (valid ? candidates(parts, index, 12) : []), [parts, index, valid])
  const [draft, setDraft] = useState(formula)
  const [preview, setPreview] = useState<string | null>(null) // candidate symbol shown in the formula
  const [pinned, setPinned] = useState<string | null>(null)   // candidate whose invention path is shown
  const path = cands.find((c) => c.sym === (pinned ?? cands.find((x) => !x.known)?.sym)) ?? cands[0]
  const hyp = useHypotheses()
  const containing = el ? COMPOUNDS.filter((c) => c.parts.some((p) => p[0] === el)).slice(0, 24) : []

  const choose = (f: string) => { setParam('f', f); setDraft(f); setPos(0) }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">מעבדת חומרים</div>
          <h1>מתרכובת ידועה להשערה חדשה</h1>
          <p>בוחרים תרכובת ויסוד אחד בתוכה. המערכת מדרגת יסודות שיכולים להחליף אותו, לפי שתי שכבות נפרדות: <b>היסטוריה כימית</b> (באילו תבניות הם כבר הופיעו יחד) ו<b>תכונות</b> (אלקטרושליליות, ערכיות, יינון). תוצאה שלא נמצאת במאגר מסומנת כהשערה.</p>
        </div>
      </div>

      <div className="glass panel stack">
        <div className="row">
          <span className="eyebrow">תרכובת מוצא</span>
          {STARTERS.map((f) => <button key={f} className="chip" aria-pressed={f === formula} onClick={() => choose(f)}>{prettyFormula(f)}</button>)}
        </div>
        <form className="row" onSubmit={(e) => { e.preventDefault(); const p = parseFormula(draft.trim()); if (p.length >= 2 && p.every(([s]) => BY_SYM.has(s))) choose(formatFormula(p)); else toast('נוסחה לא תקינה. כתבו סמלים באותיות לועזיות, למשל ZnO או Fe2O3', true) }}>
          <label className="small muted" htmlFor="ff">או כתבו נוסחה</label>
          <input id="ff" className="field mono" dir="ltr" value={draft} onChange={(e) => setDraft(e.target.value)} style={{ width: 140 }} />
          <button className="btn" type="submit">טען</button>
        </form>
        {el && containing.length > 0 && (
          <div className="row">
            <span className="eyebrow">תרכובות עם {el}</span>
            {containing.map((c) => <button key={c.formula} className="chip" aria-pressed={c.formula === formula} onClick={() => choose(c.formula)}>{prettyFormula(c.formula)}</button>)}
          </div>
        )}
      </div>

      {valid && (
        <div className="split">
          <div className="stack">
            <div className="glass panel stack">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div className="eyebrow">{FORMULA_SET.has(formula) ? 'תרכובת ידועה במאגר' : 'נוסחה מחוץ למאגר'}</div>
                  <div className="swap-formula" dir="ltr" aria-live="polite">
                    {parts.map(([sym, n], i) => {
                      const shownSym = i === index && preview ? preview : sym
                      const swapped = i === index && !!preview
                      return (
                        <span key={i + shownSym} className={`slot${i === index ? ' target' : ''}${swapped ? ' swapped' : ''}`} style={{ ['--cell' as string]: colorOf(BY_SYM.get(shownSym)!) }}>
                          {shownSym}{n > 1 && <sub>{n}</sub>}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <div className="row" role="group" aria-label="איזה יסוד להחליף">
                  <span className="eyebrow">להחליף את</span>
                  {parts.map(([s], i) => (
                    <button key={s + i} className="chip sym-chip" aria-pressed={i === index} style={{ ['--cell' as string]: colorOf(BY_SYM.get(s)!) }} onClick={() => setPos(i)}>{s}</button>
                  ))}
                </div>
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                ציון = {W_HISTORY} × היסטוריה + {W_PROPERTY} × תכונות. שתי השכבות מוצגות בנפרד, כדי שתוכלו לראות כשהן חלוקות.
                רחפו על מועמד כדי לראות את ההחלפה בנוסחה. הפס העליון הוא ההיסטוריה והתחתון התכונות. הסימון "השערה" אומר רק שהנוסחה לא נמצאת במדגם: ייתכן שהחומר כבר ידוע בספרות, או שאינו יציב.
              </p>
            </div>
            {path && <InventionPath key={formula + index + path.sym} template={formula} orig={parts[index][0]} cand={path} />}
            <div className="glass">
              {cands.length === 0 && <p className="panel muted">אין מספיק נתונים על היסוד הזה כדי להציע החלפות.</p>}
              {cands.map((c) => {
                const e = BY_SYM.get(c.sym)!
                return (
                  <div key={c.sym} className={`cand${path?.sym === c.sym ? ' pinned' : ''}`} onClick={(ev) => { if (!(ev.target as HTMLElement).closest('button,a')) setPinned(c.sym) }} onMouseEnter={() => setPreview(c.sym)} onMouseLeave={() => setPreview(null)} onFocus={() => setPreview(c.sym)} onBlur={() => setPreview(null)}>
                    <a className="chip sym-chip" href={href('matrix', { el: c.sym, lens: 'compounds' })} style={{ ['--cell' as string]: colorOf(e) }} title={`${e.he} במטריצה`}>{c.sym}</a>
                    <div style={{ minWidth: 0 }}>
                      <div className="row">
                        <span className="formula" dir="ltr">{prettyFormula(c.formula)}</span>
                        {c.known ? <span className="tag known">ידוע במאגר</span> : <><span className="tag new">השערה</span><StabilityBadge parts={parseFormula(c.formula)} /></>}
                      </div>
                      <div className="layers" aria-hidden><i style={{ width: `${c.history * 100}%` }} /><b style={{ width: `${c.property * 100}%` }} /></div>
                      <div className="small faint mono">היסטוריה {c.history.toFixed(2)} · תכונות {c.property.toFixed(2)}{c.evidence.length > 0 && <> · <span dir="ltr">{c.evidence.map(prettyFormula).join('  ')}</span></>}</div>
                    </div>
                    <span className="mono">{c.score.toFixed(2)}</span>
                    <button className="btn" disabled={c.known || hyp.list.some((h) => h.formula === c.formula)}
                      onClick={() => hyp.add({ formula: c.formula, template: formula, replaced: parts[index][0], by: c.sym, score: c.score })}>
                      {hyp.list.some((h) => h.formula === c.formula) ? 'נשמר' : 'שמור השערה'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="stack">
            <div className="glass panel">
              <h2>השערות שלי</h2>
              <p className="small muted" style={{ marginTop: 0 }}>נשמרות בדפדפן הזה. אפשר להוסיף לכל השערה הערה: מה לבדוק, מה מצאתם בספרות, למה היא מעניינת.</p>
              {hyp.list.length === 0 && <p className="small faint">עוד אין השערות. שמרו מועמד מהרשימה כדי להתחיל.</p>}
              {hyp.list.map((h) => (
                <div key={h.id} className="hyp">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <b dir="ltr" style={{ fontSize: 18, fontWeight: 400 }}>{prettyFormula(h.formula)}</b>
                    <span className="mono small faint">{h.replaced}→{h.by} ב-{prettyFormula(h.template)} · {h.score.toFixed(2)}</span>
                  </div>
                  <NoteField value={h.note} onSave={(v) => hyp.update(h.id, v)} />
                  <div className="row">
                    <button className="chip" onClick={() => choose(h.formula)}>המשך ממנה</button>
                    <DeleteButton onConfirm={() => hyp.remove(h.id)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Saves when the user pauses typing or leaves the field.
function NoteField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value)
  const [timer, setTimer] = useState<number>()
  return (
    <textarea className="field small" value={v} placeholder="הערה"
      onChange={(e) => { setV(e.target.value); clearTimeout(timer); const t = e.target.value; setTimer(window.setTimeout(() => onSave(t), 600)) }}
      onBlur={() => { clearTimeout(timer); if (v !== value) onSave(v) }} />
  )
}

// Two-step delete inside the page: the first click arms, the second deletes.
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false)
  return armed
    ? <button className="chip" style={{ borderColor: 'var(--c-alkali)' }} onClick={onConfirm} onBlur={() => setArmed(false)} autoFocus>לחצו שוב כדי למחוק</button>
    : <button className="chip" onClick={() => setArmed(true)}>מחק</button>
}

// The invention path: from a compound we use, through the shared patterns, to a new formula.
function InventionPath({ template, orig, cand }: { template: string; orig: string; cand: Candidate }) {
  const life = COMPOUND_LIFE[template]
  return (
    <div className="glass panel invention">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>מסלול ההמצאה</h2>
        <span className="small faint">לחצו על מועמד ברשימה כדי לראות את המסלול שלו</span>
      </div>
      <div className="stations">
        <div className="station" style={{ animationDelay: '0ms' }}>
          <span className="eyebrow">1 · מה שכבר קיים</span>
          <b className="big" dir="ltr">{prettyFormula(template)}</b>
          <p className="small muted">{life ? `בחיים: ${life}` : 'תרכובת מוכרת במאגר'}</p>
          <RealWorld sym={orig} height={150} />
        </div>
        <div className="connector" style={{ animationDelay: '500ms' }} aria-hidden />
        <div className="station bridge" style={{ animationDelay: '700ms' }}>
          <span className="eyebrow">2 · מה {orig} ו-{cand.sym} חולקים</span>
          <div className="evidence" dir="ltr">
            {cand.evidence.length ? cand.evidence.map((t, i) => <span key={t} className="tpl" style={{ animationDelay: `${900 + i * 220}ms` }}>{prettyFormula(t)}</span>) : <span className="tpl">אין תבניות משותפות</span>}
          </div>
          <p className="small muted">{cand.evidence.length ? `בכל התבניות האלה ${cand.sym} כבר נכנס למקום של ${orig}. זה ההיגיון של ההחלפה.` : 'ההצעה נשענת רק על דמיון בתכונות.'}</p>
          <div className="layers big-layers" aria-label={`היסטוריה ${cand.history.toFixed(2)}, תכונות ${cand.property.toFixed(2)}`}>
            <i style={{ width: `${cand.history * 100}%` }} /><b style={{ width: `${cand.property * 100}%` }} />
          </div>
          <span className="mono small faint">היסטוריה {cand.history.toFixed(2)} · תכונות {cand.property.toFixed(2)}</span>
        </div>
        <div className="connector" style={{ animationDelay: '1500ms' }} aria-hidden />
        <div className="station" style={{ animationDelay: '1700ms' }}>
          <span className="eyebrow">3 · ההחלפה</span>
          <b className="big" dir="ltr">{prettyFormula(cand.formula)}</b>
          <p className="small">{cand.known ? <span className="tag known">כבר ידוע במאגר</span> : <><span className="tag new">השערה לחומר חדש</span> <StabilityBadge parts={parseFormula(cand.formula)} full /></>}</p>
          <RealWorld sym={cand.sym} height={150} />
        </div>
      </div>
    </div>
  )
}
