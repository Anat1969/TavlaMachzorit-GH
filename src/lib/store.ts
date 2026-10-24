// Saved hypotheses (candidate new materials) and notes. localStorage, with a visible
// toast for every save and every failure — storage errors are never swallowed.
import { useCallback, useEffect, useRef, useState } from 'react'

export interface Hypothesis {
  id: string
  formula: string
  template: string
  replaced: string
  by: string
  score: number
  note: string
  createdAt: number
}

const KEY = 'tavla.hypotheses.v1'
type Toast = { text: string; err?: boolean } | null
let pushToast: (t: Toast) => void = () => {}

export function useToast() {
  const [t, setT] = useState<Toast>(null)
  useEffect(() => {
    let timer: number | undefined
    pushToast = (x) => {
      setT(x)
      clearTimeout(timer)
      timer = window.setTimeout(() => setT(null), x?.err ? 6000 : 1800)
    }
  }, [])
  return t
}
export const toast = (text: string, err = false) => pushToast({ text, err })

function read(): Hypothesis[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch (e) {
    toast('לא ניתן לקרוא השערות שמורות: ' + (e as Error).message, true)
    return []
  }
}

export function useHypotheses() {
  const [list, setList] = useState<Hypothesis[]>(read)
  const latest = useRef(list) // delayed saves (notes) must not overwrite newer changes
  const save = useCallback((change: (prev: Hypothesis[]) => Hypothesis[]) => {
    const next = change(latest.current)
    latest.current = next
    setList(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
      toast('נשמר')
    } catch (e) {
      toast('שגיאה בשמירה: ' + (e as Error).message + '. פנו מקום בדפדפן ונסו שוב.', true)
    }
  }, [])
  return {
    list,
    add: (h: Omit<Hypothesis, 'id' | 'createdAt' | 'note'>) =>
      save((l) => [{ ...h, id: crypto.randomUUID?.() ?? String(Date.now()), createdAt: Date.now(), note: '' }, ...l]),
    update: (id: string, note: string) => save((l) => l.map((h) => (h.id === id ? { ...h, note } : h))),
    remove: (id: string) => save((l) => l.filter((h) => h.id !== id)),
  }
}
