import React from 'react'
import { colors, typography } from '../tokens'

// Mirrors the production Kibble badge used in the contacts list TierPill
// (RebookUserCard.tsx): borderRadius="secondary" (4px), px=2x py=1x (8/4),
// Text size=100 (14px) semibold (700). Background and text color vary by use
// (success-tier, status chip on bookings, etc).
export default function Pill({ children, bg = colors.success, color = colors.white }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: bg, color,
      fontFamily: typography.fontFamily, fontWeight: 700,
      fontSize: 14, lineHeight: '20px',
      padding: '4px 8px', borderRadius: 4, flexShrink: 0,
    }}>
      {children}
    </span>
  )
}
