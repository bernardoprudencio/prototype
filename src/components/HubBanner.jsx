import React from 'react'
import { colors, typography, radius } from '../tokens'
import { ClockIcon, CautionIcon, CloseSmIcon } from '../assets/icons'

// Severity → background tint, text color, and default icon.
// Tokens mirror BannerBlock's compact, padded, rounded pattern.
const SEVERITY_STYLES = {
  info: {
    background: colors.bgInfo,           // palette.blue[100]
    titleColor: colors.primary,
    bodyColor: colors.primary,
    Icon: ClockIcon,
  },
  warning: {
    background: colors.yellow100,        // matches BannerBlock yellow tint
    titleColor: colors.primary,
    bodyColor: colors.primary,
    Icon: ClockIcon,
  },
  error: {
    background: colors.errorBgLight,     // palette.red[100]
    titleColor: colors.primary,
    bodyColor: colors.primary,
    Icon: CautionIcon,
  },
}

export default function HubBanner({
  severity = 'info',
  title,
  body,
  cta,
  onDismiss,
}) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info
  const Icon = s.Icon

  return (
    <div
      style={{
        background: s.background,
        borderRadius: radius.primary,
        padding: 16,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        marginBottom: 12,
      }}
    >
      {Icon && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <Icon />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <p
            style={{
              fontFamily: typography.fontFamily,
              fontWeight: 600,
              fontSize: 14,
              lineHeight: 1.25,
              color: s.titleColor,
              margin: 0,
            }}
          >
            {title}
          </p>
        )}

        <p
          style={{
            fontFamily: typography.fontFamily,
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1.5,
            color: s.bodyColor,
            margin: title ? '4px 0 0' : 0,
          }}
        >
          {body}
        </p>

        {cta && (
          <p
            onClick={cta.onClick}
            style={{
              fontFamily: typography.fontFamily,
              fontWeight: 700,
              fontSize: 14,
              color: colors.link,
              textDecoration: 'underline',
              margin: '8px 0 0',
              cursor: 'pointer',
            }}
          >
            {cta.label}
          </p>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            padding: 4,
            margin: -4,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CloseSmIcon />
        </button>
      )}
    </div>
  )
}
