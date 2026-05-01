import React from 'react'
import { colors } from '../../tokens'

// Mirrors roverdotcom/web :: RelationshipPage/components/CheckMark.tsx —
// 24px circular outline, kibble border.secondary border, border.primary fill.
// SVG path is the production check-small icon (icons/svg/check-small.svg).
export default function CheckMark({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors.white,
      border: `2px solid ${colors.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxSizing: 'border-box',
    }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="#1B1F23" aria-hidden="true">
        <path d="M21.614 11.21a1 1 0 0 1 .175 1.404l-7 9a1 1 0 0 1-1.496.093l-3-3a1 1 0 1 1 1.414-1.414l2.2 2.199 6.304-8.106a1 1 0 0 1 1.403-.175z"/>
      </svg>
    </div>
  )
}
