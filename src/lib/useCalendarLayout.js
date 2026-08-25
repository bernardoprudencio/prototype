// ─── Calendar layout variant ─────────────────────────────────────────────────
//
// Port of the POC's `NewCalendarPage/useLayoutVariant.ts`. Two wide layouts —
// the month grid (default, and the one that got all twelve build phases) and
// the 3-day columns — with the same precedence the POC used:
//
//   ?view= in the URL  →  localStorage  →  'month'
//
// One substitution. The POC wrote both localStorage AND the URL by hand via
// `window.history.replaceState`, because react-lib is pinned to react-router
// v5 and has no `useSearchParams`. This app is on v7 under a `HashRouter`,
// where `window.location.search` is empty (the query lives inside the hash),
// so hand-rolling `replaceState` would silently never read back. `useSearchParams`
// handles the hash correctly and is the faithful equivalent.
//
// Putting the variant in the URL follows the same precedent as the inbox
// filter (InboxScreen.jsx:49-51): the address is the state, so a deep link and
// a reload agree.

import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export const LAYOUT_VARIANT = { MONTH: 'month', THREE_DAY: 'threeDay' }

const STORAGE_KEY = 'newCalendar.layoutVariant'
const QUERY_PARAM = 'view'
const DEFAULT_VARIANT = LAYOUT_VARIANT.MONTH

const isValidVariant = (value) =>
  value === LAYOUT_VARIANT.MONTH || value === LAYOUT_VARIANT.THREE_DAY

const readStored = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isValidVariant(stored) ? stored : undefined
  } catch {
    // Private-mode Safari throws on localStorage. Persistence is non-critical.
    return undefined
  }
}

export function useCalendarLayout() {
  const [params, setParams] = useSearchParams()

  const fromQuery = params.get(QUERY_PARAM)
  const variant = isValidVariant(fromQuery) ? fromQuery : readStored() ?? DEFAULT_VARIANT

  const setVariant = useCallback(
    (next) => {
      if (!isValidVariant(next)) return
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // ignore — non-critical persistence
      }
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev)
          out.set(QUERY_PARAM, next)
          return out
        },
        { replace: true }
      )
    },
    [setParams]
  )

  // On first mount, push the resolved variant into the URL so a deep link
  // with no `?view=` and a stored preference end up agreeing. `replace` so it
  // does not add a history entry the back button has to step through.
  useEffect(() => {
    if (isValidVariant(fromQuery)) return
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev)
        out.set(QUERY_PARAM, variant)
        return out
      },
      { replace: true }
    )
    // Mount only, matching the POC's own empty-dep sync effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { variant, setVariant }
}
