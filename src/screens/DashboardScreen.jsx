import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, spacing } from '../tokens'
import TabBar from '../components/TabBar'
import { useIsWide } from '../lib/useMediaQuery'
import { TAB_PATHS } from '../lib/tabPaths'
import { useApp } from '../context/AppContext'
import {
  ProfileWidget, CalendarWidget, AltMonetizationWidget, WalletWidget,
  SitterResources, NewMessages, PromoteProfile,
} from './dashboard'

const CONTENT_WIDTH = 1140

/**
 * The web dashboard — production's `/account/` for a logged-in sitter
 * (`account/urls.py:28` -> `AccountDashboardView`).
 *
 * Production is a Bootstrap-3 two-column page whose *secondary* column comes
 * first in the DOM and renders on the left (`col-sm-4`), with the primary column
 * second (`col-sm-8`) — `new_design/account/two_col_priority_row.html:10-60`.
 * The sidebar order below is that DOM order.
 *
 * This screen is what `/` renders at >=769px; `HomeScreen` is what `/` renders
 * below it. `/dashboard` reaches this screen at any width, where it stacks to a
 * single column — production's own layout does the same below its 768px
 * breakpoint.
 */
export default function DashboardScreen() {
  const navigate = useNavigate()
  const isWide = useIsWide()
  const { altMonetizationRollout } = useApp()

  const sidebar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      <ProfileWidget />
      <CalendarWidget />
      {/* Graduated take rate is experiment-gated; production gates the same
          surface on `is_rollout_alt_monetisation` (views.py:1011-1013). */}
      {altMonetizationRollout && <AltMonetizationWidget />}
      <WalletWidget />
      <SitterResources />
    </div>
  )

  const primary = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      <NewMessages />
      <PromoteProfile />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.bgSecondary }}>
      <div className="hide-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{
          maxWidth: CONTENT_WIDTH,
          margin: '0 auto',
          padding: isWide ? `${spacing.xl}px ${spacing.xl}px` : `${spacing.lg}px`,
          display: 'flex',
          flexDirection: isWide ? 'row' : 'column',
          alignItems: 'flex-start',
          gap: spacing.xl,
        }}>
          <div style={{
            width: isWide ? '33%' : '100%',
            minWidth: isWide ? 280 : 0,
            maxWidth: isWide ? 375 : 'none',
            flexShrink: 0,
            alignSelf: 'stretch',
          }}>
            {sidebar}
          </div>
          <div style={{ flex: 1, minWidth: 0, width: isWide ? 'auto' : '100%' }}>
            {primary}
          </div>
        </div>
      </div>

      {/* Below 769px this is the app's nav; at wide `TabBar` stands itself down
          and the web navbar in `App.jsx` takes over. */}
      <TabBar activeTab="home" onTabSelect={(id) => {
        const path = TAB_PATHS[id]
        if (path) navigate(path)
      }} />
    </div>
  )
}
