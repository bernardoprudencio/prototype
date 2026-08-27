/**
 * Inbox threads + chat histories — derived from CLIENTS and getRelationshipData.
 *
 * Two exports:
 *   getInboxThreads()              -> Thread[]
 *   getChatHistory(conversationOpk) -> ChatItem[]
 *
 * Thread shape:
 *   { conversationOpk, ownerId, status, serviceLabel, bookingId,
 *     lastMessage: { text, sender, timestamp }, lastActivityAt, activityLabel,
 *     alert, unread }
 *
 * `lastActivityAt` is a real Date and is always in the past — it is when the
 * conversation last moved, never when the booking happens. getInboxThreads()
 * returns threads sorted by it, newest first, which is what the Inbox's
 * "Sorted by recent activity" header claims.
 *
 * ChatItem shape (must stay compatible with ConversationScreen rendering):
 *   { type: 'divider', label }
 *   { type: 'bubble',  text, time, isOwner?, showCheck? }
 *   { type: 'banner',  text, link? }
 *   { type: 'gap',     h? }                  // default height 12
 */

import { CLIENTS, getClient } from './contacts'
import { getRelationshipData } from './relationshipData'
import { PROTO_TODAY } from './owners'
import { addDays, parseDate, fmtDate, fmtRelDate, fmtActivityLabel } from '../lib/dateUtils'

// PROTO_TODAY as YYYY-MM-DD for string-comparable date checks.
const TODAY_KEY = (() => {
  const d = PROTO_TODAY
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
})()

const isActiveBooking = (booking) => {
  if (!booking?.startDate || !booking?.endDate) return false
  return booking.startDate <= TODAY_KEY && TODAY_KEY <= booking.endDate
}

// ── Last-activity derivation ────────────────────────────────────────────────
// A thread's activity date is when the conversation last moved, which is always
// in the past — as distinct from booking.dates, which for an upcoming booking is
// in the future. Everything below is derived from PROTO_TODAY so the prototype
// never drifts into stale literals.

const START_OF_TODAY = (() => {
  const d = new Date(PROTO_TODAY)
  d.setHours(0, 0, 0, 0)
  return d
})()

// "1:20 PM" -> [13, 20]. Chat bubbles carry times in this shape.
const parseClock = (t) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((t ?? '').trim())
  if (!m) return [12, 0]
  const h = Number(m[1]) % 12
  return [/pm/i.test(m[3]) ? h + 12 : h, Number(m[2])]
}

// Stamp a bubble's clock time onto a day.
const at = (day, clock) => {
  const d = new Date(day)
  const [h, min] = parseClock(clock)
  d.setHours(h, min, 0, 0)
  return d
}

const dayAgo = (n) => addDays(START_OF_TODAY, -n)

// Stable per-client offset so two clients' conversations don't land on the same
// day and one client never owns a run of rows at the top of the inbox.
const seedOf = (id) => [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)

// How many days back each recurring owner's thread last moved.
const RECURRING_DAYS_AGO = { owen: 0, james: 1, sarah: 2 }

// Position of a booking within its client's upcoming list, ordered by start
// date. `upcoming` is built ascending, but the hand-placed demo bookings and the
// recurring week are spliced in, so sort a copy rather than trusting the order.
const upcomingActivityIndex = (rel) => {
  const list = (rel?.bookings?.upcoming ?? []).filter(b => !b.isRecurring)
  const map = {}
  ;[...list]
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
    .forEach((b, i) => { map[b.conversationOpk] = i })
  return map
}

// The day a booking's conversation last moved, as a midnight Date. The clock
// time is applied later from the thread's final bubble, so this stays pure.
//   upcoming — the soonest stay was discussed most recently (last-minute
//              details); further-out stays were arranged earlier. Monotone, and
//              past by construction since it counts backwards from today.
//   active   — the stay's start date: the last thing said was the drop-off
//              exchange. Dating it today would collide with the recurring thread
//              of a client who has both, putting one client twice at the top.
//   past     — the day after the service ended: the wrap-up exchange.
//   archived — the end date, hundreds of days back, so these sink to the bottom.
const activityDayFor = (client, booking, kind, index = 0) => {
  if (kind === 'up') {
    if (isActiveBooking(booking)) return parseDate(booking.startDate) ?? START_OF_TODAY
    return dayAgo(1 + 2 * index + (seedOf(client.id) % 3))
  }
  const end = parseDate(booking.endDate) ?? dayAgo(7)
  const day = kind === 'past' ? addDays(end, 1) : end
  return day > START_OF_TODAY ? START_OF_TODAY : day
}

// ── Hand-written histories for the recurring-walk owners ─────────────────────
// Keyed by the new conversationOpk (`${ownerId}-conv-recurring`). Content is
// unchanged from the original per-owner CHAT_HISTORY map.
const RECURRING_CHAT_HISTORY = (() => {
  // Owen's walk was today, James's yesterday, Sarah's three days ago with her
  // unanswered Rover Card question the day after. Dates are derived so the
  // dividers and Rover Card banners agree with the inbox's activity label.
  const owenDay   = dayAgo(RECURRING_DAYS_AGO.owen)
  const jamesDay  = dayAgo(RECURRING_DAYS_AGO.james)
  const sarahWalk = dayAgo(RECURRING_DAYS_AGO.sarah + 1)
  const sarahAsk  = dayAgo(RECURRING_DAYS_AGO.sarah)

  return {
  'owen-conv-recurring': [
    { type: 'divider', label: fmtRelDate(dayAgo(RECURRING_DAYS_AGO.owen + 1)) },
    { type: 'bubble', text: "Hey! Are we still on for tomorrow at 9?", time: "4:32 PM" },
    { type: 'bubble', text: "Absolutely! See you then 🐾", time: "4:35 PM", isOwner: true, showCheck: true },
    { type: 'divider', label: fmtRelDate(owenDay) },
    { type: 'bubble', text: "Morning! Leashes are on the hook by the door. Burley's been a bit hyper today 😄", time: "8:52 AM" },
    { type: 'bubble', text: "On my way! Be there in a few.", time: "8:55 AM", isOwner: true, showCheck: true },
    { type: 'gap' },
    { type: 'banner', text: `Walk started at 9:04 AM, ${fmtDate(owenDay)}`, link: "See Rover Card" },
    { type: 'gap' },
    { type: 'bubble', text: "Both doing great! Koni's leading the way and Burley found a stick he absolutely won't let go of 😂", time: "9:28 AM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "Haha that's so Burley. Thank you for the update!", time: "9:31 AM" },
    { type: 'gap', h: 4 },
    { type: 'banner', text: `Walk ended at 10:01 AM, ${fmtDate(owenDay)}`, link: "See Rover Card" },
    { type: 'gap' },
    { type: 'bubble', text: "They look completely worn out, thank you! 🐾", time: "10:05 AM" },
    { type: 'bubble', text: "Ha! They definitely earned it. See you next week!", time: "10:07 AM", isOwner: true, showCheck: true },
  ],
  'james-conv-recurring': [
    { type: 'divider', label: fmtRelDate(jamesDay) },
    { type: 'bubble', text: "Hey! Are you still on for noon today?", time: "11:30 AM" },
    { type: 'bubble', text: "Yes! Heading over around 11:55.", time: "11:32 AM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "Just a heads up — Archie gets a bit shy with strangers at first", time: "11:45 AM" },
    { type: 'bubble', text: "Good to know, I'll take it slow with him 🐾", time: "11:48 AM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "He warms up fast once he's outside. The trail behind the building is his favorite", time: "11:51 AM" },
    { type: 'gap', h: 16 },
    { type: 'banner', text: `Walk started at 12:02 PM, ${fmtDate(jamesDay)}`, link: "See Rover Card" },
    { type: 'gap', h: 24 },
    { type: 'banner', text: `Walk ended at 12:31 PM, ${fmtDate(jamesDay)}`, link: "See Rover Card" },
    { type: 'gap', h: 16 },
    { type: 'bubble', text: "Thanks! How did he do?", time: "1:15 PM" },
    { type: 'bubble', text: "He was great once he warmed up! Really loved sniffing around the trail", time: "1:18 PM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "Ha, that sounds exactly like him. Thanks again!", time: "1:20 PM" },
  ],
  'sarah-conv-recurring': [
    { type: 'divider', label: fmtRelDate(sarahWalk) },
    { type: 'bubble', text: "Hi! Quick note — Milo's leash is in the basket by the front door", time: "3:42 PM" },
    { type: 'bubble', text: "Perfect, heading over now!", time: "3:45 PM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "He loves the park on Cedar St if you have time 🐾", time: "3:47 PM" },
    { type: 'bubble', text: "We'll definitely head there!", time: "3:48 PM", isOwner: true, showCheck: true },
    { type: 'gap', h: 16 },
    { type: 'banner', text: `Walk started at 4:03 PM, ${fmtDate(sarahWalk)}`, link: "See Rover Card" },
    { type: 'gap', h: 24 },
    { type: 'banner', text: `Walk ended at 4:33 PM, ${fmtDate(sarahWalk)}`, link: "See Rover Card" },
    { type: 'gap', h: 16 },
    { type: 'bubble', text: "Thank you! Was he a good boy?", time: "5:01 PM" },
    { type: 'bubble', text: "He was amazing! Made a few friends at the park 🐾", time: "5:04 PM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "Oh that makes me so happy, thank you!", time: "5:06 PM" },
    { type: 'divider', label: fmtRelDate(sarahAsk) },
    { type: 'bubble', text: "Hi! Just checking in — I didn't get a Rover Card notification. Was one started?", time: "10:12 AM" },
  ],
  }
})()

// Last-message payloads for the recurring threads. The clock time matches each
// thread's final bubble; the day comes from RECURRING_DAYS_AGO.
const RECURRING_LAST_MESSAGE = {
  owen: {
    text: "Ha! They definitely earned it. See you next week!",
    sender: 'you',
    time: '10:07 AM',
  },
  james: {
    text: "Ha, that sounds exactly like him. Thanks again!",
    sender: 'James',
    time: '1:20 PM',
  },
  sarah: {
    text: "Hi! Just checking in — I didn't get a Rover Card notification. Was one started?",
    sender: 'Sarah',
    time: '10:12 AM',
  },
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const firstNameOf = (client) => client.displayName.split(' ')[0]

const petNameOf = (client) => client.pets?.[0]?.name ?? 'your pup'

// Turn a booking.dates string into a short divider label. Examples:
//   "Mar 12, 2025"        → "Mar 12"
//   "Mar 12 to 15, 2025"  → "Mar 12"
//   "Mar 28 to Apr 2, 2025" → "Mar 28"
const startLabelFromDates = (dates) => {
  if (!dates) return 'Earlier'
  // Strip year suffix
  const noYear = dates.replace(/,\s*\d{4}$/, '')
  // Take the segment before " to "
  const head = noYear.split(' to ')[0].trim()
  return head
}

// End label for use in service-end banners. For single-day bookings reuses
// the start. For ranges, returns the end portion.
const endLabelFromDates = (dates) => {
  if (!dates) return 'Earlier'
  const noYear = dates.replace(/,\s*\d{4}$/, '')
  const parts = noYear.split(' to ')
  if (parts.length === 1) return parts[0].trim()
  const tail = parts[1].trim()
  // If the tail is just a number (same-month range), prepend the start month.
  if (/^\d+$/.test(tail)) {
    const startMonth = parts[0].trim().split(' ')[0]
    return `${startMonth} ${tail}`
  }
  return tail
}

// ── Templated chat histories per service icon ───────────────────────────────
// Each builder receives ({ client, booking, archived, upcoming, activityDay })
// and returns a ChatItem[]. Tone matches the hand-written owen/james/sarah
// threads. `activityDay` opens an upcoming thread, whose planning exchange
// happened in the past — the service date it is about is still ahead.

const buildWalkingHistory = ({ client, booking, archived, upcoming, activityDay }) => {
  const pet = petNameOf(client)
  const owner = firstNameOf(client)
  const startLabel = startLabelFromDates(booking.dates)
  const items = [
    { type: 'divider', label: upcoming ? fmtRelDate(activityDay) : startLabel },
    { type: 'bubble', text: `Hi! Quick heads up — ${pet}'s leash is hanging by the front door`, time: '3:42 PM' },
    { type: 'bubble', text: 'Got it, heading over now!', time: '3:45 PM', isOwner: true, showCheck: true },
  ]

  if (upcoming) return items

  items.push(
    { type: 'gap', h: 16 },
    { type: 'banner', text: `Walk started at 4:03 PM, ${startLabel}`, link: 'See Rover Card' },
    { type: 'gap', h: 24 },
    { type: 'banner', text: `Walk ended at 4:33 PM, ${startLabel}`, link: 'See Rover Card' },
    { type: 'gap', h: 16 },
    { type: 'bubble', text: `Thanks! How did ${pet} do?`, time: '5:01 PM' },
    { type: 'bubble', text: `${pet} was great — found a new favorite tree 🐾`, time: '5:04 PM', isOwner: true, showCheck: true },
  )

  if (archived) {
    items.push(
      { type: 'gap', h: 16 },
      { type: 'banner', text: 'Booking cancelled. Refund processed.' },
      { type: 'gap', h: 16 },
      { type: 'bubble', text: `So sorry about needing to cancel, ${owner === 'You' ? 'all' : ''} thanks for being flexible`.trim(), time: '5:30 PM' },
      { type: 'bubble', text: 'No worries at all — happy to reschedule whenever works for you', time: '5:32 PM', isOwner: true, showCheck: true },
    )
  }
  return items
}

const buildDaycareHistory = ({ client, booking, archived, upcoming, activityDay }) => {
  const pet = petNameOf(client)
  const startLabel = startLabelFromDates(booking.dates)
  const items = [
    { type: 'divider', label: upcoming ? fmtRelDate(activityDay) : startLabel },
    { type: 'bubble', text: `Hi! Drop-off around 8 AM still good?`, time: '7:30 AM' },
    { type: 'bubble', text: `Yep, doors open whenever ${pet} arrives 🐾`, time: '7:32 AM', isOwner: true, showCheck: true },
  ]

  if (upcoming) return items

  items.push(
    { type: 'gap', h: 16 },
    { type: 'banner', text: `Daycare started at 8:05 AM, ${startLabel}`, link: 'See Rover Card' },
    { type: 'gap' },
    { type: 'bubble', text: `${pet} just had lunch and is napping in the sunny spot 😴`, time: '12:15 PM', isOwner: true, showCheck: true },
    { type: 'bubble', text: 'Best update ever, thank you!', time: '12:18 PM' },
    { type: 'gap', h: 16 },
    { type: 'banner', text: `Daycare ended at 5:30 PM, ${startLabel}`, link: 'See Rover Card' },
    { type: 'gap', h: 12 },
    { type: 'bubble', text: `On my way for pickup — thanks again!`, time: '5:35 PM' },
  )

  if (archived) {
    items.push(
      { type: 'gap', h: 16 },
      { type: 'banner', text: 'Booking cancelled. Refund processed.' },
      { type: 'gap', h: 16 },
      { type: 'bubble', text: `Really sorry to cancel last minute — appreciate you being flexible`, time: '5:50 PM' },
      { type: 'bubble', text: `No problem at all, hope ${pet} is okay`, time: '5:52 PM', isOwner: true, showCheck: true },
    )
  }
  return items
}

const buildDropInHistory = ({ client, booking, archived, upcoming, activityDay }) => {
  const pet = petNameOf(client)
  const startLabel = startLabelFromDates(booking.dates)
  const items = [
    { type: 'divider', label: upcoming ? fmtRelDate(activityDay) : startLabel },
    { type: 'bubble', text: `Hi! Could you swing by between 12 and 12:30?`, time: '11:00 AM' },
    { type: 'bubble', text: `Absolutely, I'll aim for right around noon 🐾`, time: '11:02 AM', isOwner: true, showCheck: true },
  ]

  if (upcoming) return items

  items.push(
    { type: 'gap', h: 16 },
    { type: 'banner', text: `Drop-in started at 12:04 PM, ${startLabel}`, link: 'See Rover Card' },
    { type: 'gap' },
    { type: 'bubble', text: `${pet} fed, fresh water, quick visit out back. All good!`, time: '12:25 PM', isOwner: true, showCheck: true },
    { type: 'gap', h: 4 },
    { type: 'banner', text: `Drop-in ended at 12:34 PM, ${startLabel}`, link: 'See Rover Card' },
    { type: 'gap', h: 12 },
    { type: 'bubble', text: 'Thank you so much!', time: '12:40 PM' },
  )

  if (archived) {
    items.push(
      { type: 'gap', h: 16 },
      { type: 'banner', text: 'Booking cancelled. Refund processed.' },
      { type: 'gap', h: 16 },
      { type: 'bubble', text: `Apologies again for the cancel — thanks for being understanding`, time: '1:00 PM' },
      { type: 'bubble', text: `Of course, anytime!`, time: '1:02 PM', isOwner: true, showCheck: true },
    )
  }
  return items
}

const buildBoardingHistory = ({ client, booking, archived, upcoming, activityDay }) => {
  const pet = petNameOf(client)
  const startLabel = startLabelFromDates(booking.dates)
  const endLabel = endLabelFromDates(booking.dates)
  const items = [
    { type: 'divider', label: upcoming ? fmtRelDate(activityDay) : startLabel },
    { type: 'bubble', text: `Hi! What time works best to drop ${pet} off?`, time: '9:00 AM' },
    { type: 'bubble', text: `Anytime after 10 AM is great 🐾`, time: '9:05 AM', isOwner: true, showCheck: true },
    { type: 'bubble', text: `Perfect, see you around 10:30`, time: '9:07 AM' },
  ]

  if (upcoming) return items

  items.push(
    { type: 'gap', h: 16 },
    { type: 'banner', text: `Boarding started ${startLabel}`, link: 'See Rover Card' },
    { type: 'gap' },
    { type: 'bubble', text: `${pet} is settling in great — already made friends with the couch`, time: '11:15 AM', isOwner: true, showCheck: true },
    { type: 'bubble', text: 'Yes!! That makes me so happy, thanks for the update', time: '11:20 AM' },
    { type: 'gap', h: 16 },
    { type: 'banner', text: `Boarding ended ${endLabel}`, link: 'See Rover Card' },
    { type: 'gap', h: 12 },
    { type: 'bubble', text: 'Heading your way for pickup, thank you for everything!', time: '4:00 PM' },
  )

  if (archived) {
    items.push(
      { type: 'gap', h: 16 },
      { type: 'banner', text: 'Booking cancelled. Refund processed.' },
      { type: 'gap', h: 16 },
      { type: 'bubble', text: `Sorry again for the last-minute cancel`, time: '4:30 PM' },
      { type: 'bubble', text: `No worries — wishing ${pet} well!`, time: '4:32 PM', isOwner: true, showCheck: true },
    )
  }
  return items
}

const buildHouseSittingHistory = ({ client, booking, archived, upcoming, activityDay }) => {
  const pet = petNameOf(client)
  const startLabel = startLabelFromDates(booking.dates)
  const endLabel = endLabelFromDates(booking.dates)
  const items = [
    { type: 'divider', label: upcoming ? fmtRelDate(activityDay) : startLabel },
    { type: 'bubble', text: `Hi! Spare key is under the planter on the porch`, time: '2:00 PM' },
    { type: 'bubble', text: `Got it, I'll text once I'm in 🐾`, time: '2:05 PM', isOwner: true, showCheck: true },
    { type: 'bubble', text: `Thank you! Treats are in the pantry`, time: '2:07 PM' },
  ]

  if (upcoming) return items

  items.push(
    { type: 'gap', h: 16 },
    { type: 'banner', text: `House sitting started ${startLabel}`, link: 'See Rover Card' },
    { type: 'gap' },
    { type: 'bubble', text: `All settled in. ${pet} got the dinner routine on lock`, time: '7:30 PM', isOwner: true, showCheck: true },
    { type: 'bubble', text: `Amazing, thank you!`, time: '7:35 PM' },
    { type: 'gap', h: 16 },
    { type: 'banner', text: `House sitting ended ${endLabel}`, link: 'See Rover Card' },
    { type: 'gap', h: 12 },
    { type: 'bubble', text: `Just locked up — keys back under the planter. ${pet} did great!`, time: '10:00 AM', isOwner: true, showCheck: true },
    { type: 'bubble', text: 'Thank you so much, you saved the week!', time: '10:05 AM' },
  )

  if (archived) {
    items.push(
      { type: 'gap', h: 16 },
      { type: 'banner', text: 'Booking cancelled. Refund processed.' },
      { type: 'gap', h: 16 },
      { type: 'bubble', text: `Really sorry to cancel — appreciate the flexibility`, time: '10:30 AM' },
      { type: 'bubble', text: `Anytime, hope all is well`, time: '10:32 AM', isOwner: true, showCheck: true },
    )
  }
  return items
}

const HISTORY_BUILDERS = {
  walking: buildWalkingHistory,
  daycare: buildDaycareHistory,
  'drop-in': buildDropInHistory,
  'sitter-home': buildBoardingHistory,
  homevists: buildHouseSittingHistory,
}

// ── Last-message derivation ─────────────────────────────────────────────────
// Picks the final bubble from a generated history and renders a Thread-style
// last-message payload dated on `activityDay` — never on booking.dates, which
// for an upcoming booking is in the future. `at` is the Date the inbox sorts by.
const lastMessageFromHistory = (history, client, booking, activityDay) => {
  // Find the last bubble.
  let lastBubble = null
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].type === 'bubble') {
      lastBubble = history[i]
      break
    }
  }
  if (!lastBubble) {
    return {
      text: `${booking.serviceName} on ${booking.dates}`,
      sender: client.displayName.split(' ')[0],
      timestamp: fmtRelDate(activityDay),
      at: at(activityDay, '12:00 PM'),
    }
  }
  const sender = lastBubble.isOwner ? 'you' : firstNameOf(client)
  const when = at(activityDay, lastBubble.time)
  return {
    text: lastBubble.text,
    sender,
    timestamp: `${fmtRelDate(activityDay)} ${lastBubble.time}`,
    at: when,
  }
}

// Newest first — the order the Inbox header has always claimed.
const byRecency = (a, b) => b.lastActivityAt - a.lastActivityAt

// A client with several conversations otherwise owns a run of consecutive rows.
// Round-robin owners *within* each activity day: the day order stays strictly
// descending — a row can never appear above one with a newer date — while the
// rows above the fold end up different clients.
const dayKeyOf = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

const interleaveByOwner = (dayThreads) => {
  const queues = new Map()
  for (const thread of dayThreads) {
    if (!queues.has(thread.ownerId)) queues.set(thread.ownerId, [])
    queues.get(thread.ownerId).push(thread)
  }
  const out = []
  const lanes = [...queues.values()]
  while (out.length < dayThreads.length) {
    for (const lane of lanes) if (lane.length) out.push(lane.shift())
  }
  return out
}

const spreadOwners = (threads) => {
  const out = []
  let dayKey = null
  let bucket = []
  const flush = () => { if (bucket.length) out.push(...interleaveByOwner(bucket)); bucket = [] }
  for (const thread of threads) {
    const key = dayKeyOf(thread.lastActivityAt)
    if (key !== dayKey) { flush(); dayKey = key }
    bucket.push(thread)
  }
  flush()
  return out
}

// Production's inbox marks a thread unread when the owner spoke last and the
// sitter hasn't replied. Derive it from the sorted list rather than hand-listing
// opks: the newest few client-sent threads are the ones awaiting a reply.
const UNREAD_COUNT = 3
const markUnread = (threads) => {
  let marked = 0
  for (const thread of threads) {
    if (marked >= UNREAD_COUNT) break
    if (thread.status === 'archived') continue
    if (thread.lastMessage.sender === 'you') continue
    thread.unread = true
    marked += 1
  }
  return threads
}

// ── Public API ──────────────────────────────────────────────────────────────

export const getInboxThreads = () => {
  const threads = []

  for (const client of CLIENTS) {
    // 1. Recurring weekly walks → one `current` thread.
    if (client.recurringSchedule) {
      const recurring = RECURRING_LAST_MESSAGE[client.id] ?? {
        text: 'Weekly walk thread',
        sender: firstNameOf(client),
        time: '12:00 PM',
      }
      const when = at(dayAgo(RECURRING_DAYS_AGO[client.id] ?? 0), recurring.time)
      threads.push({
        conversationOpk: `${client.id}-conv-recurring`,
        ownerId: client.id,
        status: 'current',
        serviceLabel: 'Dog walking · repeats weekly',
        bookingId: null,
        lastMessage: {
          ...recurring,
          timestamp: `${fmtRelDate(when)} ${recurring.time}`,
          at: when,
        },
        lastActivityAt: when,
        activityLabel: fmtActivityLabel(when),
        alert: null,
        unread: false,
      })
    }

    // 2. Booking-derived threads.
    const rel = getRelationshipData(client.id)
    if (!rel) continue

    const { upcoming = [], past = [], archived = [] } = rel.bookings ?? {}
    const upIndex = upcomingActivityIndex(rel)

    // Emit one thread per booking. Each carries a real last-activity Date from
    // activityDayFor + its final bubble's clock time; the whole list is sorted
    // by it at the end.
    const push = (booking, kind, status) => {
      const activityDay = activityDayFor(client, booking, kind, upIndex[booking.conversationOpk] ?? 0)
      const history = getChatHistory(booking.conversationOpk)
      const lastMessage = lastMessageFromHistory(history, client, booking, activityDay)
      threads.push({
        conversationOpk: booking.conversationOpk,
        ownerId: client.id,
        status,
        serviceLabel: `${booking.serviceName} · ${booking.dates.replace(/,\s*\d{4}$/, '')}`,
        bookingId: booking.id,
        lastMessage,
        lastActivityAt: lastMessage.at,
        activityLabel: fmtActivityLabel(lastMessage.at),
        alert: null,
        unread: false,
      })
    }

    // For upcoming bookings: bookings whose date span contains PROTO_TODAY
    // become 'active' (production: active_stay). Otherwise the FIRST upcoming
    // with serviceStatus 'pending_service_deposit' becomes 'pending'; the rest
    // stay 'upcoming'.
    let pendingAssigned = false
    for (const booking of upcoming) {
      // A recurring client's current week is now a real booking in `upcoming`
      // (relationshipData.js buildRecurringWeekBooking) carrying the same
      // `${id}-conv-recurring` opk that step 1 above already emitted a thread
      // for. Skip it here so the inbox keeps one thread per conversation.
      if (booking.isRecurring) continue
      let status = 'upcoming'
      if (isActiveBooking(booking)) {
        status = 'active'
      } else if (!pendingAssigned && booking.serviceStatus === 'pending_service_deposit') {
        status = 'pending'
        pendingAssigned = true
      }
      push(booking, 'up', status)
    }

    for (const booking of past) push(booking, 'past', 'past')
    for (const booking of archived) push(booking, 'arc', 'archived')
  }

  return markUnread(spreadOwners(threads.sort(byRecency)))
}

// Locate a booking + its archived/upcoming flag from a conversationOpk.
// Returns { client, booking, archived, upcoming } or null.
const findBookingByOpk = (conversationOpk) => {
  // opk shape: `${ownerId}-conv-{up|past|arc}-${suffix}`, where suffix is
  // normally an index but is a slug for the hand-placed demo bookings in
  // relationshipData.js (`-up-active`, `-up-locked`).
  const match = conversationOpk.match(/^(.+)-conv-(up|past|arc)-([\w-]+)$/)
  if (!match) return null
  const [, ownerId, kind] = match

  const client = getClient(ownerId)
  if (!client) return null

  const rel = getRelationshipData(ownerId)
  if (!rel) return null

  const list =
    kind === 'up' ? rel.bookings.upcoming :
    kind === 'past' ? rel.bookings.past :
    rel.bookings.archived

  const booking = list.find(b => b.conversationOpk === conversationOpk)
  if (!booking) return null

  return {
    client,
    booking,
    archived: kind === 'arc',
    upcoming: kind === 'up',
    // Same derivation getInboxThreads uses, so a thread's opening divider and
    // its inbox activity label can never disagree.
    activityDay: activityDayFor(client, booking, kind, upcomingActivityIndex(rel)[conversationOpk] ?? 0),
  }
}

export const getChatHistory = (conversationOpk) => {
  if (!conversationOpk) return []

  // Hand-written recurring histories take precedence.
  if (RECURRING_CHAT_HISTORY[conversationOpk]) {
    return RECURRING_CHAT_HISTORY[conversationOpk]
  }

  const ctx = findBookingByOpk(conversationOpk)
  if (!ctx) return []

  const builder = HISTORY_BUILDERS[ctx.booking.serviceIcon]
  if (!builder) return []

  return builder(ctx)
}
