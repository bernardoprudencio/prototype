import React from 'react'
import { colors, textStyles } from '../../tokens'
import { CAL_COLORS, CAL_DIMS, CAL_TYPE } from './calendarTheme'
import { HEADER, THREE_DAY_NAV } from '../../data/calendarCopy'
import {
  addISODays, bookingsForDate, getDayState, isPastDate, monthNameOnly,
  slotsForDate, toISODate, weekdayLetters,
} from '../../lib/calendarUtils'
import { ChevronLeftIcon, ChevronRightIcon } from '../../assets/icons'
import NavButton from './NavButton'
import DayCell from './DayCell'
import EventCard from './EventCard'
import GcaBlurb from './GcaBlurb'
import MiniMonthCalendar from './MiniMonthCalendar'
import NoBookingsEmptyState from './NoBookingsEmptyState'
import SelectionSummary from './SelectionSummary'

/**
 * Port of `layouts/NewCalendarPageThreeDay.tsx` — the surviving alternate wide
 * layout, reached by `?view=threeDay`.
 *
 * Same 320px rail as the month layout, but the rail's content is different: a
 * mini-month (with its own label and nav suppressed, because this layout hoists
 * both into the header row above it) over the GCA blurb over the selection
 * summary. To its right, three day columns at `repeat(3, 1fr)`.
 *
 * Two independent pieces of view state, which is the layout's whole point
 * (`:88-97`): the **rail** heading follows the mini-month's `year`/`month`,
 * while the **columns** heading follows the selected day's month. They can read
 * the same string or different strings depending on how far the user has paged
 * the mini-month away from their selection, and seeing both at once is what
 * makes that legible.
 *
 * The columns are anchored on `viewAnchorDate` — the leftmost column, rendered
 * as `[anchor, anchor+1, anchor+2]` — which the container owns and which moves
 * independently of `selectedDate`.
 *
 * Each column's day state is the **union** of both booking signals, verbatim
 * from `:238-245`: a recurring expansion can exist as a booking before
 * `spacesOccupied` catches up, and occupancy can exist before it surfaces as a
 * discrete booking. `MiniMonthCalendar` deliberately uses the slot check alone;
 * the week strip uses the union. All three match their POC counterparts.
 *
 * One divergence, and it is the plan's item 3. The POC **removed these chevrons
 * from the UI** in Phase 12 while leaving `onPrevThreeDay` / `onNextThreeDay`
 * plumbed all the way through the container, with a comment saying the state was
 * "intentionally preserved so the chevron UI can be reinstated without container
 * changes" (`:105-112`). Shipping a three-day window with no way to page it
 * would be a bug in a prototype meant to be clicked through, so the port
 * reinstates exactly the UI that comment describes: the same circular flat
 * chevron pair the month header uses, wired to those same two handlers.
 *
 * Dropped: `isLoading` / `isLoadingBookings` and their shimmer cards.
 */
export default function ThreeDayLayout({
  data, selectedDate, rangeStart, rangeEnd, gca,
  isConfirmingAvailability, onConfirmAvailability,
  onPrevMonth, onNextMonth, viewAnchorDate, onPrevThreeDay, onNextThreeDay,
  onDayClick, onOpenSheet, onOpenConversation,
}) {
  const { year, month, bookings, availability } = data

  // `isPrevMonthDisabled` (`:80-88`) — the same rule the month layout applies,
  // because both drive the same visible-month state.
  const today = toISODate(new Date())
  const todayDate = new Date(`${today}T00:00:00`)
  const isAtCurrentMonth = year === todayDate.getFullYear() && month === todayDate.getMonth() + 1
  const prevY = month === 1 ? year - 1 : year
  const prevM = month === 1 ? 12 : month - 1
  const isPrevMonthDisabled = isAtCurrentMonth || toISODate(new Date(prevY, prevM, 0)) < today

  // The rail heading tracks the mini-month; the columns heading tracks the
  // selection (`:89-97`).
  const selectedDateObj = new Date(`${selectedDate}T00:00:00`)
  const selectedMonthLabel = monthNameOnly(
    selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1,
  )
  const viewMonthLabel = monthNameOnly(year, month)

  const columnDates = [viewAnchorDate, addISODays(viewAnchorDate, 1), addISODays(viewAnchorDate, 2)]
  const dowLetters = weekdayLetters()

  // `handlePrevThreeDay` (NewCalendarContainer.tsx:288-296) blocks the step
  // when the window it would land on is entirely in the past — the rightmost
  // column after a prev step is `anchor - 1`. The container keeps that guard;
  // mirroring it here disables the chevron rather than letting it no-op.
  const isPrevThreeDayDisabled = isPastDate(addISODays(viewAnchorDate, -1))

  const subHeading = {
    ...textStyles.heading300, color: CAL_COLORS.textPrimary,
    lineHeight: 1, margin: 0,
  }
  const railColumn = { width: CAL_DIMS.railWidth, flexShrink: 0 }

  return (
    <div>
      {/* ── View-header row: rail month + month nav | columns month + window nav ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: CAL_DIMS.pageGap, marginBottom: 16,
      }}>
        <div style={{
          ...railColumn, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={subHeading}>{viewMonthLabel}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NavButton label={HEADER.prevMonth} disabled={isPrevMonthDisabled} onClick={onPrevMonth}>
              <ChevronLeftIcon size={20} color={colors.link} />
            </NavButton>
            <NavButton label={HEADER.nextMonth} onClick={onNextMonth}>
              <ChevronRightIcon size={20} color={colors.link} />
            </NavButton>
          </div>
        </div>
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={subHeading}>{selectedMonthLabel}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NavButton
              label={THREE_DAY_NAV.prev}
              disabled={isPrevThreeDayDisabled}
              onClick={onPrevThreeDay}
            >
              <ChevronLeftIcon size={20} color={colors.link} />
            </NavButton>
            <NavButton label={THREE_DAY_NAV.next} onClick={onNextThreeDay}>
              <ChevronRightIcon size={20} color={colors.link} />
            </NavButton>
          </div>
        </div>
      </div>

      {/* ── Rail | three day columns ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: CAL_DIMS.pageGap }}>
        {/* Source order matches visual order, so focus runs left to right. */}
        <div style={{ ...railColumn, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MiniMonthCalendar
            year={year}
            month={month}
            availability={availability}
            bookings={bookings}
            selectedDate={selectedDate}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onDayClick={onDayClick}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
            hideLabel
            hideNav
          />
          <GcaBlurb
            gca={gca}
            isConfirming={isConfirmingAvailability}
            onConfirm={onConfirmAvailability}
          />
          <SelectionSummary
            data={data}
            selectedDate={selectedDate}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPrimaryAction={onOpenSheet}
          />
        </div>

        <div style={{
          flex: 1, minWidth: 0,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 16,
        }}>
          {columnDates.map((date) => {
            const d = new Date(`${date}T00:00:00`)
            const colBookings = bookingsForDate(bookings, date)
            const colSlots = slotsForDate(data, date)
            const colState = getDayState(
              colSlots,
              colBookings.length > 0 || colSlots.some((s) => s.spacesOccupied > 0),
            )
            const colIsPast = isPastDate(date)

            return (
              <div key={date}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 4, marginBottom: 12,
                }}>
                  <span style={{ ...CAL_TYPE.miniDowHeader, color: CAL_COLORS.textTertiary }}>
                    {dowLetters[d.getDay()]}
                  </span>
                  {/* `size="tile"` — the 44px cell, same as the mini grids.
                      `DayCell` is `width: 100%` at every size, so the fixed
                      box the POC wraps it in (`:277`) is what keeps the tile
                      square instead of stretching across the column.
                      Non-interactive: the header reflects the window, and day
                      selection is the rail's job. */}
                  <div style={{ width: CAL_DIMS.miniDayTileSize, height: CAL_DIMS.miniDayTileSize }}>
                    <DayCell
                      state={colState}
                      isSelected={date === selectedDate}
                      isPast={colIsPast}
                      size="tile"
                    >
                      <span style={{
                        ...textStyles.text200Semibold,
                        color: colIsPast ? CAL_COLORS.textMuted : CAL_COLORS.textPrimary,
                      }}>{d.getDate()}</span>
                    </DayCell>
                  </div>
                </div>

                {colBookings.length > 0
                  ? colBookings.map((b, i) => (
                    <EventCard
                      key={`${b.date}-${b.serviceName}-${i}`}
                      booking={b}
                      onOpen={onOpenConversation}
                    />
                  ))
                  : <NoBookingsEmptyState />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
