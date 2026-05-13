import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, typography } from '../tokens'
import { BackIcon, ChevronRightIcon } from '../assets/icons'

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
    {Icon && (
      <span style={{ display: 'inline-flex', width: 24, height: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 12 }}>
        <Icon size={24} />
      </span>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
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

export default function PresentationsScreen() {
  const navigate = useNavigate()
  const onBack = () => navigate('/more')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 56,
          paddingLeft: 16,
          paddingRight: 16,
          borderBottom: `1px solid ${colors.border}`,
          background: colors.white,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
          }}
        >
          <BackIcon />
        </button>
        <h1
          style={{
            fontFamily: typography.fontFamily,
            fontWeight: 600,
            fontSize: 17,
            lineHeight: 1.25,
            color: colors.primary,
            margin: 0,
          }}
        >
          Presentations
        </h1>
      </div>

      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <MenuRow
          title="Incomplete Rover Cards"
          subtitle="Leadership review · April 30, 2026"
          onPress={() => navigate('/presentations/leadership-review')}
        />
      </div>
    </div>
  )
}
