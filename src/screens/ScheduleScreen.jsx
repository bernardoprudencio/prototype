import React, { useState, useEffect, useRef, useMemo } from 'react'
import { colors, typography, shadows, radius } from '../tokens'
import { BackIcon } from '../assets/icons'
import { Button, PetAvatar, Chip } from '../components'
import { PROTO_TODAY, getOwnerUpcomingWeeks, getOwnerCurrentWeek } from '../data/owners'

// ── Icons ─────────────────────────────────────────────────────────────────────
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M5 1.5C5 0.671573 5.67157 0 6.5 0H9.5C10.3284 0 11 0.671573 11 1.5V2H14.5C14.7761 2 15 2.22386 15 2.5C15 2.77614 14.7761 3 14.5 3H1.5C1.22386 3 1 2.77614 1 2.5C1 2.22386 1.22386 2 1.5 2H5V1.5ZM10 1.5V2H6V1.5C6 1.22386 6.22386 1 6.5 1H9.5C9.77614 1 10 1.22386 10 1.5Z" fill="currentColor"/>
    <path d="M2.99798 4.4547C2.97298 4.17969 2.72977 3.97702 2.45476 4.00202C2.17976 4.02703 1.97708 4.27023 2.00209 4.54524L2.96075 15.0905C3.00757 15.6056 3.43944 16 3.95664 16H12.0434C12.5606 16 12.9925 15.6056 13.0393 15.0905L13.998 4.54524C14.023 4.27023 13.8203 4.02703 13.5453 4.00202C13.2703 3.97702 13.0271 4.17969 13.0021 4.4547L12.0434 15H3.95664L2.99798 4.4547Z" fill="currentColor"/>
    <path d="M7 5.5V13H6V5.5H7Z" fill="currentColor"/>
    <path d="M10 13V5.5H9V13H10Z" fill="currentColor"/>
  </svg>
)

const CloseSmIcon = ({ hover }) => (
  <svg width="16" height="16" viewBox="0 0 32 32" fill={hover ? colors.primary : colors.secondary}>
    <path d="M17.414 16l7.293-7.293a1 1 0 0 0-1.414-1.414L16 14.586 8.707 7.293a1 1 0 0 0-1.414 1.414L14.586 16l-7.293 7.293a1 1 0 0 0 1.414 1.414L16 17.414l7.293 7.293a1 1 0 0 0 1.414-1.414L17.414 16z"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 32 32" fill={colors.link} style={{ flexShrink: 0 }}>
    <path d="M26.191 4.412a1 1 0 1 1 1.618 1.176l-16 22a1 1 0 0 1-1.516.12l-6-6a1 1 0 1 1 1.414-1.415l5.173 5.172L26.19 4.412z"/>
  </svg>
)

const CautionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M1.36621 23.2499C0.744891 23.2499 0.241211 22.7462 0.241211 22.1249C0.241211 21.9451 0.284335 21.7678 0.366966 21.6081L11.0008 1.0493C11.2863 0.497434 11.965 0.281458 12.5169 0.566907C12.7238 0.6739 12.8923 0.842449 12.9993 1.0493L23.6331 21.6081C23.9186 22.1599 23.7026 22.8387 23.1507 23.1242C22.991 23.2068 22.8137 23.2499 22.6339 23.2499H1.36621ZM12.0001 2.38239L1.98237 21.7499H22.0177L12.0001 2.38239ZM12.0001 8.24991C12.4143 8.24991 12.75 8.5857 12.75 8.99991V14.9999C12.75 15.4141 12.4143 15.7499 12.0001 15.7499C11.5858 15.7499 11.2501 15.4141 11.2501 14.9999V8.99991C11.2501 8.5857 11.5858 8.24991 12.0001 8.24991ZM12.0001 19.8749C11.3787 19.8749 10.8751 19.3712 10.8751 18.7499C10.8751 18.1286 11.3787 17.6249 12.0001 17.6249C12.6214 17.6249 13.125 18.1286 13.125 18.7499C13.125 19.3712 12.6214 19.8749 12.0001 19.8749Z" fill="#BC4338"/>
  </svg>
)

const SuccessIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24ZM12 22.5C17.799 22.5 22.5 17.799 22.5 12C22.5 6.20101 17.799 1.5 12 1.5C6.20101 1.5 1.5 6.20101 1.5 12C1.5 17.799 6.20101 22.5 12 22.5ZM16.6555 7.04272C16.9081 6.7144 17.379 6.65298 17.7073 6.90553C18.0356 7.15808 18.097 7.62897 17.8445 7.95728L10.3445 17.7073C10.0684 18.0661 9.5398 18.1005 9.21967 17.7803L6.21967 14.7803C5.92678 14.4874 5.92678 14.0126 6.21967 13.7197C6.51256 13.4268 6.98744 13.4268 7.28033 13.7197L9.67633 16.1157L16.6555 7.04272Z" fill="#1B6C42"/>
  </svg>
)

// ── Time utilities ─────────────────────────────────────────────────────────────
const ALL_TIMES = (() => {
  const times = []
  for (let h = 6; h <= 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 21 && m === 30) break
      const h12 = h === 12 ? 12 : h > 12 ? h - 12 : h
      const period = h >= 12 ? 'PM' : 'AM'
      times.push(`${h12}:${m === 0 ? '00' : '30'} ${period}`)
    }
  }
  return times
})()

const timeToMinutes = (str) => {
  const [time, period] = str.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return h * 60 + m
}

// 60-min walk rule: hide times within 60 min of other selected slots.
const getAvailableTimes = (daySlots, editingSlotId) => {
  const otherMins = daySlots
    .filter(s => s.id !== editingSlotId)
    .map(s => timeToMinutes(s.time))
  return ALL_TIMES.filter(t =>
    otherMins.every(other => Math.abs(timeToMinutes(t) - other) >= 60)
  )
}

// ── Diff utilities ─────────────────────────────────────────────────────────────
const computeChanges = (currentWeeks, initialWeeks) => {
  const changes = []

  // Modified or removed days (existed in initialWeeks)
  for (const initWeek of initialWeeks) {
    const currWeek = currentWeeks.find(w => w.id === initWeek.id)
    for (const initDay of initWeek.days) {
      const currDay = currWeek?.days.find(d => d.id === initDay.id)
      const initTimes = initDay.slots.map(s => s.time)
      const currTimes = currDay ? currDay.slots.map(s => s.time) : []
      const removed = initTimes.filter(t => !currTimes.includes(t))
      const added   = currTimes.filter(t => !initTimes.includes(t))
      if (!currDay || removed.length || added.length) {
        changes.push({
          day: initDay.day,
          date: initDay.date,
          removed: !currDay ? initTimes : removed,
          added,
        })
      }
    }
  }

  // Newly added days (not in initialWeeks at all)
  for (const currWeek of currentWeeks) {
    const initWeek = initialWeeks.find(w => w.id === currWeek.id)
    for (const currDay of currWeek.days) {
      if (!initWeek?.days.find(d => d.id === currDay.id)) {
        changes.push({
          day: currDay.day,
          date: currDay.date,
          removed: [],
          added: currDay.slots.map(s => s.time),
        })
      }
    }
  }

  return changes
}

const getEmptyDayIds = (weeks) => {
  const ids = new Set()
  for (const week of weeks) {
    for (const day of week.days) {
      if (day.slots.length === 0) ids.add(day.id)
    }
  }
  return ids
}

// ── Calendar utilities ─────────────────────────────────────────────────────────
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SHORT_MONTHS_CAL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAY_LETTERS = ['M','T','W','T','F','S','S']


const getCalendarWeeks = () => {
  const daysUntilMonday = (1 - PROTO_TODAY.getDay() + 7) % 7 || 7
  const firstMonday = new Date(PROTO_TODAY)
  firstMonday.setDate(PROTO_TODAY.getDate() + daysUntilMonday)
  firstMonday.setHours(0, 0, 0, 0)
  return Array.from({ length: 5 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(firstMonday)
      date.setDate(firstMonday.getDate() + w * 7 + d)
      return date
    })
  )
}

const CALENDAR_WEEKS = getCalendarWeeks()
const CALENDAR_DAYS_FLAT = CALENDAR_WEEKS.flat()

const toDateKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
const calDateLabel = (date) => `${SHORT_MONTHS_CAL[date.getMonth()]} ${date.getDate()}`

// ── Responsive hook ────────────────────────────────────────────────────────────
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth > 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}


const cloneWeeks = (weeks) =>
  weeks.map(w => ({ ...w, days: w.days.map(d => ({ ...d, slots: d.slots.map(s => ({ ...s })) })) }))

// ── Shared text style helper ───────────────────────────────────────────────────
const tx = (size, weight, color) => ({
  fontFamily: typography.fontFamily, fontSize: size, fontWeight: weight, color, margin: 0,
})

// ── Time dropdown ──────────────────────────────────────────────────────────────
function TimeDropdown({ times, selectedTime, onSelect }) {
  const [hovered, setHovered] = useState(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (selectedTime && listRef.current) {
      const el = listRef.current.querySelector('[data-selected="true"]')
      if (el) el.scrollIntoView({ block: 'nearest' })
    }
  }, [])

  return (
    <div
      style={{
        marginTop: 8,
        background: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.primary,
        boxShadow: shadows.medium,
        overflow: 'hidden',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div ref={listRef} className="hide-scrollbar" style={{ maxHeight: 224, overflowY: 'auto' }}>
        {times.length === 0 && (
          <p style={{ ...tx(14, 400, colors.tertiary), padding: '12px 16px', margin: 0 }}>
            No times available
          </p>
        )}
        {times.map(time => {
          const selected = time === selectedTime
          const hovering = time === hovered
          return (
            <div
              key={time}
              data-selected={selected}
              onMouseEnter={() => setHovered(time)}
              onMouseLeave={() => setHovered(null)}
              onMouseDown={() => onSelect(time)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', cursor: 'pointer',
                background: selected ? '#EBF1FB' : hovering ? colors.bgSecondary : 'transparent',
                transition: 'background 0.08s',
              }}
            >
              <span style={{ ...tx(14, selected ? 600 : 400, selected ? colors.link : colors.primary) }}>
                {time}
              </span>
              {selected && <CheckIcon />}
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ── Day card ───────────────────────────────────────────────────────────────────
function DayCard({ dayData, activeSlotId, onOpenDropdown, onRemoveDay, onRemoveSlot, onSelectTime }) {
  const [anchorRect, setAnchorRect] = useState(null)

  const toggle = (slotId, rect) => {
    if (activeSlotId === slotId) {
      onOpenDropdown(null)
      setAnchorRect(null)
    } else {
      onOpenDropdown(slotId)
      setAnchorRect(rect)
    }
  }

  useEffect(() => {
    if (activeSlotId === null) setAnchorRect(null)
  }, [activeSlotId])

  const dropdownStyle = anchorRect && activeSlotId !== null ? (() => {
    const spaceBelow = window.innerHeight - anchorRect.bottom
    const showAbove = spaceBelow < 240 && anchorRect.top > 240
    return {
      position: 'fixed',
      top: showAbove ? undefined : anchorRect.bottom + 4,
      bottom: showAbove ? window.innerHeight - anchorRect.top + 4 : undefined,
      left: anchorRect.left,
      minWidth: Math.max(anchorRect.width, 180),
      zIndex: 100,
    }
  })() : null

  return (
    <div data-day-id={dayData.id} style={{ background: colors.bgSecondary, borderRadius: radius.primary, padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <p style={{ ...tx(16, 600, colors.primary), flex: 1, lineHeight: 1.5, margin: 0 }}>
          {dayData.day}, {dayData.date}
        </p>
        <Button
          variant="flat"
          icon={<TrashIcon />}
          style={{ color: '#BC4338' }}
          onClick={e => { e.stopPropagation(); onRemoveDay() }}
        />
      </div>

      {/* Chips row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 8px' }}>
        {dayData.slots.map(slot => (
          <Chip
            key={slot.id}
            label={slot.time}
            selected={activeSlotId === slot.id}
            onClick={e => toggle(slot.id, e.currentTarget.getBoundingClientRect())}
            onRemove={() => onRemoveSlot(slot.id)}
          />
        ))}
        <Chip
          label="Add time"
          selected={activeSlotId === 'add'}
          onClick={e => toggle('add', e.currentTarget.getBoundingClientRect())}
        />
      </div>

      {/* Floating dropdown — fixed to viewport, doesn't expand the card */}
      {dropdownStyle && (
        <div style={dropdownStyle}>
          <TimeDropdown
            times={getAvailableTimes(dayData.slots, activeSlotId)}
            selectedTime={activeSlotId !== 'add' ? dayData.slots.find(s => s.id === activeSlotId)?.time : null}
            onSelect={time => onSelectTime(activeSlotId, time)}
          />
        </div>
      )}
    </div>
  )
}

// ── Week group ─────────────────────────────────────────────────────────────────
function WeekGroup({ week, openDropdown, onOpenDropdown, onRemoveDay, onRemoveSlot, onSelectTime, onResetWeek }) {
  return (
    <div style={{ padding: '24px 16px', borderBottom: `1px solid ${colors.border}` }}>
      <p style={{ ...tx(14, 400, colors.secondary), lineHeight: 1.25, marginBottom: 8 }}>
        Week of {week.label}
      </p>
      {week.days.length === 0 ? (
        <div style={{ background: colors.bgSecondary, borderRadius: radius.primary, padding: 16 }}>
          <p style={{ ...tx(16, 600, colors.primary), lineHeight: 1.5, margin: '0 0 8px' }}>
            No walks this week
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 8px' }}>
            <Chip label="Reset to default schedule" onClick={() => onResetWeek(week.id)} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {week.days.map(day => {
            const activeSlotId =
              openDropdown?.weekId === week.id && openDropdown?.dayId === day.id
                ? openDropdown.slotId
                : null
            return (
              <DayCard
                key={day.id}
                dayData={day}
                activeSlotId={activeSlotId}
                onOpenDropdown={slotId =>
                  slotId === null
                    ? onOpenDropdown(null)
                    : onOpenDropdown({ weekId: week.id, dayId: day.id, slotId })
                }
                onRemoveDay={() => onRemoveDay(week.id, day.id)}
                onRemoveSlot={slotId => onRemoveSlot(week.id, day.id, slotId)}
                onSelectTime={(slotId, time) => onSelectTime(week.id, day.id, slotId, time)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Read-only sidebar cards ────────────────────────────────────────────────────
const WhiteCard = ({ children }) => (
  <div style={{ background: colors.white, borderRadius: radius.primary, padding: '24px 16px' }}>
    {children}
  </div>
)

const TimeGrid = ({ times }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
    {times.map((time, i) => (
      <p key={i} style={{ ...tx(14, 400, colors.primary), margin: 0 }}>{time}</p>
    ))}
  </div>
)

const UserInfoCard = ({ name, image, service, petNames }) => (
  <WhiteCard>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <PetAvatar size={64} images={[image]} />
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', paddingLeft: 8 }}>
        <p style={{ ...tx(20, 600, colors.primary), lineHeight: 1.25 }}>{name}</p>
        <p style={{ ...tx(14, 400, colors.secondary), lineHeight: 1.5 }}>{service}</p>
        <p style={{ ...tx(14, 400, colors.secondary), lineHeight: 1.5 }}>{petNames}</p>
      </div>
    </div>
  </WhiteCard>
)

const TemplateCard = ({ owner }) => (
  <WhiteCard>
    <p style={{ ...tx(20, 600, colors.primary), lineHeight: 1.25, marginBottom: 16 }}>Weekly schedule template</p>
    <p style={{ ...tx(14, 400, colors.secondary), lineHeight: 1.25, marginBottom: 8 }}>Repeats on</p>
    {owner.template.map(({ day, time }) => (
      <div key={day} style={{ paddingBottom: 24 }}>
        <p style={{ ...tx(16, 600, colors.primary), lineHeight: 1.5, marginBottom: 8 }}>{day}</p>
        <TimeGrid times={[time]} />
      </div>
    ))}
    <button style={{ ...tx(14, 600, colors.link), background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', width: '100%', textAlign: 'center', lineHeight: 1.25 }}>
      Edit weekly schedule template
    </button>
  </WhiteCard>
)

const CurrentWeekCard = ({ owner }) => {
  const currentWeekDays = getOwnerCurrentWeek(owner)
  const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dow = PROTO_TODAY.getDay()
  const daysFromMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(PROTO_TODAY)
  monday.setDate(PROTO_TODAY.getDate() - daysFromMonday)
  const weekLabel = `${SHORT_MONTHS[monday.getMonth()]} ${monday.getDate()}`
  return (
    <WhiteCard>
      <p style={{ ...tx(20, 600, colors.primary), lineHeight: 1.25, marginBottom: 4 }}>Happening this week</p>
      <p style={{ ...tx(14, 400, colors.secondary), lineHeight: 1.25, marginBottom: 16 }}>Week of {weekLabel}</p>
      {currentWeekDays.map(({ day, date, times }) => (
        <div key={day} style={{ paddingBottom: 24 }}>
          <p style={{ ...tx(16, 600, colors.primary), lineHeight: 1.5, marginBottom: 8 }}>{day}, {date}</p>
          <TimeGrid times={times} />
        </div>
      ))}
      <button style={{ ...tx(14, 600, colors.link), background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', width: '100%', textAlign: 'center', lineHeight: 1.25 }}>
        Manage current week
      </button>
    </WhiteCard>
  )
}

// ── Change rows (shared between sheet + modal) ─────────────────────────────────
function ChangeRows({ changes }) {
  return (
    <div className="hide-scrollbar" style={{ maxHeight: 240, overflowY: 'auto', padding: '24px 0' }}>
      {changes.map((change, i) => (
        <div key={i} style={{ paddingBottom: i < changes.length - 1 ? 12 : 0 }}>
          <p style={{ ...tx(16, 600, colors.primary), marginBottom: 4, lineHeight: 1.5 }}>
            {change.day}, {change.date}
          </p>
          {change.removed.map((t, j) => (
            <p key={`r${j}`} style={{ ...tx(14, 400, '#BC4338'), marginBottom: 2, lineHeight: 1.5 }}>
              Removed: {t}
            </p>
          ))}
          {change.added.map((t, j) => (
            <p key={`a${j}`} style={{ ...tx(14, 400, '#1B6C42'), marginBottom: 2, lineHeight: 1.5 }}>
              Added: {t}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Error banner ───────────────────────────────────────────────────────────────
function ErrorBanner({ emptyDays, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div>
      <div style={{
        background: '#FFEDE8',
        borderRadius: 4,
        boxShadow: '0px 2px 12px -1px rgba(27,31,35,0.24)',
        padding: 16,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <CautionIcon />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ ...tx(14, 600, colors.primary), lineHeight: 1.25, marginBottom: 4 }}>
            The following days have no time scheduled:
          </p>
          <ul style={{ margin: 0, paddingLeft: 21 }}>
            {emptyDays.map((d, i) => (
              <li key={i} style={{ ...tx(14, 400, colors.primary), lineHeight: 1.5 }}>
                {d.day}, {d.date}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0, marginTop: 2 }}
        >
          <CloseSmIcon />
        </button>
      </div>
    </div>
  )
}

// ── Calendar day cell ──────────────────────────────────────────────────────────
function CalendarDay({ date, isBooked, onSelect }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={() => onSelect(date)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', height: 44, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', position: 'relative',
        borderRadius: 8, cursor: 'pointer',
        background: hovered ? '#EBF1FB' : 'transparent',
        transition: 'background 0.1s', userSelect: 'none',
      }}
    >
      <span style={{ ...tx(14, 400, colors.primary), lineHeight: 1 }}>
        {date.getDate()}
      </span>
      {isBooked && (
        <div style={{
          position: 'absolute', bottom: 4,
          width: 6, height: 6, borderRadius: 3,
          background: colors.success,
          border: `1px solid ${colors.white}`,
        }} />
      )}
    </div>
  )
}

// ── Calendar grid ──────────────────────────────────────────────────────────────
function CalendarGrid({ disabledKeys, bookedKeys, onSelect }) {
  let lastMonth = null
  return (
    <div>
      {/* Weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, paddingBottom: 8 }}>
        {DAY_LETTERS.map((l, i) => (
          <div key={i} style={{ height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ ...tx(14, 400, colors.tertiary), lineHeight: 1 }}>{l}</span>
          </div>
        ))}
      </div>
      {/* Weeks */}
      {CALENDAR_WEEKS.map((week, wi) => {
        const mondayMonth = week[0].getMonth()
        const showHeader = mondayMonth !== lastMonth
        if (showHeader) lastMonth = mondayMonth
        return (
          <React.Fragment key={wi}>
            {showHeader && (
              <p style={{ ...tx(16, 600, colors.primary), lineHeight: 1.5, margin: `${wi > 0 ? 16 : 0}px 0 8px` }}>
                {MONTHS_FULL[mondayMonth]} 2026
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 4 }}>
              {week.map((date, di) => (
                <CalendarDay
                  key={di}
                  date={date}
                  isBooked={bookedKeys.has(toDateKey(date))}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Add day sheet (mobile) ─────────────────────────────────────────────────────
function AddDaySheet({ onSelect, onClose, disabledKeys, bookedKeys }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(27,31,35,0.48)', display: 'flex', alignItems: 'flex-end', zIndex: 10 }}
      onClick={onClose}
    >
      <div
        style={{ background: colors.white, borderRadius: '16px 16px 0 0', boxShadow: shadows.medium, padding: '32px 16px 24px', width: '100%', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 36, height: 5, borderRadius: 35, background: '#C9CFD4' }} />
        <p style={{ ...tx(20, 600, colors.primary), lineHeight: 1.25, marginBottom: 20 }}>Add a day</p>
        <CalendarGrid disabledKeys={disabledKeys} bookedKeys={bookedKeys} onSelect={onSelect} />
        <div style={{ paddingTop: 24 }}>
          <Button variant="default" size="default" fullWidth onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

// ── Add day modal (desktop) ────────────────────────────────────────────────────
function AddDayModal({ onSelect, onClose, disabledKeys, bookedKeys }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(27,31,35,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
      onClick={onClose}
    >
      <div
        style={{ background: colors.white, borderRadius: 8, boxShadow: '0px 4px 16px 0px rgba(0,0,0,0.12)', padding: 24, width: 440, maxWidth: 'calc(100vw - 48px)' }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ ...tx(20, 600, colors.primary), lineHeight: 1.25, marginBottom: 20 }}>Add a day</p>
        <CalendarGrid disabledKeys={disabledKeys} bookedKeys={bookedKeys} onSelect={onSelect} />
        <div style={{ paddingTop: 24 }}>
          <Button variant="flat" size="default" fullWidth onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm sheet (mobile) ─────────────────────────────────────────────────────
function ConfirmSheet({ changes, ownerName, onConfirm, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(27,31,35,0.48)',
        display: 'flex', alignItems: 'flex-end',
        zIndex: 10,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.white,
          borderRadius: '16px 16px 0 0',
          boxShadow: shadows.medium,
          padding: '32px 16px 24px',
          width: '100%',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          width: 36, height: 5, borderRadius: 35, background: '#C9CFD4',
        }} />

        <p style={{ ...tx(20, 600, colors.primary), lineHeight: 1.25, marginBottom: 8 }}>
          Confirm changes
        </p>
        <p style={{ ...tx(14, 400, colors.primary), lineHeight: 1.5, marginBottom: 0 }}>
          Review your changes below. We'll notify {ownerName} of these updates.
        </p>

        <ChangeRows changes={changes} />

        <Button variant="primary" size="default" fullWidth onClick={onConfirm}>
          Confirm and notify
        </Button>
        <div style={{ paddingTop: 12 }}>
          <Button variant="default" size="default" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm modal (desktop) ────────────────────────────────────────────────────
function ConfirmModal({ changes, ownerName, onConfirm, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(27,31,35,0.48)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10,
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: colors.white,
        borderRadius: 8,
        boxShadow: '0px 4px 16px 0px rgba(0,0,0,0.12)',
        padding: 24,
        width: 400, maxWidth: 'calc(100vw - 48px)',
      }}>
        <p style={{ ...tx(20, 600, colors.primary), lineHeight: 1.25, marginBottom: 8 }}>
          Confirm changes
        </p>
        <p style={{ ...tx(14, 400, colors.primary), lineHeight: 1.5, marginBottom: 0 }}>
          Review your changes below. We'll notify {ownerName} of these updates.
        </p>

        <ChangeRows changes={changes} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button variant="primary" size="default" fullWidth onClick={onConfirm}>
            Confirm and notify
          </Button>
          <Button variant="flat" size="default" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Success banner ─────────────────────────────────────────────────────────────
function SuccessBanner({ onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div>
      <div style={{
        background: '#F1FDF6',
        borderRadius: 4,
        boxShadow: '0px 2px 12px -1px rgba(27,31,35,0.24)',
        padding: 16,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <SuccessIcon />
        <p style={{ ...tx(14, 600, colors.primary), lineHeight: 1.25, flex: 1, margin: 0 }}>
          Upcoming weeks schedule was updated successfully
        </p>
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
        >
          <CloseSmIcon />
        </button>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ScheduleScreen({ onBack, owner = {} }) {
  const isDesktop = useIsDesktop()
  const [initialWeeks] = useState(() => getOwnerUpcomingWeeks(owner))
  const [weeks, setWeeks] = useState(() => cloneWeeks(initialWeeks))
  const [baseWeeks, setBaseWeeks] = useState(() => initialWeeks)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showAddDay, setShowAddDay] = useState(false)
  const [newDayId, setNewDayId] = useState(null)
  const [errorDays, setErrorDays] = useState(null)
  const [savedChanges, setSavedChanges] = useState(null) // null = unsaved, array = saved diff

  const hasChanges = JSON.stringify(weeks) !== JSON.stringify(baseWeeks)

  // Close dropdown when clicking outside the upcoming panel
  const panelRef = useRef(null)
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const removeDay = (weekId, dayId) => {
    setOpenDropdown(null)
    setWeeks(prev => prev.map(w =>
      w.id !== weekId ? w : { ...w, days: w.days.filter(d => d.id !== dayId) }
    ))
  }

  const removeSlot = (weekId, dayId, slotId) =>
    setWeeks(prev => prev.map(w =>
      w.id !== weekId ? w : {
        ...w,
        days: w.days.map(d =>
          d.id !== dayId ? d : { ...d, slots: d.slots.filter(s => s.id !== slotId) }
        ),
      }
    ))

  const selectTime = (weekId, dayId, slotId, time) => {
    setOpenDropdown(null)
    setWeeks(prev => prev.map(w =>
      w.id !== weekId ? w : {
        ...w,
        days: w.days.map(d =>
          d.id !== dayId ? d : {
            ...d,
            slots: slotId === 'add'
              ? [...d.slots, { id: `s${Date.now()}`, time }]
              : d.slots.map(s => s.id !== slotId ? s : { ...s, time }),
          }
        ),
      }
    ))
  }

  const resetWeek = (weekId) => {
    const initial = initialWeeks.find(w => w.id === weekId)
    if (!initial) return
    setWeeks(prev => prev.map(w => w.id !== weekId ? w : cloneWeeks([initial])[0]))
  }

  // Dates already in the schedule — disabled in the calendar
  const disabledDateKeys = useMemo(() => {
    const keys = new Set()
    for (const week of weeks) {
      for (const day of week.days) {
        const match = CALENDAR_DAYS_FLAT.find(d => calDateLabel(d) === day.date)
        if (match) keys.add(toDateKey(match))
      }
    }
    return keys
  }, [weeks])

  // Dates from the original schedule — shown with booked indicator
  const bookedDateKeys = useMemo(() => {
    const keys = new Set()
    for (const week of initialWeeks) {
      for (const day of week.days) {
        const match = CALENDAR_DAYS_FLAT.find(d => calDateLabel(d) === day.date)
        if (match) keys.add(toDateKey(match))
      }
    }
    return keys
  }, [])

  const addDay = (date) => {
    const dateKey = toDateKey(date)
    setShowAddDay(false)

    // If already scheduled, scroll to existing day and focus
    if (disabledDateKeys.has(dateKey)) {
      const dateLabel = calDateLabel(date)
      let existingId = null
      for (const week of weeks) {
        const found = week.days.find(d => d.date === dateLabel)
        if (found) { existingId = found.id; break }
      }
      if (existingId) setNewDayId(existingId)
      return
    }

    const weekIdx = CALENDAR_WEEKS.findIndex(week =>
      week.some(d => toDateKey(d) === dateKey)
    )
    if (weekIdx === -1) return

    const monday = CALENDAR_WEEKS[weekIdx][0]
    const weekLabel = calDateLabel(monday)
    const newId = `d${Date.now()}`
    const newDay = {
      id: newId,
      day: DAY_NAMES_FULL[date.getDay()],
      date: calDateLabel(date),
      slots: [],
    }

    setWeeks(prev => {
      const existingIdx = prev.findIndex(w => w.label === weekLabel)
      if (existingIdx >= 0) {
        return prev.map((w, i) => i !== existingIdx ? w : {
          ...w,
          days: [...w.days, newDay].sort((a, b) => {
            const aMs = CALENDAR_DAYS_FLAT.find(d => calDateLabel(d) === a.date)?.getTime() ?? 0
            const bMs = CALENDAR_DAYS_FLAT.find(d => calDateLabel(d) === b.date)?.getTime() ?? 0
            return aMs - bMs
          }),
        })
      } else {
        const newWeek = { id: `w${Date.now()}`, label: weekLabel, days: [newDay] }
        return [...prev, newWeek].sort((a, b) => {
          const aMs = CALENDAR_WEEKS.find(wk => calDateLabel(wk[0]) === a.label)?.[0].getTime() ?? 0
          const bMs = CALENDAR_WEEKS.find(wk => calDateLabel(wk[0]) === b.label)?.[0].getTime() ?? 0
          return aMs - bMs
        })
      }
    })

    setNewDayId(newId)
  }

  // Scroll to newly added day
  useEffect(() => {
    if (!newDayId) return
    const el = document.querySelector(`[data-day-id="${newDayId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setNewDayId(null)
    }
  }, [newDayId, weeks])

  const handleSaveChanges = () => {
    const emptyIds = getEmptyDayIds(weeks)
    if (emptyIds.size > 0) {
      const days = []
      let firstId = null
      for (const week of weeks) {
        for (const day of week.days) {
          if (emptyIds.has(day.id)) {
            if (!firstId) firstId = day.id
            days.push({ day: day.day, date: day.date })
          }
        }
      }
      setErrorDays(days)
      if (firstId) {
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-day-id="${firstId}"]`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
      }
    } else {
      setErrorDays(null)
      setShowConfirm(true)
    }
  }

  const handleConfirm = () => {
    const changes = computeChanges(weeks, initialWeeks)
    setBaseWeeks(cloneWeeks(weeks))
    setSavedChanges(changes)
    setShowConfirm(false)
  }

  const handleDismissAll = () => {
    setOpenDropdown(null)
    setErrorDays(null)
    setSavedChanges(null)
    setWeeks(cloneWeeks(initialWeeks))
    setBaseWeeks(initialWeeks)
  }

  const sidebar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UserInfoCard name={owner.name} image={owner.image} service={owner.service} petNames={owner.petNames} />
      <TemplateCard owner={owner} />
      <CurrentWeekCard owner={owner} />
    </div>
  )

  const upcomingHeader = (
    <div style={{ padding: '24px 16px 17px', borderBottom: `1px solid ${colors.border}`, background: colors.white }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <p style={{ ...tx(20, 600, colors.primary), flex: 1, lineHeight: 1.25, margin: 0 }}>
          Upcoming weeks
        </p>
        <Button variant="primary" size="small" onClick={() => setShowAddDay(true)}>Add a day</Button>
      </div>
      <p style={{ ...tx(14, 400, colors.secondary), lineHeight: 1.5, margin: 0 }}>
        Make changes to accommodate changes in your regular schedule.
      </p>
    </div>
  )

  const weekGroups = weeks.map(week => (
    <WeekGroup
      key={week.id}
      week={week}
      openDropdown={openDropdown}
      onOpenDropdown={setOpenDropdown}
      onRemoveDay={removeDay}
      onRemoveSlot={removeSlot}
      onSelectTime={selectTime}
      onResetWeek={resetWeek}
    />
  ))

  // Footer buttons — only when there are unsaved changes and no confirmed save
  const footer = !savedChanges && hasChanges ? (
    <div style={{
      flexShrink: 0, background: colors.white,
      borderTop: `1px solid ${colors.border}`,
      padding: '16px 16px 24px',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <Button variant="primary" size="default" fullWidth onClick={handleSaveChanges}>
        Save changes
      </Button>
      <Button variant="default" size="default" fullWidth onClick={handleDismissAll}>
        Dismiss all changes
      </Button>
    </div>
  ) : null

  // Floating banners — absolute-positioned, float above scroll content
  const FOOTER_H = 128
  const bannerBottom = footer ? FOOTER_H : 0
  const floatingBanner = (errorDays || savedChanges) ? (
    <div style={{
      position: 'absolute',
      bottom: bannerBottom, left: 16, right: 16,
      zIndex: 5, paddingBottom: 16,
    }}>
      {errorDays && <ErrorBanner emptyDays={errorDays} onDismiss={() => setErrorDays(null)} />}
      {savedChanges && <SuccessBanner onDismiss={() => setSavedChanges(null)} />}
    </div>
  ) : null

  const confirmDialog = showConfirm
    ? isDesktop
      ? <ConfirmModal changes={computeChanges(weeks, initialWeeks)} ownerName={owner.name} onConfirm={handleConfirm} onClose={() => setShowConfirm(false)} />
      : <ConfirmSheet changes={computeChanges(weeks, initialWeeks)} ownerName={owner.name} onConfirm={handleConfirm} onClose={() => setShowConfirm(false)} />
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.bgSecondary }}>
      {/* Nav header */}
      <div style={{
        background: colors.white, borderBottom: `1px solid ${colors.border}`,
        boxShadow: shadows.headerShadow, padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: 8, height: 56, flexShrink: 0, zIndex: 3,
      }}>
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => onBack(savedChanges)}>
          <BackIcon />
        </div>
        <p style={{ ...tx(16, 700, colors.primary), margin: 0 }}>Modify schedule</p>
      </div>

      {isDesktop ? (
        // ── Desktop: sidebar + right column ────────────────────────────
        <div style={{
          flex: 1, overflow: 'hidden', display: 'flex',
          maxWidth: 1140, margin: '0 auto', width: '100%',
          gap: 24, padding: '24px 24px 0', boxSizing: 'border-box',
        }}>
          {/* Sidebar — scrolls independently */}
          <div className="hide-scrollbar" style={{ width: 360, flexShrink: 0, overflowY: 'auto', paddingBottom: 24, alignSelf: 'flex-start' }}>
            {sidebar}
          </div>

          {/* Right column — header fixed, weeks scroll, footer fixed, banners floating */}
          <div ref={panelRef} style={{
            flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
            background: colors.white, borderRadius: `${radius.primary}px ${radius.primary}px 0 0`,
            overflow: 'hidden', position: 'relative',
          }}>
            <div style={{ flexShrink: 0 }}>{upcomingHeader}</div>
            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
              {weekGroups}
            </div>
            {footer}
            {floatingBanner}
          </div>
        </div>
      ) : (
        // ── Mobile: single scrollable column + sticky header + footer + floating banners ──
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
            {/* Sidebar cards */}
            <div style={{ padding: '16px 16px 0' }}>{sidebar}</div>

            {/* Upcoming panel — header sticks within scroll */}
            <div ref={panelRef} style={{ margin: 16, background: colors.white, borderRadius: radius.primary }}>
              <div style={{ position: 'sticky', top: 0, zIndex: 2, borderRadius: `${radius.primary}px ${radius.primary}px 0 0` }}>
                {upcomingHeader}
              </div>
              {weekGroups}
            </div>
          </div>

          {footer}
          {floatingBanner}
        </div>
      )}

      {/* Confirmation overlay */}
      {confirmDialog}

      {/* Add day overlay */}
      {showAddDay && (isDesktop
        ? <AddDayModal onSelect={addDay} onClose={() => setShowAddDay(false)} disabledKeys={disabledDateKeys} bookedKeys={bookedDateKeys} />
        : <AddDaySheet onSelect={addDay} onClose={() => setShowAddDay(false)} disabledKeys={disabledDateKeys} bookedKeys={bookedDateKeys} />
      )}

    </div>
  )
}
