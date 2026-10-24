import { useMemo, useState } from 'react'
import { BY_SYM } from '../data/elements'
import { COMPOUNDS, FORMULA_SET, parseFormula, prettyFormula, formatFormula } from '../data/compounds'
import { candidates, W_HISTORY, W_PROPERTY } from '../lib/substitute'
import { colorOf } from '../lib/colors'
import { setParam, href } from '../lib/router'
import { useHypotheses, toast } from '../lib/store'

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
                  <div style={{ fontSize: 40, fontWeight: 200, direction: 'ltr', textAlign: 'right' }}>{prettyFormula(formula)}</div>
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
                הסימון "השערה" אומר רק שהנוסחה לא נמצאת במדגם: ייתכן שהחומר כבר ידוע בספרות, או שאינו יציב.
              </p>
            </div>
            <div className="glass">
              {cands.length === 0 && <p className="panel muted">אין מספיק נתונים על היסוד הזה כדי להציע החלפות.</p>}
              {cands.map((c) => {
                const e = BY_SYM.get(c.sym)!
                return (
                  <div key={c.sym} className="cand">
                    <a className="chip sym-chip" href={href('matrix', { el: c.sym, lens: 'compounds' })} style={{ ['--cell' as string]: colorOf(e) }} title={`${e.he} במטריצה`}>{c.sym}</a>
                    <div style={{ minWidth: 0 }}>
                      <div className="row">
                        <span className="formula" dir="ltr">{prettyFormula(c.formula)}</span>
                        {c.known ? <span className="tag known">ידוע במאגר</span> : <span className="tag new">השערה</span>}
                      </div>
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
