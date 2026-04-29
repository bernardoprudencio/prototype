import React, { useState } from 'react'
import { colors, typography, shadows, radius } from '../tokens'
import { petImages } from '../assets/images'
import PetAvatar from './PetAvatar'
import Button from './Button'
import Row from './Row'

export default function ReviewSheet({ visible, card, onClose, onComplete, onCancelRefund }) {
  const [answer, setAnswer] = useState('no')

  if (!visible || !card) return null

  const ownerFirstName = (card.client || '').split(' ')[0]

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.3)',
    }}>
      <div onClick={onClose} style={{ flex: 1 }} />

      <div style={{
        background: colors.white, borderRadius: '8px 8px 0 0',
        boxShadow: shadows.medium, padding: '0 16px 24px',
        animation: 'slideUp 0.25s ease-out',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, marginBottom: 24 }}>
          <div style={{ width: 36, height: 5, borderRadius: 35, background: colors.borderInteractive }} />
        </div>

        <Row
          label={card.label}
          sublabel={card.sublabel}
          rightItem={<PetAvatar size={48} images={[petImages[card.petKey]]} />}
          firstRow
        />

        <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, color: colors.primary, margin: '0 0 12px' }}>
          Did the walk happen?
        </p>

        {/* Yes / No toggle — Kibble Chip pattern */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['yes', 'no'].map((opt) => {
            const selected = answer === opt
            return (
              <button
                key={opt}
                onClick={() => setAnswer(opt)}
                style={{
                  minWidth: 88, padding: '10px 16px',
                  border: `2px solid ${selected ? colors.link : colors.border}`,
                  borderRadius: radius.primary,
                  background: selected ? '#ECF1FB' : colors.white,
                  fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 14,
                  color: selected ? colors.primary : colors.tertiary,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {selected && (
                  <svg width="16" height="16" viewBox="0 0 32 32" fill={colors.link}>
                    <path d="M26.191 4.412a1 1 0 1 1 1.618 1.176l-16 22a1 1 0 0 1-1.516.12l-6-6a1 1 0 1 1 1.414-1.415l5.173 5.172L26.19 4.412z"/>
                  </svg>
                )}
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            )
          })}
        </div>

        <p style={{ fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.5, color: colors.tertiary, margin: '0 0 20px' }}>
          {answer === 'yes'
            ? "There's no Rover Card, so your client won't see updates about their pet. We'll let them know the service is complete."
            : `${ownerFirstName} will be refunded ${card.cost} for this service once all services of the week are submitted.`}
        </p>

        <Button
          variant="primary"
          fullWidth
          style={{ marginBottom: 12 }}
          onClick={answer === 'yes' ? onComplete : onCancelRefund}
        >
          Submit
        </Button>
        <Button variant="default" fullWidth onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
