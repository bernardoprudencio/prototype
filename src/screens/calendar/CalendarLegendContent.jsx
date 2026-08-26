import React from 'react'
import { colors, radius, textStyles } from '../../tokens'
import { LEGEND } from '../../data/calendarCopy'
import { CAL_COLORS, CAL_DIMS, FULLY_BOOKED_PATTERN, NOT_AVAILABLE_PATTERN } from './calendarTheme'

/**
 * The four-row colour legend — port of `components/CalendarLegendContent.tsx`.
 *
 * Source: roverdotcom/web @ origin/ai-pilot-web-calendar
 *   .../NewCalendarPage/components/CalendarLegendContent.tsx
 *
 * It is the only place the day-cell fills are ever explained, which is why it
 * lives inside the Help sheet rather than on the page. Two instruction
 * paragraphs (click a day; click a second day for a range) precede it, and both
 * are part of this component in the POC, not the sheet.
 *
 * Three swatch kinds, and the third one is the interesting one. `solid` and
 * `pattern` reuse the day cell's own fills, but a fully-available day cell
 * renders `transparent` — invisible against a white sheet — so the POC's
 * `empty` swatch is the primary surface plus a 1px border (`:19-24`, which
 * calls out the tradeoff explicitly: RxN's intent over exact day-cell parity).
 *
 * The digit is always `10` (`SAMPLE_DAY_NUMBER`), so each swatch reads as a
 * sample day rather than a colour chip, and it goes tertiary on the neutral
 * stripes only — mirroring RxN's striped tile (`:104-106`).
 */

const SAMPLE_DAY_NUMBER = '10'

// `SWATCH_SIZE = '44px'` (:10) — the same square as the mini day tile.
const swatchBase = {
  width: CAL_DIMS.miniDayTileSize,
  height: CAL_DIMS.miniDayTileSize,
  flexShrink: 0,
  borderRadius: radius.primary,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const ROW_SWATCH = {
  fullyAvailable: { style: { background: colors.white, border: `1px solid ${CAL_COLORS.border}` }, digitColor: CAL_COLORS.textPrimary },
  someBookings:   { style: { background: CAL_COLORS.someBookingsFill },  digitColor: CAL_COLORS.textPrimary },
  notAvailable:   { style: { background: NOT_AVAILABLE_PATTERN },        digitColor: CAL_COLORS.textTertiary },
  fullyBooked:    { style: { background: FULLY_BOOKED_PATTERN },         digitColor: CAL_COLORS.textPrimary },
}

export default function CalendarLegendContent() {
  return (
    <div>
      <p style={{ ...textStyles.paragraph200, color: colors.primary, margin: '0 0 8px' }}>
        {LEGEND.clickHint}
      </p>
      <p style={{ ...textStyles.paragraph200, color: colors.primary, margin: '0 0 8px' }}>
        {LEGEND.rangeHint}
      </p>
      {/* `mb="5x"` (:132) is the one gap in this block that is not the 16px
          row gap below it. */}
      <p style={{ ...textStyles.paragraph200, color: colors.primary, margin: '0 0 24px' }}>
        {LEGEND.intro}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {LEGEND.rows.map((row) => {
          const swatch = ROW_SWATCH[row.state]
          return (
            <div
              key={`${row.state}`}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }}
            >
              <div style={{ ...swatchBase, ...swatch.style }}>
                <span style={{ ...textStyles.text100Semibold, color: swatch.digitColor }}>
                  {SAMPLE_DAY_NUMBER}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <span style={{ ...textStyles.text100Semibold, color: CAL_COLORS.textPrimary }}>
                  {row.label}
                </span>
                <span style={{ ...textStyles.text100, color: CAL_COLORS.textPrimary }}>
                  {row.body}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
