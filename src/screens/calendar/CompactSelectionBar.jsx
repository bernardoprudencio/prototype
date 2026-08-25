import React from 'react'
import { colors, textStyles } from '../../tokens'
import { SELECTION, bookedSpacesLabel } from '../../data/calendarCopy'
import {
  computeRangeStatus, formatLongDateWithYear, formatShortDateWithYear,
  getDatesInRange, getPrimaryActionForSelection, getSelectionSubtitle,
} from '../../lib/calendarUtils'
import Button from '../../components/Button'
import GcaBlurb from './GcaBlurb'

/**
 * Port of `components/CompactSelectionBar.tsx` — the compact analogue of
 * `SelectionSummary`, and the one piece of calendar chrome that is *not* in the
 * scroll flow: a `position: fixed` bar pinned to the bottom of the viewport with
 * no backdrop, so the page scrolls behind it.
 *
 * Every derivation is shared with `SelectionSummary` — same `isRange` test, same
 * `computeRangeStatus` over the away-filtered calendars, same
 * `getPrimaryActionForSelection`, same booked-spaces sum across *all* selected
 * days — with two differences, both the POC's:
 *   - no "Share my profile" secondary button
 *   - the GCA blurb lives inside the bar rather than above it in a rail footer
 *
 * `hideUnavailable: false` matches the desktop summary, so an unavailable
 * selection still reads "Not available" here.
 *
 * The third CTA is `default`, not `primary`, exactly as on desktop: marking
 * yourself unavailable is not the encouraged action.
 *
 * Positioning diverges in mechanism, not in effect. The POC is `position: fixed;
 * bottom: 0` with `paddingBottom: calc(24px + env(safe-area-inset-bottom))`,
 * because in `web` the calendar is the whole viewport. Here the app shell puts a
 * `TabBar` at the bottom, so the bar is `position: absolute; bottom: 0` inside
 * the layout's content area — which is the region *above* the tab bar. It pins
 * to the same visible edge, scrolls nothing, and needs no safe-area inset
 * because the `TabBar` below it already clears the home indicator.
 *
 * `zIndex: 100` is the POC's, and it still means the same thing: the availability
 * editor's `BottomSheet` / wide overlay both sit above it, so the editor opens
 * over the bar rather than under it.
 */
export default function CompactSelectionBar({
  selectedDate, rangeStart, rangeEnd, availability, preferences,
  gca, isConfirmingAvailability, onConfirmAvailability, onOpenSheet,
}) {
  const isRange = Boolean(rangeStart && rangeEnd && rangeStart !== rangeEnd)

  const dateLabel = isRange
    ? `${formatShortDateWithYear(rangeStart)} — ${formatShortDateWithYear(rangeEnd)}`
    : formatLongDateWithYear(selectedDate)

  const awayCalendarIds = preferences.filter((p) => p.isAway).map((p) => p.calendarId)
  const selectedDates = isRange ? getDatesInRange(rangeStart, rangeEnd) : [selectedDate]
  const rangeStatus = computeRangeStatus(availability, selectedDates, awayCalendarIds)

  const action = getPrimaryActionForSelection({ isRange, rangeStatus })

  const bookedSpaces = selectedDates.reduce((total, date) => {
    const day = availability.find((a) => a.date === date)
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

  const cta = action.kind === 'single'
    ? { label: SELECTION.editAvailability, variant: 'primary' }
    : action.kind === 'range-mark-available'
      ? { label: SELECTION.markAvailable, variant: 'primary' }
      : { label: SELECTION.markUnavailable, variant: 'default' }

  return (
    <div
      role="region"
      aria-label={SELECTION.barAriaLabel}
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 100,
        background: colors.white,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
        <GcaBlurb gca={gca} isConfirming={isConfirmingAvailability} onConfirm={onConfirmAvailability} />

        <div style={{
          ...textStyles.text100, color: colors.tertiary, textAlign: 'center',
        }}>
          {dateLabel}
        </div>

        {statusLabel && (
          <div aria-live="polite" style={{
            ...textStyles.heading200, color: colors.primary, textAlign: 'center',
          }}>
            {statusLabel}
          </div>
        )}

        <Button variant={cta.variant} size="small" fullWidth onClick={() => onOpenSheet?.(action)}>
          {cta.label}
        </Button>
      </div>
    </div>
  )
}
