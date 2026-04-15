import React, { useState } from 'react'
import { colors, typography, shadows } from '../tokens'
import { TabBar } from '../components'
import { OWNERS } from '../data/owners'
import helpIconSrc from '../assets/alert-help.svg'
import settingsIconSrc from '../assets/settings.svg'

const DAY_LABELS  = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

// Days that have at least one scheduled walk, derived from owner templates
const BOOKED_DAYS = new Set(
  Object.values(OWNERS).flatMap(o => o.template.map(t => t.day))
)

function getDayState(date) {
  const dayName = DAY_NAMES[date.getDay()]
  return BOOKED_DAYS.has(dayName) ? 'booked' : 'default'
}

function getCalendarWeeks(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]
  while (cells.length % 7) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// Stripe patterns for glossary tiles
const STRIPE_GRAY = 'repeating-linear-gradient(-45deg, #D7DCE0 0px, #D7DCE0 4px, #F4F5F6 4px, #F4F5F6 8px)'
const STRIPE_RED  = 'repeating-linear-gradient(-45deg, #FFC8BC 0px, #FFC8BC 4px, #FFE5DF 4px, #FFE5DF 8px)'

function DayCell({ date, isPast }) {
  if (!date) return <div style={{ flex: 1, aspectRatio: '1', minWidth: 0 }} />

  const state = isPast ? 'default' : getDayState(date)
  const bg = state === 'booked' ? '#FFECBD' : colors.white
  const textColor = isPast
    ? colors.disabledText
    : state === 'booked' ? colors.primary : colors.tertiary

  return (
    <div style={{
      flex: 1, aspectRatio: '1', borderRadius: 8,
      background: bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', overflow: 'hidden',
      minWidth: 0, position: 'relative',
    }}>
      <span style={{
        fontFamily: typography.fontFamily,
        fontSize: 14, fontWeight: 600,
        color: textColor, lineHeight: 1,
        position: 'relative', zIndex: 1,
      }}>{date.getDate()}</span>
    </div>
  )
}

// ─── Glossary tile used inside the help sheet ───────────────────────────────
function outline(c) {
  return `-2px -2px 0 ${c}, 0 -2px 0 ${c}, 2px -2px 0 ${c},
          -2px  0   0 ${c},                 2px  0   0 ${c},
          -2px  2px 0 ${c}, 0  2px 0 ${c}, 2px  2px 0 ${c}`
}

function GlossaryTile({ bg, textColor = colors.primary, textOutline }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 8, flexShrink: 0,
      background: bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', overflow: 'hidden',
    }}>
      <span style={{
        fontFamily: typography.fontFamily, fontSize: 14, fontWeight: 600,
        color: textColor,
        textShadow: textOutline ? outline(textOutline) : undefined,
      }}>
        10
      </span>
    </div>
  )
}

// ─── Glossary row ────────────────────────────────────────────────────────────
function GlossaryRow({ bg, tileTextColor, tileTextOutline, label, description }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <GlossaryTile bg={bg} textColor={tileTextColor} textOutline={tileTextOutline} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontFamily: typography.fontFamily, fontSize: 14, fontWeight: 600, color: colors.primary, lineHeight: 1.25 }}>
          {label}
        </p>
        <p style={{ margin: '4px 0 0', fontFamily: typography.fontFamily, fontSize: 14, fontWeight: 400, color: colors.primary, lineHeight: 1.25 }}>
          {description}
        </p>
      </div>
    </div>
  )
}

// ─── Help glossary bottom sheet ──────────────────────────────────────────────
function GlossarySheet({ onClose }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.3)',
    }}>
      <div onClick={onClose} style={{ flex: 1 }} />
      <div style={{
        position: 'relative',
        background: colors.white,
        borderRadius: '16px 16px 0 0',
        boxShadow: shadows.medium,
        padding: '32px 16px 24px',
        animation: 'slideUp 0.25s ease-out',
      }}>
        {/* Handle */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 36, height: 5, borderRadius: 35, background: colors.borderInteractive }} />
        </div>

        {/* Title */}
        <p style={{ margin: '0 0 4px', fontFamily: typography.fontFamily, fontSize: 16, fontWeight: 600, color: colors.primary, lineHeight: 1.25 }}>
          How to manage your calendar
        </p>

        {/* Body */}
        <p style={{ margin: '0 0 24px', fontFamily: typography.fontFamily, fontSize: 14, fontWeight: 400, color: colors.primary, lineHeight: 1.5 }}>
          Edit your capacity by clicking on single dates to override your existing calendar settings. For reference, the colors mean:
        </p>

        {/* Glossary rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GlossaryRow
            bg={colors.white}
            tileTextColor={colors.tertiary}
            label="Available"
            description="You can take bookings on this day"
          />
          <GlossaryRow
            bg="#FFECBD"
            tileTextColor={colors.primary}
            label="Available"
            description="You can take more bookings this day"
          />
          <GlossaryRow
            bg={STRIPE_GRAY}
            tileTextColor={colors.tertiary}
            tileTextOutline="#F4F5F6"
            label="Not available"
            description="Marked yourself unavailable on this day"
          />
          <GlossaryRow
            bg={STRIPE_RED}
            tileTextColor={colors.primary}
            tileTextOutline="#FFE5DF"
            label="Not available"
            description="You're fully booked for this day"
          />
        </div>
      </div>
    </div>
  )
}

export default function CalendarScreen({ onTabChange, onOpenAvailability, showAlert, onAlertDismiss }) {
  const [showGlossary, setShowGlossary] = useState(false)

  const today     = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const year      = today.getFullYear()
  const months    = Array.from({ length: 3 }, (_, i) =>
    new Date(year, today.getMonth() + i, 1)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white, position: 'relative' }}>

      {/* ─── Fixed header ─── */}
      <div style={{ flexShrink: 0, background: colors.white, boxShadow: shadows.headerShadow }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 16px 16px' }}>
          <h1 style={{ fontFamily: typography.displayFamily, fontWeight: 600, fontSize: 26, color: colors.primary, margin: 0, lineHeight: 1.25 }}>
            {year}
          </h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <img src={helpIconSrc} width={24} height={24} alt="" onClick={() => setShowGlossary(true)} style={{ cursor: 'pointer' }} />
            <img src={settingsIconSrc} width={24} height={24} alt="" onClick={onOpenAvailability} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        {/* Day-of-week row */}
        <div style={{ display: 'flex', padding: '8px 16px 8px' }}>
          {DAY_LABELS.map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
              <span style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.tertiary, lineHeight: 1.25 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Scrollable months ─── */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 128px' }}>
        {months.map((monthDate) => {
          const y = monthDate.getFullYear()
          const m = monthDate.getMonth()
          const weeks = getCalendarWeeks(y, m)
          return (
            <div key={`${y}-${m}`} style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 20, color: colors.primary, margin: '0 0 16px', lineHeight: 1.25 }}>
                {MONTH_NAMES[m]}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: 'flex', gap: 6 }}>
                    {week.map((date, di) => {
                      const isPast = date && date < todayStart
                      return <DayCell key={di} date={date} isPast={isPast} />
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── "Select multiple days" sticky button ─── */}
      <div style={{
        position: 'absolute', right: 0, bottom: 48,
        width: 230, height: 80, zIndex: 5,
        display: 'flex', alignItems: 'center',
        padding: 16, boxSizing: 'border-box',
      }}>
        <button style={{
          width: '100%', height: 48,
          borderRadius: 999,
          border: `2px solid ${colors.borderInteractive}`,
          background: colors.white,
          boxShadow: shadows.headerShadow,
          color: colors.secondary,
          fontFamily: typography.fontFamily,
          fontWeight: 600, fontSize: 16,
          cursor: 'pointer',
        }}>
          Select multiple days
        </button>
      </div>

      {/* ─── Availability-changed alert ─── */}
      {showAlert && (
        <div style={{
          position: 'absolute', bottom: 64, left: 16, right: 16,
          background: '#F1FDF6', border: '2px solid #1A824E',
          borderRadius: 4,
          boxShadow: '0px 8px 10px 0px rgba(27,31,35,0.22)',
          padding: '12px 16px',
          display: 'flex', gap: 8, alignItems: 'flex-start',
          zIndex: 10,
        }}>
          <p style={{ flex: 1, margin: 0, fontFamily: typography.fontFamily, fontSize: 14, color: colors.primary, lineHeight: 1.5 }}>
            You changed your availability for Boarding and Day Care
          </p>
          <button onClick={onAlertDismiss} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginTop: 2 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke={colors.tertiary} strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      <TabBar activeTab="calendar" onTabChange={onTabChange} />

      {/* ─── Glossary sheet ─── */}
      {showGlossary && <GlossarySheet onClose={() => setShowGlossary(false)} />}
    </div>
  )
}
