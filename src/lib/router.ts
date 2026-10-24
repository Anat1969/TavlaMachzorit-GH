// Hash routing: #/page?key=value. The URL always carries the current view,
// so "copy link" shares exactly what is on screen.
import { useEffect, useState } from 'react'

export interface Route { page: string; params: URLSearchParams }

function parse(): Route {
  const raw = location.hash.replace(/^#\/?/, '')
  const [page, q] = raw.split('?')
  return { page: page || 'home', params: new URLSearchParams(q ?? '') }
}

export function useRoute() {
  const [r, setR] = useState(parse)
  useEffect(() => {
    const on = () => setR(parse())
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return r
}

export function href(page: string, params: Record<string, string | undefined> = {}) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v)
  const s = q.toString()
  return `#/${page}${s ? '?' + s : ''}`
}

/** Update one query param of the current page without adding history noise. */
export function setParam(key: string, value: string | null) {
  const { page, params } = parse()
  if (value) params.set(key, value)
  else params.delete(key)
  const s = params.toString()
  history.replaceState(null, '', `#/${page}${s ? '?' + s : ''}`)
  dispatchEvent(new HashChangeEvent('hashchange'))
}
