import React from 'react'
import { colors, typography } from '../../tokens'
import { ChevronRightIcon } from '../../assets/icons'
import { Pill } from '../../components'
import { formatMoney } from '../../data/relationshipData'

// Chip color map mirrors getChipColors in BookingItem.tsx production:
// pending → green[200] bg / primary text, completed → success bg / inverse text,
// no_deposit → secondary bg, issue → red bg.
const CHIP_COLORS = {
  pending_service_deposit:   { bg: colors.successLight, color: colors.primary },
  completed_service_deposit: { bg: colors.success,      color: colors.white   },
  no_service_deposit:        { bg: colors.bgSecondary,  color: colors.primary },
  issue_service_deposit:     { bg: colors.errorBg,      color: colors.primary },
}

const ServiceIcon = ({ name }) => (
  <i
    className={`rover-icon-${name}`}
    style={{
      fontSize: 24, color: colors.primary,
      lineHeight: 1, display: 'inline-block', flexShrink: 0,
    }}
  />
)

export default function BookingItem({ booking, type, onClick }) {
  const chip = CHIP_COLORS[booking.serviceStatus] || CHIP_COLORS.no_service_deposit
  const showEarnings = type !== 'archived'

  return (
    <div
      role="button"
      onClick={() => onClick && onClick(booking.conversationOpk)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: colors.white,
        cursor: 'pointer',
      }}
    >
      <ServiceIcon name={booking.serviceIcon} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Service name — Text size 200 semibold */}
        <div style={{
          fontFamily: typography.fontFamily,
          fontWeight: 700, fontSize: 16, lineHeight: '24px',
          color: colors.primary,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {booking.serviceName}
        </div>
        {/* Dates — Text size 100 tertiary */}
        <div style={{
          fontFamily: typography.fontFamily,
          fontSize: 14, lineHeight: '18px',
          color: colors.tertiary,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {booking.dates}
        </div>
        {showEarnings && (
          <div style={{
            fontFamily: typography.fontFamily,
            fontSize: 14, lineHeight: '18px',
            color: colors.tertiary,
          }}>
            Your earnings: {formatMoney(booking.earnings)}
          </div>
        )}
      </div>

      <Pill bg={chip.bg} color={chip.color}>{formatMoney(booking.price)}</Pill>

      <ChevronRightIcon />
    </div>
  )
}
