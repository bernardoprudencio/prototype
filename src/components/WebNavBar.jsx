import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, layout, typography } from '../tokens'
import { RoverLogoIcon } from '../assets/icons'
import WebNavMenu from './WebNavMenu'
import { WEB_NAV_LEFT, WEB_NAV_RIGHT } from '../data/webNavItems'
import { getInboxThreads } from '../data/threads'

/**
 * The desktop web navbar — rover.com's logged-in sitter header.
 *
 * Ported from the SSR kibble NavBar: a 60px white bar with a 1px bottom border,
 * contents capped at 1140px (`NavBar.tsx:61-72`, `Header.tsx:45-50`,
 * `patterns/Section/constants.ts:10`). 40px between the left and right groups,
 * 16px within each (`gap="10x"` / `gap="4x"`).
 *
 * Every item is a kibble `Link size="100" variant="navigation"` — 14px/400,
 * `#62686E`, hover `#1F2124` + underline (`NavBarItem.tsx:12-26,46-50`) — with a
 * 16px icon. Production applies no active-item styling to any of them, so
 * neither does this.
 *
 * The bar carries no destinations beyond Inbox; the sitter IA lives in
 * `WebNavMenu`.
 */

// Exported so surfaces that need viewport math below the bar (the two-pane
// conversation's sticky thread column) don't re-derive it.
export const BAR_HEIGHT = 60
const ICON_SIZE     = 16

const itemBase = {
  display: 'flex', alignItems: 'center', gap: 8, padding: 0,
  border: 'none', background: 'none', cursor: 'pointer',
  fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.25,
  whiteSpace: 'nowrap', textDecoration: 'none',
}

/**
 * A navbar item. `onClick` is optional — production links that point at pages
 * outside the prototype (Search Sitters, Promote your profile, Help) render at
 * full fidelity but don't navigate, the same way `moreMenu.js` uses `noop`.
 */
function NavItem({ Icon, label, ariaLabel, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...itemBase, color: hover ? colors.primary : colors.navigation }}
    >
      {Icon && <Icon size={ICON_SIZE} color="currentColor" />}
      {label != null && (
        <span style={{ textDecoration: hover ? 'underline' : 'none' }}>{label}</span>
      )}
    </button>
  )
}

export default function WebNavBar() {
  const navigate = useNavigate()

  // Production's `unreadMessageCount`. Derived from the same thread list the
  // Inbox screen filters on, so the two can never disagree. Seeded data has no
  // unread threads; production renders `(0)` in that case too.
  const unreadCount = useMemo(
    () => getInboxThreads().filter(t => t.unread).length,
    [],
  )

  const renderRight = (item) => {
    switch (item.key) {
      case 'inbox':
        // The visible label really is just the count in parens; "Inbox" lives
        // only in the aria-label (`NavBarRight.tsx:41-48`).
        return (
          <NavItem
            key={item.key}
            Icon={item.Icon}
            label={`(${unreadCount})`}
            ariaLabel={item.ariaLabel(unreadCount)}
            onClick={() => navigate(item.to)}
          />
        )
      default:
        return (
          <NavItem
            key={item.key}
            Icon={item.Icon}
            label={item.label}
            ariaLabel={item.ariaLabel ? item.ariaLabel() : undefined}
          />
        )
    }
  }

  return (
    // `position: relative` + a zIndex above the content pane's is what keeps the
    // avatar dropdown over the overlay routes — the pane below is its own
    // stacking context, so its z-10/z-20 overlays can never outrank this bar.
    <div style={{
      flexShrink: 0, background: colors.white,
      borderBottom: `1px solid ${colors.border}`,
      position: 'relative', zIndex: 1,
    }}>
      <div style={{
        maxWidth: layout.contentWidth, margin: '0 auto', padding: '0 16px',
        minHeight: BAR_HEIGHT, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 40,
      }}>
        {/* ── Left: logo, then Search Sitters / Promote your profile ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Rover"
            style={{
              ...itemBase, gap: 0, marginRight: 4,
              height: 35, color: colors.brand,
            }}
          >
            <RoverLogoIcon />
          </button>
          {WEB_NAV_LEFT.map(item => (
            <NavItem key={item.key} Icon={item.Icon} label={item.label} />
          ))}
        </div>

        {/* ── Right: avatar menu, bell, inbox, help ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <WebNavMenu />
          {WEB_NAV_RIGHT.map(renderRight)}
        </div>
      </div>
    </div>
  )
}
