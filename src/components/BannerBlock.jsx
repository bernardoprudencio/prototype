import React from 'react'
import { colors, typography } from '../tokens'
import { ClockIcon } from '../assets/icons'

export default function BannerBlock({ text, link, onClick }) {
  return (
    <div style={{
      background: colors.yellow100, borderRadius: 4, padding: 16,
      display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12,
    }}>
      <div style={{ flexShrink: 0 }}><ClockIcon /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.5, color: colors.primary, margin: 0 }}>{text}</p>
        {link && (
          <p onClick={onClick} style={{
            fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 14,
            color: colors.link, textDecoration: 'underline', margin: '8px 0 0', cursor: 'pointer',
          }}>{link}</p>
        )}
      </div>
    </div>
  )
}
