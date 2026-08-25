import React, { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { colors } from '../../tokens'
import { useIsWide } from '../../lib/useMediaQuery'
import { ANNOUNCE } from '../../data/calendarCopy'
import { buildCalendarData, CALENDAR_GCA } from '../../data/calendarData'
import { CAL_DIMS } from './calendarTheme'
import { formatAnnouncementDate, isPastDate, toISODate } from '../../lib/calendarUtils'
import CalendarHeader from './CalendarHeader'
import MonthLayout from './MonthLayout'
import StubScreen from '../StubScreen'

const CONTENT_WIDTH = 1140

// `URL_DATE_PARAM` / `ISO_DATE_RE` (NewCalendarContainer.tsx:44-46).
const URL_DATE_PARAM = 'date'
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// The POC's `isValidIsoDate` round-trips the string through a Date so that a
// shape-valid but nonexistent day (2026-02-30) is rejected rather than silently
// rolling forward into March.
function isValidIsoDate(value) {
  if (!ISO_DATE_RE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00`)
  return !Number.isNaN(parsed.getTime()) && toISODate(parsed) === value
}

/**
 * Port of `NewCalendarContainer.tsx` — all of the calendar's state, and the
 * page shell from `NewCalendarPage.tsx`.
 *
 * State model (`:230-300`): `selectedDate` is always set — a day is never
 * deselected — with `rangeStart` / `rangeEnd` layered on top for a multi-day
 * selection. `viewYear` / `viewMonth` are *decoupled* from the selection and
 * merely seeded from it, so paging the month chevrons moves the grid without
 * disturbing what's selected.
 *
 * `?date=` persistence is the POC's, with one substitution: the POC writes via
 * `history.replaceState`, which cannot work here because under `HashRouter`
 * `window.location.search` is always empty — the query lives inside the hash.
 * `useSearchParams` with `{ replace: true }` gives the same
 * no-new-history-entry behaviour through the router. A past `?date=` clamps to
 * today, as it does in the POC, since past days are inert.
 *
 * Deferred, and why: everything the availability editor needs
 * (`patchAvailability`, `useOptimisticMutation`, `inFlightRef`, `isSaving`) is
 * commit 5's, so `onOpenSheet` is inert here and the tap cadence's save-in-
 * progress guard has nothing to guard yet — the rule is ported and reads the
 * ref so that commit only has to fill the ref in. The compact layout is commit
 * 6 and the 3-day layout and view switcher are commit 7.
 */
export default function CalendarScreen() {
  const navigate = useNavigate()
  const isWide = useIsWide()
  const [searchParams, setSearchParams] = useSearchParams()

  const today = toISODate(new Date())

  // `readInitialSelectedDate` (:52-68) — an absent, malformed, or past `?date=`
  // all resolve to today.
  const [selectedDate, setSelectedDate] = useState(() => {
    const raw = searchParams.get(URL_DATE_PARAM)
    if (!raw || !isValidIsoDate(raw) || isPastDate(raw)) return today
    return raw
  })
  const [rangeStart, setRangeStart] = useState(null)
  const [rangeEnd, setRangeEnd] = useState(null)

  const seed = new Date(`${selectedDate}T00:00:00`)
  const [viewYear, setViewYear] = useState(seed.getFullYear())
  const [viewMonth, setViewMonth] = useState(seed.getMonth() + 1)

  const [announcement, setAnnouncement] = useState('')
  const [isConfirmingAvailability, setIsConfirmingAvailability] = useState(false)
  const [gcaConfirmed, setGcaConfirmed] = useState(false)

  // Placeholder for commit 5's synchronous in-flight flag (`:210-213`). It is
  // read by rule 2 below and never set yet.
  const inFlightRef = useRef(false)

  const data = useMemo(() => buildCalendarData(viewYear, viewMonth), [viewYear, viewMonth])
  const gca = gcaConfirmed ? { ...CALENDAR_GCA, daysSinceLastUpdate: 0 } : CALENDAR_GCA

  const announce = (message) => setAnnouncement(message)

  const commitSelectedDate = (date) => {
    setSelectedDate(date)
    const next = new URLSearchParams(searchParams)
    next.set(URL_DATE_PARAM, date)
    setSearchParams(next, { replace: true })
  }

  // `syncViewToDate` (:302-316) — bring the clicked day's month into view. When
  // a range was just formed, the anchor backs off two days so a 3-day window
  // ends on the range end; only the month half of that matters here.
  const syncViewToDate = (date) => {
    const d = new Date(`${date}T00:00:00`)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth() + 1)
  }

  /**
   * The tap cadence, `handleDayClick` (:324-391). Six rules, in order:
   *   1. a past day is inert
   *   2. a save in flight blocks selection changes
   *   3. a click while a range is active clears both anchors and starts over
   *   4. re-clicking the selected day is a no-op — the invariant is that
   *      exactly one day is always selected
   *   5. a click *before* the selected day re-anchors rather than forming a
   *      backwards range
   *   6. a click after it forms selectedDate → clicked as the range
   */
  const handleDayClick = (date) => {
    if (isPastDate(date)) {
      announce(ANNOUNCE.pastNotEditable)
      return
    }
    if (inFlightRef.current) {
      announce(ANNOUNCE.saveInProgress)
      return
    }
    if (rangeStart && rangeEnd) {
      setRangeStart(null)
      setRangeEnd(null)
      commitSelectedDate(date)
      syncViewToDate(date)
      announce(ANNOUNCE.selected(formatAnnouncementDate(date)))
      return
    }
    if (date === selectedDate) return
    if (date < selectedDate) {
      commitSelectedDate(date)
      syncViewToDate(date)
      announce(ANNOUNCE.selected(formatAnnouncementDate(date)))
      return
    }
    setRangeStart(selectedDate)
    setRangeEnd(date)
    commitSelectedDate(date)
    syncViewToDate(date)
    announce(ANNOUNCE.rangeSelected(
      formatAnnouncementDate(selectedDate), formatAnnouncementDate(date),
    ))
  }

  const goToMonth = (delta) => {
    const next = new Date(viewYear, viewMonth - 1 + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth() + 1)
  }

  // `handleConfirmAvailability` (:187-193). The prototype has no request to
  // await, so the two announcements land back to back and the blurb drops out
  // once `daysSinceLastUpdate` reaches 0 — its own null branch.
  const handleConfirmAvailability = () => {
    setIsConfirmingAvailability(true)
    announce(ANNOUNCE.updating)
    setGcaConfirmed(true)
    setIsConfirmingAvailability(false)
  }

  const openConversation = (booking) => {
    if (booking.conversationUrl) navigate(booking.conversationUrl, { state: { type: 'today' } })
  }

  // The compact layout arrives in commit 6. Until then `/calendar` is only
  // reachable at wide width — the web navbar's dropdown is wide-only and the
  // `CALENDAR` tab is still unwired — so this branch is a placeholder rather
  // than a squeezed desktop layout.
  if (!isWide) {
    return <StubScreen title="Calendar" note="The compact calendar is not built yet." />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {/* `aria-live` mirror for the selection announcements (`:441-450`). */}
      <div aria-live="polite" aria-atomic="true" style={{
        position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
        overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
      }}>
        {announcement}
      </div>

      <div className="hide-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* `NewCalendarPage` pads 40px at desktop (`padding="10x"`); the page
            caps at the prototype's shared 1140px content width. */}
        <div style={{
          maxWidth: CONTENT_WIDTH, margin: '0 auto',
          padding: `${CAL_DIMS.pagePadY}px ${CAL_DIMS.pagePadX}px`,
        }}>
          <CalendarHeader year={viewYear} />
          <MonthLayout
            data={data}
            selectedDate={selectedDate}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            gca={gca}
            isConfirmingAvailability={isConfirmingAvailability}
            onConfirmAvailability={handleConfirmAvailability}
            onPrevMonth={() => goToMonth(-1)}
            onNextMonth={() => goToMonth(1)}
            onDayClick={handleDayClick}
            onOpenSheet={undefined}
            onOpenConversation={openConversation}
          />
        </div>
      </div>
    </div>
  )
}
