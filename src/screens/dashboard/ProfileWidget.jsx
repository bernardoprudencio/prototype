import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, spacing, textStyles } from '../../tokens'
import UserAvatar from '../../components/UserAvatar'
import { SITTER_FIRST_NAME, SITTER_PROFILE } from '../../data/sitterProfile'
import { DASHBOARD_COPY } from '../../data/dashboardCopy'
import Widget, { WidgetLink } from './Widget'

/** profile_image_widget.html — avatar, name, and the three profile links. */
export default function ProfileWidget() {
  const navigate = useNavigate()
  const c = DASHBOARD_COPY.profile

  return (
    <Widget>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.md }}>
        <UserAvatar size={96} />
        <span style={{ ...textStyles.heading300, color: colors.primary }}>{SITTER_FIRST_NAME}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
          <WidgetLink onClick={() => navigate('/service-settings')}>{c.serviceSettings}</WidgetLink>
          <WidgetLink onClick={() => navigate('/service-settings/about')}>{c.editProfile}</WidgetLink>
          <WidgetLink onClick={() => window.open(SITTER_PROFILE.destinations.viewProfile, '_blank', 'noopener')}>
            {c.viewProfile}
          </WidgetLink>
        </div>
      </div>
    </Widget>
  )
}
