import React from 'react'
import { colors, radius, typography, textStyles } from '../tokens'
import { BackIcon, BlockedIcon, ChevronRightIcon } from '../assets/icons'
import { HUB_COPY } from '../data/hubCopy'
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

// ── Wide-width (side-menu) primitives ────────────────────────────────────────
// At >=769px the hub becomes a master-detail layout: this sidebar picks the
// section, and the family panes pick their slot with `PaneTabs`. Figma
// 608:55002 (desktop), 1548:5507 (tablet).

/**
 * Left sidebar. `items` are `{ key, label, Icon, to, badge }`; the selected row
 * gets a grey pill. The "Review" badge is per nav item, not per tab — Figma
 * 4233:41097 shows Pet sitting and Business badged while Training is selected,
 * and no frame ever badges a tab.
 */
export const HubSideNav = ({ title, items, activeKey, onSelect, onStopProviding }) => (
  <nav style={{ display: 'flex', flexDirection: 'column' }}>
    <h1
      style={{
        ...textStyles.display400,
        color: colors.primary,
        margin: 0,
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 24,
      }}
    >
      {title}
    </h1>

    {items.map((item) => {
      const selected = item.key === activeKey
      return (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            height: 56,
            paddingLeft: 16,
            paddingRight: 16,
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: radius.primary,
            background: selected ? colors.bgSecondary : 'transparent',
          }}
        >
          {item.Icon && (
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
              <item.Icon size={24} color={colors.primary} />
            </span>
          )}
          <span
            style={{
              ...(selected ? textStyles.text200Semibold : textStyles.text200),
              color: colors.primary,
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </span>
          {item.badge && <ReviewBadge />}
        </button>
      )
    })}

    <div
      style={{
        marginTop: 24,
        marginBottom: 24,
        borderTop: `1px solid ${colors.border}`,
      }}
    />

    <div style={{ paddingLeft: 16, paddingRight: 16 }}>
      <SettingsRow
        label={HUB_COPY.accountActions.stopProviding.label}
        labelColor={colors.destructive}
        sublabel={HUB_COPY.accountActions.stopProviding.sublabel}
        rightItem={<BlockedIcon />}
        onPress={onStopProviding}
      />
    </div>
  </nav>
)

/**
 * Right-pane title row: Bogart display title, optional right-hand link
 * ("View profile") and optional `rightSlot` — where `ResubmitButton` lands on
 * the family panes. Figma 3399:5777.
 */
export const PaneTitle = ({ title, rightLinkLabel, onRightLink, rightSlot }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      // Wraps rather than overlapping when the pane is narrow and the row
      // carries both the "View profile" link and the Resubmit pill.
      flexWrap: 'wrap',
      gap: 16,
      paddingTop: 24,
      paddingBottom: 16,
    }}
  >
    <h1
      style={{
        ...textStyles.display400,
        color: colors.primary,
        margin: 0,
        minWidth: 0,
      }}
    >
      {title}
    </h1>
    {(rightLinkLabel || rightSlot) && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {rightLinkLabel && (
          <button
            type="button"
            onClick={onRightLink}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              ...textStyles.link100Semibold,
              color: colors.link,
            }}
          >
            {rightLinkLabel}
          </button>
        )}
        {rightSlot}
      </div>
    )}
  </div>
)

/**
 * Services | Profile tabs on the family panes — the wide-width replacement for
 * the mobile drill-down. `tabs` are `{ key, label }`. The codebase has no other
 * tab primitive (the bottom `TabBar` is a different pattern), and this is the
 * only surface that uses one, so it lives here. Figma 608:55002.
 */
export const PaneTabs = ({ tabs, activeKey, onSelect }) => (
  <div
    style={{
      display: 'flex',
      gap: 32,
      borderBottom: `1px solid ${colors.border}`,
      marginBottom: 8,
    }}
  >
    {tabs.map((tab) => {
      const active = tab.key === activeKey
      return (
        <button
          key={tab.key}
          type="button"
          onClick={() => onSelect(tab)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            paddingBottom: 12,
            cursor: 'pointer',
            // The 3px active underline overlaps the container rule rather than
            // sitting under it.
            marginBottom: -1,
            borderBottom: `3px solid ${active ? colors.primary : 'transparent'}`,
            ...(active ? textStyles.text200Semibold : textStyles.text200),
            color: colors.primary,
          }}
        >
          {tab.label}
        </button>
      )
    })}
  </div>
)
