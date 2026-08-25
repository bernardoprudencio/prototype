import React from 'react'
import { radius, textStyles } from '../../tokens'
import { CAL_COLORS, CAL_DIMS } from './calendarTheme'
import { BOOKINGS } from '../../data/calendarCopy'
import PetAvatar from '../../components/PetAvatar'

/**
 * Port of `layouts/v1/V1EventCard.tsx` — one booking in the rail.
 *
 * The POC composes its own title rather than trusting the payload:
 * `${serviceName}: ${petList || serviceName}` (:56-60), so a booking with no
 * pets repeats the service name instead of trailing a bare colon. It renders as
 * a `<button>` when `conversationUrl` is set and as a plain `<div>` otherwise,
 * with `aria-label="Open conversation for {title}"`.
 *
 * Kibble `variant="elevation_mid"` maps onto the prototype's own card shadow
 * (`CAL_COLORS.cardShadow`, the same `shadows.low` value the codebase uses for
 * raised surfaces).
 */
export default function EventCard({ booking, onOpen }) {
  const petList = booking.pets.map((p) => p.name).join(', ')
  const titleLine = `${booking.serviceName}: ${petList || booking.serviceName}`
  const subLine = booking.subtitle || null

  const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

  const body = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ ...textStyles.text200Semibold, color: CAL_COLORS.textPrimary, marginBottom: 4, ...ellipsis }}>
          {titleLine}
        </div>
        {subLine && (
          <div style={{ ...textStyles.text200, color: CAL_COLORS.textSecondary, ...ellipsis }}>
            {subLine}
          </div>
        )}
      </div>
      <PetAvatar
        size={CAL_DIMS.eventAvatarSize}
        images={booking.pets.slice(0, 1).map((p) => p.avatarImage)}
      />
    </div>
  )

  const shell = {
    display: 'block', width: '100%', textAlign: 'left',
    background: '#fff', border: 'none', padding: 12, marginBottom: 8,
    borderRadius: radius.primary, boxShadow: CAL_COLORS.cardShadow,
    boxSizing: 'border-box',
  }

  if (!booking.conversationUrl) {
    return <div style={shell}>{body}</div>
  }

  return (
    <button
      type="button"
      aria-label={BOOKINGS.openConversation(titleLine)}
      onClick={() => onOpen?.(booking)}
      style={{ ...shell, cursor: 'pointer', font: 'inherit' }}
    >
      {body}
    </button>
  )
}
