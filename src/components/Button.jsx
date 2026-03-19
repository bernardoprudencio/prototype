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
  destructive: { background: '#BC4338',         borderColor: 'transparent',            color: colors.white,     boxShadow: shadows.medium },
}

export default function Button({ children, variant = 'default', size = 'small', disabled = false, fullWidth = false, onClick, icon, style = {} }) {
  const v = disabled ? VARIANTS.disabled : VARIANTS[variant]
  const s = SIZES[size]
  const isIconOnly = icon && !children

  return (
    <button
      onClick={disabled ? undefined : onClick}
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
    </button>
  )
}
