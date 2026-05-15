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

// `layout="paragraph"` collapses title + body + cta into a single inline
// paragraph (bold lead, plain follow-up, inline link). Matches the
// production GroomingProfileReviewBanner shape, which uses a Kibble Alert
// with no icon and a single <Paragraph> of three inline spans.
export default function HubBanner({
  severity = 'info',
  title,
  body,
  cta,
  onDismiss,
  layout = 'stack',
  hideIcon = false,
}) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info
  const Icon = !hideIcon ? s.Icon : null

  const renderCta = (extraStyle = {}) => {
    if (!cta) return null
    const baseStyle = {
      fontFamily: typography.fontFamily,
      fontWeight: 700,
      fontSize: 14,
      color: colors.link,
      textDecoration: 'underline',
      cursor: 'pointer',
      ...extraStyle,
    }
    if (cta.href) {
      return (
        <a
          href={cta.href}
          target={cta.target || '_self'}
          rel={cta.target === '_blank' ? 'noreferrer noopener' : undefined}
          style={baseStyle}
        >
          {cta.label}
        </a>
      )
    }
    return (
      <span onClick={cta.onClick} style={baseStyle}>
        {cta.label}
      </span>
    )
  }

  if (layout === 'paragraph') {
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

        <p
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: typography.fontFamily,
            fontSize: 14,
            lineHeight: 1.5,
            color: s.bodyColor,
            margin: 0,
          }}
        >
          {title && <span style={{ fontWeight: 600 }}>{title}</span>}
          {title && body && ' '}
          {body && <span>{body}</span>}
          {cta && ' '}
          {renderCta()}
        </p>

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
          <div style={{ marginTop: 8 }}>
            {renderCta({ display: 'inline-block' })}
          </div>
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
