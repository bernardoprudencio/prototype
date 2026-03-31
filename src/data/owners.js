import { peopleImages, petImages } from '../assets/images'

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

// ── Owner definitions ──────────────────────────────────────────────────────────
export const OWNERS = {
  owen: {
    id: 'owen',
    name: 'Owen O.',
    image: peopleImages.owen,
    service: 'Weekly 60 min walks',
    serviceDuration: 60,
    petNames: 'Koni, Burley',
    petImages: [petImages.koni, petImages.burley],
    address: '123 Fourth Ave, Seattle, WA',
    template: [
      { day: 'Monday',    time: '9:00 AM' },
      { day: 'Wednesday', time: '9:00 AM' },
      { day: 'Friday',    time: '9:00 AM' },
    ],
  },
  james: {
    id: 'james',
    name: 'James T.',
    image: peopleImages.james,
    service: 'Weekly 30 min walks',
    serviceDuration: 30,
    petNames: 'Archie',
    petImages: [petImages.archie],
    address: '450 Pine St, Seattle, WA',
    template: [
      { day: 'Tuesday',  time: '2:00 PM' },
      { day: 'Thursday', time: '2:00 PM' },
    ],
  },
  sarah: {
    id: 'sarah',
    name: 'Sarah S.',
    image: peopleImages.sarah,
    service: 'Weekly 30 min walks',
    serviceDuration: 30,
    petNames: 'Milo',
    petImages: [petImages.milo],
    address: '88 Union St, Seattle, WA',
    template: [
      { day: 'Monday',    time: '4:00 PM' },
      { day: 'Wednesday', time: '4:00 PM' },
      { day: 'Friday',    time: '4:00 PM' },
    ],
  },
}

// ── RelationshipScreen unit helpers ───────────────────────────────────────────

const DAY_TO_DOW = {
  Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6
}

const toHHMM = (time) => {
  const [timePart, period] = time.split(' ')
  let [h, m] = timePart.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

export const getOwnerRelUnit = (owner, petIds = []) => {
  // Anchor ~4 weeks before PROTO_TODAY (Monday-aligned) so it looks like an established relationship
  const monday = new Date(PROTO_TODAY)
  const dow = monday.getDay()
  monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1) - 28)
  const startDate = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`

  return {
    id: 1,
    serviceId: 'dog_walking',
    startDate,
    endDate: '',
    repeatEndDate: '',
    startTime: toHHMM(owner.template[0].time),
    durationMins: owner.serviceDuration,
    petIds,
    frequency: 'weekly',
    weekDays: owner.template.map(t => DAY_TO_DOW[t.day]),
    everyNWeeks: 1,
    skippedKeys: [],
    overrides: {},
    cost: 20,
  }
}

// ── Incomplete cards ──────────────────────────────────────────────────────────

// Last occurrence of last week for each owner — drives both Home dash and Schedule screen
export const getIncompleteCards = () => {
  const dow = PROTO_TODAY.getDay()
  const thisMonday = new Date(PROTO_TODAY)
  thisMonday.setDate(PROTO_TODAY.getDate() - (dow === 0 ? 6 : dow - 1))
  thisMonday.setHours(0, 0, 0, 0)
  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(thisMonday.getDate() - 7)

  return Object.values(OWNERS).flatMap(owner => {
    const lastWeekOccs = owner.template
      .map(t => {
        const date = new Date(lastMonday)
        date.setDate(lastMonday.getDate() + DAY_OFFSET[t.day])
        date.setHours(0, 0, 0, 0)
        return { ...t, date }
      })
      .filter(t => t.date >= lastMonday && t.date < thisMonday)
      .sort((a, b) => a.date - b.date)

    if (!lastWeekOccs.length) return []
    const last = lastWeekOccs[lastWeekOccs.length - 1]
    const dateStr = fmt(last.date)
    const petKey = owner.petNames.split(',')[0].trim().toLowerCase()

    return [{
      id:        `${owner.id}-incomplete`,
      label:     `Dog Walking: ${owner.petNames}`,
      sublabel:  `${dateStr} · ${formatTimeRange(last.time, owner.serviceDuration)}`,
      dateLabel: `${dateStr} at ${last.time}`,
      client:    owner.name,
      clientKey: owner.id,
      petKey,
      petImgs:   owner.petImages,
      cost:      '$20.00',
    }]
  })
}

// ── Derived helpers ────────────────────────────────────────────────────────────

// Today's walks across all owners, sorted by start time
export const getTodayWalks = () => {
  const todayName = DAY_NAMES[PROTO_TODAY.getDay()]
  return Object.values(OWNERS)
    .flatMap(owner =>
      owner.template
        .filter(t => t.day === todayName)
        .map(t => ({
          owner,
          time: t.time,
          timeRange: formatTimeRange(t.time, owner.serviceDuration),
        }))
    )
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

// Upcoming 5 weeks starting next Monday, derived from owner template
export const getOwnerUpcomingWeeks = (owner) => {
  const daysUntilMonday = (1 - PROTO_TODAY.getDay() + 7) % 7 || 7
  const firstMonday = new Date(PROTO_TODAY)
  firstMonday.setDate(PROTO_TODAY.getDate() + daysUntilMonday)
  firstMonday.setHours(0, 0, 0, 0)

  return Array.from({ length: 5 }, (_, w) => {
    const monday = new Date(firstMonday)
    monday.setDate(firstMonday.getDate() + w * 7)
    const days = owner.template.map((entry, di) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + DAY_OFFSET[entry.day])
      return {
        id: `${owner.id}-w${w + 1}-d${di + 1}`,
        day: entry.day,
        date: fmt(date),
        slots: [{ id: `${owner.id}-w${w + 1}-d${di + 1}-s1`, time: entry.time }],
      }
    })
    return { id: `${owner.id}-w${w + 1}`, label: fmt(monday), days }
  })
}
