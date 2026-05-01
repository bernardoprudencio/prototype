import React from 'react'
import { colors, typography } from '../tokens'
import { ChevronRightIcon } from '../assets/icons'
import { personPlaceholder } from '../assets/images'

// Kibble's <Avatar> falls back to PersonPlaceholder
// (react-lib/src/images/placeholders/person-placeholder.png) when imageUrl
// is null. Rendered with object-fit: cover (Kibble Image default).
const Avatar = ({ src, size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
  }}>
    <img
      src={src || personPlaceholder}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  </div>
)

// Mirrors RebookUserCard.tsx: bg = theme.colors.text.success, text = primary_inverse,
// borderRadius="secondary" (4px), px=2x py=1x (8/4), Text size=100 semibold.
const TierPill = ({ name }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    background: colors.success, color: colors.white,
    fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 12, lineHeight: '16px',
    padding: '4px 8px', borderRadius: 4, flexShrink: 0,
  }}>
    {name}
  </span>
)

const truncate = {
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
}

export default function RebookUserCard({ contact }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      borderBottom: `1px solid ${colors.border}`,
      background: colors.white,
    }}>
      <Avatar src={contact.imageUrl} size={32} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{
          ...truncate,
          fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, lineHeight: '22px', color: colors.primary,
        }}>
          {contact.displayName}
        </div>
        {contact.subtitleText && (
          <div style={{
            ...truncate,
            fontFamily: typography.fontFamily, fontSize: 14, lineHeight: '20px', color: colors.tertiary,
          }}>
            {contact.subtitleText}
          </div>
        )}
        {contact.bookingInfoText && (
          <div style={{
            ...truncate,
            fontFamily: typography.fontFamily, fontSize: 14, lineHeight: '20px', color: colors.tertiary,
          }}>
            {contact.bookingInfoText}
          </div>
        )}
      </div>

      {contact.tierName && <TierPill name={contact.tierName} />}
      <ChevronRightIcon />
    </div>
  )
}
