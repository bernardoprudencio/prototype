import React from 'react'
import { radius } from '../../tokens'

/**
 * Circular flat icon button — Kibble `Button icon circular variant="flat"
 * size="small"`, which the POC uses for every paging control it has: the month
 * chevrons in `NewCalendarPageMonth.tsx:266-280`, the mini-month's own pair
 * (`V1MiniMonthCalendar.tsx:158-174`), and the compact week strip's
 * (`CompactWeekStrip.tsx:144-159`).
 *
 * Lifted out of `MonthLayout.jsx`, where it started, once the mini-month and
 * the week strip needed the same button.
 *
 * `expanded` is for the one instance that is a disclosure rather than a pager —
 * the compact header's show/hide-calendar toggle (`CalendarHeader.tsx:178-186`),
 * which carries `aria-expanded`. Omit it everywhere else so the attribute is
 * absent rather than false.
 */
export default function NavButton({ label, disabled, onClick, expanded, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={typeof expanded === 'boolean' ? expanded : undefined}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 32, height: 32, padding: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', borderRadius: radius.round,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}
