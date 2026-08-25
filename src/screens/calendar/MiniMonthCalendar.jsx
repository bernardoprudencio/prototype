import React, { useMemo } from 'react'
import { colors, textStyles } from '../../tokens'
import { HEADER } from '../../data/calendarCopy'
import {
  buildMonthCells, formatMonthYear, getDayState, monthNameOnly, toISODate, weekdayLetters,
} from '../../lib/calendarUtils'
import useRovingGridFocus from '../../lib/useRovingGridFocus'
import { ChevronLeftIcon, ChevronRightIcon } from '../../assets/icons'
import { CAL_COLORS, CAL_DIMS, CAL_TYPE } from './calendarTheme'
import DayCell from './DayCell'
import NavButton from './NavButton'

/**
 * Port of `layouts/v1/V1MiniMonthCalendar.tsx` — the 44px-tile month grid that
 * the compact layout shows above the selected day's bookings, and that the
 * 3-day layout will reuse in its rail.
 *
 * It is not a smaller `MonthGrid`: no booking stubs, no `+N more`, no 96px row
 * floor, and its own heading-plus-chevron row rather than the month layout's
 * shared sub-header. What the two *do* share is `buildMonthCells`, the
 * whole-week trailing pad, the `role="grid"` / `role="row"` /
 * `display: contents` structure, `useRovingGridFocus`, and
 * `isPrevMonthDisabled`.
 *
 * Three switches come straight from the POC (`:42-52`):
 *   - `hideLabel` / `hideNav` let a caller hoist the label and the chevrons into
 *     its own header row. Both are used by the 3-day layout; when both are set
 *     the internal row is suppressed entirely.
 *   - `monthLabelFormat` picks "April" (the default, for callers whose page-level
 *     `<h1>` already carries the year) or "April 2026". The compact layout passes
 *     `monthYear`, since its `<h1>` is the *short* month plus the year and the
 *     mini-month is the only place the full month name appears.
 *
 * Note the grid's `aria-label` is always the fully-qualified "April 2026", even
 * when the visible label is month-only — screen-reader users get the year
 * regardless (`:100-106`).
 *
 * Dropped: `isLoading` and its shimmer tiles. The prototype's data is
 * synchronous.
 */
export default function MiniMonthCalendar({
  year, month, availability, bookings,
  selectedDate, rangeStart, rangeEnd,
  onDayClick, onPrevMonth, onNextMonth,
  hideLabel = false, hideNav = false, monthLabelFormat = 'monthOnly',
}) {
  const dow = weekdayLetters()
  const slotsByDate = useMemo(
    () => new Map(availability.map((a) => [a.date, a.calendars])),
    [availability],
  )

  // Pad to a whole-week grid so every row is 7 wide for `role="row"`.
  const cells = useMemo(() => {
    const out = [...buildMonthCells(year, month)]
    const trailing = (7 - (out.length % 7)) % 7
    for (let i = 0; i < trailing; i += 1) out.push({})
    return out
  }, [year, month])

  const rows = useMemo(() => {
    const out = []
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7))
    return out
  }, [cells])

  const monthDates = useMemo(() => cells.map((c) => c.date).filter(Boolean), [cells])
  const today = toISODate(new Date())

  const monthLabel = monthLabelFormat === 'monthYear'
    ? formatMonthYear(year, month)
    : monthNameOnly(year, month)
  const gridAriaLabel = formatMonthYear(year, month)

  // Same expression as `MonthLayout`'s (`:108-114`): the visible month is the
  // current one, or the previous month already ended.
  const todayDate = new Date(`${today}T00:00:00`)
  const isAtCurrentMonth = year === todayDate.getFullYear() && month === todayDate.getMonth() + 1
  const prevY = month === 1 ? year - 1 : year
  const prevM = month === 1 ? 12 : month - 1
  const isPrevMonthDisabled = isAtCurrentMonth || toISODate(new Date(prevY, prevM, 0)) < today

  const { focusedDate, registerCellRef, onGridKeyDown, handleCellClick } = useRovingGridFocus({
    dates: monthDates, selectedDate, today, minDate: today, onPrevMonth, onNextMonth,
    onActivate: onDayClick,
  })

  const gridCols = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }

  return (
    <div>
      {(!hideLabel || !hideNav) && (
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: hideLabel ? 'flex-end' : 'space-between',
          marginBottom: 8,
        }}>
          {!hideLabel && (
            <h2 style={{
              ...textStyles.heading300, color: CAL_COLORS.textPrimary, lineHeight: 1, margin: 0,
            }}>
              {monthLabel}
            </h2>
          )}
          {!hideNav && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NavButton label={HEADER.prevMonth} disabled={isPrevMonthDisabled} onClick={onPrevMonth}>
                <ChevronLeftIcon size={20} color={colors.link} />
              </NavButton>
              <NavButton label={HEADER.nextMonth} onClick={onNextMonth}>
                <ChevronRightIcon size={20} color={colors.link} />
              </NavButton>
            </div>
          )}
        </div>
      )}

      {/* Day-of-week letters — plain labels, deliberately outside the grid. */}
      <div style={gridCols}>
        {dow.map((letter, i) => (
          <div key={`dow-${i}`} style={{
            height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ ...CAL_TYPE.miniDowHeader, color: CAL_COLORS.textTertiary }}>
              {letter}
            </span>
          </div>
        ))}
      </div>

      <div role="grid" aria-label={gridAriaLabel} onKeyDown={onGridKeyDown} style={gridCols}>
        {rows.map((row, rowIdx) => (
          <div key={`row-${rowIdx}`} role="row" style={{ display: 'contents' }}>
            {row.map((c, i) => {
              if (!c.date) {
                return (
                  <div
                    key={`empty-${rowIdx}-${i}`}
                    role="gridcell"
                    style={{ height: CAL_DIMS.miniDayTileSize }}
                  />
                )
              }
              const { date } = c
              const slots = slotsByDate.get(date) ?? []
              // The mini-month's own check, and note it is *not* the week
              // strip's union: only slot occupancy counts here (`:222`).
              const state = getDayState(slots, slots.some((s) => s.spacesOccupied > 0))
              const isSelected = date === selectedDate
              const isRangeStart = !!rangeStart && date === rangeStart
              const isRangeEnd = !!rangeEnd && date === rangeEnd
              const isInRange = !!(rangeStart && rangeEnd && date > rangeStart && date < rangeEnd)
              const isPast = date < today

              return (
                <DayCell
                  key={date}
                  state={state}
                  isSelected={isSelected}
                  isRangeStart={isRangeStart}
                  isRangeEnd={isRangeEnd}
                  isInRange={isInRange}
                  isToday={date === today}
                  isPast={isPast}
                  date={date}
                  bookingCount={bookings.filter((b) => b.date === date).length}
                  size="mini"
                  onClick={onDayClick && !isPast
                    ? () => { handleCellClick(date); onDayClick(date) }
                    : undefined}
                  role="gridcell"
                  tabIndex={isPast ? -1 : (date === focusedDate ? 0 : -1)}
                  buttonRef={isPast ? undefined : registerCellRef(date)}
                >
                  <span style={{
                    ...textStyles.text100,
                    fontWeight: isSelected || isRangeStart || isRangeEnd ? 600 : 400,
                    color: isPast ? CAL_COLORS.textMuted : CAL_COLORS.textPrimary,
                  }}>
                    {c.day}
                  </span>
                </DayCell>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
