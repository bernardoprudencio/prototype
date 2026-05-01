import React from 'react'
import { colors, typography } from '../tokens'
import {
  HomeFilledIcon, HomeOutlineIcon, InboxIcon,
  CalendarIcon, RebookIcon, MoreTabIcon,
} from '../assets/icons'

const TABS = [
  { id: 'home',     label: 'HOME',     Icon: HomeOutlineIcon },
  { id: 'inbox',    label: 'INBOX',    Icon: InboxIcon },
  { id: 'calendar', label: 'CALENDAR', Icon: CalendarIcon },
  { id: 'rebook',   label: 'CONTACTS', Icon: RebookIcon },
  { id: 'more',     label: 'MORE',     Icon: MoreTabIcon },
]

export default function TabBar({ activeTab = 'home', onTabSelect }) {
  return (
    <div style={{
      display: 'flex', borderTop: `1px solid ${colors.border}`,
      background: colors.white, flexShrink: 0,
    }}>
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id
        const iconColor = isActive ? colors.primary : colors.tertiary
        return (
          <div
            key={id}
            onClick={() => onTabSelect?.(id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', padding: '5px 0 4px', cursor: 'pointer',
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
