import React, { useState } from 'react'
import { textStyles } from '../../tokens'
import { addISODays, bookingsForDate, formatShortMonth, formatWeekdayShortDate } from '../../lib/calendarUtils'
import { CAL_COLORS, CAL_DIMS } from './calendarTheme'
import CalendarHeader from './CalendarHeader'
import CompactSelectionBar from './CompactSelectionBar'
import CompactWeekStrip from './CompactWeekStrip'
import EventCard from './EventCard'
import MiniMonthCalendar from './MiniMonthCalendar'
import NoBookingsEmptyState from './NoBookingsEmptyState'

/**
 * Port of `layouts/NewCalendarPageCompact.tsx` — the below-769px layout.
 *
 * It is a genuine design rather than a squeezed desktop one, and it is shaped
 * around a single idea: on a phone the month grid and the day's bookings cannot
 * both be on screen, so the calendar is *collapsible*. Expanded, the top of the
 * page is the mini-month; collapsed, it is a one-row week strip that still lets
 * you move between days. Below either, always, is the selected day's heading and
 * its booking cards. The selection bar is pinned to the bottom edge so the CTA
 * never scrolls away.
 *
 * `calendarCollapsed` is local state, as in the POC (`:77`) — it is a display
 * preference for this layout only, so it neither lifts to `CalendarScreen` nor
 * persists.
 *
 * Week paging needs no new state either (`:86-87`): a week step is
 * `onDayClick(addISODays(selectedDate, ±7))`, so `selectedDate` stays the single
 * source of truth for both the visible week and the visible bookings, and the
 * container reacts exactly as it does to a direct tap.
 *
 * `BAR_CLEARANCE` is the POC's 260px: bottom padding on the scroller so the last
 * booking card can clear the bar. The bar's rendered height varies — the GCA
 * blurb hides itself once the calendar is confirmed — so the value is sized for
 * the worst case rather than measured.
 *
 * Layout structure diverges from the POC in one way, because the app shell does.
 * The POC's bar is `position: fixed` against the viewport; here the layout owns a
 * `position: relative` content area with the scroller absolutely filling it and
 * the bar absolutely pinned to its bottom, and `CalendarScreen` puts the
 * `TabBar` below that area. Same visible result — a bar that never scrolls,
 * sitting directly above the app's nav — without a fixed element that would
 * cover the tab bar.
 */

// `BAR_CLEARANCE` (NewCalendarPageCompact.tsx:22).
const BAR_CLEARANCE = 260

export default function CompactLayout({
  data, selectedDate, rangeStart, rangeEnd, gca,
  isConfirmingAvailability, onConfirmAvailability,
  onPrevMonth, onNextMonth, onDayClick, onOpenSheet, onOpenConversation,
}) {
  const { year, month, bookings, availability } = data
  const [calendarCollapsed, setCalendarCollapsed] = useState(false)

  const dayBookings = bookingsForDate(bookings, selectedDate)

  const handlePrevWeek = () => onDayClick(addISODays(selectedDate, -7))
  const handleNextWeek = () => onDayClick(addISODays(selectedDate, 7))

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <div className="hide-scrollbar" style={{
        position: 'absolute', inset: 0, overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: CAL_DIMS.pageGap,
          padding: 16, paddingBottom: BAR_CLEARANCE,
        }}>
          <div>
            <CalendarHeader
              variant="compact"
              month={formatShortMonth(month)}
              year={year}
              calendarCollapsed={calendarCollapsed}
              onToggleCollapsed={() => setCalendarCollapsed((prev) => !prev)}
            />
            {calendarCollapsed ? (
              <CompactWeekStrip
                selectedDate={selectedDate}
                availability={availability}
                bookings={bookings}
                onDayClick={onDayClick}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
              />
            ) : (
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
                monthLabelFormat="monthYear"
              />
            )}
          </div>

          <div>
            <h2 style={{
              ...textStyles.heading300, color: CAL_COLORS.textPrimary,
              margin: '0 0 12px', lineHeight: 1,
            }}>
              {formatWeekdayShortDate(selectedDate)}
            </h2>
            {dayBookings.length > 0
              ? dayBookings.map((b, i) => (
                <EventCard
                  key={`${b.date}-${b.serviceName}-${i}`}
                  booking={b}
                  onOpen={onOpenConversation}
                />
              ))
              : <NoBookingsEmptyState />}
          </div>
        </div>
      </div>

      <CompactSelectionBar
        selectedDate={selectedDate}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        availability={availability}
        preferences={data.preferences}
        gca={gca}
        isConfirmingAvailability={isConfirmingAvailability}
        onConfirmAvailability={onConfirmAvailability}
        onOpenSheet={onOpenSheet}
      />
    </div>
  )
}
