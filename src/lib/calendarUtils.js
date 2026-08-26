// ─── Calendar pure functions ─────────────────────────────────────────────────
//
// Port of the POC's `NewCalendarPage/utils.ts` (roverdotcom/web @
// ai-pilot-web-calendar, 535 lines). No React, no state — every function here
// is pure and every one is a faithful port unless a comment says otherwise.
//
// Two parse conventions carry over from the POC, and mixing them up is the
// classic way to break a calendar by one day:
//
//   - LOCAL MIDNIGHT — `new Date(`${iso}T00:00:00`)` — for date *math*, so
//     adding a day is adding a day in the user's own timezone.
//   - UTC NOON — `Date.UTC(y, m, d, 12, 0, 0)` — for date *labels*, so day
//     rollover from a timezone offset cannot flip the rendered date.
//
// Overlap with `dateUtils.js`, deliberately not merged: that module speaks
// `Date` objects (`addDays(date, n) -> Date`), while the POC's calendar speaks
// ISO strings end to end (`addISODays(iso, n) -> iso`). Collapsing them would
// mean rewriting either the calendar or every existing schedule screen, so the
// two coexist and the ISO-string variants are named distinctly.
//
// Known POC bugs, ported as-is rather than silently fixed:
//   - `getDatesInRange` steps with `setDate(+1)`, so a 23h/25h DST day is off
//     by an hour internally (the ISO output is still correct).
//   - An out-of-range ISO date in the URL (`2026-02-30`) rolls forward rather
//     than being rejected.

import { DAY_STATE_PHRASE, DAY_CELL_PHRASE, SELECTION, bookingCountLabel } from '../data/calendarCopy'

// ── Day state ───────────────────────────────────────────────────────────────
// The four-state day model, aligned 1:1 with the React Native availability
// calendar's `getColor()`
// (reactNativeApp/src/pages/calendar/AvailablityCalendar/utils.tsx). Past-date
// dimming is a separate flag on the tile, not a fifth state.
export const DAY_STATE = {
  FULLY_AVAILABLE: 'fullyAvailable',
  SOME_BOOKINGS: 'someBookings',
  FULLY_BOOKED: 'fullyBooked',
  NOT_AVAILABLE: 'notAvailable',
}

export function getDayState(calendars, hasBookings) {
  const slots = calendars ?? []
  const total = slots.reduce((acc, c) => acc + c.spacesOccupied, 0)
  const notAvailable = slots.length > 0 && slots.every((c) => (c.spacesAvailable ?? 0) === 0)

  if (notAvailable && hasBookings) return DAY_STATE.FULLY_BOOKED
  if (notAvailable) return DAY_STATE.NOT_AVAILABLE
  if (total === 0) return DAY_STATE.FULLY_AVAILABLE
  return DAY_STATE.SOME_BOOKINGS
}

// ── ISO helpers ─────────────────────────────────────────────────────────────
// `toISODate` is the same computation as `dateUtils.dateKey`; kept under the
// POC's name so ported call sites read as they did there.
export function toISODate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

export function isPastDate(iso) {
  return iso < toISODate(new Date())
}

// POC name: `addDays`. Renamed to keep it distinct from `dateUtils.addDays`,
// which takes and returns `Date`.
export function addISODays(iso, days) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function getDatesInRange(start, end) {
  const dates = []
  const current = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  while (current <= endDate) {
    dates.push(toISODate(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function monthStartEnd(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { startDate, endDate }
}

// ── Locale-aware names ──────────────────────────────────────────────────────
// The POC replaced hardcoded English arrays with `Intl.DateTimeFormat`,
// memoized at module load so the constructor cost is paid once. Every anchor
// below is UTC noon on a fixed reference date — those are calendar constants,
// not schedule data, so they are the one place a literal year is correct.

function buildMonthNames(style) {
  const fmt = new Intl.DateTimeFormat(undefined, { month: style })
  const names = []
  for (let m = 0; m < 12; m += 1) names.push(fmt.format(new Date(Date.UTC(2020, m, 15, 12, 0, 0))))
  return names
}

export const MONTH_NAMES = buildMonthNames('long')
const SHORT_MONTH_NAMES = buildMonthNames('short')

// Anchored to a known Sunday (2024-01-07) at UTC noon and stepped one day at a
// time, so the Sun..Sat order is stable regardless of the locale's own
// first-day-of-week preference. Index 0 is Sunday, matching `Date#getDay()`.
const SUNDAY_ANCHOR_UTC = Date.UTC(2024, 0, 7, 12, 0, 0)
const DAY_MS = 24 * 3600 * 1000

function buildDayNames(style) {
  const fmt = new Intl.DateTimeFormat(undefined, { weekday: style })
  const out = []
  for (let i = 0; i < 7; i += 1) out.push(fmt.format(new Date(SUNDAY_ANCHOR_UTC + i * DAY_MS)))
  return out
}

const SHORT_DAY_NAMES = buildDayNames('short')
const NARROW_DAY_NAMES = buildDayNames('narrow')

// Single-letter headers for the mini-month and 3-day day-of-week rows.
export function weekdayLetters() {
  return NARROW_DAY_NAMES
}

// "Sun"/"Mon"… headers for the desktop month grid.
export function shortDayHeaders() {
  return SHORT_DAY_NAMES
}

// ── Formatters ──────────────────────────────────────────────────────────────

// "April 2026" — month / 3-day / mini-month headings.
export function formatMonthYear(year, month) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, month - 1, 15, 12, 0, 0))
  )
}

// "April" — panel headers where the adjacent mini-cal makes the year redundant.
export function monthNameOnly(year, month) {
  return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(
    new Date(Date.UTC(year, month - 1, 15, 12, 0, 0))
  )
}

// "Apr 2026" — compact headers where the long month is too wide.
export function formatShortMonthYear(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })
}

// "Apr" — pairs with a separately-passed year so the header can hide the year
// at narrow widths without recomputing on resize.
export function formatShortMonth(month) {
  return new Date(2000, month - 1, 1).toLocaleDateString(undefined, { month: 'short' })
}

// "Wed, Apr 25" — compact single-day headers that don't need the year.
export function formatWeekdayShortDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// "Tue, Jun 23 2026" — comma after the weekday, none before the year.
export function formatShortDateWithYear(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return `${SHORT_DAY_NAMES[d.getDay()]}, ${SHORT_MONTH_NAMES[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`
}

// "Tuesday, June 23".
export function formatLongDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// "Tuesday, June 23 2026" — year appended with NO comma before it. Intl's
// default `{weekday, month, day, year}` inserts a comma between day and year in
// en-US and many other locales, so the parts are hand-assembled to drop that
// one separator while keeping the rest of the locale's punctuation.
export function formatLongDateWithYear(iso) {
  const d = new Date(`${iso}T00:00:00`)
  const parts = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).formatToParts(d)
  let out = ''
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i]
    const isDayYearSeparator =
      part.type === 'literal' &&
      part.value.includes(',') &&
      parts[i - 1]?.type === 'day' &&
      parts[i + 1]?.type === 'year'
    out += isDayYearSeparator ? ' ' : part.value
  }
  return out
}

// "April 12" — screen-reader announcements when a range anchor is set.
export function formatAnnouncementDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  })
}

// Aria-label date, rendered at UTC noon so an offset cannot flip the day.
function formatIsoForAriaLabel(iso) {
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

// ── Data selectors ──────────────────────────────────────────────────────────

// A flat equality filter, with no range math, because rows arrive pre-expanded
// to one per day — the POC's server did that and `calendarData.js` does it here.
export function bookingsForDate(bookings, date) {
  return bookings.filter((b) => b.date === date)
}

export function slotsForDate(data, date) {
  return data.availability.find((a) => a.date === date)?.calendars ?? []
}

// Slots + preferences → the editor's per-service form state.
export function buildServiceEdits(slots, preferences) {
  return preferences.map((pref) => {
    const slot = slots.find((c) => c.calendarId === pref.calendarId)
    const spacesAvailable = slot?.spacesAvailable ?? pref.spacesAvailable
    const spacesOccupied = slot?.spacesOccupied ?? 0
    return {
      calendarId: pref.calendarId,
      name: pref.name,
      isOn: (spacesAvailable ?? 0) > 0,
      spacesAvailable: Math.max(spacesAvailable ?? 0, 0),
      spacesOccupied,
      maximumSpacesAvailable: pref.maximumSpacesAvailable,
      defaultSpacesAvailable: pref.spacesAvailable,
      // Derived purely from capacity > 1. The POC removed an earlier magic
      // -number check (`calendarId !== HOUSE_SITTING_CALENDAR_ID`) because a
      // service whose capacity is always 1 already falls out of this test.
      supportsCapacity: pref.maximumSpacesAvailable > 1,
      isAway: pref.isAway,
    }
  })
}

// ── Month grid skeleton ─────────────────────────────────────────────────────
// Leading empty cells for the Sunday-start day-of-week prefix, then one entry
// per day of the month. NO trailing padding — the POC never renders
// neighbouring-month days, so the last row is deliberately short.
export function buildMonthCells(year, month) {
  const firstDow = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i += 1) cells.push({})
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d })
  }
  return cells
}

// ── Accessibility ───────────────────────────────────────────────────────────

export function dayStateToAriaPhrase(state) {
  return DAY_STATE_PHRASE[state]
}

// Part order: date → bookings → state → today → selected/range. Undefined
// parts are omitted. The booking chips inside a cell are non-interactive (the
// cell itself is the only touch target), so this label is the only path back to
// the booking summaries for screen-reader users.
export function composeDayCellAriaLabel({
  date,
  state,
  bookingCount,
  bookingLabels,
  isToday,
  isSelected,
  isRangeStart,
  isRangeEnd,
  isInRange,
}) {
  const parts = [formatIsoForAriaLabel(date)]

  if (typeof bookingCount === 'number' && bookingCount > 0) {
    const countPhrase = bookingCountLabel(bookingCount)
    parts.push(bookingLabels?.length > 0 ? `${countPhrase}: ${bookingLabels.join(', ')}` : countPhrase)
  }

  const phrase = state ? dayStateToAriaPhrase(state) : undefined
  if (phrase) parts.push(phrase)

  if (isToday) parts.push(DAY_CELL_PHRASE.today)

  if (isRangeStart) parts.push(DAY_CELL_PHRASE.rangeStart)
  else if (isRangeEnd) parts.push(DAY_CELL_PHRASE.rangeEnd)
  else if (isInRange) parts.push(DAY_CELL_PHRASE.inRange)
  else if (isSelected) parts.push(DAY_CELL_PHRASE.selected)

  return parts.join(', ')
}

// ── Range classification ────────────────────────────────────────────────────
// Away services are excluded on every date:
//   available   → every date has at least one non-away service with spaces > 0
//   unavailable → every date has all non-away services at 0
//   mix         → anything else
//
// A date with no snapshot counts as default-available. A date where every
// service is away contributes to neither bucket and falls through to `mix`,
// which is the conservative answer for the caller.
export const RANGE_STATUS = { AVAILABLE: 'available', UNAVAILABLE: 'unavailable', MIX: 'mix' }

export function computeRangeStatus(availability, range, awayCalendarIds) {
  if (range.length === 0) return RANGE_STATUS.MIX
  const awaySet = new Set(awayCalendarIds)

  let allDaysAvailable = true
  let allDaysUnavailable = true

  for (const date of range) {
    const day = availability.find((a) => a.date === date)
    if (!day) {
      allDaysUnavailable = false
    } else {
      const nonAway = day.calendars.filter((c) => !awaySet.has(c.calendarId))
      if (nonAway.length === 0) {
        allDaysAvailable = false
        allDaysUnavailable = false
      } else {
        if (!nonAway.some((c) => (c.spacesAvailable ?? 0) > 0)) allDaysAvailable = false
        if (!nonAway.every((c) => (c.spacesAvailable ?? 0) === 0)) allDaysUnavailable = false
      }
    }
    if (!allDaysAvailable && !allDaysUnavailable) return RANGE_STATUS.MIX
  }

  if (allDaysAvailable) return RANGE_STATUS.AVAILABLE
  if (allDaysUnavailable) return RANGE_STATUS.UNAVAILABLE
  return RANGE_STATUS.MIX
}

// ── Selection → CTA ─────────────────────────────────────────────────────────
// The three-way branch behind both the rail's SelectionSummary and the compact
// selection bar. `mode` is the sheet mode the caller opens with.
//   single                 → primary, "Edit my availability"
//   range-mark-available   → primary, "Mark services as available"
//   range-mark-unavailable → default, "Mark services as unavailable"
export const SHEET_MODE = {
  EDIT_CAPACITY: 'edit-capacity',
  EDIT_AVAILABILITY: 'edit-availability',
  EDIT_UNAVAILABILITY: 'edit-unavailability',
}

export function getPrimaryActionForSelection({ isRange, rangeStatus }) {
  if (!isRange) return { kind: 'single', mode: SHEET_MODE.EDIT_CAPACITY }
  if (rangeStatus === RANGE_STATUS.UNAVAILABLE) {
    return { kind: 'range-mark-available', mode: SHEET_MODE.EDIT_AVAILABILITY }
  }
  return { kind: 'range-mark-unavailable', mode: SHEET_MODE.EDIT_UNAVAILABILITY }
}

// ── Selection subtitle ──────────────────────────────────────────────────────
// Shared by the rail overlay and the editor's own header, which is why the
// `hideUnavailable` flag exists: in the editor a "Not available" label would be
// redundant with the mode CTAs, while in the overlay it is the primary signal.
//   range (any)                                        → null
//   single, booked > 0                                  → bookedLabel
//   single, 0 booked, unavailable, hideUnavailable      → bookedLabel
//   single, 0 booked, unavailable, !hideUnavailable     → "Not available"
//   single, 0 booked, not unavailable                   → bookedLabel
export function getSelectionSubtitle({
  rangeStatus,
  bookedSpaces,
  isRange,
  bookedLabel,
  hideUnavailable = false,
}) {
  if (isRange) return null
  if (bookedSpaces > 0) return bookedLabel
  if (rangeStatus === RANGE_STATUS.UNAVAILABLE && !hideUnavailable) return SELECTION.notAvailable
  return bookedLabel
}

// ── Availability patches ────────────────────────────────────────────────────
// The POC's optimistic-update machinery, minus React Query. Its
// `useNewCalendarData` keeps a ref-held `Map<'YYYY-MM', CalendarUpdate[]>` of
// patches and re-applies them over every fetched month on each merge pass
// (`useNewCalendarData.ts:130-137, 309-333`). Here the "fetch" is
// `buildCalendarData`, which is synchronous and re-derived per visible month,
// so the same overlay applies at exactly the same point in the pipeline.
//
// One divergence, and it is a reduction: the POC stores a *list* of updates per
// month and replays it in order, so a date edited twice holds two entries. We
// collapse to `{ [date]: { [calendarId]: spacesAvailable } }`, which is the same
// final state — last write wins either way — without the list growing for the
// life of the session.

/** `monthPrefix` (NewCalendarContainer.tsx:90-92). */
export function monthKeyOf(iso) {
  return iso.slice(0, 7)
}

/**
 * Fold a `CalendarUpdate[]` into the month-keyed patch store.
 * `store` is `{ [monthKey]: { [date]: { [calendarId]: spacesAvailable } } }`.
 */
export function mergeAvailabilityPatches(store, updates) {
  const next = { ...store }
  updates.forEach((u) => {
    const mk = monthKeyOf(u.date)
    const month = { ...(next[mk] ?? {}) }
    const day = { ...(month[u.date] ?? {}) }
    u.calendars.forEach((c) => { day[c.calendarId] = c.spacesAvailable })
    month[u.date] = day
    next[mk] = month
  })
  return next
}

/**
 * `applyPatchesToAvailability` (useNewCalendarData.ts:93-124). Overwrites
 * `spacesAvailable` on the slots the patch names and leaves the rest alone.
 * A patched date the base array doesn't carry is appended rather than dropped,
 * so a range edit that reaches past the built month still shows.
 */
export function applyAvailabilityPatches(availability, patchesByDate) {
  if (!patchesByDate || Object.keys(patchesByDate).length === 0) return availability
  const byDate = new Map(availability.map((day) => [day.date, day]))
  Object.entries(patchesByDate).forEach(([date, cals]) => {
    const existing = byDate.get(date)
    if (!existing) {
      byDate.set(date, {
        date,
        calendars: Object.entries(cals).map(([calendarId, spacesAvailable]) => ({
          calendarId: Number(calendarId),
          spacesAvailable,
          spacesOccupied: 0,
          manualAvailability: false,
          manualSpacesAvailable: null,
        })),
      })
      return
    }
    byDate.set(date, {
      ...existing,
      calendars: existing.calendars.map((slot) => (
        cals[slot.calendarId] === undefined
          ? slot
          : { ...slot, spacesAvailable: cals[slot.calendarId] }
      )),
    })
  })
  return Array.from(byDate.values())
}

/**
 * `undoFor` (NewCalendarContainer.tsx:224-239) — the inverse patch, built from
 * the pre-mutation snapshot. A slot the snapshot didn't carry falls back to the
 * optimistic value, which makes the undo a no-op there rather than clobbering
 * it with 0.
 */
export function buildUndoUpdates(updates, snapshot) {
  return updates.map((u) => {
    const priorDay = snapshot.find((d) => d.date === u.date)
    return {
      date: u.date,
      calendars: u.calendars.map((c) => {
        const priorSlot = priorDay?.calendars.find((s) => s.calendarId === c.calendarId)
        return {
          calendarId: c.calendarId,
          spacesAvailable: priorSlot?.spacesAvailable ?? c.spacesAvailable,
        }
      }),
    }
  })
}

/**
 * `runOptimisticMutation` (useOptimisticMutation.ts:37-71) — apply, save, and
 * either announce success or roll back and announce failure. Returns whether
 * the save succeeded; the caller closes the editor only on `true`.
 */
export async function runOptimisticMutation({
  optimisticPatch, undoPatch, save, successMessage, errorMessage, announce, onSuccess,
}) {
  optimisticPatch()
  let success = false
  try {
    success = await save()
  } catch {
    success = false
  }
  if (success) {
    announce(successMessage, 'polite')
    onSuccess?.()
    return true
  }
  undoPatch()
  announce(errorMessage, 'assertive')
  return false
}
