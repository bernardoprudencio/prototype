import React from 'react'
import { colors, radius, textStyles } from '../../tokens'
import { CAL_COLORS, CAL_DIMS } from './calendarTheme'
import { HEADER } from '../../data/calendarCopy'
import { bookingsForDate, formatLongDate, monthNameOnly, toISODate } from '../../lib/calendarUtils'
import { ChevronLeftIcon, ChevronRightIcon } from '../../assets/icons'
import MonthGrid from './MonthGrid'
import EventCard from './EventCard'
import GcaBlurb from './GcaBlurb'
import NoBookingsEmptyState from './NoBookingsEmptyState'
import SelectionSummary from './SelectionSummary'

// `SHELL_GRID_TEMPLATE` (NewCalendarPageMonth.tsx:38). The POC names its token
// `rightRailWidth`, but 320px is the *left* column in both desktop layouts —
// hence `railWidth` in `calendarTheme.js`.
const SHELL_GRID_TEMPLATE = `${CAL_DIMS.railWidth}px minmax(0, 1fr)`

/** Circular flat icon button — Kibble `Button icon circular variant="flat" size="small"`. */
function NavButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 32, height: 32, padding: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', borderRadius: radius.round,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

/**
 * Port of `layouts/NewCalendarPageMonth.tsx` — the POC's default and by far its
 * most finished layout.
 *
 * Two rows, both on the same `320px minmax(0, 1fr)` template so the headings
 * line up with the columns beneath them:
 *
 *   1. a sub-header — the selected day's long date over the rail, the month name
 *      plus its chevron pair over the grid. Both are semantically `<h2>` at 20px
 *      because the page-level `<h1>` is the year (`CalendarHeader`).
 *   2. the shell — rail | month grid.
 *
 * The rail's height trick is load-bearing and ported verbatim (`:284-336`): an
 * outer `position: relative` box with `minHeight: max(500px, calc(100svh -
 * 240px))` whose only child is `position: absolute; inset: 0`. The absolute
 * child contributes nothing to the grid row's intrinsic height, so the row
 * collapses to the month grid's natural size and the rail stretches to match —
 * which is what keeps the page from resizing every time a different day is
 * selected. Earlier POC attempts that capped the scroller or pinned the rail to
 * `calc(100svh - 200px)` both produced jumps or overflow.
 *
 * The two rail branches differ in more than content: empty puts the empty-state
 * and the blurb in a `flex: 0 0 auto` box with an `aria-hidden` spacer below so
 * the summary still lands at the bottom, while the bookings branch scrolls the
 * cards in a `flex: 1 1 auto; minHeight: 0` region above a bordered footer that
 * holds the blurb and the summary together.
 *
 * Dropped: `isLoading` / `isLoadingBookings` and their shimmer cards. The
 * prototype's data is synchronous, so no loading state exists to render.
 */
export default function MonthLayout({
  data, selectedDate, rangeStart, rangeEnd, gca,
  isConfirmingAvailability, onConfirmAvailability,
  onPrevMonth, onNextMonth, onDayClick, onOpenSheet, onOpenConversation,
}) {
  const { year, month } = data
  const dayBookings = bookingsForDate(data.bookings, selectedDate)

  // `isPrevMonthDisabled` (:281-291) — the visible month is the current one, or
  // the previous month ended before today. Past months hold nothing editable.
  const today = toISODate(new Date())
  const todayDate = new Date(`${today}T00:00:00`)
  const isAtCurrentMonth = year === todayDate.getFullYear() && month === todayDate.getMonth() + 1
  const prevY = month === 1 ? year - 1 : year
  const prevM = month === 1 ? 12 : month - 1
  const isPrevMonthDisabled = isAtCurrentMonth || toISODate(new Date(prevY, prevM, 0)) < today

  const subHeading = {
    ...textStyles.heading300, color: CAL_COLORS.textPrimary,
    lineHeight: 1, margin: 0,
  }

  const blurbNode = (
    <GcaBlurb gca={gca} isConfirming={isConfirmingAvailability} onConfirm={onConfirmAvailability} />
  )
  const summaryNode = (
    <SelectionSummary
      data={data}
      selectedDate={selectedDate}
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      onPrimaryAction={onOpenSheet}
    />
  )

  return (
    <div>
      {/* ── Sub-header row, mirroring the shell template ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: SHELL_GRID_TEMPLATE,
        alignItems: 'center', gap: 24, marginBottom: 16,
      }}>
        <h2 style={subHeading}>{formatLongDate(selectedDate)}</h2>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0,
        }}>
          <h2 style={subHeading}>{monthNameOnly(year, month)}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NavButton label={HEADER.prevMonth} disabled={isPrevMonthDisabled} onClick={onPrevMonth}>
              <ChevronLeftIcon size={20} color={colors.link} />
            </NavButton>
            <NavButton label={HEADER.nextMonth} onClick={onNextMonth}>
              <ChevronRightIcon size={20} color={colors.link} />
            </NavButton>
          </div>
        </div>
      </div>

      {/* ── Shell: rail | month grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: SHELL_GRID_TEMPLATE, gap: 24 }}>
        <div style={{
          minWidth: 0, position: 'relative', overflow: 'hidden',
          minHeight: 'max(500px, calc(100svh - 240px))',
        }}>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          }}>
            {dayBookings.length === 0 ? (
              <>
                <div style={{
                  flex: '0 0 auto', padding: 16,
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <NoBookingsEmptyState />
                  {blurbNode}
                </div>
                <div aria-hidden style={{ flex: '1 1 auto' }} />
                <div style={{ flex: '0 0 auto', padding: 16 }}>{summaryNode}</div>
              </>
            ) : (
              <>
                <div className="hide-scrollbar" style={{
                  flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: 16,
                }}>
                  {dayBookings.map((b, i) => (
                    <EventCard
                      key={`${b.date}-${b.serviceName}-${i}`}
                      booking={b}
                      onOpen={onOpenConversation}
                    />
                  ))}
                </div>
                <div style={{
                  flex: '0 0 auto', padding: 16, background: colors.white,
                  borderTop: `1px solid ${CAL_COLORS.border}`,
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  {blurbNode}
                  {summaryNode}
                </div>
              </>
            )}
          </div>
        </div>

        <MonthGrid
          data={data}
          selectedDate={selectedDate}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onDayClick={onDayClick}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
        />
      </div>
    </div>
  )
}
