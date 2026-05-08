import { colors } from '../tokens'

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
 *   children   ReactNode           (main content / scrollable body)
 */
export default function BottomSheet({ variant = 'simple', onDismiss, zIndex = 300, header, children }) {
  const overlay = {
    position: 'fixed', inset: 0,
    background: colors.overlayBg,
    zIndex,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
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
          <div style={{ overflowY: 'auto', padding: '0 16px 24px' }}>
            {children}
          </div>
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
