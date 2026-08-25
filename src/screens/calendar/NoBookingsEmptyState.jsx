import React from 'react'
import { radius, textStyles } from '../../tokens'
import { CAL_COLORS } from './calendarTheme'
import { BOOKINGS } from '../../data/calendarCopy'
import DayIllustration from './DayIllustration'

/**
 * Port of `components/NoBookingsEmptyState.tsx` — the rail's content when the
 * selected day has nothing on it. `px="3x" py="4x"` (12/16), radius primary,
 * the blurb background, and a horizontal row: illustration at 24px with a 12px
 * right margin, then `Text size="100"` semibold.
 */
export default function NoBookingsEmptyState() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '16px 12px',
      borderRadius: radius.primary,
      background: CAL_COLORS.blurbBg,
    }}>
      <div style={{ marginRight: 12, flexShrink: 0 }}>
        <DayIllustration size={24} />
      </div>
      <span style={{ ...textStyles.text100Semibold, color: CAL_COLORS.textPrimary }}>
        {BOOKINGS.empty}
      </span>
    </div>
  )
}
