import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, spacing, textStyles } from '../../tokens'
import Button from '../../components/Button'
import { DASHBOARD_COPY } from '../../data/dashboardCopy'
import { DASHBOARD_DATA } from '../../data/dashboardData'
import Widget from './Widget'

/** AvailabilityCalendarWidget — days-since-update plus the availability CTA. */
export default function CalendarWidget() {
  const navigate = useNavigate()
  const c = DASHBOARD_COPY.calendar

  return (
    <Widget title={c.title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: spacing.sm }}>
          <span style={{ ...textStyles.text100, color: colors.tertiary }}>{c.daysSinceLabel}</span>
          <span style={{ ...textStyles.heading300, color: colors.primary }}>
            {DASHBOARD_DATA.calendar.daysSinceUpdate}
          </span>
        </div>
        <p style={{ ...textStyles.paragraph100, color: colors.secondary, margin: 0 }}>{c.prompt}</p>
        {/* `/service-settings/availability` is not a declared route — this CTA
            was dead. The calendar is the surface it wanted. */}
        <Button variant="primary" fullWidth onClick={() => navigate('/calendar')}>
          {c.ctaLabel}
        </Button>
      </div>
    </Widget>
  )
}
