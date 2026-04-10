import React from 'react'
import { colors, typography, spacing } from '../tokens'
import { peopleImages } from '../assets/images'

const dateOnly = (ts) => ts.replace(/\s+\d{1,2}:\d{2}\s*(AM|PM)/i, '').trim()
const buildSnippet = (text, sender) => sender === 'you' ? `You: ${text}` : text

export default function ThreadRow({ thread, owner, displayMessage, onClick }) {
  const snippet = buildSnippet(displayMessage.text, displayMessage.sender)
  const { serviceLabel, alert } = thread

  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
        <div style={{
          paddingLeft: spacing.lg,
          paddingRight: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
          background: colors.white,
        }}>

          {/* Row 1: avatar + name/pets + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.lg }}>
            <div style={{ flexShrink: 0 }}>
              <img
                src={peopleImages[thread.ownerId]}
                alt={owner.name}
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', display: 'block', border: `1px solid ${colors.white}` }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 14, lineHeight: 1.25, color: colors.primary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{owner.name}</p>
              <p style={{ fontFamily: typography.fontFamily, fontWeight: 400, fontSize: 14, lineHeight: 1.25, color: colors.tertiary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{owner.petNames}</p>
            </div>
            <div style={{ flexShrink: 0 }}>
              <p style={{ fontFamily: typography.fontFamily, fontWeight: 400, fontSize: 14, lineHeight: 1.25, color: colors.tertiary, margin: 0, textAlign: 'right', whiteSpace: 'nowrap' }}>{dateOnly(displayMessage.timestamp)}</p>
            </div>
          </div>

          {/* Message snippet */}
          <p style={{ fontFamily: typography.fontFamily, fontWeight: 400, fontSize: 14, lineHeight: 1.25, color: colors.primary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snippet}</p>

          {/* Service detail */}
          <p style={{ fontFamily: typography.fontFamily, fontWeight: 400, fontSize: 14, lineHeight: 1.25, color: colors.tertiary, margin: 0, paddingTop: spacing.lg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{serviceLabel}</p>

          {/* Status */}
          <div style={{ paddingTop: spacing.sm }}>
            <p style={{ fontFamily: typography.fontFamily, fontWeight: 400, fontSize: 14, lineHeight: 1.25, color: colors.success, margin: 0 }}>Ongoing</p>
          </div>

          {/* Alert banner */}
          {alert && (
            <div style={{ paddingTop: spacing.lg }}>
              <div style={{ background: colors.blueLight, borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <p style={{ fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 14, lineHeight: 1.25, color: colors.link, textDecoration: 'underline', margin: 0, flex: 1 }}>{alert}</p>
                <span style={{ color: colors.link, fontSize: 16 }}>›</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ height: 1, background: colors.border }} />
    </div>
  )
}
