import React from 'react'
import { radius, textStyles } from '../../tokens'
import { CAL_COLORS } from './calendarTheme'
import { SELECTION, bookedSpacesLabel } from '../../data/calendarCopy'
import {
  computeRangeStatus, getDatesInRange, getPrimaryActionForSelection, getSelectionSubtitle,
  formatLongDateWithYear, formatShortDateWithYear, RANGE_STATUS,
} from '../../lib/calendarUtils'
import Button from '../../components/Button'

/**
 * Port of `components/SelectionSummary.tsx` — the rail footer that names the
 * current selection and offers the one action that fits it.
 *
 * Every derivation is the POC's (`:44-110`):
 *   - a selection is a range only when both anchors exist *and* differ, so a
 *     collapsed range reads as a single day
 *   - the label is "start — end" for a range, the long date for a single day
 *   - `computeRangeStatus` runs over the range, ignoring calendars whose service
 *     preference is away
 *   - `bookedSpaces` sums `spacesOccupied` across the selected days' slots
 *   - "Share my profile" appears only on a single, unbooked, available day
 *
 * Three CTA branches, and note the third is deliberately `default` rather than
 * `primary` — marking yourself unavailable is not the encouraged action.
 */
export default function SelectionSummary({
  data, selectedDate, rangeStart, rangeEnd, onPrimaryAction,
}) {
  const isRange = Boolean(rangeStart && rangeEnd && rangeStart !== rangeEnd)

  const dateLabel = isRange
    ? `${formatShortDateWithYear(rangeStart)} — ${formatShortDateWithYear(rangeEnd)}`
    : formatLongDateWithYear(selectedDate)

  const awayCalendarIds = data.preferences.filter((p) => p.isAway).map((p) => p.calendarId)
  const selectedDates = isRange ? getDatesInRange(rangeStart, rangeEnd) : [selectedDate]
  const rangeStatus = computeRangeStatus(data.availability, selectedDates, awayCalendarIds)

  const action = getPrimaryActionForSelection({ isRange, rangeStatus })

  // Booked spaces total across *every* date in the selection, not just the
  // anchor day (`SelectionSummary.tsx:80-90`).
  const bookedSpaces = selectedDates.reduce((total, date) => {
    const day = data.availability.find((a) => a.date === date)
    if (!day) return total
    return total + day.calendars.reduce((acc, cal) => acc + cal.spacesOccupied, 0)
  }, 0)

  const statusLabel = getSelectionSubtitle({
    rangeStatus,
    bookedSpaces,
    isRange,
    bookedLabel: bookedSpacesLabel(bookedSpaces),
    hideUnavailable: false,
  })

  const showShareProfile = !isRange && bookedSpaces === 0 && rangeStatus !== RANGE_STATUS.UNAVAILABLE

  const cta = action.kind === 'single'
    ? { label: SELECTION.editAvailability, variant: 'primary' }
    : action.kind === 'range-mark-available'
      ? { label: SELECTION.markAvailable, variant: 'primary' }
      : { label: SELECTION.markUnavailable, variant: 'default' }

  return (
    <div style={{
      borderRadius: radius.primary,
      padding: 12,
      border: '0.5px solid rgba(0, 0, 0, 0.06)',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <div style={{ ...textStyles.text100, color: CAL_COLORS.textTertiary }}>{dateLabel}</div>

        {statusLabel && (
          <div aria-live="polite" style={{
            ...textStyles.heading200, color: CAL_COLORS.textPrimary, textAlign: 'center',
          }}>
            {statusLabel}
          </div>
        )}

        <Button variant={cta.variant} size="small" fullWidth onClick={() => onPrimaryAction?.(action)}>
          {cta.label}
        </Button>

        {/* Production href is `/provider-profile/promote` (SelectionSummary.tsx:192),
            which is a real page in `web` and has no prototype route — the same
            situation as the "Promote your profile" rows in `webNavItems.js:43`
            and `moreMenu.js:35`, so it follows their convention and is inert. */}
        {showShareProfile && (
          <Button variant="flat" size="small" fullWidth onClick={() => {}}>
            {SELECTION.shareProfile}
          </Button>
        )}
      </div>
    </div>
  )
}
