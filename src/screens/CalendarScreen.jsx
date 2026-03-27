import React from 'react'
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

// Deterministic demo states — full/unavailable scattered for visual variety
function getDayState(date) {
  const dayName = DAY_NAMES[date.getDay()]
  const d = date.getDate()
  if (BOOKED_DAYS.has(dayName) && (d === 7 || d === 21)) return 'full'
  if (d === 14 || d === 28) return 'unavailable'
  if (BOOKED_DAYS.has(dayName)) return 'booked'
  return 'default'
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

// Stripe patterns matched to Figma
const STRIPE_GRAY = 'repeating-linear-gradient(-45deg, #D7DCE0 0px, #D7DCE0 2px, #F4F5F6 2px, #F4F5F6 7px)'
const STRIPE_RED  = 'repeating-linear-gradient(-45deg, #F5B5B0 0px, #F5B5B0 2px, #FDE8E7 2px, #FDE8E7 7px)'

function DayCell({ date, isToday, isPast }) {
  if (!date) return <div style={{ flex: 1, aspectRatio: '1', minWidth: 0 }} />

  const state = isPast ? 'default' : getDayState(date)
  const bg = {
    default:     'transparent',
    booked:      colors.yellow100,  // #FCF6EB
    unavailable: STRIPE_GRAY,
    full:        STRIPE_RED,
  }[state]

  const textColor = isPast ? colors.disabledText : (isToday ? colors.brand : colors.primary)

  return (
    <div style={{
      flex: 1, aspectRatio: '1', borderRadius: 8,
      background: bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', overflow: 'hidden',
      minWidth: 0, position: 'relative',
    }}>
      <span style={{
        fontFamily: typography.fontFamily,
        fontSize: 14,
        fontWeight: isToday ? 700 : 400,
        color: textColor,
        lineHeight: 1,
        position: 'relative', zIndex: 1,
      }}>{date.getDate()}</span>
    </div>
  )
}

export default function CalendarScreen({ onTabChange, onOpenAvailability }) {
  const today     = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const year      = today.getFullYear()
  const months    = Array.from({ length: 3 }, (_, i) =>
    new Date(year, today.getMonth() + i, 1)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>

      {/* ─── Fixed header ─── */}
      <div style={{ flexShrink: 0, background: colors.white, boxShadow: shadows.headerShadow }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 16px 16px' }}>
          <h1 style={{ fontFamily: typography.displayFamily, fontWeight: 600, fontSize: 26, color: colors.primary, margin: 0, lineHeight: 1.25 }}>
            {year}
          </h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <img src={helpIconSrc} width={24} height={24} alt="" />
            <img src={settingsIconSrc} width={24} height={24} alt="" onClick={onOpenAvailability} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        {/* Day-of-week row */}
        <div style={{ display: 'flex', padding: '0 16px 8px' }}>
          {DAY_LABELS.map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.tertiary, lineHeight: 1.25 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Scrollable months ─── */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>
        {months.map((monthDate) => {
          const y = monthDate.getFullYear()
          const m = monthDate.getMonth()
          const weeks = getCalendarWeeks(y, m)
          return (
            <div key={`${y}-${m}`} style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 20, color: colors.primary, margin: '0 0 12px', lineHeight: 1.25 }}>
                {MONTH_NAMES[m]}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: 'flex', gap: 6 }}>
                    {week.map((date, di) => {
                      const isPast  = date && date < todayStart
                      const isToday = date && date.toDateString() === today.toDateString()
                      return <DayCell key={di} date={date} isToday={isToday} isPast={isPast} />
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <TabBar activeTab="calendar" onTabChange={onTabChange} />
    </div>
  )
}
