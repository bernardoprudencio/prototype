import React, { useState } from 'react'
import { colors, typography, shadows } from '../tokens'
import { TabBar } from '../components'
import { getWalksForDate } from '../data/owners'
import helpIconSrc from '../assets/alert-help.svg'
import settingsIconSrc from '../assets/settings.svg'

const DAY_LABELS   = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAY_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function getWeekDates(date) {
  const sun = new Date(date)
  sun.setDate(date.getDate() - date.getDay())
  sun.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun)
    d.setDate(sun.getDate() + i)
    return d
  })
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

// ─── Week date tile ───────────────────────────────────────────────────────────
function WeekTile({ date, isSelected, hasBookings, onSelect }) {
  return (
    <div
      onClick={() => onSelect(date)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        height: 40,
        borderRadius: 8,
        background: isSelected ? '#FFECBD' : colors.white,
        cursor: 'pointer',
      }}
    >
      <span style={{
        fontFamily: typography.fontFamily,
        fontWeight: isSelected ? 700 : 400,
        fontSize: 16,
        color: colors.primary,
        lineHeight: 1.5,
        position: 'relative',
        zIndex: 1,
      }}>
        {date.getDate()}
      </span>
      <div style={{
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: hasBookings ? '#F8B816' : 'transparent',
        position: 'absolute',
        bottom: isSelected ? 4 : 2,
      }} />
    </div>
  )
}

// ─── Booking card ─────────────────────────────────────────────────────────────
function BookingCard({ walk }) {
  const label = `Dog Walking: ${walk.owner.petNames}`
  return (
    <div style={{
      background: colors.white,
      borderRadius: 8,
      boxShadow: '0px 1px 4px 0px rgba(27,31,35,0.32)',
      padding: 12,
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontFamily: typography.fontFamily,
          fontWeight: 700,
          fontSize: 16,
          color: colors.primary,
          lineHeight: 1.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </p>
        <p style={{
          margin: 0,
          fontFamily: typography.fontFamily,
          fontWeight: 400,
          fontSize: 16,
          color: colors.secondary,
          lineHeight: 1.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {walk.timeRange}
        </p>
      </div>
      <div style={{ flexShrink: 0, width: 64, display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', width: 48, height: 48 }}>
          <img
            src={walk.owner.petImages[0]}
            width={48}
            height={48}
            alt=""
            style={{
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '1px solid white',
          }} />
        </div>
      </div>
    </div>
  )
}

// ─── DailyView ────────────────────────────────────────────────────────────────
export default function DailyView({ date, onBack, onOpenAvailability }) {
  const [selectedDay, setSelectedDay] = useState(date)

  const walks     = getWalksForDate(selectedDay)
  const weekDates = getWeekDates(selectedDay)
  const monthName = MONTH_NAMES[selectedDay.getMonth()]
  const year      = selectedDay.getFullYear()

  const dateLabel = `${WEEKDAY_FULL[selectedDay.getDay()]}, ${monthName} ${selectedDay.getDate()} ${year}`
  const bookingCount = walks.length

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: colors.bgSecondary,
      position: 'relative',
    }}>

      {/* ─── Fixed header ─── */}
      <div style={{
        flexShrink: 0,
        background: colors.white,
        boxShadow: shadows.headerShadow,
        paddingBottom: 8,
      }}>
        {/* Title row: back | month name | help + settings */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 16px 16px',
          gap: 8,
        }}>
          {/* Back arrow */}
          <div
            onClick={onBack}
            style={{ cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Month name */}
          <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
            <h1 style={{
              fontFamily: typography.displayFamily,
              fontWeight: 600,
              fontSize: 26,
              color: colors.primary,
              margin: 0,
              lineHeight: 1.25,
            }}>
              {monthName}
            </h1>
          </div>

          {/* Help + settings */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
            <img src={helpIconSrc} width={24} height={24} alt="" style={{ cursor: 'pointer', display: 'block' }} />
            <img src={settingsIconSrc} width={24} height={24} alt="" onClick={onOpenAvailability} style={{ cursor: 'pointer', display: 'block' }} />
          </div>
        </div>

        {/* Weekday letter labels: S M T W T F S */}
        <div style={{ display: 'flex', padding: '8px 16px 0' }}>
          {DAY_LABELS.map((label, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <span style={{
                fontFamily: typography.fontFamily,
                fontWeight: 400,
                fontSize: 14,
                color: colors.tertiary,
                lineHeight: 1.25,
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Week date tiles */}
        <div style={{ display: 'flex', padding: '4px 16px 0', gap: 2 }}>
          {weekDates.map((d, i) => {
            const dayWalks = getWalksForDate(d)
            return (
              <WeekTile
                key={i}
                date={d}
                isSelected={isSameDay(d, selectedDay)}
                hasBookings={dayWalks.length > 0}
                onSelect={setSelectedDay}
              />
            )
          })}
        </div>
      </div>

      {/* ─── Scrollable event list ─── */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingBottom: 220,
        }}
      >
        {walks.length === 0 ? (
          <p style={{
            fontFamily: typography.fontFamily,
            fontSize: 14,
            color: colors.tertiary,
            textAlign: 'center',
            marginTop: 24,
          }}>
            No bookings on this day
          </p>
        ) : (
          walks.map((walk, i) => <BookingCard key={i} walk={walk} />)
        )}
      </div>

      {/* ─── Static bottom sheet ─── */}
      {/* Outer container clips the shadow at the tab bar edge */}
      <div style={{
        position: 'absolute',
        bottom: 48, /* tab bar height */
        left: 0,
        right: 0,
        top: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: colors.white,
        borderRadius: '16px 16px 0 0',
        boxShadow: '0px 4px 16px 0px rgba(0,0,0,0.12)',
        padding: '12px 16px 24px',
        pointerEvents: 'auto',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 16 }}>
          <div style={{ width: 36, height: 5, borderRadius: 35, background: colors.borderInteractive }} />
        </div>

        {/* Date label */}
        <p style={{
          margin: '0 0 0',
          fontFamily: typography.fontFamily,
          fontWeight: 400,
          fontSize: 14,
          color: colors.tertiary,
          textAlign: 'center',
          lineHeight: 1.25,
        }}>
          {dateLabel}
        </p>

        {/* Spaces booked heading */}
        <p style={{
          margin: '0',
          fontFamily: typography.fontFamily,
          fontWeight: 700,
          fontSize: 16,
          color: colors.primary,
          textAlign: 'center',
          lineHeight: 1.25,
        }}>
          {bookingCount} {bookingCount === 1 ? 'space' : 'spaces'} booked
        </p>

        {/* Bookings body */}
        <p style={{
          margin: '4px 0 24px',
          fontFamily: typography.fontFamily,
          fontWeight: 400,
          fontSize: 14,
          color: colors.primary,
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {bookingCount} {bookingCount === 1 ? 'booking' : 'bookings'}
        </p>

        {/* Primary button */}
        <button
          onClick={onOpenAvailability}
          style={{
            width: '100%',
            height: 40,
            borderRadius: 99999,
            background: colors.link,
            color: colors.white,
            fontFamily: typography.fontFamily,
            fontWeight: 700,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0px 2px 12px 0px rgba(27,31,35,0.24)',
            lineHeight: 1.25,
          }}
        >
          Edit my availability
        </button>
      </div>
      </div>{/* end clip wrapper */}

      {/* ─── Tab bar ─── */}
      <TabBar activeTab="calendar" onTabChange={() => {}} />
    </div>
  )
}
