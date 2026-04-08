import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { colors, typography } from '../tokens'
import {
  HomeFilledIcon, HomeOutlineIcon, InboxIcon,
  CalendarIcon, RebookIcon, MoreTabIcon,
} from '../assets/icons'

const TAB_PATHS = {
  home:     '/',
  inbox:    '/inbox',
  calendar: null,
  rebook:   null,
  more:     null,
}

const TABS = [
  { id: 'home',     label: 'HOME',     Icon: HomeOutlineIcon },
  { id: 'inbox',    label: 'INBOX',    Icon: InboxIcon },
  { id: 'calendar', label: 'CALENDAR', Icon: CalendarIcon },
  { id: 'rebook',   label: 'REBOOK',   Icon: RebookIcon },
  { id: 'more',     label: 'MORE',     Icon: MoreTabIcon },
]

export default function TabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const activeTab = pathname === '/inbox' ? 'inbox' : 'home'

  return (
    <div style={{
      display: 'flex', borderTop: `1px solid ${colors.border}`,
      background: colors.white, flexShrink: 0,
    }}>
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id
        const iconColor = isActive ? colors.primary : colors.tertiary
        const path = TAB_PATHS[id]
        return (
          <div
            key={id}
            onClick={() => path && navigate(path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', padding: '5px 0 4px',
              cursor: path ? 'pointer' : 'default',
            }}
          >
            <Icon color={iconColor} />
            <span style={{
              fontFamily: typography.fontFamily, fontWeight: 700,
              fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.07,
              color: iconColor, lineHeight: '13px',
            }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}
