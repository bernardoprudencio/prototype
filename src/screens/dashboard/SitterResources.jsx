import React from 'react'
import { colors, spacing, textStyles } from '../../tokens'
import { DASHBOARD_COPY } from '../../data/dashboardCopy'
import Widget, { WidgetLink } from './Widget'

/** sitter_resources.html — Rover 101 plus the resources-center callout. */
export default function SitterResources() {
  const c = DASHBOARD_COPY.resources

  return (
    <Widget title={c.title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <WidgetLink>{c.rover101}</WidgetLink>
        <p style={{ ...textStyles.paragraph100, color: colors.secondary, margin: 0 }}>{c.centerCallout}</p>
      </div>
    </Widget>
  )
}
