import React, { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { colors } from '../../tokens'
import { useIsWide } from '../../lib/useMediaQuery'
import { ANNOUNCE, successBannerMessage } from '../../data/calendarCopy'
import { buildCalendarData, CALENDAR_GCA } from '../../data/calendarData'
import { CAL_DIMS } from './calendarTheme'
import {
  applyAvailabilityPatches, buildUndoUpdates, formatAnnouncementDate,
  formatLongDateWithYear, formatShortDateWithYear, isPastDate,
  runOptimisticMutation, SHEET_MODE, toISODate,
} from '../../lib/calendarUtils'
import { useApp } from '../../context/AppContext'
import { TAB_PATHS } from '../../lib/tabPaths'
import Snackbar from '../../components/Snackbar'
import TabBar from '../../components/TabBar'
import AvailabilitySheet from './AvailabilitySheet'
import CalendarHeader from './CalendarHeader'
import CompactLayout from './CompactLayout'
import MonthLayout from './MonthLayout'

const CONTENT_WIDTH = 1140

// `A11yHiddenBox` (useCalendarAnnouncements.tsx:69) — the visually-hidden
// wrapper the live regions render inside.
const SR_ONLY = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
}

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
 * Saving mirrors `handleSaveServiceList` (`:409-468`): an optimistic patch
 * into `AppContext.calendarAvailability`, then a "save", then either a polite
 * announcement or an undo patch plus an assertive one. The save here is
 * synchronous and can only fail deliberately, via the `calendarSaveFails` dev
 * flag — that is what keeps the POC's rollback path reachable without inventing
 * random failures during user testing.
 *
 * Both widths render from this one container, as in the POC: `NewCalendarPage`
 * picks a layout by `useIsCompact()` and passes every layout the same props.
 * Here that gate is `useIsWide()` (769px, the prototype's only breakpoint) and
 * the two layouts are `MonthLayout` / `CompactLayout`. The compact branch also
 * renders the `TabBar` — `/calendar` is the third tab, and it is this commit
 * that makes tapping it do anything.
 *
 * Deferred: the 3-day layout and the view switcher are commit 7.
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

  // Two live regions, polite and assertive, as
  // `useCalendarAnnouncements.tsx:49-86` renders them. The nonce makes React
  // re-mount the region so two identical consecutive messages are both read.
  const [politeMsg, setPoliteMsg] = useState({ text: '', nonce: 0 })
  const [assertiveMsg, setAssertiveMsg] = useState({ text: '', nonce: 0 })
  const [snackbar, setSnackbar] = useState('')
  const [sheetMode, setSheetMode] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirmingAvailability, setIsConfirmingAvailability] = useState(false)
  const [gcaConfirmed, setGcaConfirmed] = useState(false)

  // `inFlightRef` (`:210-213`) — a synchronous mirror of `isSaving`, because the
  // state update lands a tick too late to gate a click in the same frame.
  const inFlightRef = useRef(false)

  const { calendarAvailability, patchCalendarAvailability, calendarSaveFails } = useApp()

  const base = useMemo(() => buildCalendarData(viewYear, viewMonth), [viewYear, viewMonth])

  // The patch overlay sits exactly where the POC's does — over the freshly
  // derived month, on every render (`useNewCalendarData.ts:130-137`). The store
  // is month-keyed, so a range spanning a boundary patches both months and each
  // one surfaces when it is the visible month.
  const monthKey = `${viewYear}-${String(viewMonth).padStart(2, '0')}`
  const data = useMemo(() => ({
    ...base,
    availability: applyAvailabilityPatches(base.availability, calendarAvailability[monthKey]),
  }), [base, calendarAvailability, monthKey])

  const gca = gcaConfirmed ? { ...CALENDAR_GCA, daysSinceLastUpdate: 0 } : CALENDAR_GCA

  const announce = (message, politeness = 'polite') => {
    if (politeness === 'assertive') {
      setAssertiveMsg(prev => ({ text: message, nonce: prev.nonce + 1 }))
      return
    }
    setPoliteMsg(prev => ({ text: message, nonce: prev.nonce + 1 }))
  }

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

  // `handleOpenSheet` / `handleCloseSheet` (`:470-490`) — both refuse while a
  // save is in flight, and say so rather than failing silently.
  const handleOpenSheet = (action) => {
    if (inFlightRef.current || isSaving) {
      announce(ANNOUNCE.saveInProgress)
      return
    }
    setSheetMode(action?.mode ?? SHEET_MODE.EDIT_CAPACITY)
  }

  const handleCloseSheet = () => {
    if (inFlightRef.current || isSaving) {
      announce(ANNOUNCE.saveInProgress)
      return
    }
    setSheetMode(null)
  }

  /**
   * `handleSaveServiceList` (`:409-468`). The undo payload is captured from the
   * *pre-patch* snapshot, so a failure restores exactly what was on screen.
   * A multi-day save also clears the range anchors up front — the POC does this
   * inside `optimisticPatch` so the grid stops showing a selection it is about
   * to have overwritten.
   */
  const handleSaveServiceList = async (updates) => {
    if (updates.length === 0) return
    const undoUpdates = buildUndoUpdates(updates, data.availability)
    const dayCount = updates.length
    const isSingleDay = dayCount === 1

    const startDate = updates[0].date
    const endDate = updates[dayCount - 1].date
    const changedIds = new Set(updates[0].calendars.map(c => c.calendarId))
    const serviceNames = data.preferences
      .filter(p => changedIds.has(p.calendarId))
      .map(p => p.name)

    inFlightRef.current = true
    setIsSaving(true)
    let result
    try {
      result = await runOptimisticMutation({
        optimisticPatch: () => {
          if (!isSingleDay) {
            setRangeStart(null)
            setRangeEnd(null)
          }
          announce(ANNOUNCE.updating)
          patchCalendarAvailability(updates)
        },
        undoPatch: () => patchCalendarAvailability(undoUpdates),
        // The prototype's "save" is the patch that already happened. It only
        // fails when the dev flag says to, which is what makes the rollback
        // path demonstrable without random failures in a user test.
        save: () => !calendarSaveFails,
        successMessage: isSingleDay ? ANNOUNCE.saved : ANNOUNCE.daysUpdated(dayCount),
        errorMessage: isSingleDay ? ANNOUNCE.saveFailed : ANNOUNCE.saveFailedDays(dayCount),
        announce,
      })
    } finally {
      inFlightRef.current = false
      setIsSaving(false)
    }

    // The visible confirmation is the POC's success banner copy
    // (`useCalendarSuccessBanner.tsx:141-157`), carried by the prototype's
    // `Snackbar`. Its Undo button is not ported — the sitter can just edit the
    // day again, and there is no request to cancel.
    setSnackbar(result
      ? successBannerMessage({
        services: serviceNames,
        startLabel: isSingleDay ? formatLongDateWithYear(startDate) : formatShortDateWithYear(startDate),
        endLabel: isSingleDay ? '' : formatShortDateWithYear(endDate),
      })
      : (isSingleDay ? ANNOUNCE.saveFailed : ANNOUNCE.saveFailedDays(dayCount)))

    // Only a successful save closes the editor (`:467`).
    if (result !== false) setSheetMode(null)
  }

  const openConversation = (booking) => {
    if (booking.conversationUrl) navigate(booking.conversationUrl, { state: { type: 'today' } })
  }

  // Every prop below is shared by both layouts, exactly as `NewCalendarPage`
  // spreads one object into whichever layout `useIsCompact()` selects.
  const layoutProps = {
    data,
    selectedDate,
    rangeStart,
    rangeEnd,
    gca,
    isConfirmingAvailability,
    onConfirmAvailability: handleConfirmAvailability,
    onPrevMonth: () => goToMonth(-1),
    onNextMonth: () => goToMonth(1),
    onDayClick: handleDayClick,
    onOpenSheet: handleOpenSheet,
    onOpenConversation: openConversation,
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: colors.white, position: 'relative',
    }}>
      {/* The two live regions from `useCalendarAnnouncements`. */}
      <div key={`polite-${politeMsg.nonce}`} aria-live="polite" aria-atomic="true" style={SR_ONLY}>
        {politeMsg.text}
      </div>
      <div key={`assertive-${assertiveMsg.nonce}`} role="alert" aria-live="assertive" aria-atomic="true" style={SR_ONLY}>
        {assertiveMsg.text}
      </div>

      {isWide ? (
        <div className="hide-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {/* `NewCalendarPage` pads 40px at desktop (`padding="10x"`); the page
              caps at the prototype's shared 1140px content width. */}
          <div style={{
            maxWidth: CONTENT_WIDTH, margin: '0 auto',
            padding: `${CAL_DIMS.pagePadY}px ${CAL_DIMS.pagePadX}px`,
          }}>
            <CalendarHeader year={viewYear} />
            <MonthLayout {...layoutProps} />
          </div>
        </div>
      ) : (
        // The compact layout owns its own header (the month/year `<h1>` plus the
        // collapse toggle), its own scroller, and the fixed selection bar, so it
        // takes the flex slot whole rather than sitting inside a shared one.
        <CompactLayout {...layoutProps} />
      )}

      <AvailabilitySheet
        isOpen={sheetMode !== null}
        mode={sheetMode ?? SHEET_MODE.EDIT_CAPACITY}
        selectedDate={selectedDate}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        preferences={data.preferences}
        availability={data.availability}
        isSaving={isSaving}
        onSaveAll={handleSaveServiceList}
        onClose={handleCloseSheet}
      />

      <Snackbar message={snackbar} onDone={() => setSnackbar('')} />

      {/* Third tab, and until this commit the only one whose route was
          missing from every `TAB_PATHS` map. `TabBar` stands itself down at
          wide width, so no gate is needed here. */}
      <TabBar activeTab="calendar" onTabSelect={(id) => {
        const path = TAB_PATHS[id]
        if (path) navigate(path)
      }} />
    </div>
  )
}
