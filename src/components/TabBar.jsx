import React from 'react'
import { colors, typography } from '../tokens'
import {
  HomeFilledIcon, HomeOutlineIcon, InboxIcon,
  CalendarIcon, RebookIcon, MoreTabIcon,
} from '../assets/icons'

const TABS = [
  { id: 'home', label: 'HOME', icon: <HomeOutlineIcon />, activeIcon: <HomeFilledIcon /> },
  { id: 'inbox', label: 'INBOX', icon: <InboxIcon /> },
  { id: 'calendar', label: 'CALENDAR', icon: <CalendarIcon /> },
  { id: 'rebook', label: 'REBOOK', icon: <RebookIcon /> },
  { id: 'more', label: 'MORE', icon: <MoreTabIcon /> },
]

export default function TabBar({ activeTab = 'home' }) {
  return (
    <div style={{
      display: 'flex', borderTop: `1px solid ${colors.border}`,
      background: colors.white, flexShrink: 0,
    }}>
      {TABS.map(t => (
        <div key={t.id} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '5px 0 4px', cursor: 'pointer',
        }}>
          {activeTab === t.id && t.activeIcon ? t.activeIcon : t.icon}
          <span style={{
            fontFamily: typography.fontFamily, fontWeight: 700,
            fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.07,
            color: activeTab === t.id ? colors.primary : colors.tertiary,
            lineHeight: '13px',
          }}>{t.label}</span>
        </div>
      ))}
    </div>
  )
}
