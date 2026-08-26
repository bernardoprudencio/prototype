import React, { useEffect } from 'react'
import { colors, radius, shadows } from '../../tokens'
import { useIsWide } from '../../lib/useMediaQuery'
import { getDatesInRange, SHEET_MODE } from '../../lib/calendarUtils'
import BottomSheet from '../../components/BottomSheet'
import ServiceListPanel from './ServiceListPanel'

/**
 * Port of `components/AvailabilitySheet.tsx` — the chrome around
 * `ServiceListPanel`, forked on width. `NewCalendarPage.tsx:118` picks the
 * variant with `isCompact ? 'sheet' : 'modal'`; here that is `useIsWide()`, the
 * prototype's single breakpoint.
 *
 * The chrome is deliberately bare in the POC: no title, no close icon
 * (`hideCloseIcon`), because the panel already carries its own date header and
 * its own Cancel. Close affordances are the backdrop, Esc, and that Cancel.
 *
 * Padding is split the POC's way: the modal lets the panel own all of it
 * (`padding: '0x'` on the modal content, `framePaddingY` at its `'6x'`
 * default), while the sheet zeroes the panel's own frame padding
 * (`contentPaddingStyles={{ paddingX: '0x' }}` + `framePaddingY="0x"`) and
 * leans on the sheet's. `BottomSheet`'s simple variant already pads 16px
 * horizontally and 24px at the bottom, so the panel contributes none.
 */
export default function AvailabilitySheet({
  isOpen, mode, selectedDate, rangeStart, rangeEnd,
  preferences, availability, isSaving, onSaveAll, onClose,
}) {
  const isWide = useIsWide()

  // `AvailabilitySheet.tsx:57-61` — capacity mode is always single-day, and a
  // half-formed range falls back to the selected day.
  const dates = mode === SHEET_MODE.EDIT_CAPACITY || !rangeStart || !rangeEnd
    ? [selectedDate]
    : getDatesInRange(rangeStart, rangeEnd)

  // Kibble's Modal / BottomSheet both close on Esc; hand-rolled chrome has to
  // do it explicitly. A save in flight swallows it, matching the container's
  // `handleCloseSheet` guard.
  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (e) => { if (e.key === 'Escape' && !isSaving) onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, isSaving, onClose])

  if (!isOpen) return null

  const panel = (
    <ServiceListPanel
      mode={mode}
      dates={dates}
      preferences={preferences}
      availability={availability}
      isSaving={isSaving}
      onSaveAll={onSaveAll}
      onCancel={onClose}
      framePaddingY={isWide ? 24 : 0}
      framePaddingX={isWide ? 20 : 0}
    />
  )

  if (!isWide) {
    return <BottomSheet onDismiss={isSaving ? undefined : onClose}>{panel}</BottomSheet>
  }

  // The desktop modal. Overlay and card follow the codebase's existing modal
  // shape (`AddDayModal`, ScheduleScreen.jsx:590), at the POC's own
  // `width: ['100%', '480px']` / `maxHeight: '90vh'`.
  return (
    <div
      onClick={isSaving ? undefined : onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(27,31,35,0.48)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        style={{
          background: colors.white,
          borderRadius: radius.primary,
          boxShadow: shadows.medium,
          width: 480, maxWidth: '100%',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {panel}
      </div>
    </div>
  )
}
