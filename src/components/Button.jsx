import React from 'react'
import { colors, radius, typography, shadows } from '../tokens'

// Matches Kibble ButtonYPaddingMap + ButtonXPaddingMap
const SIZES = {
  small:   { paddingTop: 8,  paddingBottom: 8,  paddingLeft: 16, paddingRight: 16, fontSize: 14 },
  default: { paddingTop: 10, paddingBottom: 10, paddingLeft: 24, paddingRight: 24, fontSize: 16 },
  large:   { paddingTop: 18, paddingBottom: 18, paddingLeft: 32, paddingRight: 32, fontSize: 20 },
}

// Matches Kibble button variant theme tokens
const VARIANTS = {
  default:     { background: colors.white,      borderColor: colors.borderInteractive, color: colors.secondary, boxShadow: 'none' },
  primary:     { background: colors.link,       borderColor: 'transparent',            color: colors.white,     boxShadow: shadows.medium },
  flat:        { background: 'transparent',     borderColor: 'transparent',            color: colors.link,      boxShadow: 'none' },
  disabled:    { background: colors.disabledBg, borderColor: colors.disabledBorder,    color: colors.disabledText, boxShadow: 'none' },
  destructive: { background: colors.destructive, borderColor: 'transparent',            color: colors.white,     boxShadow: shadows.medium },
  // Kibble's `destructive` secondary: the outlined counterpart to `destructive`,
  // exactly as `default` is to `primary` — white ground, no shadow, the red
  // carried by the border and the label instead of the fill.
  destructiveSecondary: { background: colors.white, borderColor: colors.destructive, color: colors.destructive, boxShadow: 'none' },
}

/**
 * `ariaLabel` exists for icon-only buttons, which have no text node to name
 * them. `href` / `hrefTarget` / `rel` mirror Kibble's Button, which renders an
 * anchor under the hood when given an `href` (Button.tsx destructures both off
 * `webProps`) — the calendar's sync panel needs that for its `webcal:` and
 * Google add-by-URL links, which must be real navigations.
 */
export default function Button({
  children, variant = 'default', size = 'small', disabled = false,
  fullWidth = false, onClick, icon, style = {}, ariaLabel,
  href, hrefTarget, rel,
}) {
  const v = disabled ? VARIANTS.disabled : VARIANTS[variant]
  const s = SIZES[size]
  const isIconOnly = icon && !children

  const Tag = href ? 'a' : 'button'

  return (
    <Tag
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      href={href}
      target={href ? hrefTarget : undefined}
      rel={href ? rel : undefined}
      style={{
        fontFamily: typography.fontFamily,
        fontWeight: 700,
        fontSize: s.fontSize,
        lineHeight: '1.25',
        borderRadius: radius.round,
        cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        textDecoration: 'none',
        paddingTop:    isIconOnly ? s.paddingTop    : s.paddingTop,
        paddingBottom: isIconOnly ? s.paddingBottom : s.paddingBottom,
        paddingLeft:   isIconOnly ? s.paddingTop    : s.paddingLeft,
        paddingRight:  isIconOnly ? s.paddingTop    : s.paddingRight,
        width: fullWidth ? '100%' : 'auto',
        border: '2px solid',
        transition: 'all 0.15s ease',
        flexShrink: 0,
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
        ...v,
        ...style,
      }}
    >
      {icon}
      {children && <span>{children}</span>}
    </Tag>
  )
}
