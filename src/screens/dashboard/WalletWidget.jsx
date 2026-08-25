import React from 'react'
import { colors, spacing, textStyles } from '../../tokens'
import { DASHBOARD_COPY } from '../../data/dashboardCopy'
import { DASHBOARD_DATA } from '../../data/dashboardData'
import Widget, { WidgetLink } from './Widget'

/** rover_balance_widget.html — the three balance rows and its two links. */
export default function WalletWidget() {
  const c = DASHBOARD_COPY.wallet
  const w = DASHBOARD_DATA.wallet

  const rows = [
    [c.upcomingEarnings,   w.upcomingEarnings],
    [c.pendingEarnings,    w.pendingEarnings],
    [c.processingPayments, w.processingPayments],
  ]

  return (
    <Widget title={c.title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {rows.map(([label, amount]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md }}>
            <span style={{ ...textStyles.text100, color: colors.tertiary }}>{label}</span>
            <span style={{ ...textStyles.text100Semibold, color: colors.primary }}>{amount}</span>
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: spacing.sm,
        marginTop: spacing.lg, paddingTop: spacing.md, borderTop: `1px solid ${colors.border}`,
      }}>
        <WidgetLink>{c.receivePayments}</WidgetLink>
        <WidgetLink>{c.viewPayments}</WidgetLink>
      </div>
    </Widget>
  )
}
