import React from 'react'
import { colors, typography, shadows } from '../tokens'
import { ChevronRightIcon } from '../assets/icons'
import { petImages } from '../assets/images'
import PetAvatar from './PetAvatar'
import Button from './Button'

const OPTIONS = [
  { label: 'Review and complete' },
  { label: 'Go to conversation with Owen', actionKey: 'conversation' },
  { label: 'Reschedule walk' },
]

export default function ActionSheet({ visible, onClose, onGoToConversation }) {
  if (!visible) return null

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} />

      {/* Sheet */}
      <div style={{
        background: colors.white, borderRadius: '16px 16px 0 0',
        boxShadow: shadows.medium, padding: '32px 16px 24px',
        animation: 'slideUp 0.25s ease-out',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 36, height: 5, borderRadius: 35, background: colors.borderInteractive }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0 16px' }}>
          <PetAvatar size={48} images={[petImages.archie]} />
          <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
            <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, color: colors.primary, margin: 0 }}>Dog Walking: Archie</p>
            <p style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.tertiary, margin: 0 }}>Yesterday · 12:00 PM to 12:30 PM</p>
          </div>
        </div>

        {/* Options */}
        {OPTIONS.map((item, i) => (
          <div
            key={i}
            onClick={item.actionKey === 'conversation' ? onGoToConversation : undefined}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 0',
              borderTop: i === 0 ? `1px solid ${colors.bgSecondary}` : 'none',
              cursor: item.actionKey ? 'pointer' : 'default',
            }}
          >
            <p style={{ fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 16, color: colors.primary, margin: 0 }}>{item.label}</p>
            <ChevronRightIcon />
          </div>
        ))}

        <div style={{ paddingTop: 16 }}>
          <Button variant="default" fullWidth onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
