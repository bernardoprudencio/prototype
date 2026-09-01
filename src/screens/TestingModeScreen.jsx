import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, typography, textStyles } from '../tokens'
import { BackIcon } from '../assets/icons'
import { useApp } from '../context/AppContext'
import { useIsWide } from '../lib/useMediaQuery'
import { webColumn } from '../lib/webColumn'

// Boolean flags ride the option-id API of ModeToggle (ServiceVariantConfigSheet.jsx:167-168).
const boolToId = (v) => (v ? 'on' : 'off')
const idToBool = (id) => id === 'on'

// Two-pill toggle used by each testing variant.
const ModeToggle = ({ value, onChange, options }) => {
  // Shrink padding/font when there are 4+ options so labels don't truncate
  // inside the 375px phone frame.
  const compact = options.length >= 4
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      padding: 4,
      background: colors.bgSecondary,
      borderRadius: 999,
    }}>
      {options.map(opt => {
        const active = value === opt.id
        return (
          <div
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: compact ? '8px 6px' : '8px 12px',
              cursor: 'pointer',
              fontFamily: typography.fontFamily,
              fontWeight: 600,
              fontSize: compact ? 12 : 14,
              lineHeight: compact ? '16px' : '20px',
              color: active ? colors.white : colors.primary,
              background: active ? colors.primary : 'transparent',
              borderRadius: 999,
              transition: 'background 120ms ease, color 120ms ease',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </div>
        )
      })}
    </div>
  )
}

const VariantRow = ({ title, description, value, onChange, options }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 20px 16px',
    gap: 4,
    borderBottom: `1px solid ${colors.border}`,
  }}>
    <span style={{
      fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 16,
      lineHeight: '24px', color: colors.primary,
    }}>{title}</span>
    {description && (
      <span style={{
        fontFamily: typography.fontFamily, fontWeight: 400, fontSize: 13,
        lineHeight: '18px', color: colors.tertiary, marginBottom: 12,
      }}>{description}</span>
    )}
    <ModeToggle value={value} onChange={onChange} options={options} />
  </div>
)

export default function TestingModeScreen() {
  const navigate = useNavigate()
  const isWide = useIsWide()
  const {
    scheduleMode, setScheduleMode,
    ratesMode, setRatesMode,
    altMonetizationRollout, setAltMonetizationRollout,
  } = useApp()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {/* Header. Below 769px this is app chrome: a bordered bar with the back
          arrow that is the screen's only way out. At and above it the web navbar
          is the navigation, so the arrow goes and the title becomes a page
          heading inside the navbar's content column. */}
      <div style={{
        padding: isWide ? '24px 16px 16px' : '12px 16px',
        borderBottom: isWide ? 'none' : `1px solid ${colors.border}`,
        flexShrink: 0,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...webColumn(isWide) }}>
        {!isWide && (
          <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <BackIcon />
          </div>
        )}
        <h1 style={isWide ? { ...textStyles.display400, color: colors.primary, margin: 0 } : {
          fontFamily: typography.displayFamily, fontWeight: 600, fontSize: 20,
          lineHeight: 1.25, color: colors.primary, margin: 0,
        }}>Testing mode</h1>
      </div>
      </div>

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={webColumn(isWide)}>
        <p style={{
          fontFamily: typography.fontFamily, fontWeight: 400, fontSize: 13,
          lineHeight: '18px', color: colors.tertiary,
          margin: 0, padding: '16px 20px 8px',
        }}>
          Toggle between prototype variants. Choices persist on this device.
        </p>

        <VariantRow
          title="Schedule management"
          description="Which schedule UX opens from a conversation."
          value={scheduleMode}
          onChange={setScheduleMode}
          options={[
            { id: 'modification', label: 'Modification' },
            { id: 'agenda',       label: 'Agenda' },
          ]}
        />

        <VariantRow
          title="Locked rates"
          description="Proposal is the granular per-rate model under test; Current is today's single lock switch."
          value={ratesMode}
          onChange={setRatesMode}
          options={[
            { id: 'granular', label: 'Proposal' },
            { id: 'current',  label: 'Current' },
          ]}
        />

        <VariantRow
          title="Graduated take rate"
          description="Client tiers, relationship progress and relationship-based fees."
          value={boolToId(altMonetizationRollout)}
          onChange={(id) => setAltMonetizationRollout(idToBool(id))}
          options={[
            { id: 'off', label: 'Off' },
            { id: 'on',  label: 'On'  },
          ]}
        />
        </div>
      </div>
    </div>
  )
}
