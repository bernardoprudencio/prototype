import React from 'react'
import { colors, typography, textStyles } from '../tokens'
import { BackIcon, ChevronRightIcon } from '../assets/icons'
import ReviewBadge from './ReviewBadge'

// Shared row/section primitives for the service-settings hub and its two
// per-family sub-pages. They lived inside ServiceSettingsScreen until the
// Management-hub migration (DEV-146752) split the detail out into
// FamilyServicesScreen / FamilyProfileScreen, which render the same rows.

// Status-line color tokens. `price` is the yellow "Away" treatment; `link`
// is the blue "Awaiting Approval" one.
export const COLOR_BY_TOKEN = {
  primary:   colors.primary,
  secondary: colors.secondary,
  tertiary:  colors.tertiary,
  price:     colors.cautionText,
  link:      colors.link,
}

/**
 * Section heading. In the migrated IA the leading icon sits on the section
 * header itself (family paw / grid-plus / list / person), where it used to
 * sit on the now-removed Services / Profile sub-headings.
 */
export const SectionHeader = ({ Icon, title, rightLinkLabel, onRightLink, topPadding = 24 }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingTop: topPadding,
      paddingBottom: 8,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      {Icon && (
        <span
          style={{
            display: 'inline-flex',
            width: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={24} color={colors.primary} />
        </span>
      )}
      <h2
        style={{
          fontFamily: typography.fontFamily,
          fontWeight: 600,
          fontSize: 20,
          lineHeight: 1.25,
          color: colors.primary,
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
    {rightLinkLabel && (
      <button
        type="button"
        onClick={onRightLink}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          flexShrink: 0,
          ...textStyles.link100Semibold,
          color: colors.link,
        }}
      >
        {rightLinkLabel}
      </button>
    )}
  </div>
)

/**
 * Settings row. Row-level dividers are intentionally absent — section
 * boundaries are conveyed by `SectionGroup`'s trailing border instead.
 *
 * `needsReview` renders the yellow "Review" badge left of the right item.
 */
export const SettingsRow = ({
  leftIcon,
  label,
  labelColor = colors.primary,
  sublabel,
  statusLines,
  needsReview = false,
  rightItem,
  onPress,
}) => (
  <div
    onClick={onPress}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      paddingTop: 16,
      paddingBottom: 16,
      cursor: onPress ? 'pointer' : 'default',
    }}
  >
    {leftIcon && (
      <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
        {leftIcon}
      </span>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
      <span style={{ ...textStyles.text200Semibold, lineHeight: 1.25, color: labelColor }}>
        {label}
      </span>
      {sublabel && (
        <span style={{ ...textStyles.text100, color: colors.tertiary }}>{sublabel}</span>
      )}
      {statusLines?.map((line, i) => {
        const text = typeof line === 'string' ? line : line.text
        const colorToken = typeof line === 'object' ? line.color : undefined
        return (
          <span
            key={i}
            style={{ ...textStyles.text100, color: COLOR_BY_TOKEN[colorToken] ?? colors.tertiary }}
          >
            {text}
          </span>
        )
      })}
    </div>
    {(needsReview || rightItem) && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {needsReview && <ReviewBadge />}
        {rightItem}
      </div>
    )}
  </div>
)

export const Chevron = () => <ChevronRightIcon />

/**
 * Wraps a top-level section group: 40px bottom padding plus a 1px trailing
 * rule, matching Figma's structure where the rule belongs to the section
 * above rather than being a standalone divider. The last section on a page
 * renders `borderless`.
 */
export const SectionGroup = ({ children, borderless = false }) => (
  <div
    style={{
      paddingBottom: 40,
      borderBottom: borderless ? 'none' : `1px solid ${colors.border}`,
    }}
  >
    {children}
  </div>
)

/**
 * 56px nav bar used by the per-family sub-pages: back chevron on the left,
 * centered title. The hub itself uses a left-aligned Bogart display title
 * instead, so it does not share this.
 */
export const SubPageHeader = ({ title, onBack }) => (
  <div
    style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      height: 56,
      paddingLeft: 16,
      paddingRight: 16,
      borderBottom: `1px solid ${colors.border}`,
      background: colors.white,
      flexShrink: 0,
    }}
  >
    <button
      type="button"
      onClick={onBack}
      aria-label="Back"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        zIndex: 1,
      }}
    >
      <BackIcon />
    </button>
    <h1
      style={{
        position: 'absolute',
        left: 56,
        right: 56,
        textAlign: 'center',
        fontFamily: typography.fontFamily,
        fontWeight: 600,
        fontSize: 17,
        lineHeight: 1.25,
        color: colors.primary,
        margin: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {title}
    </h1>
  </div>
)
