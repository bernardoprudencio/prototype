import React, { useState } from 'react'
import { colors, typography, shadows } from '../tokens'
import { Button } from '../components'

// ── Google brand colors ────────────────────────────────────────────────────────
const G = { blue: '#4285F4', red: '#EA4335', yellow: '#FBBC05', green: '#34A853' }

// ── Shared icons ──────────────────────────────────────────────────────────────
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="3" y="8" width="12" height="9" rx="2" stroke="#5F6368" strokeWidth="1.5" />
    <path d="M6 8V5.5a3 3 0 0 1 6 0V8" stroke="#5F6368" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="9" cy="12.5" r="1.25" fill="#5F6368" />
  </svg>
)

const GoogleLogo = () => (
  <span style={{ fontFamily: "'Product Sans', Arial, sans-serif", fontSize: 26, fontWeight: 400, letterSpacing: -0.5, lineHeight: 1 }}>
    <span style={{ color: G.blue }}>G</span>
    <span style={{ color: G.red }}>o</span>
    <span style={{ color: G.yellow }}>o</span>
    <span style={{ color: G.blue }}>g</span>
    <span style={{ color: G.green }}>l</span>
    <span style={{ color: G.red }}>e</span>
  </span>
)

// ── Step 1 — Entry sheet ──────────────────────────────────────────────────────
function EntrySheet({ onConnect, onDismiss }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.35)',
    }}>
      <div onClick={onDismiss} style={{ flex: 1 }} />
      <div style={{
        background: colors.white, borderRadius: '16px 16px 0 0',
        boxShadow: shadows.medium, padding: '0 24px 40px',
        animation: 'slideUp 0.25s ease-out',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 5, borderRadius: 35, background: colors.borderInteractive }} />
        </div>
        <h2 style={{ fontFamily: typography.displayFamily, fontSize: 22, fontWeight: 600, color: colors.primary, margin: '0 0 12px', lineHeight: 1.25 }}>
          Sync your bookings to Google Calendar
        </h2>
        <p style={{ fontFamily: typography.fontFamily, fontSize: 15, color: colors.secondary, lineHeight: 1.5, margin: '0 0 24px' }}>
          New bookings will be added to your calendar automatically. We'll also update or remove events if anything changes.
        </p>
        <Button variant="primary" fullWidth onClick={onConnect}>
          Connect Google Calendar
        </Button>
        <button
          onClick={onDismiss}
          style={{
            display: 'block', width: '100%', marginTop: 16, padding: 0,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: typography.fontFamily, fontSize: 15,
            color: colors.link, textAlign: 'center', lineHeight: 1.5,
          }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}

// ── Step 2 — Google OAuth ─────────────────────────────────────────────────────
function GoogleOAuth({ onAllow, onCancel }) {
  const [loading, setLoading] = useState(false)

  const handleAllow = () => {
    setLoading(true)
    setTimeout(onAllow, 1500)
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: colors.white,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Google header bar */}
      <div style={{ background: '#F8F9FA', borderBottom: '1px solid #DADCE0', padding: '12px 24px', flexShrink: 0 }}>
        <GoogleLogo />
      </div>

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 24px' }}>
        {/* Avatar placeholder */}
        <div style={{
          width: 56, height: 56, borderRadius: 999, background: G.blue,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <span style={{ fontFamily: 'Arial', fontWeight: 600, fontSize: 22, color: colors.white }}>Y</span>
        </div>

        <h2 style={{ fontFamily: 'Arial, sans-serif', fontSize: 18, fontWeight: 400, color: '#202124', margin: '0 0 6px', lineHeight: 1.4 }}>
          Rover wants to access your Google Account
        </h2>
        <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 14, color: '#5F6368', margin: '0 0 24px', lineHeight: 1.5 }}>
          your.email@gmail.com
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: '#E8EAED', margin: '0 0 20px' }} />

        {/* Permission item */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ marginTop: 2, flexShrink: 0 }}><LockIcon /></div>
          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 14, color: '#202124', margin: 0, lineHeight: 1.5 }}>
            See when you're busy (free/busy only)
          </p>
        </div>

        <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#5F6368', lineHeight: 1.5, margin: '0 0 32px' }}>
          Rover will use this to keep your availability accurate. It won't read your event titles or details.
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: '#E8EAED', margin: '0 0 24px' }} />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '8px 20px', borderRadius: 4, border: 'none',
              background: 'transparent', cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Arial, sans-serif', fontSize: 14, fontWeight: 500,
              color: loading ? '#9AA0A6' : G.blue,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAllow}
            disabled={loading}
            style={{
              padding: '8px 20px', borderRadius: 4, border: 'none',
              background: loading ? '#DADCE0' : G.blue, cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Arial, sans-serif', fontSize: 14, fontWeight: 500,
              color: loading ? '#9AA0A6' : colors.white,
              minWidth: 90,
            }}
          >
            {loading ? 'Connecting…' : 'Allow'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Step 3 — Calendar picker ──────────────────────────────────────────────────
const CALENDARS = [
  { id: 'Personal',     color: G.blue },
  { id: 'Work',         color: G.red },
  { id: 'Side hustle',  color: G.green },
]

function CalendarPicker({ selected, onSelect, onContinue }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: colors.white,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '24px 16px 0', flexShrink: 0 }}>
        <h2 style={{ fontFamily: typography.displayFamily, fontSize: 22, fontWeight: 600, color: colors.primary, margin: '0 0 24px', lineHeight: 1.25 }}>
          Which calendar should we add your bookings to?
        </h2>
      </div>

      <div style={{ flex: 1, padding: '0 16px' }}>
        {CALENDARS.map(cal => (
          <div
            key={cal.id}
            onClick={() => onSelect(cal.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 0',
              borderBottom: `1px solid ${colors.border}`,
              cursor: 'pointer',
            }}
          >
            {/* Colored dot */}
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="6" fill={cal.color} />
            </svg>
            {/* Label */}
            <span style={{ flex: 1, fontFamily: typography.fontFamily, fontSize: 16, color: colors.primary, lineHeight: 1.5 }}>
              {cal.id}
            </span>
            {/* Radio button */}
            <div style={{
              width: 20, height: 20, borderRadius: 999, flexShrink: 0,
              border: `2px solid ${selected === cal.id ? colors.brand : colors.borderInteractive}`,
              background: colors.white,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {selected === cal.id && (
                <div style={{ width: 10, height: 10, borderRadius: 999, background: colors.brand }} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 16px 40px', flexShrink: 0 }}>
        <Button variant="primary" fullWidth onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  )
}

// ── Step 4 — Success ──────────────────────────────────────────────────────────
function SuccessScreen({ calendar, onDone }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: colors.white,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '0 32px 40px',
    }}>
      {/* Checkmark */}
      <div style={{
        width: 72, height: 72, borderRadius: 999,
        background: colors.brandLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M7 17L13 23L25 10" stroke={colors.brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 style={{ fontFamily: typography.displayFamily, fontSize: 26, fontWeight: 600, color: colors.primary, margin: '0 0 12px', lineHeight: 1.25, textAlign: 'center' }}>
        You're all set
      </h2>
      <p style={{ fontFamily: typography.fontFamily, fontSize: 15, color: colors.secondary, lineHeight: 1.5, margin: '0 0 40px', textAlign: 'center' }}>
        New bookings will be added to your <strong>{calendar}</strong> calendar automatically.
      </p>

      <Button variant="primary" fullWidth onClick={onDone}>
        Done
      </Button>
    </div>
  )
}

// ── Orchestrator ──────────────────────────────────────────────────────────────
export default function GoogleCalendarFlow({ step, onDismiss, onComplete, selectedCalendar, onSelectCalendar }) {
  if (!step) return null

  if (step === 'sheet')
    return <EntrySheet onConnect={() => onDismiss('oauth')} onDismiss={() => onDismiss(null)} />

  if (step === 'oauth')
    return <GoogleOAuth onAllow={() => onDismiss('picker')} onCancel={() => onDismiss(null)} />

  if (step === 'picker')
    return <CalendarPicker selected={selectedCalendar} onSelect={onSelectCalendar} onContinue={() => onDismiss('success')} />

  if (step === 'success')
    return <SuccessScreen calendar={selectedCalendar} onDone={onComplete} />

  return null
}
