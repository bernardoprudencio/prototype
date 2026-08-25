import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addISODays } from './calendarUtils'

/**
 * WCAG 2.2 AA roving-tabindex + arrow-key handler for a date grid.
 *
 * Source: roverdotcom/web @ origin/ai-pilot-web-calendar
 *   src/frontend/react-lib/src/pages/account/NewCalendarPage/useRovingGridFocus.ts
 *
 * A "grid" here is the array of ISO dates for the cells visible in the
 * current month — padding cells are not part of it, callers hand in real
 * dates only.
 *
 *   - Arrows move focus 1 day (Left/Right) or 7 days (Up/Down).
 *   - Home goes to Sunday of the current row, End to Saturday.
 *   - PageUp/PageDown defer to `onPrevMonth` / `onNextMonth`.
 *   - Enter/Space activate via `onActivate`.
 *
 * Arrow navigation clamps to the visible month: crossing a month boundary
 * needs PageUp/PageDown or the chevrons. The POC took that shortcut to
 * avoid orchestrating focus restore against its fetch layer, and left
 * cross-month auto-advance as a follow-up; the constraint is kept here so
 * the keyboard model matches.
 */
export default function useRovingGridFocus({
  dates,
  selectedDate,
  today,
  minDate,
  onPrevMonth,
  onNextMonth,
  onActivate,
}) {
  const dateSet = useMemo(() => new Set(dates), [dates])
  const isBelowMin = useCallback((iso) => !!minDate && iso < minDate, [minDate])

  // Initial focus target: selected > today > first allowed day. Candidates
  // below `minDate` are skipped so focus never seeds on an inert cell.
  const computeInitial = useCallback(() => {
    if (selectedDate && dateSet.has(selectedDate) && !isBelowMin(selectedDate)) return selectedDate
    if (today && dateSet.has(today) && !isBelowMin(today)) return today
    return dates.find((d) => !isBelowMin(d)) ?? dates[0] ?? ''
  }, [selectedDate, today, dateSet, dates, isBelowMin])

  const [focusedDate, setFocusedDate] = useState(computeInitial)

  // Re-seed only when `selectedDate` actually changes, so a keyboard-driven
  // focus move isn't clobbered on every render.
  const lastSyncedSelected = useRef(selectedDate)
  useEffect(() => {
    if (selectedDate !== lastSyncedSelected.current) {
      lastSyncedSelected.current = selectedDate
      if (selectedDate && dateSet.has(selectedDate)) setFocusedDate(selectedDate)
    }
    // The month changed out from under us — snap back to a valid cell.
    if (!dateSet.has(focusedDate)) setFocusedDate(computeInitial())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, dateSet])

  // Set only by keyboard moves, so a mouse click doesn't steal focus back.
  const pendingFocus = useRef(undefined)
  const cellRefs = useRef(new Map())

  const registerCellRef = useCallback((date) => (el) => {
    if (el) cellRefs.current.set(date, el)
    else cellRefs.current.delete(date)
  }, [])

  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    cellRefs.current.get(target)?.focus()
    pendingFocus.current = undefined
  }, [focusedDate])

  const moveFocus = useCallback((next) => {
    if (!dateSet.has(next)) return
    pendingFocus.current = next
    setFocusedDate(next)
  }, [dateSet])

  const onGridKeyDown = useCallback((e) => {
    const { key } = e
    if (key === 'PageDown') { e.preventDefault(); onNextMonth?.(); return }
    if (key === 'PageUp') { e.preventDefault(); onPrevMonth?.(); return }
    if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
      // The native <button> already fires a click for these, so this only
      // runs when the grid container itself is the target.
      if (onActivate && e.target === e.currentTarget) {
        e.preventDefault()
        onActivate(focusedDate)
      }
      return
    }
    const isNav = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)
    if (!isNav) return
    e.preventDefault()

    let next = focusedDate
    if (key === 'ArrowLeft') next = addISODays(focusedDate, -1)
    else if (key === 'ArrowRight') next = addISODays(focusedDate, 1)
    else if (key === 'ArrowUp') next = addISODays(focusedDate, -7)
    else if (key === 'ArrowDown') next = addISODays(focusedDate, 7)
    else {
      const dow = new Date(`${focusedDate}T00:00:00`).getDay()
      next = addISODays(focusedDate, key === 'Home' ? -dow : 6 - dow)
    }

    if (!dateSet.has(next)) return   // clamp to the visible month
    if (isBelowMin(next)) return     // past days are inert
    moveFocus(next)
  }, [focusedDate, dateSet, moveFocus, onActivate, onNextMonth, onPrevMonth, isBelowMin])

  const handleCellClick = useCallback((date) => {
    if (dateSet.has(date)) setFocusedDate(date)
  }, [dateSet])

  return { focusedDate, registerCellRef, onGridKeyDown, handleCellClick }
}
