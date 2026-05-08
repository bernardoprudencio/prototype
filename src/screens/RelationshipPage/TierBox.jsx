import React from 'react'
import { colors, typography, radius } from '../../tokens'
import CheckMark from './CheckMark'

// Heights ascend across tier boxes to create the "ladder" silhouette
// (production heights: 96 / 104 / 120 px).
const HEIGHTS = [96, 104, 120]

const borderFor = (status) => {
  switch (status) {
    case 'active':   return { border: `2px solid ${colors.success}` }
    case 'pending':  return { border: `2px dashed ${colors.successLight}` }
    case 'complete': return { border: `2px solid ${colors.borderInteractive}` }
    case 'new':
    default:         return { border: `2px solid ${colors.borderInteractive}` }
  }
}

// Production paddingTop per TierBox.tsx: tier-specific padding plus extra
// clearance when an avatar/check sits above the content.
const paddingTopFor = (tierIndex, hasIcon) => {
  const tierPadding = tierIndex === 1 ? 8 : tierIndex === 2 ? 24 : 0
  const iconPadding = hasIcon ? 12 : 0
  return tierPadding + iconPadding
}

export default function TierBox({ label, status, thresholdText, earnText, ownerAvatarUrl, tierIndex = 0 }) {
  const showAvatar = status === 'active' && ownerAvatarUrl
  const showCheck = status === 'complete'
  const hasIcon = showAvatar || showCheck

  return (
    <div style={{
      flex: 1, position: 'relative',
      minHeight: HEIGHTS[tierIndex],
      minWidth: 90,
      borderRadius: radius.primary,
      background: 'transparent',
      ...borderFor(status),
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-end',
      paddingTop: paddingTopFor(tierIndex, hasIcon),
      paddingBottom: 16,
      paddingLeft: 8, paddingRight: 8,
      textAlign: 'center',
    }}>
      {/* Tier label — Text size 200 (16px) semibold per production TierBox */}
      <div style={{
        fontFamily: typography.fontFamily,
        fontWeight: 700, fontSize: 16, lineHeight: '20px',
        color: colors.primary,
      }}>
        {label}
      </div>
      {/* Threshold + earn — Text size 50 (13px) regular */}
      {thresholdText && (
        <div style={{
          fontFamily: typography.fontFamily,
          fontSize: 13, lineHeight: '16px',
          color: colors.tertiary,
        }}>
          {thresholdText}
        </div>
      )}
      {earnText && (
        <div style={{
          fontFamily: typography.fontFamily,
          fontSize: 13, lineHeight: '16px',
          color: colors.tertiary,
        }}>
          {earnText}
        </div>
      )}

      {showAvatar && (
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 24, height: 24, borderRadius: '50%',
          border: `2px solid ${colors.success}`,
          background: colors.white,
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
          <img src={ownerAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {showCheck && (
        <div style={{ position: 'absolute', top: -4, right: -4 }}>
          <CheckMark size={24} />
        </div>
      )}
    </div>
  )
}
