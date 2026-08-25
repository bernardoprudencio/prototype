import React, { useMemo } from 'react'
import { colors, textStyles } from '../../tokens'
import { ANNOUNCE, HEADER } from '../../data/calendarCopy'
import {
  addISODays, bookingsForDate, getDayState, toISODate, weekdayLetters,
} from '../../lib/calendarUtils'
import useRovingGridFocus from '../../lib/useRovingGridFocus'
import { ChevronLeftIcon, ChevronRightIcon } from '../../assets/icons'
import { CAL_COLORS, CAL_TYPE } from './calendarTheme'
import DayCell from './DayCell'
import NavButton from './NavButton'

/**
 * Port of `components/CompactWeekStrip.tsx` — the single-row, 7-tile strip the
 * compact layout shows in place of the mini-month once the calendar is
 * collapsed. Without it, collapsing would leave no way to move between days.
 *
 * Sunday-start, like every other grid in the calendar: `startOfWeek` steps back
 * by `getDay()`, so the strip and the mini-month it replaces show the same seven
 * columns under the same letters. (`ScheduleScreen`'s day-picker is Monday-start
 * and stays that way — see the plan's divergence 2.)
 *
 * One deliberate difference from `MiniMonthCalendar`, and it is the POC's
 * (`:217-222`): `hasBookings` here is a **union** of `bookingsForDate(...)
 * .length > 0` and `slots.some(s => s.spacesOccupied > 0)`, so a day that has a
 * booking row but zero occupied spaces still reads as booked. The mini-month and
 * the month grid use the slot check alone.
 *
 * Paging needs no new state: the compact layout hands us
 * `onDayClick(addISODays(selectedDate, ±7))`, so a week step is just a day
 * selection seven days away and `selectedDate` remains the single source of
 * truth for which week is visible. `useRovingGridFocus` is grid-shaped, so
 * Up/Down (±7 days) clamp to this week's dates and no-op, while PageUp/PageDown
 * reach the same week handlers.
 *
 * The strip renders no range highlight: the POC passes neither `rangeStart` nor
 * `rangeEnd` into its cells (`:232-251`), so a multi-day selection reads only in
 * the fixed bar below. Ported as-is — the mini-month is where a range shows.
 *
 * Dropped: `isLoading` and its shimmer tiles.
 *
 * NOTE (POC status): this strip was never design-reviewed — it is the least
 * finished piece of the least finished layout (`NewCalendarPageCompact.tsx`).
 * Ported as-is rather than redesigned.
 */

/** `startOfWeek` (`:48-51`). Sunday-start. */
function startOfWeek(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return addISODays(iso, -d.getDay())
}

/** `formatWeekStart` (`:57-61`) — "Apr 21", composed into "Week of {label}". */
function formatWeekStart(iso) {
  const start = new Date(`${iso}T00:00:00`)
  return `${start.toLocaleDateString(undefined, { month: 'short' })} ${start.getDate()}`
}

export default function CompactWeekStrip({
  selectedDate, availability, bookings, onDayClick, onPrevWeek, onNextWeek,
}) {
  const dow = weekdayLetters()

  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate])
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addISODays(weekStart, i)),
    [weekStart],
  )
  const today = toISODate(new Date())
  const slotsByDate = useMemo(
    () => new Map(availability.map((a) => [a.date, a.calendars])),
    [availability],
  )

  const { focusedDate, registerCellRef, onGridKeyDown, handleCellClick } = useRovingGridFocus({
    dates: weekDates, selectedDate, today, minDate: today,
    onPrevMonth: onPrevWeek, onNextMonth: onNextWeek, onActivate: onDayClick,
  })

  const headingText = ANNOUNCE.weekOf(formatWeekStart(weekStart))
  const gridCols = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }

  return (
    <div>
      {/* Heading + chevrons on one line, mirroring the mini-month's row. */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
      }}>
        <h2 style={{
          ...textStyles.heading300, color: CAL_COLORS.textPrimary, lineHeight: 1, margin: 0,
        }}>
          {headingText}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavButton label={HEADER.prevWeek} onClick={onPrevWeek}>
            <ChevronLeftIcon size={20} color={colors.link} />
          </NavButton>
          <NavButton label={HEADER.nextWeek} onClick={onNextWeek}>
            <ChevronRightIcon size={20} color={colors.link} />
          </NavButton>
        </div>
      </div>

      {/* Weekday letters, keyed off each date's own `getDay()` so the row
          cannot drift from the tiles below it. */}
      <div style={gridCols}>
        {weekDates.map((date) => (
          <div key={`dow-${date}`} style={{
            height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ ...CAL_TYPE.miniDowHeader, color: CAL_COLORS.textTertiary }}>
              {dow[new Date(`${date}T00:00:00`).getDay()]}
            </span>
          </div>
        ))}
      </div>

      <div role="grid" aria-label={headingText} onKeyDown={onGridKeyDown} style={gridCols}>
        <div role="row" style={{ display: 'contents' }}>
          {weekDates.map((date) => {
            const slots = slotsByDate.get(date) ?? []
            const dayBookings = bookingsForDate(bookings, date)
            const hasBookings = dayBookings.length > 0 || slots.some((s) => s.spacesOccupied > 0)
            const state = getDayState(slots, hasBookings)
            const isSelected = date === selectedDate
            const isPast = date < today
            const dayNum = new Date(`${date}T00:00:00`).getDate()

            return (
              <DayCell
                key={date}
                state={state}
                isSelected={isSelected}
                isToday={date === today}
                isPast={isPast}
                date={date}
                bookingCount={dayBookings.length}
                size="mini"
                onClick={isPast ? undefined : () => { handleCellClick(date); onDayClick(date) }}
                role="gridcell"
                tabIndex={isPast ? -1 : (date === focusedDate ? 0 : -1)}
                buttonRef={isPast ? undefined : registerCellRef(date)}
              >
                <span style={{
                  ...textStyles.text100,
                  fontWeight: isSelected ? 600 : 400,
                  color: isPast ? CAL_COLORS.textMuted : CAL_COLORS.textPrimary,
                }}>
                  {dayNum}
                </span>
              </DayCell>
            )
          })}
        </div>
      </div>

    </div>
  )
}
