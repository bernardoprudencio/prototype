import React from 'react'
import { colors, textStyles } from '../../tokens'
import { HEADER } from '../../data/calendarCopy'
import { ChevronDownIcon, ChevronUpIcon } from '../../assets/icons'
import Pill from '../../components/Pill'
import NavButton from './NavButton'

/**
 * Port of `components/CalendarHeader.tsx`. One component, two variants, as in
 * the POC — `variant="wide"` here is its desktop branch (`:70-140`),
 * `variant="compact"` its mobile branch (`:141-224`).
 *
 * Both branches make the same choice about the page-level `<h1>`: it is **not**
 * the word "Calendar". Desktop puts the year in it and each layout's own
 * sub-header carries the month; compact puts the short month *and* the year in
 * it, because the compact layout has no sub-header row — its month label lives
 * on the mini-month, which the user can collapse away. The Beta badge sits
 * beside the heading in both (`Badge text="Beta" variant="info"` → `Pill`).
 *
 * The compact branch adds the collapse toggle, which is the only control that
 * differs between the two: a circular flat chevron carrying `aria-expanded`
 * against the calendar it shows or hides. The POC uses `ExpandSmall` /
 * `CollapseSmall`; the prototype's equivalents are `ChevronDownIcon` /
 * `ChevronUpIcon`.
 *
 * `actions` is the right-hand slot. In the POC it holds the view switcher plus
 * the Help / "Sync your calendar" / "Availability settings" buttons; each of
 * those opens a panel this port has not built, and the POC itself only renders
 * the sync button when `onOpenSync` is passed (`:118-124`), so an empty slot is
 * its own behaviour for absent handlers rather than a stripped-down header. The
 * compact branch's `flexWrap` is why the slot can safely hold the switcher at
 * ~375px once commit 7 fills it.
 *
 * One divergence. The POC wraps the year in a `<span>` that a
 * `@media (max-width: XXS_MAX)` rule hides, so the heading collapses to just
 * "Apr" on the narrowest phones. An inline `style` cannot carry a media query
 * and this port adds no CSS files, so the year always shows. At `display500`
 * (32px Bogart) "Apr 2026" fits 320px, and the header already wraps, so the
 * cost is the badge dropping to a second row rather than an overflow.
 */
export default function CalendarHeader({
  variant = 'wide', year, month, calendarCollapsed = false, onToggleCollapsed,
  actions = null,
}) {
  const isCompact = variant === 'compact'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 8, marginBottom: 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <h1 style={{ ...textStyles.display500, color: colors.primary, margin: 0 }}>
          {isCompact ? `${month} ${year}` : year}
        </h1>
        {isCompact && (
          <NavButton
            label={calendarCollapsed ? HEADER.showCalendar : HEADER.hideCalendar}
            expanded={!calendarCollapsed}
            onClick={onToggleCollapsed}
          >
            {/* Down = "expand it back open", up = "collapse it away", matching
                the POC's `ExpandSmall` / `CollapseSmall` pairing. */}
            {calendarCollapsed
              ? <ChevronDownIcon size={20} color={colors.link} />
              : <ChevronUpIcon size={20} color={colors.link} />}
          </NavButton>
        )}
        <Pill bg={colors.link}>{HEADER.beta}</Pill>
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>
      )}
    </div>
  )
}
