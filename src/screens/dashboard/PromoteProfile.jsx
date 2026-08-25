import React from 'react'
import { colors, spacing, textStyles } from '../../tokens'
import Button from '../../components/Button'
import { PromoIcon } from '../../assets/icons'
import { DASHBOARD_COPY } from '../../data/dashboardCopy'
import { DASHBOARD_DATA } from '../../data/dashboardData'
import Widget from './Widget'

/** promote.html — the first-booking discount promo box. */
export default function PromoteProfile() {
  const c = DASHBOARD_COPY.promote

  return (
    <Widget>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md }}>
        <PromoIcon color={colors.link} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <p style={{ ...textStyles.heading200, color: colors.primary, margin: 0 }}>
            {c.headline(DASHBOARD_DATA.promoAmount)}
          </p>
          <div>
            <Button variant="default">{c.ctaLabel}</Button>
          </div>
        </div>
      </div>
    </Widget>
  )
}
