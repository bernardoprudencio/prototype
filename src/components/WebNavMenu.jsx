import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { colors, radius, shadows, typography } from '../tokens'
import { DropdownSmallIcon } from '../assets/icons'
import UserAvatar from './UserAvatar'
import { SITTER_MENU_ITEMS, PROTOTYPE_MENU_ITEMS, LOG_OUT_LABEL } from '../data/webNavItems'
import { SITTER_FIRST_NAME } from '../data/sitterProfile'

/**
 * The avatar dropdown from production's desktop navbar
 * (`DesktopMenu.tsx:26-116`). This is where the entire sitter IA lives on web —
 * the bar itself carries no destinations.
 *
 * Dimensions are production's: a 158px panel of 34px rows
 * (`DesktopMenu.tsx:23-24`). Rows are `Link size="100" variant="navigation"`,
 * i.e. 14px/400 in `#62686E`, going `#1F2124` + underline + semibold on hover
 * (`Link.common.tsx:85-101`, `menus/MenuItem.tsx:62-73`). There is deliberately
 * no selected/active state — production has none.
 */

const PANEL_WIDTH = 158
const ROW_HEIGHT   = 34

const rowBase = {
  display: 'flex', alignItems: 'center', width: '100%', height: ROW_HEIGHT,
  padding: '0 12px', border: 'none', background: 'none', cursor: 'pointer',
  textAlign: 'left', fontFamily: typography.fontFamily, fontSize: 14,
  lineHeight: 1.25, whiteSpace: 'nowrap',
}

function Divider() {
  return <div style={{ height: 1, background: colors.border }} />
}

/**
 * One dropdown row. `badge` renders as a *sibling* of the label rather than a
 * child, so the hover underline and semibold don't bleed into it — the same
 * reason production keeps it outside the link (`menus/MenuItem.tsx:14-19,76-83`).
 */
function MenuRow({ label, badge, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...rowBase,
        color: hover ? colors.primary : colors.navigation,
        fontWeight: hover ? 600 : 400,
      }}
    >
      <span style={{ textDecoration: hover ? 'underline' : 'none' }}>{label}</span>
      {badge && (
        <span style={{
          marginLeft: 8, fontSize: 11, fontWeight: 600, lineHeight: 1,
          textTransform: 'uppercase', letterSpacing: 0.4,
          color: colors.link, flexShrink: 0,
        }}>{badge}</span>
      )}
    </button>
  )
}

export default function WebNavMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  // Dismiss on outside click and on Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Navigating always closes the panel, including when a row targets the route
  // we are already on (which produces no location change of its own).
  useEffect(() => { setOpen(false) }, [location.pathname])

  const go = (to) => () => { setOpen(false); navigate(to) }

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={`Logged in as ${SITTER_FIRST_NAME}`}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: 0,
          border: 'none', background: 'none', cursor: 'pointer',
          fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.25,
          color: open ? colors.primary : colors.navigation,
        }}
      >
        <UserAvatar size={24} />
        <span>{SITTER_FIRST_NAME}</span>
        <DropdownSmallIcon size={16} color="currentColor" />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: '100%', right: 0, width: PANEL_WIDTH,
            background: colors.white, overflow: 'hidden',
            borderBottomLeftRadius: radius.secondary,
            borderBottomRightRadius: radius.secondary,
            boxShadow: shadows.medium, zIndex: 1,
            paddingTop: 4, paddingBottom: 4,
          }}
        >
          {SITTER_MENU_ITEMS.map(item => (
            <MenuRow key={item.key} label={item.label} badge={item.badge} onClick={go(item.to)} />
          ))}

          <Divider />
          {PROTOTYPE_MENU_ITEMS.map(item => (
            <MenuRow key={item.key} label={item.label} onClick={go(item.to)} />
          ))}

          <Divider />
          {/* Nothing to log out of in the prototype — the row is inert. */}
          <MenuRow label={LOG_OUT_LABEL} onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
