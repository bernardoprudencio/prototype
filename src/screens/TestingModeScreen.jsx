import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, typography } from '../tokens'
import { BackIcon } from '../assets/icons'
import { useApp } from '../context/AppContext'

// Two-pill toggle used by each testing variant.
const ModeToggle = ({ value, onChange, options }) => (
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
            padding: '8px 12px',
            cursor: 'pointer',
            fontFamily: typography.fontFamily,
            fontWeight: 600,
            fontSize: 14,
            lineHeight: '20px',
            color: active ? colors.white : colors.primary,
            background: active ? colors.primary : 'transparent',
            borderRadius: 999,
            transition: 'background 120ms ease, color 120ms ease',
            userSelect: 'none',
          }}
        >
          {opt.label}
        </div>
      )
    })}
  </div>
)

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
    <span style={{
      fontFamily: typography.fontFamily, fontWeight: 400, fontSize: 13,
      lineHeight: '18px', color: colors.tertiary, marginBottom: 12,
    }}>{description}</span>
    <ModeToggle value={value} onChange={onChange} options={options} />
  </div>
)

export default function TestingModeScreen() {
  const navigate = useNavigate()
  const { scheduleMode, setScheduleMode } = useApp()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px',
        borderBottom: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}>
        <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <BackIcon />
        </div>
        <h1 style={{
          fontFamily: typography.displayFamily, fontWeight: 600, fontSize: 20,
          lineHeight: 1.25, color: colors.primary, margin: 0,
        }}>Testing mode</h1>
      </div>

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
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
      </div>
    </div>
  )
}
