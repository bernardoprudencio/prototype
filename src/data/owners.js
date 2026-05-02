import { CLIENTS } from './contacts'

export const PROTO_TODAY = new Date()

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
// Offset from Monday (Mon=0 … Sun=6)
const DAY_OFFSET   = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 }

const fmt = (date) => `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`

const toMins = (str) => {
  const [time, p] = str.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (p === 'PM' && h !== 12) h += 12
  if (p === 'AM' && h === 12) h = 0
  return h * 60 + m
}

const formatTimeRange = (startTime, durationMins) => {
  const total = toMins(startTime) + durationMins
  const endH   = Math.floor(total / 60)
  const endM   = total % 60
  const endP   = endH >= 12 ? 'PM' : 'AM'
  const endH12 = endH === 12 ? 12 : endH > 12 ? endH - 12 : endH
  return `${startTime} – ${endH12}:${endM === 0 ? '00' : endM} ${endP}`
}

// ── Owner derivation ────────────────────────────────────────────────────────
// An "owner" is a CLIENTS entry that has a `recurringSchedule`. We surface a
// flatter shape for the screens that pre-date the unified contacts model.
const deriveOwner = (client) => ({
  id: client.id,
  name: client.displayName,
  image: client.imageUrl,
  service: client.recurringSchedule.service,
  serviceDuration: client.recurringSchedule.serviceDuration,
  petNames: client.pets.map(p => p.name).join(', '),
  petImages: client.pets.map(p => p.image),
  pets: client.pets,
  address: client.recurringSchedule.address,
  template: client.recurringSchedule.template,
  pricing: client.recurringSchedule.pricing,
})

export const OWNERS = Object.fromEntries(
  CLIENTS.filter(c => c.recurringSchedule).map(c => [c.id, deriveOwner(c)])
)

// ── Derived helpers ────────────────────────────────────────────────────────────

// Today's walks across all owners, sorted by start time.
// ownerCurrentWeeks: optional { ownerId: days[] } override from App state.
export const getTodayWalks = (ownerCurrentWeeks = {}) => {
  const todayName = DAY_NAMES[PROTO_TODAY.getDay()]
  return Object.values(OWNERS)
    .flatMap(owner => {
      const currentWeekDays = ownerCurrentWeeks[owner.id]
      if (currentWeekDays) {
        return currentWeekDays
          .filter(d => d.day === todayName)
          .flatMap(d => d.slots.map(s => ({
            owner,
            time: s.time,
            timeRange: formatTimeRange(s.time, owner.serviceDuration),
          })))
      }
      return owner.template
        .filter(t => t.day === todayName)
        .map(t => ({
          owner,
          time: t.time,
          timeRange: formatTimeRange(t.time, owner.serviceDuration),
        }))
    })
    .sort((a, b) => toMins(a.time) - toMins(b.time))
}

// Days in the current week (week containing PROTO_TODAY) for a given owner
export const getOwnerCurrentWeek = (owner) => {
  const dow = PROTO_TODAY.getDay()
  const daysFromMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(PROTO_TODAY)
  monday.setDate(PROTO_TODAY.getDate() - daysFromMonday)
  monday.setHours(0, 0, 0, 0)
  return owner.template.map(entry => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + DAY_OFFSET[entry.day])
    return { day: entry.day, date: fmt(date), times: [entry.time] }
  })
}

// Slot-based current week for editing (groups multiple times on same day)
export const getOwnerCurrentWeekSlots = (owner) => {
  const dow = PROTO_TODAY.getDay()
  const daysFromMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(PROTO_TODAY)
  monday.setDate(PROTO_TODAY.getDate() - daysFromMonday)
  monday.setHours(0, 0, 0, 0)

  const grouped = []
  owner.template.forEach(({ day, time }) => {
    const existing = grouped.find(g => g.day === day)
    if (existing) existing.times.push(time)
    else grouped.push({ day, times: [time] })
  })

  return grouped.map((group, di) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + DAY_OFFSET[group.day])
    return {
      id: `${owner.id}-cw-d${di + 1}`,
      day: group.day,
      date: fmt(date),
      slots: group.times.map((time, si) => ({
        id: `${owner.id}-cw-d${di + 1}-s${si + 1}`,
        time,
      })),
    }
  })
}

// All 7 days of the current week, with template slots pre-populated
export const getFullCurrentWeekSlots = (owner) => {
  const dow = PROTO_TODAY.getDay()
  const daysFromMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(PROTO_TODAY)
  monday.setDate(PROTO_TODAY.getDate() - daysFromMonday)
  monday.setHours(0, 0, 0, 0)

  const templateByDay = {}
  owner.template.forEach(({ day, time }) => {
    if (!templateByDay[day]) templateByDay[day] = []
    templateByDay[day].push(time)
  })

  return DAY_NAMES.slice(1).concat('Sunday').map((day, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const times = templateByDay[day] || []
    return {
      id: `${owner.id}-cw-d${i + 1}`,
      day,
      date: fmt(date),
      slots: times.map((time, si) => ({ id: `${owner.id}-cw-d${i + 1}-s${si + 1}`, time })),
    }
  })
}

// Upcoming 5 weeks starting next Monday, derived from owner template
export const getOwnerUpcomingWeeks = (owner) => {
  const daysUntilMonday = (1 - PROTO_TODAY.getDay() + 7) % 7 || 7
  const firstMonday = new Date(PROTO_TODAY)
  firstMonday.setDate(PROTO_TODAY.getDate() + daysUntilMonday)
  firstMonday.setHours(0, 0, 0, 0)

  // Group template entries by day so multiple times on the same day share one row
  const grouped = []
  owner.template.forEach(({ day, time }) => {
    const existing = grouped.find(g => g.day === day)
    if (existing) existing.times.push(time)
    else grouped.push({ day, times: [time] })
  })

  return Array.from({ length: 5 }, (_, w) => {
    const monday = new Date(firstMonday)
    monday.setDate(firstMonday.getDate() + w * 7)
    const days = grouped.map((group, di) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + DAY_OFFSET[group.day])
      return {
        id: `${owner.id}-w${w + 1}-d${di + 1}`,
        day: group.day,
        date: fmt(date),
        slots: group.times.map((time, si) => ({
          id: `${owner.id}-w${w + 1}-d${di + 1}-s${si + 1}`,
          time,
        })),
      }
    })
    return { id: `${owner.id}-w${w + 1}`, label: fmt(monday), days }
  })
}
