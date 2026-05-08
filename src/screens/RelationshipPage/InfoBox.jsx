import React from 'react'
import { colors, typography } from '../../tokens'

// Mirrors production InfoBox.tsx:
// - background: neutral[100] (light grey) for normal, red[100] for error
// - borderRadius: secondary (4px), padding: 4x (16px)
// - icon (GenericNone, red) ONLY when isError
// - title: Heading size 100 (14px / 700), content: Paragraph size 100 (14px / 400)
// - flex row, gap 3x (12px) between icon and content
const ErrorIcon = () => (
  <i
    className="rover-icon-generic-none"
    style={{
      fontSize: 24, color: colors.destructive,
      lineHeight: 1, display: 'inline-block', flexShrink: 0,
    }}
  />
)

export default function InfoBox({ callout }) {
  const { title, content, isError } = callout

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: 16,
      borderRadius: 4,
      background: isError ? colors.errorBg : colors.bgSecondary,
    }}>
      {isError && <ErrorIcon />}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {title && (
          <div style={{
            fontFamily: typography.fontFamily,
            fontWeight: 700, fontSize: 14, lineHeight: '18px',
            color: colors.primary,
          }}>
            {title}
          </div>
        )}
        {content && (
          <div style={{
            fontFamily: typography.fontFamily,
            fontSize: 14, lineHeight: '21px',
            color: colors.primary,
            whiteSpace: 'pre-line',
          }}>
            {content}
          </div>
        )}
      </div>
    </div>
  )
}
