import React, { useMemo } from 'react'
import {
  bookingsForDate, buildMonthCells, formatMonthYear, getDayState,
  shortDayHeaders, slotsForDate, toISODate,
} from '../../lib/calendarUtils'
import useRovingGridFocus from '../../lib/useRovingGridFocus'
import { BOOKINGS } from '../../data/calendarCopy'
import { CAL_COLORS, CAL_DIMS, CAL_TYPE } from './calendarTheme'
import DayCell from './DayCell'

/**
 * The month grid — the day-of-week header plus the 7-column tile grid.
 *
 * Source: roverdotcom/web @ origin/ai-pilot-web-calendar
 *   .../NewCalendarPage/layouts/NewCalendarPageMonth.tsx:83-132, 452-614
 *
 * Extracted from the POC's month layout, which interleaves this grid with
 * its rail and header in one 620-line file. Only the grid comes here; the
 * page chrome around it lands with the layout itself.
 */

const MAX_STUBS_PER_CELL = 3   // NewCalendarPageMonth.tsx:31

// The daily-bookings serializer bakes per-day context (walk times, "Day n of
// m") into `subtitle` already, so a month cell only needs the service and the
// pets. NewCalendarPageMonth.tsx:67-70.
export function stubLabelFor(booking) {
  const pets = booking.pets.map((p) => p.name).join(', ')
  return `${booking.serviceName}: ${pets || booking.serviceName}`
}

// Rows are chunked to seven so each can carry role="row" — the WCAG 2.2 AA
// date-grid pattern. Trailing blanks pad the last row out to a full seven
// (NewCalendarPageMonth.tsx:119-129); they are empty cells, never
// neighbouring-month dates, which the POC deliberately never renders.
function buildMonthGrid(year, month, data, selectedDate, rangeStart, rangeEnd) {
  const blank = { dimmed: true, isSelected: false, isInRange: false, slots: [], bookings: [] }
  const cells = buildMonthCells(year, month).map((cell) => {
    if (!cell.date) return { ...blank }
    return {
      date: cell.date,
      day: cell.day,
      dimmed: false,
      isSelected: cell.date === selectedDate,
      isInRange: !!(rangeStart && rangeEnd && cell.date > rangeStart && cell.date < rangeEnd),
      slots: slotsForDate(data, cell.date),
      bookings: bookingsForDate(data.bookings, cell.date),
    }
  })
  const trailing = (7 - (cells.length % 7)) % 7
  for (let i = 0; i < trailing; i += 1) cells.push({ ...blank })
  return cells
}

// Past days are inert, so they leave the tab order entirely.
const cellTabIndex = (isPast, isFocusTarget) => (isPast ? -1 : isFocusTarget ? 0 : -1)

export default function MonthGrid({
  data, selectedDate, rangeStart, rangeEnd, onDayClick, onPrevMonth, onNextMonth,
}) {
  const { year, month } = data
  const cells = buildMonthGrid(year, month, data, selectedDate, rangeStart, rangeEnd)

  const rows = useMemo(() => {
    const out = []
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7))
    return out
  }, [cells])

  const monthDates = useMemo(() => cells.map((c) => c.date).filter(Boolean), [cells])
  const today = toISODate(new Date())

  const { focusedDate, registerCellRef, onGridKeyDown, handleCellClick } = useRovingGridFocus({
    dates: monthDates, selectedDate, today, minDate: today, onPrevMonth, onNextMonth,
    onActivate: onDayClick,
  })

  return (
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Day-of-week header */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: CAL_DIMS.gridGap, marginBottom: 8, flex: '0 0 auto',
      }}>
        {shortDayHeaders().map((label, i) => (
          <span key={`${label}-${i}`} style={{
            ...CAL_TYPE.dowHeader, color: CAL_COLORS.textTertiary, textAlign: 'center',
          }}>
            {label}
          </span>
        ))}
      </div>

      {/* `gridAutoRows: minmax(96px, 1fr)` floors each row at the height that
          fits a date number, three booking stubs and a "+N more", then lets
          rows share any surplus evenly so a 5- or 6-row month fills the
          available height. `DayCell` resolves its own content min to 0 and
          clips overflow, which is what makes that floor the real floor
          instead of "the tallest cell's content". */}
      <div
        role="grid"
        aria-label={formatMonthYear(year, month)}
        onKeyDown={onGridKeyDown}
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: `minmax(${CAL_DIMS.gridRowMin}px, 1fr)`,
          gap: CAL_DIMS.gridGap, flex: '1 1 auto',
        }}
      >
        {rows.map((row, rowIdx) => (
          <div key={`row-${rowIdx}`} role="row" style={{ display: 'contents' }}>
            {row.map((cell, idx) => {
              if (cell.dimmed || !cell.date) {
                return <div key={`empty-${rowIdx}-${idx}`} role="gridcell" style={{ minHeight: CAL_DIMS.gridRowMin }} />
              }
              const { date } = cell
              const state = getDayState(cell.slots, cell.slots.some((s) => s.spacesOccupied > 0))
              const stubs = cell.bookings.slice(0, MAX_STUBS_PER_CELL)
              const overflow = cell.bookings.length - stubs.length
              const isPast = date < today

              return (
                <DayCell
                  key={date}
                  state={state}
                  isSelected={cell.isSelected}
                  isRangeStart={date === rangeStart}
                  isRangeEnd={date === rangeEnd}
                  isInRange={cell.isInRange}
                  isToday={date === today}
                  isPast={isPast}
                  date={date}
                  bookingCount={cell.bookings.length}
                  // The stub chips are non-interactive decoration — the cell
                  // is the only target — so their labels are folded into the
                  // cell's own accessible name instead.
                  bookingLabels={stubs.map(stubLabelFor)}
                  size="grid"
                  onClick={isPast ? undefined : () => { handleCellClick(date); onDayClick(date) }}
                  role="gridcell"
                  tabIndex={cellTabIndex(isPast, date === focusedDate)}
                  buttonRef={isPast ? undefined : registerCellRef(date)}
                >
                  <span style={{ ...CAL_TYPE.dayNumber, color: CAL_COLORS.textPrimary }}>{cell.day}</span>
                  {stubs.map((b, i) => (
                    <span key={`${date}-${i}`} aria-hidden="true" style={{
                      ...CAL_TYPE.stub, color: CAL_COLORS.textPrimary,
                      display: 'block', width: '100%', textAlign: 'left',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {stubLabelFor(b)}
                    </span>
                  ))}
                  {overflow > 0 && (
                    <span style={{ ...CAL_TYPE.stub, color: CAL_COLORS.textTertiary }}>
                      {BOOKINGS.moreInCell(overflow)}
                    </span>
                  )}
                </DayCell>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
