import React from 'react'
import { colors, radius, spacing, textStyles } from '../../tokens'

/**
 * The bordered panel every dashboard module sits in. Production's dashboard
 * widgets are Bootstrap `.panel` blocks; this is the token equivalent.
 */
export default function Widget({ title, children, style = {} }) {
  return (
    <section style={{
      border: `1px solid ${colors.border}`,
      borderRadius: radius.primary,
      background: colors.white,
      padding: spacing.lg,
      ...style,
    }}>
      {title && (
        <h2 style={{ ...textStyles.heading200, color: colors.primary, margin: `0 0 ${spacing.md}px` }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

/** Inline text link, styled to match the rest of the prototype's links. */
export function WidgetLink({ children, onClick, style = {} }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...textStyles.link100Semibold,
        color: colors.link,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
