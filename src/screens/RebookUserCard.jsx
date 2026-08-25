import React from 'react'
import { colors, typography } from '../tokens'
import { ChevronRightIcon } from '../assets/icons'
import { personPlaceholder } from '../assets/images'
import Pill from '../components/Pill'

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

const truncate = {
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
}

// `isWide` turns the row into a card: production's chevron is scoped to
// `max-width: 719px` and the desktop card carries a full border rather than a
// single bottom rule (RebookUserCard.tsx:25,130-134).
export default function RebookUserCard({ contact, onClick, isWide = false }) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        border: isWide ? `1px solid ${colors.border}` : undefined,
        borderRadius: isWide ? 8 : undefined,
        borderBottom: isWide ? undefined : `1px solid ${colors.border}`,
        background: colors.white,
        cursor: onClick ? 'pointer' : 'default',
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

      {contact.tierName && <Pill>{contact.tierName}</Pill>}
      {!isWide && <ChevronRightIcon />}
    </div>
  )
}
