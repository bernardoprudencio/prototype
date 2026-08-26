import React from 'react'
import { radius, textStyles } from '../../tokens'
import { CAL_COLORS } from './calendarTheme'
import { EDITOR } from '../../data/calendarCopy'
import Button from '../../components/Button'
import Switch from '../../components/Switch'
import Stepper from '../../components/Stepper'

/**
 * Port of `components/ServiceRow.tsx` — one service inside the availability
 * editor. Stateless: every mutation goes back out through the three callbacks
 * so `ServiceListPanel` stays the single source of truth (`:36-39`).
 *
 * Three visual pieces, and the second one is conditional:
 *   1. name + status subtext, with the on/off switch on the right. A service the
 *      sitter is away for loses the switch and reads "Away" (`:135`).
 *   2. the capacity sub-row — occupancy dot, "X of Y spaces booked", and the
 *      stepper — shown only for a single-day, non-away, capacity-supporting row
 *      that is either on *or* has live bookings. That last clause is what lets a
 *      sitter see what is booked on a day they have marked unavailable, and step
 *      capacity back above it (`:52-58`).
 *   3. "Reset to default", when the stepper has moved off the service default
 *      *and* the default is still reachable — the stepper's floor is
 *      `spacesOccupied`, so a default below that would make the button a
 *      dead-end click (`:95-104`).
 *
 * `effectiveCapacity` (`:75-77`) is the displayed number: the stored value when
 * the row is on, floored at `spacesOccupied` when it is off, so an unavailable
 * day with three stays reads "3 of 3" rather than "3 of 0".
 */
export default function ServiceRow({
  svc, isRange, isSaving, onToggle, onCapacityChange, onResetToDefault,
}) {
  const isAway = svc.isAway === true
  const hasBookings = svc.spacesOccupied > 0
  const showCapacityRow = !isRange && svc.supportsCapacity && !isAway && (svc.isOn || hasBookings)

  let statusText
  if (isAway) statusText = EDITOR.away
  else if (svc.isOn) statusText = EDITOR.available
  else statusText = EDITOR.unavailable

  const effectiveCapacity = svc.isOn
    ? svc.spacesAvailable
    : Math.max(svc.spacesAvailable, svc.spacesOccupied)

  // ServiceRow.tsx:82-86 — red once occupancy meets or exceeds capacity.
  const isFullyBookedOrOver = hasBookings && svc.spacesOccupied >= effectiveCapacity
  const dotColor = isFullyBookedOrOver ? CAL_COLORS.occupancyDotFull : CAL_COLORS.occupancyDot

  const bookedLabel = EDITOR.occupancy(
    svc.spacesOccupied, effectiveCapacity, effectiveCapacity === 1 ? 'space booked' : 'spaces booked',
  )

  const showReset = svc.isOn
    && svc.spacesAvailable !== svc.defaultSpacesAvailable
    && svc.defaultSpacesAvailable >= svc.spacesOccupied

  return (
    <div style={{ padding: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ ...textStyles.heading200, color: CAL_COLORS.textPrimary, marginBottom: 4 }}>
            {svc.name}
          </div>
          <div style={{ ...textStyles.text100, color: CAL_COLORS.textSecondary }}>
            {statusText}
          </div>
        </div>
        {!isAway && (
          <Switch
            checked={svc.isOn}
            disabled={isSaving}
            ariaLabel={svc.name}
            onChange={(next) => onToggle(svc.calendarId, next)}
          />
        )}
      </div>

      {showCapacityRow && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {hasBookings && (
                <span aria-hidden="true" style={{
                  width: 16, height: 16, flexShrink: 0,
                  borderRadius: radius.secondary,
                  background: dotColor,
                }} />
              )}
              <span style={{ ...textStyles.text100, color: CAL_COLORS.textSecondary }}>
                {bookedLabel}
              </span>
            </div>
            <Stepper
              value={effectiveCapacity}
              onIncrement={() => onCapacityChange(svc.calendarId, 1)}
              onDecrement={() => onCapacityChange(svc.calendarId, -1)}
              minValue={svc.spacesOccupied}
              maxValue={svc.maximumSpacesAvailable}
              disabled={isSaving}
            />
          </div>
          {showReset && (
            <div style={{ marginTop: 8 }}>
              <Button
                variant="default"
                size="small"
                fullWidth
                disabled={isSaving}
                onClick={() => onResetToDefault(svc.calendarId)}
              >
                {EDITOR.resetToDefault}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
