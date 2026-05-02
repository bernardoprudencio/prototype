/**
 * Inbox threads + chat histories — derived from CLIENTS and getRelationshipData.
 *
 * Two exports:
 *   getInboxThreads()              -> Thread[]
 *   getChatHistory(conversationOpk) -> ChatItem[]
 *
 * Thread shape:
 *   { conversationOpk, ownerId, status, serviceLabel, bookingId,
 *     lastMessage: { text, sender, timestamp }, alert, unread }
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

// PROTO_TODAY as YYYY-MM-DD for string-comparable date checks.
const TODAY_KEY = (() => {
  const d = PROTO_TODAY
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
})()

const isActiveBooking = (booking) => {
  if (!booking?.startDate || !booking?.endDate) return false
  return booking.startDate <= TODAY_KEY && TODAY_KEY <= booking.endDate
}

// ── Hand-written histories for the recurring-walk owners ─────────────────────
// Keyed by the new conversationOpk (`${ownerId}-conv-recurring`). Content is
// unchanged from the original per-owner CHAT_HISTORY map.
const RECURRING_CHAT_HISTORY = {
  'owen-conv-recurring': [
    { type: 'divider', label: 'Yesterday' },
    { type: 'bubble', text: "Hey! Are we still on for tomorrow at 9?", time: "4:32 PM" },
    { type: 'bubble', text: "Absolutely! See you then 🐾", time: "4:35 PM", isOwner: true, showCheck: true },
    { type: 'divider', label: 'Today' },
    { type: 'bubble', text: "Morning! Leashes are on the hook by the door. Burley's been a bit hyper today 😄", time: "8:52 AM" },
    { type: 'bubble', text: "On my way! Be there in a few.", time: "8:55 AM", isOwner: true, showCheck: true },
    { type: 'gap' },
    { type: 'banner', text: "Walk started at 9:04 AM, Mar 19", link: "See Rover Card" },
    { type: 'gap' },
    { type: 'bubble', text: "Both doing great! Koni's leading the way and Burley found a stick he absolutely won't let go of 😂", time: "9:28 AM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "Haha that's so Burley. Thank you for the update!", time: "9:31 AM" },
    { type: 'gap', h: 4 },
    { type: 'banner', text: "Walk ended at 10:01 AM, Mar 19", link: "See Rover Card" },
    { type: 'gap' },
    { type: 'bubble', text: "They look completely worn out, thank you! 🐾", time: "10:05 AM" },
    { type: 'bubble', text: "Ha! They definitely earned it. See you next week!", time: "10:07 AM", isOwner: true, showCheck: true },
  ],
  'james-conv-recurring': [
    { type: 'divider', label: 'Yesterday' },
    { type: 'bubble', text: "Hey! Are you still on for noon today?", time: "11:30 AM" },
    { type: 'bubble', text: "Yes! Heading over around 11:55.", time: "11:32 AM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "Just a heads up — Archie gets a bit shy with strangers at first", time: "11:45 AM" },
    { type: 'bubble', text: "Good to know, I'll take it slow with him 🐾", time: "11:48 AM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "He warms up fast once he's outside. The trail behind the building is his favorite", time: "11:51 AM" },
    { type: 'gap', h: 16 },
    { type: 'banner', text: "Walk started at 12:02 PM, Mar 18", link: "See Rover Card" },
    { type: 'gap', h: 24 },
    { type: 'banner', text: "Walk ended at 12:31 PM, Mar 18", link: "See Rover Card" },
    { type: 'gap', h: 16 },
    { type: 'bubble', text: "Thanks! How did he do?", time: "1:15 PM" },
    { type: 'bubble', text: "He was great once he warmed up! Really loved sniffing around the trail", time: "1:18 PM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "Ha, that sounds exactly like him. Thanks again!", time: "1:20 PM" },
  ],
  'sarah-conv-recurring': [
    { type: 'divider', label: 'Mar 12' },
    { type: 'bubble', text: "Hi! Quick note — Milo's leash is in the basket by the front door", time: "3:42 PM" },
    { type: 'bubble', text: "Perfect, heading over now!", time: "3:45 PM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "He loves the park on Cedar St if you have time 🐾", time: "3:47 PM" },
    { type: 'bubble', text: "We'll definitely head there!", time: "3:48 PM", isOwner: true, showCheck: true },
    { type: 'gap', h: 16 },
    { type: 'banner', text: "Walk started at 4:03 PM, Mar 12", link: "See Rover Card" },
    { type: 'gap', h: 24 },
    { type: 'banner', text: "Walk ended at 4:33 PM, Mar 12", link: "See Rover Card" },
    { type: 'gap', h: 16 },
    { type: 'bubble', text: "Thank you! Was he a good boy?", time: "5:01 PM" },
    { type: 'bubble', text: "He was amazing! Made a few friends at the park 🐾", time: "5:04 PM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "Oh that makes me so happy, thank you!", time: "5:06 PM" },
    { type: 'divider', label: 'Mar 13' },
    { type: 'bubble', text: "Hi! Just checking in — I didn't get a Rover Card notification. Was one started?", time: "10:12 AM" },
  ],
}

// Last-message payloads for the recurring threads. Mirrors the original
// hand-coded INBOX_THREADS entries exactly.
const RECURRING_LAST_MESSAGE = {
  owen: {
    text: "Ha! They definitely earned it. See you next week!",
    sender: 'you',
    timestamp: 'Today 10:07 AM',
  },
  james: {
    text: "Ha, that sounds exactly like him. Thanks again!",
    sender: 'James',
    timestamp: 'Yesterday 1:20 PM',
  },
  sarah: {
    text: "Hi! Just checking in — I didn't get a Rover Card notification. Was one started?",
    sender: 'Sarah',
    timestamp: 'Mar 13 10:12 AM',
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
// Each builder receives ({ client, booking, archived, upcoming }) and returns
// a ChatItem[]. Tone matches the hand-written owen/james/sarah threads.

const buildWalkingHistory = ({ client, booking, archived, upcoming }) => {
  const pet = petNameOf(client)
  const owner = firstNameOf(client)
  const startLabel = startLabelFromDates(booking.dates)
  const items = [
    { type: 'divider', label: startLabel },
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

const buildDaycareHistory = ({ client, booking, archived, upcoming }) => {
  const pet = petNameOf(client)
  const startLabel = startLabelFromDates(booking.dates)
  const items = [
    { type: 'divider', label: startLabel },
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

const buildDropInHistory = ({ client, booking, archived, upcoming }) => {
  const pet = petNameOf(client)
  const startLabel = startLabelFromDates(booking.dates)
  const items = [
    { type: 'divider', label: startLabel },
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

const buildBoardingHistory = ({ client, booking, archived, upcoming }) => {
  const pet = petNameOf(client)
  const startLabel = startLabelFromDates(booking.dates)
  const endLabel = endLabelFromDates(booking.dates)
  const items = [
    { type: 'divider', label: startLabel },
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

const buildHouseSittingHistory = ({ client, booking, archived, upcoming }) => {
  const pet = petNameOf(client)
  const startLabel = startLabelFromDates(booking.dates)
  const endLabel = endLabelFromDates(booking.dates)
  const items = [
    { type: 'divider', label: startLabel },
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
// last-message payload. Falls back to a sensible default when no bubble exists.
const lastMessageFromHistory = (history, client, booking) => {
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
      timestamp: startLabelFromDates(booking.dates),
    }
  }
  const sender = lastBubble.isOwner ? 'you' : firstNameOf(client)
  const dateLabel = startLabelFromDates(booking.dates)
  return {
    text: lastBubble.text,
    sender,
    timestamp: `${dateLabel} ${lastBubble.time}`,
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export const getInboxThreads = () => {
  const threads = []

  for (const client of CLIENTS) {
    // 1. Recurring weekly walks → one `current` thread.
    if (client.recurringSchedule) {
      threads.push({
        conversationOpk: `${client.id}-conv-recurring`,
        ownerId: client.id,
        status: 'current',
        serviceLabel: 'Dog walking · repeats weekly',
        bookingId: null,
        lastMessage: RECURRING_LAST_MESSAGE[client.id] ?? {
          text: 'Weekly walk thread',
          sender: firstNameOf(client),
          timestamp: 'Today',
        },
        alert: null,
        unread: false,
      })
    }

    // 2. Booking-derived threads.
    const rel = getRelationshipData(client.id)
    if (!rel) continue

    const { upcoming = [], past = [], archived = [] } = rel.bookings ?? {}

    // For upcoming bookings: bookings whose date span contains PROTO_TODAY
    // become 'active' (production: active_stay). Otherwise the FIRST upcoming
    // with serviceStatus 'pending_service_deposit' becomes 'pending'; the rest
    // stay 'upcoming'.
    let pendingAssigned = false
    for (const booking of upcoming) {
      let status = 'upcoming'
      if (isActiveBooking(booking)) {
        status = 'active'
      } else if (!pendingAssigned && booking.serviceStatus === 'pending_service_deposit') {
        status = 'pending'
        pendingAssigned = true
      }
      const history = getChatHistory(booking.conversationOpk)
      threads.push({
        conversationOpk: booking.conversationOpk,
        ownerId: client.id,
        status,
        serviceLabel: `${booking.serviceName} · ${booking.dates.replace(/,\s*\d{4}$/, '')}`,
        bookingId: booking.id,
        lastMessage: lastMessageFromHistory(history, client, booking),
        alert: null,
        unread: false,
      })
    }

    for (const booking of past) {
      const history = getChatHistory(booking.conversationOpk)
      threads.push({
        conversationOpk: booking.conversationOpk,
        ownerId: client.id,
        status: 'past',
        serviceLabel: `${booking.serviceName} · ${booking.dates.replace(/,\s*\d{4}$/, '')}`,
        bookingId: booking.id,
        lastMessage: lastMessageFromHistory(history, client, booking),
        alert: null,
        unread: false,
      })
    }

    for (const booking of archived) {
      const history = getChatHistory(booking.conversationOpk)
      threads.push({
        conversationOpk: booking.conversationOpk,
        ownerId: client.id,
        status: 'archived',
        serviceLabel: `${booking.serviceName} · ${booking.dates.replace(/,\s*\d{4}$/, '')}`,
        bookingId: booking.id,
        lastMessage: lastMessageFromHistory(history, client, booking),
        alert: null,
        unread: false,
      })
    }
  }

  return threads
}

// Locate a booking + its archived/upcoming flag from a conversationOpk.
// Returns { client, booking, archived, upcoming } or null.
const findBookingByOpk = (conversationOpk) => {
  // opk shape: `${ownerId}-conv-{up|past|arc}-${i}`
  const match = conversationOpk.match(/^(.+)-conv-(up|past|arc)-(\d+)$/)
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
