import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, typography, radius, shadows } from '../tokens'
import { ChevronRightIcon, SettingsIcon } from '../assets/icons'
import { TabBar } from '../components'
import { SITTER_MORE_MENU, SITTER_MORE_MENU_BANNER } from '../data/moreMenu'

const TAB_PATHS = { home: '/', inbox: '/inbox', rebook: '/contacts', more: '/more' }

// Mirrors roverdotcom/web .../components/buttons/MenuRow:
// height 56, pt 8, px 20, icon 24, ml 12, title default weight 16/24,
// subtitle 13/16 tertiary, chevron primary with negative right margin.
const MenuRow = ({ Icon, title, subtitle, onPress }) => (
  <div
    onClick={onPress}
    style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      paddingTop: 8,
      paddingLeft: 20,
      paddingRight: 20,
      cursor: onPress ? 'pointer' : 'default',
      background: colors.white,
      boxSizing: 'border-box',
    }}
  >
    <span style={{ display: 'inline-flex', width: 24, height: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={24} />
    </span>
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, marginLeft: 12 }}>
      <span style={{
        fontFamily: typography.fontFamily, fontWeight: 400, fontSize: 16,
        lineHeight: '24px', color: colors.primary,
      }}>{title}</span>
      {subtitle && (
        <span style={{
          fontFamily: typography.fontFamily, fontWeight: 400, fontSize: 13,
          lineHeight: '16px', color: colors.tertiary, marginTop: 4,
        }}>{subtitle}</span>
      )}
    </div>
    <span style={{ display: 'inline-flex', marginRight: -12, flexShrink: 0 }}>
      <ChevronRightIcon color={colors.primary} />
    </span>
  </div>
)

const SectionHeader = ({ title }) => (
  <h2 style={{
    fontFamily: typography.displayFamily,
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 1.25,
    color: colors.primary,
    margin: '24px 20px 4px',
  }}>
    {title}
  </h2>
)

// Mirrors PromotionalCallout.tsx: white card, padding 16 (right 0), border-radius 8,
// shadow; row with text column on left + 56x48 image on right.
const PromoBanner = ({ banner }) => (
  <div
    onClick={banner.onPress}
    style={{
      background: colors.white,
      borderRadius: radius.primary,
      boxShadow: shadows.low,
      padding: '16px 0 16px 16px',
      margin: '8px 16px 0',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    }}
  >
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 4 }}>
      <span style={{
        fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 16,
        lineHeight: '24px', color: colors.primary,
      }}>{banner.title}</span>
      <span style={{
        fontFamily: typography.fontFamily, fontWeight: 400, fontSize: 13,
        lineHeight: '16px', color: colors.tertiary,
      }}>{banner.body}</span>
    </div>
    <img
      src={banner.image}
      alt=""
      style={{ width: 56, height: 48, objectFit: 'contain', flexShrink: 0 }}
    />
  </div>
)

export default function MoreScreen() {
  const navigate = useNavigate()
  const onTabSelect = (id) => {
    const path = TAB_PATHS[id]
    if (path) navigate(path)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      <div style={{ borderBottom: `1px solid ${colors.border}`, padding: '24px 20px 16px', flexShrink: 0 }}>
        <h1 style={{
          fontFamily: typography.displayFamily, fontWeight: 600, fontSize: 26,
          lineHeight: 1.25, color: colors.primary, margin: 0,
        }}>More</h1>
      </div>

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        <PromoBanner banner={SITTER_MORE_MENU_BANNER} />

        {SITTER_MORE_MENU.map((section, sIdx) => (
          <div key={section.title || `section-${sIdx}`}>
            {section.title ? <SectionHeader title={section.title} /> : <div style={{ height: 16 }} />}
            {section.items.map((item) => (
              <MenuRow
                key={item.title}
                Icon={item.Icon}
                title={item.title}
                subtitle={item.subtitle}
                onPress={item.onPress}
              />
            ))}
          </div>
        ))}

        {/* ── Prototype-only entry point for testing variants ── */}
        <div style={{ height: 24 }} />
        <MenuRow
          Icon={SettingsIcon}
          title="Testing mode"
          subtitle="Configure prototype variants"
          onPress={() => navigate('/testing-mode')}
        />
      </div>

      <TabBar activeTab="more" onTabSelect={onTabSelect} />
    </div>
  )
}
