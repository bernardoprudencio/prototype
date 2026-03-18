import React from 'react'
import { colors, typography } from '../tokens'
import { CheckIcon } from '../assets/icons'

export default function ChatBubble({ message, time, isOwner = false, showCheck = false }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isOwner ? 'flex-end' : 'flex-start',
      padding: '0 0 8px',
    }}>
      <div style={{
        background: isOwner ? colors.bgTertiary : colors.bgSecondary,
        borderRadius: isOwner ? '10px 10px 0 10px' : '10px 10px 10px 0',
        padding: '8px 12px', maxWidth: '80%',
      }}>
        <p style={{
          fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.5,
          color: colors.primary, margin: '0 0 4px',
        }}>{message}</p>
        <div style={{
          display: 'flex', gap: 4, alignItems: 'center',
          justifyContent: isOwner ? 'flex-end' : 'flex-start',
        }}>
          <span style={{ fontFamily: typography.fontFamily, fontSize: 13, color: colors.tertiary }}>{time}</span>
          {showCheck && <CheckIcon />}
        </div>
      </div>
    </div>
  )
}
