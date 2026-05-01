import React from 'react'
import { colors, typography, shadows } from '../../tokens'
import { Button } from '../../components'
import { BackIcon } from '../../assets/icons'
import { personPlaceholder } from '../../assets/images'

// Mirrors the RN HeaderRow layout: back arrow + 48px avatar on the left,
// name (title) and pet names (subtitle) stacked, Rebook/Profile buttons
// below the title row but still inside the header bar.
export default function RelationshipPageHeader({ ownerName, petNames, avatarUrl, onBack, onRebookPress, onProfilePress }) {
  const showButtons = onRebookPress || onProfilePress

  return (
    <div style={{
      flexShrink: 0,
      background: colors.white,
      boxShadow: shadows.headerShadow,
      zIndex: 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 8px 8px 4px',
      }}>
        <button
          onClick={onBack}
          aria-label="Back"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <BackIcon />
        </button>

        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          overflow: 'hidden', background: colors.bgSecondary, flexShrink: 0,
        }}>
          <img
            src={avatarUrl || personPlaceholder}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title — Text size 200 (16px) semibold (production HeaderRow title) */}
          <div style={{
            fontFamily: typography.fontFamily,
            fontWeight: 700, fontSize: 16, lineHeight: '20px',
            color: colors.primary,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {ownerName}
          </div>
          {/* Subtitle — Text size 100 (14px) tertiary */}
          {petNames && (
            <div style={{
              fontFamily: typography.fontFamily,
              fontSize: 14, lineHeight: '18px',
              color: colors.tertiary,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {petNames}
            </div>
          )}
        </div>
      </div>

      {showButtons && (
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
          {onRebookPress && (
            <Button variant="primary" size="small" onClick={onRebookPress}>Rebook</Button>
          )}
          {onProfilePress && (
            <Button variant="default" size="small" onClick={onProfilePress}>Profile</Button>
          )}
        </div>
      )}
    </div>
  )
}
