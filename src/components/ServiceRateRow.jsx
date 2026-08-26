import React from 'react'
import { colors, typography } from '../tokens'
import { LockIcon, ChevronRightIcon } from '../assets/icons'
import { lockStatusLine, INACTIVE_SERVICE } from '../data/granularRatesCopy'

const ICON_SIZE = 16

/**
 * ServiceRateRow — one service in the relationship page's read-only rate sheet.
 * Service name left, status line beneath, padlock + chevron right.
 *
 * Ported from the POC's `ServiceRateRow.tsx`. Two of its decisions carry over:
 *   - `Inactive service` wins over the lock line. A service the provider
 *     stopped offering is only listed while it still has custom rates; the
 *     padlock says that part, and the line is the only place the deactivation
 *     can be read.
 *   - The row is pressable whatever the state — opening an inactive service is
 *     the only way to unlock it.
 * The POC's `ServiceLogo` has no prototype equivalent, so the row leads with the
 * name rather than an icon.
 *
 * Row.jsx is not reused directly: it only styles a string label at the default
 * colour, and an inactive service needs a greyed one (the same reason the POC
 * builds its label as a node).
 *
 * Props:
 *   serviceName string
 *   isLocked    bool
 *   lockedAt    Date | null
 *   isInactive  bool     — "Inactive service" wins over the lock status line
 *   onPress     () => void
 */
export default function ServiceRateRow({
  serviceName, isLocked = false, lockedAt = null, isInactive = false, onPress,
}) {
  // `undefined` locale = the browser's, as calendarUtils.js already does.
  const status = isInactive ? INACTIVE_SERVICE : lockStatusLine(isLocked, lockedAt, undefined)

  return (
    <div
      role="button"
      aria-label={`${serviceName}, ${status}`}
      onClick={onPress}
      style={{
        // Geometry copied from Row.jsx so this sits flush with the house rows.
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56,
        paddingTop: 8,
        paddingBottom: 8,
        width: '100%',
        cursor: onPress ? 'pointer' : 'default',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16,
          lineHeight: 1.5, margin: 0,
          color: isInactive ? colors.disabledText : colors.primary,
        }}>{serviceName}</p>
        <p style={{
          fontFamily: typography.fontFamily, fontSize: 14,
          lineHeight: 1.25, color: colors.tertiary, margin: 0,
        }}>{status}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingLeft: 8 }}>
        {/* Padlock on locked services only — the POC gates it on `state === 'custom'`. */}
        {isLocked && <LockIcon size={ICON_SIZE} color={colors.secondary} />}
        <ChevronRightIcon size={ICON_SIZE} />
      </div>
    </div>
  )
}
