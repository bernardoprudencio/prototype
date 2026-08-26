import { useEffect } from 'react'
import { colors, radius, shadows, spacing } from '../tokens'
import { useIsWide } from '../lib/useMediaQuery'

const DRAG_HANDLE = (
  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 16 }}>
    <div style={{ width: 36, height: 5, borderRadius: 35, background: colors.borderInteractive }} />
  </div>
)

/**
 * BottomSheet — overlay + sheet wrapper used by all modal flows.
 *
 * variant="simple"  — compact, 8px radius, no scrollable header/body split
 * variant="full"    — tall, 16px radius, sticky header / scrollable body split
 *
 * Props:
 *   variant    "simple" | "full"   (default "simple")
 *   onDismiss  called when overlay or back-swipe closes the sheet
 *   zIndex     number              (default 300)
 *   header     ReactNode           (full variant only — rendered sticky at top)
 *   footer     ReactNode           (full variant only — reserved region below
 *                                   the scrolling body, mirroring Kibble's
 *                                   ScrollableModal, which renders its buttons
 *                                   as a sibling after the scroll area rather
 *                                   than inside it: ScrollableModal.tsx:97-125.
 *                                   Its region is px="4x" py="4x" (16px) and the
 *                                   scrolling body drops to a 4px bottom pad
 *                                   (`paddingBottom: space['1x']`, L91).)
 *   children   ReactNode           (main content / scrollable body)
 *   wideModal  bool                (opt-in, default false) — at >=769px
 *                                   (`useIsWide`) present as a centred modal
 *                                   instead of a bottom sheet: scrim behind,
 *                                   480px cap, token radius on all four
 *                                   corners, no drag handle, Escape closes.
 *                                   Off by default, so every existing caller
 *                                   renders exactly as before at every width.
 */
export default function BottomSheet({ variant = 'simple', onDismiss, zIndex = 300, header, footer, wideModal = false, children }) {
  const isWide = useIsWide()
  const asModal = wideModal && isWide

  // Escape is the modal's keyboard equivalent of a scrim click, so it lands on
  // the same handler — which, for the rates flow, is the discard guard.
  useEffect(() => {
    if (!asModal) return undefined
    const onKeyDown = (e) => { if (e.key === 'Escape') onDismiss?.() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [asModal, onDismiss])

  const overlay = {
    position: 'fixed', inset: 0,
    background: colors.overlayBg,
    zIndex,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  }

  if (asModal) {
    return (
      <div
        style={{ ...overlay, alignItems: 'center', padding: spacing.xl }}
        onClick={onDismiss}
      >
        <div
          role="dialog"
          aria-modal="true"
          onClick={e => e.stopPropagation()}
          style={{
            background: colors.white,
            borderRadius: radius.primary,
            width: '100%', maxWidth: 480, maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: shadows.high,
          }}
        >
          {header && (
            <div style={{ flexShrink: 0, padding: `${spacing.xl}px ${spacing.xl}px 0` }}>
              {header}
            </div>
          )}
          <div style={{
            overflowY: 'auto',
            padding: footer ? `${spacing.xl}px ${spacing.xl}px ${spacing.xs}px` : spacing.xl,
          }}>
            {children}
          </div>
          {footer && (
            <div style={{ flexShrink: 0, padding: spacing.xl, paddingTop: 0 }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div style={overlay} onClick={onDismiss}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: '16px 16px 0 0',
            width: '100%', maxWidth: '100%', maxHeight: '92vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0px 2px 12px rgba(27,31,35,0.24)',
          }}
        >
          <div style={{ flexShrink: 0, background: '#fff', borderRadius: '16px 16px 0 0', padding: '8px 16px 0' }}>
            {DRAG_HANDLE}
            {header}
          </div>
          <div style={{ overflowY: 'auto', padding: footer ? '0 16px 4px' : '0 16px 24px' }}>
            {children}
          </div>
          {footer && (
            <div style={{ flexShrink: 0, background: '#fff', padding: 16 }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }

  // simple
  return (
    <div style={overlay} onClick={onDismiss}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          width: '100%', maxWidth: '100%',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          padding: '0 16px 24px',
        }}
      >
        {DRAG_HANDLE}
        {children}
      </div>
    </div>
  )
}
