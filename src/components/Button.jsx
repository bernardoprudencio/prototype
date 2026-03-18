import React from 'react'
import { colors, radius, typography } from '../tokens'

const VARIANTS = {
  default: { background: colors.white, borderColor: colors.borderInteractive, color: colors.secondary },
  primary: { background: colors.link, borderColor: colors.link, color: colors.white },
  flat: { background: 'transparent', borderColor: 'transparent', color: colors.link },
  disabled: { background: colors.disabledBg, borderColor: colors.disabledBorder, color: colors.disabledText },
}

export default function Button({ children, variant = 'default', disabled = false, fullWidth = false, onClick, icon, style = {} }) {
  const v = disabled ? VARIANTS.disabled : VARIANTS[variant]

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        fontFamily: typography.fontFamily,
        fontWeight: 700,
        fontSize: 14,
        lineHeight: '1.25',
        borderRadius: radius.round,
        cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: icon && !children ? 8 : '8px 16px',
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
