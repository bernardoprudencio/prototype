import React from 'react'
import { colors, textStyles } from '../../tokens'
import { HEADER } from '../../data/calendarCopy'
import Pill from '../../components/Pill'

/**
 * Port of `components/CalendarHeader.tsx`, desktop branch (`:70-140`).
 *
 * The page-level `<h1>` is the **year**, not "Calendar" — the POC moved the
 * month label down into each layout's own sub-header so the h1 could carry the
 * year at Kibble `Display size="500"` (32px Bogart → `textStyles.display500`).
 * The Beta badge sits beside it (`Badge text="Beta" variant="info"` → `Pill`).
 *
 * `actions` is the header's right-hand slot. In the POC it holds the view
 * switcher plus the Help / "Sync your calendar" / "Availability settings"
 * buttons; each of those opens a panel this port has not built yet, and the POC
 * itself only renders the sync button when its `onOpenSync` prop is passed
 * (`:118-124`), so an empty slot is the POC's own behaviour for an absent
 * handler rather than a stripped-down header.
 */
export default function CalendarHeader({ year, actions = null }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 8, marginBottom: 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <h1 style={{ ...textStyles.display500, color: colors.primary, margin: 0 }}>{year}</h1>
        <Pill bg={colors.link}>{HEADER.beta}</Pill>
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>
      )}
    </div>
  )
}
