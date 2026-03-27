import React, { useState } from 'react'
import { colors, typography } from '../tokens'
import { BackIcon, ChevronRightIcon } from '../assets/icons'
import { Button } from '../components'

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: 56,
        height: 32,
        borderRadius: 17,
        padding: 4,
        boxSizing: 'border-box',
        cursor: 'pointer',
        flexShrink: 0,
        border: `2px solid ${on ? colors.secondary : colors.borderInteractive}`,
        background: on ? colors.secondary : 'transparent',
        justifyContent: on ? 'flex-end' : 'flex-start',
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 999, flexShrink: 0,
        background: on ? colors.white : colors.secondary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {on ? (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke={colors.secondary} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 1L7 7M7 1L1 7" stroke={colors.white} strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  )
}

// ── Info icon (ℹ) ─────────────────────────────────────────────────────────────
const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke={colors.tertiary} strokeWidth="1.25" />
    <path d="M8 7v4" stroke={colors.tertiary} strokeWidth="1.25" strokeLinecap="round" />
    <circle cx="8" cy="5.25" r="0.75" fill={colors.tertiary} />
  </svg>
)

// ── Row types ─────────────────────────────────────────────────────────────────
function SwitchRow({ label, on, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: typography.fontFamily, fontSize: 16, color: colors.primary, lineHeight: 1.5 }}>
          {label}
        </span>
        <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <InfoIcon />
        </div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

function ChevronRow({ label, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', cursor: 'default' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: typography.fontFamily, fontSize: 16, color: colors.primary, lineHeight: 1.5, margin: 0 }}>
          {label}
        </p>
        {subtitle && (
          <p style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.tertiary, lineHeight: 1.25, margin: '2px 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>
      <ChevronRightIcon size={16} color={colors.tertiary} />
    </div>
  )
}

function StepperRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0' }}>
      <span style={{ fontFamily: typography.fontFamily, fontSize: 16, color: colors.primary, lineHeight: 1.5, flex: 1 }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', width: 92, flexShrink: 0 }}>
        {/* Minus */}
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          style={{
            width: 24, height: 24, borderRadius: 999, border: `1.5px solid ${colors.borderInteractive}`,
            background: colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, padding: 0,
          }}
        >
          <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
            <path d="M1 1H9" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        {/* Number */}
        <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 16, color: colors.primary, lineHeight: 1.5 }}>
            {value}
          </span>
        </div>
        {/* Plus */}
        <button
          onClick={() => onChange(value + 1)}
          style={{
            width: 24, height: 24, borderRadius: 999, border: `1.5px solid ${colors.primary}`,
            background: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, padding: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1V9M1 5H9" stroke={colors.white} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

const Divider = () => (
  <div style={{ padding: '16px 0' }}>
    <div style={{ height: 1, background: colors.border }} />
  </div>
)

// ── Service section ───────────────────────────────────────────────────────────
function ServiceSection({ title, stepperLabel, dailySubtitle }) {
  const [away, setAway]           = useState(false)
  const [newClients, setNewClients] = useState(true)
  const [pets, setPets]           = useState(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <p style={{ fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 20, color: colors.primary, lineHeight: 1.25, margin: '0 0 12px' }}>
        {title}
      </p>
      <SwitchRow label="Away" on={away} onChange={setAway} />
      <SwitchRow label="New clients for occasional care" on={newClients} onChange={setNewClients} />
      <ChevronRow label="Daily availability" subtitle={dailySubtitle} />
      <ChevronRow label="Lead time for requests" subtitle="Select the time you need" />
      <StepperRow label={stepperLabel} value={pets} onChange={setPets} />
    </div>
  )
}

// ── Google Calendar row (connected state) ─────────────────────────────────────
function ConnectedGCalRow({ calendar, onDisconnect }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: typography.fontFamily, fontSize: 16, color: colors.primary, lineHeight: 1.5, margin: 0 }}>
            Google Calendar
          </p>
          <p style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.success, lineHeight: 1.25, margin: '2px 0 0' }}>
            Connected · {calendar}
          </p>
        </div>
        <ChevronRightIcon size={16} color={colors.tertiary} />
      </div>
      {confirming ? (
        <div style={{ background: colors.bgSecondary, borderRadius: 8, padding: '12px 16px', marginTop: 4 }}>
          <p style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.primary, margin: '0 0 12px', lineHeight: 1.4 }}>
            Disconnect Google Calendar? Your bookings will no longer sync.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="default" style={{ flex: 1 }} onClick={() => setConfirming(false)}>Cancel</Button>
            <Button variant="flat" style={{ flex: 1, color: colors.destructive }} onClick={onDisconnect}>Disconnect</Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          style={{
            background: 'none', border: 'none', padding: '0 0 8px', cursor: 'pointer',
            fontFamily: typography.fontFamily, fontSize: 14, color: colors.destructive, lineHeight: 1.5,
          }}
        >
          Disconnect
        </button>
      )}
    </div>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function AvailabilityScreen({ onBack, onGoogleCalendar, gcalConnected, gcalCalendar, onDisconnect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>

      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 8px', flexShrink: 0 }}>
        <div
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 0' }}
        >
          <BackIcon color={colors.primary} />
          <span style={{ fontFamily: typography.fontFamily, fontSize: 16, color: colors.primary, lineHeight: 1.5 }}>
            Availability
          </span>
        </div>
      </div>

      {/* ─── Scrollable content ─── */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>

        <ServiceSection
          title="Boarding"
          stepperLabel="Pets per night"
          dailySubtitle="Su, Mo, Tu, We, Th, Fr, Sa"
        />

        <Divider />

        <ServiceSection
          title="Day Care"
          stepperLabel="Dogs per day"
          dailySubtitle="Mo, Tu, We, Th, Fr, Sa"
        />

        <Divider />

        {/* ─── Calendar sync section ─── */}
        <p style={{ fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 20, color: colors.primary, lineHeight: 1.25, margin: '0 0 12px' }}>
          Calendar sync
        </p>
        {gcalConnected ? (
          <ConnectedGCalRow calendar={gcalCalendar} onDisconnect={onDisconnect} />
        ) : (
          <div
            onClick={onGoogleCalendar}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', cursor: 'pointer' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: typography.fontFamily, fontSize: 16, color: colors.primary, lineHeight: 1.5, margin: 0 }}>
                Google Calendar
              </p>
              <p style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.tertiary, lineHeight: 1.25, margin: '2px 0 0' }}>
                Not connected
              </p>
            </div>
            <ChevronRightIcon size={16} color={colors.tertiary} />
          </div>
        )}

      </div>
    </div>
  )
}
