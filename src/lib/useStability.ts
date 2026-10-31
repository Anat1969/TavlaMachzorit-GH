// The stability table is large, so pages in the main bundle load it on demand.
import { useEffect, useState } from 'react'
type Mod = typeof import('./stability')
let cached: Mod | null = null
export function useStability() {
  const [m, setM] = useState<Mod | null>(cached)
  useEffect(() => {
    if (cached) return
    import('./stability').then((x) => { cached = x; setM(x) }).catch(() => setM(null))
  }, [])
  return m
}
