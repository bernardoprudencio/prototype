import { useEffect, useState } from 'react'

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    mql.addEventListener('change', onChange)
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

// ── Shared width breakpoints ──────────────────────────────────────────────────
// There is no phone shell: every screen fills the viewport at every width (see
// `.app-shell` in global.css). So these queries are the single source of truth
// for "is there room for a wide layout?", and a screen that has one should gate
// it on these rather than reading `window.innerWidth` on every resize tick.
export const BREAKPOINTS = {
  // Two-column threshold used by the schedule screens. Equivalent to the
  // `window.innerWidth > 768` checks these screens hand-rolled before.
  wide: '(min-width: 769px)',
  // Service settings opts into a later threshold because its two columns carry
  // full rate tables rather than a 360px sidebar.
  extraWide: '(min-width: 880px)',
}

export const useIsWide = () => useMediaQuery(BREAKPOINTS.wide)
export const useIsExtraWide = () => useMediaQuery(BREAKPOINTS.extraWide)
