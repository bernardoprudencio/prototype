import React, { useState } from 'react'
import { colors, typography, shadows } from '../tokens'
import { petImages } from '../assets/images'
import PetAvatar from './PetAvatar'
import Button from './Button'
import Row from './Row'
import Chip from './Chip'

export default function ReviewSheet({ visible, card, onClose, onComplete, onCancelRefund }) {
  const [answer, setAnswer] = useState('no')

  if (!visible || !card) return null

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
          Have you completed the walk?
        </p>

        {/* No / Yes toggle — Kibble Chip pattern */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['no', 'yes'].map((opt) => (
            <Chip
              key={opt}
              label={opt.charAt(0).toUpperCase() + opt.slice(1)}
              selected={answer === opt}
              checkmark
              onClick={() => setAnswer(opt)}
            />
          ))}
        </div>

        <p style={{ fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.5, color: colors.tertiary, margin: '0 0 20px' }}>
          {answer === 'yes'
            ? "There's no Rover Card, so your client won't see updates about their pet. We'll let them know the service is complete."
            : `A refund of ${card.cost} will automatically be processed.`}
        </p>

        {answer === 'yes'
          ? <Button variant="primary" fullWidth style={{ marginBottom: 12 }} onClick={onComplete}>Mark as complete</Button>
          : <Button variant="destructive" fullWidth style={{ marginBottom: 12 }} onClick={onCancelRefund}>Cancel and refund</Button>
        }
        <Button variant="default" fullWidth onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
