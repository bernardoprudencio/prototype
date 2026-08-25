import React, { useEffect, useMemo, useRef, useState } from 'react'
import { textStyles } from '../../tokens'
import { EDITOR, bookedSpacesLabel } from '../../data/calendarCopy'
import {
  computeRangeStatus,
  formatLongDateWithYear,
  formatShortDateWithYear,
  getSelectionSubtitle,
} from '../../lib/calendarUtils'
import { CAL_COLORS } from './calendarTheme'
import Button from '../../components/Button'
import ServiceRow from './ServiceRow'

const DIVIDER_COLOR = 'rgba(0,0,0,0.08)'   // ServiceListPanel.tsx:54

/**
 * Seed the per-service edit state for the FIRST date in `dates`
 * (`ServiceListPanel.tsx:62-101`). A range applies the same calendar state to
 * every date in it, so `dates[0]` is the canonical seed either way.
 *
 * The one non-obvious rule is `isOn = currentSpaces > occupied`, not `> 0`
 * (`:75-81`): a slot reporting fewer available than occupied spaces displays as
 * "5 of 2 booked" with a red dot — semantically full — so it seeds OFF.
 *
 * One addition to the POC: `isAway` is carried through from the preference.
 * `ServiceRow` reads `svc.isAway` (`ServiceRow.tsx:50`) but the POC's
 * `seedServices` never writes it, so the row's Away branch is unreachable
 * there. The prototype's `CALENDAR_PREFERENCES` do carry `isAway`, so passing
 * it makes the branch behave as `ServiceRow` already documents.
 */
function seedServices(mode, firstDate, preferences, availability) {
  const day = availability.find(a => a.date === firstDate)
  return preferences.map((pref) => {
    const slot = day?.calendars.find(c => c.calendarId === pref.calendarId)
    const currentSpaces = slot?.spacesAvailable ?? pref.spacesAvailable
    const occupied = slot?.spacesOccupied ?? 0

    let spacesAvailable = Math.max(currentSpaces ?? 0, 0)
    let isOn = (currentSpaces ?? 0) > occupied

    if (mode === 'edit-availability') {
      spacesAvailable = Math.max(1, pref.spacesAvailable - occupied)
      isOn = true
    } else if (mode === 'edit-unavailability') {
      spacesAvailable = 0
      isOn = false
    }

    return {
      calendarId: pref.calendarId,
      name: pref.name,
      isOn,
      isAway: pref.isAway === true,
      spacesAvailable,
      spacesOccupied: occupied,
      maximumSpacesAvailable: pref.maximumSpacesAvailable,
      defaultSpacesAvailable: pref.spacesAvailable,
      supportsCapacity: pref.maximumSpacesAvailable > 1,
    }
  })
}

/**
 * `seedChanged` (`:104-115`). In `edit-capacity` nothing has been touched yet,
 * so Save starts disabled. The two range modes *are* a bulk edit, so every
 * non-away service is pre-marked and Save is immediately actionable.
 */
function seedChanged(mode, preferences) {
  if (mode === 'edit-capacity') return new Set()
  return new Set(preferences.filter(p => !p.isAway).map(p => p.calendarId))
}

/**
 * Port of `components/ServiceListPanel.tsx` — the availability/capacity editor
 * body, shared verbatim by the desktop modal and the compact bottom sheet.
 * `AvailabilitySheet` supplies the chrome; this owns all of the state.
 *
 * Re-seeding is deliberately gated on a `${mode}::${dates}` signature rather
 * than on `preferences` / `availability` (`:143-152`): the optimistic patch
 * rewrites `availability` mid-save, and re-seeding then would wipe the sitter's
 * in-progress edits.
 */
export default function ServiceListPanel({
  mode, dates, preferences, availability, isSaving,
  onSaveAll, onCancel, framePaddingY = 24, framePaddingX = 20,
}) {
  const isRange = dates.length > 1
  const firstDate = dates[0]
  const lastDate = dates[dates.length - 1]

  const seedSignatureRef = useRef('')
  const currentSignature = `${mode}::${dates.join(',')}`

  const [services, setServices] = useState(
    () => seedServices(mode, firstDate, preferences, availability),
  )
  const [changed, setChanged] = useState(() => seedChanged(mode, preferences))

  useEffect(() => {
    if (seedSignatureRef.current === currentSignature) return
    seedSignatureRef.current = currentSignature
    setServices(seedServices(mode, firstDate, preferences, availability))
    setChanged(seedChanged(mode, preferences))
  }, [currentSignature])   // eslint-disable-line react-hooks/exhaustive-deps

  // `:157-158` — the POC's only guard on the unenforced "active, non-away and
  // no availability" invariant.
  const hasAllServicesAway = preferences.length > 0 && preferences.every(p => p.isAway)
  const saveDisabled = hasAllServicesAway || isSaving || changed.size === 0

  const markChanged = (calendarId) => {
    setChanged((prev) => {
      if (prev.has(calendarId)) return prev
      const next = new Set(prev)
      next.add(calendarId)
      return next
    })
  }

  // `handleToggle` (:173-200). ON floors at `spacesOccupied + 1` so "Available"
  // always means at least one free space; OFF clamps down to `spacesOccupied`
  // so the editor can never silently overbook an existing stay.
  const handleToggle = (calendarId, isOn) => {
    setServices(prev => prev.map((s) => {
      if (s.calendarId !== calendarId) return s
      if (isOn) {
        const target = Math.max(
          s.spacesAvailable || s.defaultSpacesAvailable || 1,
          s.spacesOccupied + 1,
          1,
        )
        return { ...s, isOn: true, spacesAvailable: target }
      }
      return { ...s, isOn: false, spacesAvailable: s.spacesOccupied }
    }))
    markChanged(calendarId)
  }

  // `handleCapacityChange` (:202-231). The baseline matches `ServiceRow`'s
  // `effectiveCapacity` so stepping starts from the *displayed* number, and
  // `isOn` follows from the result — stepping above the booked count flips the
  // row on, stepping down to it flips it off.
  const handleCapacityChange = (calendarId, delta) => {
    setServices(prev => prev.map((s) => {
      if (s.calendarId !== calendarId) return s
      const baseline = s.isOn ? s.spacesAvailable : Math.max(s.spacesAvailable, s.spacesOccupied)
      const next = Math.min(
        Math.max(baseline + delta, s.spacesOccupied),
        s.maximumSpacesAvailable,
      )
      return { ...s, spacesAvailable: next, isOn: next > s.spacesOccupied }
    }))
    markChanged(calendarId)
  }

  // `handleResetToDefault` (:233-248) — same `> spacesOccupied` rule, so a
  // default that exactly matches the booked count resets the row OFF rather
  // than leaving an Available row with no headroom.
  const handleResetToDefault = (calendarId) => {
    setServices(prev => prev.map(s => (s.calendarId === calendarId
      ? {
        ...s,
        spacesAvailable: s.defaultSpacesAvailable,
        isOn: s.defaultSpacesAvailable > s.spacesOccupied,
      }
      : s)))
    markChanged(calendarId)
  }

  // Sub-header (`:259-300`): a tertiary date label over a status heading. The
  // em dash is the POC's own range separator.
  const dateLabel = isRange
    ? `${formatShortDateWithYear(firstDate)} — ${formatShortDateWithYear(lastDate)}`
    : formatLongDateWithYear(firstDate)

  const awayCalendarIds = preferences.filter(p => p.isAway).map(p => p.calendarId)
  const rangeStatus = computeRangeStatus(availability, dates, awayCalendarIds)

  const bookedSpaces = useMemo(() => dates.reduce((total, date) => {
    const day = availability.find(a => a.date === date)
    if (!day) return total
    return total + day.calendars.reduce((acc, cal) => acc + cal.spacesOccupied, 0)
  }, 0), [availability, dates])

  // `hideUnavailable: true` — inside the editor the "Not available" label would
  // shadow the mode the sitter just chose (`:288-296`). The rail still shows it.
  const statusLabel = getSelectionSubtitle({
    rangeStatus,
    bookedSpaces,
    isRange,
    bookedLabel: bookedSpacesLabel(bookedSpaces),
    hideUnavailable: true,
  })

  const handleSave = () => {
    const changedServices = services.filter(s => changed.has(s.calendarId))
    if (changedServices.length === 0) return
    const updates = dates.map(date => ({
      date,
      calendars: changedServices.map(s => ({
        calendarId: s.calendarId,
        spacesAvailable: s.spacesAvailable,
      })),
    }))
    onSaveAll(updates)
  }

  return (
    <div style={{ padding: `${framePaddingY}px ${framePaddingX}px` }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...textStyles.text100, color: CAL_COLORS.textTertiary }}>
          {dateLabel}
        </div>
        {statusLabel && (
          <div style={{ ...textStyles.heading200, color: CAL_COLORS.textPrimary, marginTop: 4 }}>
            {statusLabel}
          </div>
        )}
      </div>

      <div>
        {services.map((svc, index) => (
          <div key={svc.calendarId}>
            <ServiceRow
              svc={svc}
              isRange={isRange}
              isSaving={isSaving}
              onToggle={handleToggle}
              onCapacityChange={handleCapacityChange}
              onResetToDefault={handleResetToDefault}
            />
            {index < services.length - 1 && (
              <div style={{ margin: '16px 0', height: 1, background: DIVIDER_COLOR }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <Button
          fullWidth
          size="small"
          variant="primary"
          disabled={saveDisabled}
          onClick={handleSave}
        >
          {EDITOR.save}
        </Button>
        <div style={{ marginTop: 8 }}>
          <Button
            fullWidth
            size="small"
            variant="flat"
            disabled={isSaving}
            onClick={onCancel}
          >
            {EDITOR.cancel}
          </Button>
        </div>
      </div>
    </div>
  )
}
