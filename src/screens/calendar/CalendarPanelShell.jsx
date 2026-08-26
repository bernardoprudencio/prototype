import React, { useEffect } from 'react'
import { colors, radius, shadows, textStyles } from '../../tokens'
import { useIsWide } from '../../lib/useMediaQuery'
import BottomSheet from '../../components/BottomSheet'

/**
 * The chrome the calendar's three header panels share — Help, Sync, and
 * Availability settings.
 *
 * Source: roverdotcom/web @ origin/ai-pilot-web-calendar
 *   .../NewCalendarPage/components/NewCalendarHelpSheet.tsx:100-140
 *   .../NewCalendarPage/components/SyncCalendarPanel.tsx:299-331
 *   .../NewCalendarPage/components/AvailabilitySettingsPanel.tsx:724-756
 *
 * All three end in the same shape, written out three times in the POC: a
 * `BottomSheet` with `hideCloseIcon`, a `Heading size="200"` in
 * `HeaderComponent` and the buttons in `FooterComponent` when
 * `useMatchMedia(MQ.XS)`; otherwise a `Modal` with `showCloseIcon={false}`,
 * `headerText`, and the footer as the last child of the body column. One
 * component here rather than three copies, because the only thing that varies
 * between them is the modal width (520 for help and settings, 560 for sync).
 *
 * `AvailabilitySheet` deliberately does *not* use this: the per-day editor has
 * no title and no footer of its own — `ServiceListPanel` carries both — so it
 * keeps its own barer chrome.
 *
 * Two substitutions. Kibble's Modal and BottomSheet both close on Esc, which a
 * hand-rolled overlay has to do explicitly; and the POC's body cap
 * (`maxHeight: ['50vh', '60vh']` with internal scroll — mobile first, so 50vh
 * compact and 60vh wide) exists so a tall body cannot push the footer
 * offscreen, which matters here for exactly the same reason.
 */
export default function CalendarPanelShell({
  isOpen, title, footer, width = 520, onClose, children,
}) {
  const isWide = useIsWide()

  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const heading = (
    <h2 style={{ ...textStyles.heading200, color: colors.primary, margin: 0 }}>{title}</h2>
  )

  const body = (
    <div className="hide-scrollbar" style={{
      maxHeight: isWide ? '60vh' : '50vh', overflowY: 'auto',
    }}>
      {children}
    </div>
  )

  if (!isWide) {
    return (
      <BottomSheet variant="full" onDismiss={onClose} header={heading} footer={footer}>
        {body}
      </BottomSheet>
    )
  }

  // The desktop modal, on the codebase's existing modal shape (`AddDayModal`,
  // ScheduleScreen.jsx:590) at the POC's `min(<width>px, 100vw)`.
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: colors.overlayBg,
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
          width, maxWidth: '100%',
          display: 'flex', flexDirection: 'column', gap: 16,
          padding: 24,
        }}
      >
        {heading}
        {body}
        {footer}
      </div>
    </div>
  )
}
