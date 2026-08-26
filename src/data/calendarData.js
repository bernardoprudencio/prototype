// ─── Sitter calendar fixtures ────────────────────────────────────────────────
//
// The POC's frontend model (roverdotcom/web @ ai-pilot-web-calendar,
// NewCalendarPage/types.ts) is **sitter-wide and date-keyed**, with bookings
// pre-expanded server-side to one row per day per booking — `bookingsForDate`
// in its `utils.ts` is a flat `b => b.date === date` filter with no range math
// on the client at all.
//
// The prototype has no sitter-wide date-keyed source: `buildAgenda()` takes one
// client's units, `getTodayWalks()` is sitter-wide but today-only with no date
// argument, and only 3 of the 10 clients in contacts.js carry a
// `recurringSchedule`. So this module projects what the prototype does have
// onto the POC's shape.
//
// Everything anchors on `PROTO_TODAY` (owners.js:3). No literal year appears
// anywhere below.
//
// Two POC gaps are closed here rather than reproduced:
//
//   1. DENSE, NOT SPARSE. The POC's API emits availability rows only for days
//      that differ from the service default, so an absent day and a
//      fully-available day are indistinguishable to the day cell (which reads
//      `slots.some(s => s.spacesOccupied > 0)`). That was its own P1.
//      `buildAvailability` below emits every day in the requested month.
//
//   2. DERIVED, NOT HAND-AUTHORED, OCCUPANCY. The POC shipped two
//      independently-authored fixtures — bookings and availability — which
//      could and did disagree, making cells lie about their state.
//      `buildAvailability` takes the projected bookings as an argument and
//      counts `spacesOccupied` off them, so disagreement is impossible.

import { CLIENTS } from './contacts'
import { PROTO_TODAY, OWNERS } from './owners'
import { getOwnerRelUnit } from './scheduleData'
import { getRelationshipData } from './relationshipData'
import { buildAgenda } from '../lib/scheduleHelpers'
import { dateKey, parseDate, addDays } from '../lib/dateUtils'
import { SERVICES as SITTER_SERVICES, DEFAULT_SERVICE_STATES, SERVICE_STATE } from './sitterServices'
import { SITTER_FIRST_NAME, SITTER_PROFILE } from './sitterProfile'

// ── Calendar IDs ────────────────────────────────────────────────────────────
// Production's `Calendar` primary keys, read off the POC's own fixtures and
// its `useNewCalendarData` merge:
//   1 Overnight Hosting (Boarding)   5 Dog Walking
//   2 Overnight Sitting (House Sitting)  6 Grooming
//   3 Drop-In Visits                 7 Dog Training
//   4 Daycare
//
// CLAUDE.md's two-namespace warning applies here: the booking/rates side uses
// `drop_in_visits` / `dog_daycare` while the schedule/unit side uses `drop_in`
// / `doggy_daycare`. This map deliberately accepts BOTH spellings so callers
// never have to know which side a key came from, and so a `unit.serviceId` and
// a `booking.serviceKey` for the same service land on the same calendar.
export const CALENDAR_ID = {
  boarding: 1,
  house_sitting: 2,
  drop_in_visits: 3,
  drop_in: 3,
  dog_daycare: 4,
  doggy_daycare: 4,
  dog_walking: 5,
  grooming: 6,
  dog_training: 7,
}

// ── Service preferences ─────────────────────────────────────────────────────
// The POC's `ServicePreference[]`, and the one thing with no prototype
// equivalent: there is no per-service capacity model anywhere in this repo.
// Names come from the sitter's own catalog (`sitterServices.js:105`) rather
// than production's calendar names, so the calendar and the service-settings
// hub call the same service the same thing.
//
// `maximumSpacesAvailable > 1` is what makes a service capacity-editable
// (`ServiceEditState.supportsCapacity` in the POC's types.ts), so boarding and
// daycare carry more than one space and the stepper has somewhere to appear.
//
// DIVERGENCE, deliberate. `DEFAULT_SERVICE_STATES` (sitterServices.js:119) has
// dog_walking and house_sitting INACTIVE, but the booking fixtures book both:
// all three recurring clients book weekly walks (contacts.js), and
// `relationshipData.js` cycles its bookings through all five pet-sitting
// services. A calendar that omitted either would show those bookings with no
// slot to count them against, so the derivation would read zero occupancy on a
// day that plainly has work on it. All five pet-sitting services are included
// here and treated as available; the hub's own flags are untouched.
const CALENDAR_SERVICE_IDS = [
  'boarding', 'house_sitting', 'doggy_daycare', 'drop_in', 'dog_walking',
]

// How many of each the sitter can take in a day. Every one is set above the
// fixtures' observed peak, because the POC defines `overbooked` /
// `overbookedBg` tokens but has no code path that reaches them —
// `occupied > available` falls through to the amber `someBookings` fill — so an
// overbooked fixture would render as an ordinary busy day and quietly hide the
// miscount.
//
// House sitting is the awkward one: it is 1 in reality, since you can only sit
// in one home at a time, but `relationshipData.js` gives Lena and Amelia
// overlapping house-sitting stays. Rather than edit those fixtures (out of
// scope, and they feed the relationship pages) the capacity is 2 here.
const CAPACITY = {
  boarding: 3,
  house_sitting: 2,
  doggy_daycare: 4,
  drop_in: 3,
  dog_walking: 4,
}

export const CALENDAR_PREFERENCES = CALENDAR_SERVICE_IDS.map((id) => {
  const svc = SITTER_SERVICES.find((s) => s.id === id)
  const capacity = CAPACITY[id]
  return {
    calendarId: CALENDAR_ID[id],
    serviceId: id,
    name: svc.label,
    spacesAvailable: capacity,
    maximumSpacesAvailable: capacity,
    // POC: `boolean | null`. Null where production has no answer.
    acceptsMoreThanOneClient: capacity > 1 ? true : null,
    isAway: DEFAULT_SERVICE_STATES[id] === SERVICE_STATE.AWAY,
  }
})

// ── Small date/time helpers ─────────────────────────────────────────────────
// `dateKey` already produces the POC's ISO `YYYY-MM-DD`; these fill the gaps.

const startOfDay = (d) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c }

// "09:00" (the unit-side format from scheduleData.js:30) → "9:00 AM".
const to12h = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

// One service, one name. `services.js` (unit side) says "Dog Walking" while
// `relationshipData.js` (booking side) says "Dog walking", and the calendar
// mixes rows from both — so every row takes its label from the preference it
// counts against, which is also the label the availability editor shows.
// ── Sitter-wide availability settings ───────────────────────────────────────
// The `CalendarSettingsService[]` the POC's `AvailabilitySettingsPanel` reads
// from `/api/person/<opk>/calendar-settings/`. Nothing in the prototype models
// per-service defaults at this granularity — `sitterServices.js` has state and
// `sitterProfile.js` has `acceptingNew`, and neither has lead time, weekday
// defaults, or a recurring-clients capability — so the two fields with no
// prototype source are authored here and marked.
//
// `serviceSlug` uses production's own slugs rather than either of the
// prototype's two service-key namespaces (CLAUDE.md), because the panel's
// overnight lead-time spread is keyed off them (`OVERNIGHT_SLUGS`,
// AvailabilitySettingsPanel.tsx:83).
const SETTINGS_SLUG = {
  boarding: 'overnight-boarding',
  house_sitting: 'overnight-traveling',
  drop_in: 'drop-in',
  doggy_daycare: 'doggy-day-care',
  dog_walking: 'dog-walking',
}

// PROTOTYPE-ONLY, both of these. Production serves `spacesAvailableText` as
// the stepper's own sublabel and `canUpdateAcceptingRecurringClients` as a
// per-service capability flag; the prototype has neither. The text is supplied
// only for the services whose capacity is above one, which is the same gate the
// per-day editor uses (`maximumSpacesAvailable > 1`), so the stepper appears in
// exactly the places it already appears there. The capability is true for the
// three daytime services, which are the ones the recurring clients actually
// book weekly in `contacts.js`.
const SPACES_TEXT = {
  boarding: 'Dogs you can host at once',
  house_sitting: 'Homes you can sit at once',
  drop_in: 'Visits you can take in a day',
  doggy_daycare: 'Dogs you can watch at once',
  dog_walking: 'Walks you can take in a day',
}

const CAN_UPDATE_RECURRING = {
  boarding: false,
  house_sitting: false,
  drop_in: true,
  doggy_daycare: true,
  dog_walking: true,
}

// Lead time in days, and the weekday defaults. Both are fixtures: the spread
// exists so the panel's two option sets (overnight up to 14 days, daytime up to
// 7) are both exercised, and dog walking drops Sunday so at least one service
// arrives with a day already unchecked.
const LEAD_TIME_DAYS = {
  boarding: 7,
  house_sitting: 3,
  drop_in: 1,
  doggy_daycare: 1,
  dog_walking: 0,
}

const DAY_KEYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

const OFF_DAYS = { dog_walking: ['sunday'] }

export const CALENDAR_SETTINGS_SERVICES = CALENDAR_SERVICE_IDS.map((id) => {
  const pref = CALENDAR_PREFERENCES.find((p) => p.serviceId === id)
  const off = OFF_DAYS[id] ?? []
  const days = Object.fromEntries(DAY_KEYS.map((d) => [d, !off.includes(d)]))
  return {
    serviceSlug: SETTINGS_SLUG[id],
    serviceId: id,
    serviceTitle: pref.name,
    isAway: pref.isAway,
    // `sitterProfile.js`'s own per-service flag, so the panel opens agreeing
    // with what the service-settings hub says.
    isAcceptingNewCustomers:
      SITTER_PROFILE.services.find((s) => s.id === id)?.acceptingNew ?? true,
    isAcceptingNewRecurringClients: true,
    canUpdateAcceptingRecurringClients: CAN_UPDATE_RECURRING[id],
    spacesAvailable: pref.spacesAvailable,
    spacesAvailableText: pref.maximumSpacesAvailable > 1 ? SPACES_TEXT[id] : '',
    leadTimeDays: LEAD_TIME_DAYS[id],
    ...days,
  }
})

// The keys a settings override may carry — `OVERRIDE_KEYS`
// (AvailabilitySettingsPanel.tsx:73-80), which is also what `diffFromServer`
// walks. `spacesAvailableText`, `serviceTitle` and the capability flag are
// read-only, so they are deliberately absent.
export const SETTINGS_OVERRIDE_KEYS = [
  'isAway',
  'isAcceptingNewCustomers',
  'isAcceptingNewRecurringClients',
  'spacesAvailable',
  'leadTimeDays',
  ...DAY_KEYS,
]

export const SETTINGS_DAY_KEYS = DAY_KEYS

// PROTOTYPE-ONLY. Production hands the sync panel a scheme-less signed iCal
// URL through `Rover.pages.newCalendar.iCalUrl`
// (SyncCalendarPanel.tsx:36-38), e.g.
// `//rover.local:8001/ical/<username>/as-provider/<token>/`. There is no
// backend here, so the shape is reproduced with a stand-in token — the built
// URLs are real enough to read and copy, and will not resolve.
export const CALENDAR_ICAL_URL =
  `//www.rover.com/ical/${SITTER_FIRST_NAME.toLowerCase()}-p/as-provider/prototype/`

const PREF_BY_CALENDAR_ID = Object.fromEntries(
  CALENDAR_PREFERENCES.map((p) => [p.calendarId, p])
)

const serviceNameFor = (calendarId, fallback) =>
  PREF_BY_CALENDAR_ID[calendarId]?.name ?? fallback

const petsFor = (client) =>
  client.pets.map((p) => ({ name: p.name, avatarImage: p.image }))

// The POC's `bookingType` is carried through its whole pipeline and never
// branched on — only typed (`types.ts:65`) and asserted in tests, where the
// fixture value is 'service-booking'. Kept so the shape matches.
const BOOKING_TYPE = 'service-booking'

// ── subtitle ────────────────────────────────────────────────────────────────
// The POC's `subtitle` arrives pre-localized from the server in two observed
// forms: "Day 2 of 5" and "Check-in, 8:00 AM". Its schema carries no intraday
// time fields at all — earlier phases faked them with a `STUB_TIME` constant
// and the stubs were removed as a trust risk. The prototype's times are real
// (`unit.startTime`, and `SERVICE_DETAIL`'s start/end via each booking's
// `startTime` / `endTime`), so both forms can be produced truthfully.
const multiDaySubtitle = (dayIndex, totalDays, startTime, endTime) => {
  if (dayIndex === 0 && startTime) return `Check-in, ${startTime}`
  if (dayIndex === totalDays - 1 && endTime) return `Check-out, ${endTime}`
  return `Day ${dayIndex + 1} of ${totalDays}`
}

// ── buildCalendarBookings ───────────────────────────────────────────────────
// Fans out over the whole roster and flattens to the POC's `CalendarBooking[]`,
// one row per day per booking, for the inclusive [startDate, endDate] window.
//
// Two sources, split exactly on `recurringSchedule` presence so no client
// contributes twice:
//
//   - owen / james / sarah  → their recurring unit, expanded through
//     `buildAgenda()` so the calendar reuses the same occurrence math (and the
//     same overnight explosion) the per-client schedule screens use.
//   - the other seven       → the `bookings.upcoming` / `bookings.past` lists
//     `relationshipData.js` already builds, expanded day-by-day here off each
//     booking's ISO `startDate` / `endDate`.
//
// `conversationUrl` points at the prototype's real conversation route, so a
// day-cell chip deep-links into the thread exactly as the POC's `role="link"`
// stubs did.
export function buildCalendarBookings(startDate, endDate) {
  const from = startOfDay(typeof startDate === 'string' ? parseDate(startDate) : startDate)
  const to = startOfDay(typeof endDate === 'string' ? parseDate(endDate) : endDate)
  const inWindow = (d) => d >= from && d <= to

  const rows = []

  // ── Recurring clients ─────────────────────────────────────────────────────
  Object.values(OWNERS).forEach((owner) => {
    const petIds = owner.pets.map((p) => p.id)
    // `getOwnerRelUnit` hardcodes `id: 1`, and the occurrence key it feeds is
    // `${unit.id}-${dateKey}` — three owners sharing id 1 would collide, so the
    // owner id becomes the unit id here.
    const unit = { ...getOwnerRelUnit(owner, petIds), id: owner.id }
    const client = CLIENTS.find((c) => c.id === owner.id)

    buildAgenda([unit]).forEach(([iso, occs]) => {
      const day = parseDate(iso)
      if (!inWindow(day)) return
      occs.forEach((occ, i) => {
        const serviceId = occ.svc.id
        const nights = occ.totalNights
        rows.push({
          id: `${occ.key}-${i}`,
          date: iso,
          ownerId: owner.id,
          ownerName: owner.name,
          calendarId: CALENDAR_ID[serviceId],
          bookingType: BOOKING_TYPE,
          serviceName: serviceNameFor(CALENDAR_ID[serviceId], occ.svc.label),
          serviceType: serviceId,
          subtitle: nights
            ? multiDaySubtitle(occ.nightIndex - 1, nights, to12h(occ.unit.startTime), null)
            : to12h(occ.unit.startTime),
          conversationUrl: `/conversation/${owner.id}`,
          pets: client ? petsFor(client) : [],
        })
      })
    })
  })

  // ── Non-recurring clients ────────────────────────────────────────────────
  CLIENTS.filter((c) => !c.recurringSchedule).forEach((client) => {
    const { bookings } = getRelationshipData(client.id)
    const pets = petsFor(client)
    // Archived bookings are requests that never became stays, so they are not
    // work on a calendar. Upcoming + past only.
    ;[...bookings.upcoming, ...bookings.past].forEach((booking) => {
      // Recurring-week bookings are synthetic (`buildRecurringWeekBooking`)
      // and only exist for clients handled by the branch above, but the guard
      // is cheap and keeps this loop honest if that ever changes.
      if (booking.isRecurring) return
      const start = startOfDay(parseDate(booking.startDate))
      const end = startOfDay(parseDate(booking.endDate))
      const totalDays = Math.round((end - start) / 86400000) + 1
      for (let i = 0; i < totalDays; i++) {
        const day = addDays(start, i)
        if (!inWindow(day)) continue
        rows.push({
          id: `${booking.id}-${i}`,
          date: dateKey(day),
          ownerId: client.id,
          ownerName: client.displayName,
          calendarId: CALENDAR_ID[booking.serviceKey],
          bookingType: BOOKING_TYPE,
          serviceName: serviceNameFor(CALENDAR_ID[booking.serviceKey], booking.serviceName),
          serviceType: booking.serviceKey,
          subtitle: totalDays > 1
            ? multiDaySubtitle(i, totalDays, booking.startTime, booking.endTime)
            : booking.startTime ?? '',
          conversationUrl: `/conversation/${client.id}/thread/${booking.conversationOpk}`,
          pets,
        })
      }
    })
  })

  return rows.sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)))
}

// ── buildAvailability ───────────────────────────────────────────────────────
// The POC's `AvailabilityDay[]` — one entry per day, each holding one
// `ServiceSlot` per non-away service. `month` is 1-12, matching
// `NewCalendarData.month`.
//
// `spacesOccupied` is counted off `bookings`, never authored. `spacesAvailable`
// starts at the service's preference default; the availability editor overlays
// its own values on top of this in AppContext, and a slot the sitter has
// touched flips `manualAvailability` with the value in `manualSpacesAvailable`
// — the POC's two fields for "the sitter overrode the default here".
export function buildAvailability(year, month, bookings = []) {
  const occupiedByDate = {}
  bookings.forEach((b) => {
    if (!occupiedByDate[b.date]) occupiedByDate[b.date] = {}
    occupiedByDate[b.date][b.calendarId] = (occupiedByDate[b.date][b.calendarId] ?? 0) + 1
  })

  const daysInMonth = new Date(year, month, 0).getDate()
  const days = []
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = dateKey(new Date(year, month - 1, d))
    const occupied = occupiedByDate[iso] ?? {}
    days.push({
      date: iso,
      calendars: CALENDAR_PREFERENCES.filter((p) => !p.isAway).map((p) => ({
        calendarId: p.calendarId,
        spacesAvailable: p.spacesAvailable,
        spacesOccupied: occupied[p.calendarId] ?? 0,
        manualAvailability: false,
        manualSpacesAvailable: null,
      })),
    })
  }
  return days
}

// ── GCA status ──────────────────────────────────────────────────────────────
// The POC's `GcaStatus` — the days-since-last-update nudge behind V1GcaBlurb.
// Relative to `PROTO_TODAY` so the blurb reads the same on any day the
// prototype is opened. `needsAttention` at the POC's own threshold: the blurb
// switches to the "Keep your calendar up-to-date…" body once it trips.
const GCA_DAYS_SINCE_UPDATE = 12

export const CALENDAR_GCA = {
  lastUpdatedAt: dateKey(addDays(startOfDay(PROTO_TODAY), -GCA_DAYS_SINCE_UPDATE)),
  daysSinceLastUpdate: GCA_DAYS_SINCE_UPDATE,
  needsAttention: true,
}

// ── buildCalendarData ───────────────────────────────────────────────────────
// The POC's `NewCalendarData` for one month, assembled the way its
// `useNewCalendarData` merge did — except that availability derives from the
// bookings instead of arriving alongside them.
//
// The window is padded a full week either side of the month so the grid's
// leading pad cells (Sunday-start) and any multi-day booking that straddles a
// month boundary both resolve.
export function buildCalendarData(year, month) {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const bookings = buildCalendarBookings(addDays(first, -7), addDays(last, 7))
  return {
    year,
    month,
    bookings,
    availability: buildAvailability(year, month, bookings),
    preferences: CALENDAR_PREFERENCES,
    gca: CALENDAR_GCA,
  }
}
