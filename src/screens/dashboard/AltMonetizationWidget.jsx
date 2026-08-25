import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, spacing, textStyles } from '../../tokens'
import { FavoriteIcon } from '../../assets/icons'
import { DASHBOARD_COPY } from '../../data/dashboardCopy'
import Widget, { WidgetLink } from './Widget'

/**
 * AlternativeMonetizationWidget.tsx:61-97 — the lower-fees pitch. Its two links
 * are the widget's whole interaction surface; "See clients" is the prototype's
 * Contacts tab, which is where production's own link lands.
 */
export default function AltMonetizationWidget() {
  const navigate = useNavigate()
  const c = DASHBOARD_COPY.altMonetization

  return (
    <Widget>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md }}>
        <FavoriteIcon color={colors.brand} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <p style={{ ...textStyles.heading200, color: colors.primary, margin: 0 }}>{c.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
            <WidgetLink>{c.learnMore}</WidgetLink>
            <WidgetLink onClick={() => navigate('/contacts')}>{c.seeClients}</WidgetLink>
          </div>
        </div>
      </div>
    </Widget>
  )
}
