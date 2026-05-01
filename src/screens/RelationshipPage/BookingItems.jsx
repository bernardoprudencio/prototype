import React, { useState } from 'react'
import { colors, typography, radius, shadows } from '../../tokens'
import { Button, DragHandle } from '../../components'
import { formatMoney } from '../../data/relationshipData'
import BookingItem from './BookingItem'

const TITLES = {
  upcoming: 'upcoming',
  past:     'complete',
  archived: 'Archived',
}

const PREVIEW_LIMIT = 3

const SectionHeader = ({ type, earningsAmount, currencyIso }) => {
  if (type === 'archived') {
    return (
      <div style={{
        fontFamily: typography.fontFamily,
        fontWeight: 700, fontSize: 16, lineHeight: '20px',
        color: colors.primary,
      }}>
        Archived
      </div>
    )
  }

  const indicatorColor = type === 'upcoming' ? colors.successLight : colors.success
  const moneyText = formatMoney({ amount: earningsAmount || '0', currencyIso })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 24, height: 24, borderRadius: radius.primary,
        background: indicatorColor,
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: typography.fontFamily,
        fontWeight: 700, fontSize: 16, lineHeight: '20px',
        color: colors.primary,
      }}>
        {moneyText} {TITLES[type]}
      </span>
    </div>
  )
}

const SeeMoreModal = ({ open, onClose, type, bookings, earningsAmount, currencyIso, onCardClick }) => {
  if (!open) return null

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.4)',
    }}>
      <div onClick={onClose} style={{ flex: 1 }} />
      <div style={{
        background: colors.white,
        borderRadius: '16px 16px 0 0',
        boxShadow: shadows.medium,
        maxHeight: '85%',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.25s ease-out',
      }}>
        <DragHandle />
        <div style={{ padding: '16px 16px 12px' }}>
          <SectionHeader type={type} earningsAmount={earningsAmount} currencyIso={currencyIso} />
        </div>
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
          {bookings.map(b => (
            <BookingItem key={b.id} booking={b} type={type} onClick={onCardClick} />
          ))}
        </div>
        <div style={{ padding: '12px 16px 16px' }}>
          <Button variant="default" size="small" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function BookingItems({ type, bookings, earningsAmount, currencyIso, onCardClick }) {
  const [modalOpen, setModalOpen] = useState(false)

  if (!bookings || bookings.length === 0) return null

  const preview = bookings.slice(0, PREVIEW_LIMIT)
  const hasMore = bookings.length > PREVIEW_LIMIT

  return (
    <div style={{
      background: colors.white,
      borderRadius: radius.primary,
      padding: '16px 0 8px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '0 16px 4px' }}>
        <SectionHeader type={type} earningsAmount={earningsAmount} currencyIso={currencyIso} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {preview.map(b => (
          <BookingItem key={b.id} booking={b} type={type} onClick={onCardClick} />
        ))}
      </div>

      {hasMore && (
        <div style={{ padding: '8px 16px 0' }}>
          <Button variant="flat" size="small" fullWidth onClick={() => setModalOpen(true)}>
            See more
          </Button>
        </div>
      )}

      <SeeMoreModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        type={type}
        bookings={bookings}
        earningsAmount={earningsAmount}
        currencyIso={currencyIso}
        onCardClick={onCardClick}
      />
    </div>
  )
}
