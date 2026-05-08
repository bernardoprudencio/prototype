// Graduated take-rate (Canada) — mirrors roverdotcom/web
// src/aplaceforrover/conversations/take_rates/constants.py.
// `sitterShare` is the provider earnings percentage (1 - rover fee).
// `roverFeePercentage` is misnamed in production: it actually carries the
// sitter's earnings share (e.g. "0.70" = "Earn 70%"). See the in-code comment
// in TierStatus.tsx.

import { CLIENTS } from './contacts'
import { peopleImages } from '../assets/images'
import { PROTO_TODAY } from './owners'

export const TIERS = [
  { tierName: 'Tier 1', threshold: 499,      sitterShare: 0.70 },
  { tierName: 'Tier 2', threshold: 999,      sitterShare: 0.85 },
  { tierName: 'Tier 3', threshold: Infinity, sitterShare: 0.90 },
]

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const fmt = (d) => `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`

const fmtRange = (start, end) => {
  if (start.getMonth() === end.getMonth()) {
    return `${SHORT_MONTHS[start.getMonth()]} ${start.getDate()} to ${end.getDate()}, ${start.getFullYear()}`
  }
  return `${fmt(start)} to ${fmt(end)}, ${start.getFullYear()}`
}

const formatCAD = (amount) => new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
}).format(amount)

export const formatMoney = (m) => formatCAD(parseFloat(m.amount))

const money = (amount) => ({ amount: amount.toFixed(2), currencyIso: 'CAD' })

// ── Service catalog ───────────────────────────────────────────────────────────
// `serviceIcon` keys match rover-icons.css class suffixes. These are the
// browsable services per roverdotcom/web :: services/constants.py. Training
// and grooming are intentionally excluded — the production view 404s
// relationship pages with no browsable conversations
// (RelationshipProgressScreenView), so they're never shown here either.
const SERVICES = {
  dog_walking:    { name: 'Dog walking',    icon: 'walking',     daily: 25, span: 1, multiDay: false },
  dog_daycare:    { name: 'Daycare',        icon: 'daycare',     daily: 45, span: 1, multiDay: false },
  drop_in_visits: { name: 'Drop-in visit',  icon: 'drop-in',     daily: 30, span: 1, multiDay: false },
  boarding:       { name: 'Boarding',       icon: 'sitter-home', daily: 70, span: 3, multiDay: true  },
  house_sitting:  { name: 'House sitting',  icon: 'homevists',   daily: 65, span: 3, multiDay: true  },
}

const SERVICE_KEYS = Object.keys(SERVICES)

// Deterministic hash so re-renders pick the same bookings for the same client.
const hash = (s, salt = 0) => {
  let h = salt
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Tier index for a given cumulative amount.
const tierIndexFor = (amount) => {
  if (amount <= TIERS[0].threshold) return 0
  if (amount <= TIERS[1].threshold) return 1
  return 2
}

// ── Booking generator ─────────────────────────────────────────────────────────
// Walks dates backwards from PROTO_TODAY and produces booking objects whose
// summed `price` values approximately reconcile to the client's gbv.
const buildPastBookings = (client, count, targetGbv) => {
  if (count === 0) return []

  const bookings = []
  const cursor = new Date(PROTO_TODAY)
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() - 4) // start a few days before "today"

  // Distribute targetGbv across `count` bookings; pick service+span per id.
  const targetPerBooking = targetGbv > 0 ? targetGbv / count : 60
  let runningGbv = 0

  for (let i = 0; i < count; i++) {
    const seed = hash(client.id, i + 1)
    const serviceKey = SERVICE_KEYS[seed % SERVICE_KEYS.length]
    const svc = SERVICES[serviceKey]

    // Span: multi-day services pick 1-4 nights based on seed.
    const span = svc.multiDay ? 1 + (seed % 4) : 1
    const end = new Date(cursor)
    const start = new Date(cursor)
    start.setDate(end.getDate() - (span - 1))

    // Price: anchor on (daily × span) but jitter ±20% so the list feels real.
    const base = svc.daily * span
    const jitter = ((seed % 41) - 20) / 100 // -0.20 .. +0.20
    let price = Math.max(20, Math.round(base * (1 + jitter)))

    // For the final couple of bookings, nudge price so total ≈ targetGbv.
    if (i >= count - 2 && targetGbv > 0) {
      const remaining = targetGbv - runningGbv
      const remainingBookings = count - i
      price = Math.max(20, Math.round(remaining / remainingBookings))
    }
    runningGbv += price

    // Earnings: tier the booking landed in (based on cumulative gbv at that point).
    const cumulativeAfter = runningGbv
    const tier = TIERS[tierIndexFor(cumulativeAfter)]
    const earnings = price * tier.sitterShare

    bookings.push({
      id: `${client.id}-past-${i + 1}`,
      price: money(price),
      dates: span === 1 ? `${fmt(start)}, ${start.getFullYear()}` : fmtRange(start, end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      earnings: money(earnings),
      serviceStatus: 'completed_service_deposit',
      conversationOpk: `${client.id}-conv-past-${i + 1}`,
    })

    // Step cursor backwards: span days + 2-6 day gap.
    const gap = 2 + (seed % 5)
    cursor.setDate(cursor.getDate() - span - gap)
  }

  return bookings
}

const buildUpcomingBookings = (client, count, currentTier) => {
  const out = []
  const cursor = new Date(PROTO_TODAY)
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 5)

  for (let i = 0; i < count; i++) {
    const seed = hash(client.id, 100 + i)
    const serviceKey = SERVICE_KEYS[seed % SERVICE_KEYS.length]
    const svc = SERVICES[serviceKey]
    const span = svc.multiDay ? 1 + (seed % 4) : 1
    const start = new Date(cursor)
    const end = new Date(cursor)
    end.setDate(start.getDate() + (span - 1))

    const base = svc.daily * span
    const jitter = ((seed % 31) - 15) / 100
    const price = Math.max(20, Math.round(base * (1 + jitter)))

    out.push({
      id: `${client.id}-up-${i + 1}`,
      price: money(price),
      dates: span === 1 ? `${fmt(start)}, ${start.getFullYear()}` : fmtRange(start, end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      earnings: money(price * currentTier.sitterShare),
      serviceStatus: 'pending_service_deposit',
      conversationOpk: `${client.id}-conv-up-${i + 1}`,
    })

    cursor.setDate(cursor.getDate() + span + (3 + (seed % 6)))
  }

  return out
}

const buildArchivedBookings = (client, count) => {
  const out = []
  const cursor = new Date(PROTO_TODAY)
  cursor.setHours(0, 0, 0, 0)
  // Archived = much older history (a year+ back).
  cursor.setDate(cursor.getDate() - 400)

  for (let i = 0; i < count; i++) {
    const seed = hash(client.id, 999 + i)
    const serviceKey = SERVICE_KEYS[seed % SERVICE_KEYS.length]
    const svc = SERVICES[serviceKey]
    const span = svc.multiDay ? 1 + (seed % 3) : 1
    const start = new Date(cursor)
    const end = new Date(cursor)
    end.setDate(start.getDate() + (span - 1))

    const price = Math.max(20, Math.round(svc.daily * span * 0.95))

    out.push({
      id: `${client.id}-arc-${i + 1}`,
      price: money(price),
      dates: span === 1 ? `${fmt(start)}, ${start.getFullYear()}` : fmtRange(start, end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      earnings: money(0),
      serviceStatus: 'no_service_deposit',
      conversationOpk: `${client.id}-conv-arc-${i + 1}`,
    })

    cursor.setDate(cursor.getDate() - span - 7)
  }

  return out
}

// Builds archived-booking objects from a client's explicit `cancelledBookings`
// list. Used for clients without a tier — bookings exist but produce $0 GBV
// because they were fully cancelled (deposit recaptured). Per BookingsMapper
// in roverdotcom/web, cancelled stays with stay_price == 0 land in `archived`
// with serviceStatus `no_service_deposit` (gray chip).
const buildCancelledArchived = (client) => {
  const cursor = new Date(PROTO_TODAY)
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() - 4)

  return client.cancelledBookings.map((b, i) => {
    const seed = hash(client.id, i + 1)
    const svc = SERVICES[b.serviceKey]
    const span = b.span ?? (svc.multiDay ? 1 + (seed % 3) : 1)
    const end = new Date(cursor)
    const start = new Date(cursor)
    start.setDate(end.getDate() - (span - 1))

    const item = {
      id: `${client.id}-arc-${i + 1}`,
      price: money(b.price),
      dates: span === 1 ? `${fmt(start)}, ${start.getFullYear()}` : fmtRange(start, end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      earnings: money(0),
      serviceStatus: 'no_service_deposit',
      conversationOpk: `${client.id}-conv-arc-${i + 1}`,
    }

    cursor.setDate(cursor.getDate() - span - (2 + (seed % 5)))
    return item
  })
}

// ── Tier statuses + callout ───────────────────────────────────────────────────
// Mirrors ProgressMapper._get_tiers_data in roverdotcom/web — when both
// cumulativeGrossValue and pending are 0, every tier is 'new' (no active
// highlight, no checkmarks). Otherwise the current bucket becomes 'active',
// completed buckets get 'complete', and a single pending bucket may sit
// above the active one if pending earnings will reach it.
const buildTierStates = (effectiveGbv, pendingAmount) => {
  const totalWithPending = effectiveGbv + pendingAmount
  const currentIdx = effectiveGbv > 0 ? tierIndexFor(effectiveGbv) : -1

  return TIERS.map((t, i) => {
    const start = i === 0 ? 0 : TIERS[i - 1].threshold
    let status
    if (effectiveGbv === 0 && pendingAmount === 0) status = 'new'
    else if (effectiveGbv >= t.threshold) status = 'complete'
    else if (i === currentIdx) status = 'active'
    else if (totalWithPending >= start) status = 'pending'
    else status = 'new'
    return {
      tierName: t.tierName,
      status,
      roverFeePercentage: t.sitterShare.toFixed(2),
      threshold: {
        amount: t.threshold === Infinity ? `${TIERS[i - 1].threshold}+` : String(t.threshold),
        currencyIso: 'CAD',
      },
    }
  })
}

// Mirrors ProgressMapper._get_heading.
const headingFor = (effectiveGbv) => {
  if (effectiveGbv <= 0) return 'Start your relationship'
  const idx = tierIndexFor(effectiveGbv)
  return `Your Tier ${idx + 1} relationship`
}

// Mirrors ProgressMapper._get_tier_progress_callout. Production switches to a
// pending-focused message when upcoming bookings exist, so earnings totals and
// remaining-to-next-tier copy never disagree with what the user can see.
const calloutFor = (client, effectiveGbv, pendingAmount) => {
  const firstName = client.displayName.split(' ')[0]

  if (effectiveGbv === 0 && pendingAmount === 0) {
    return {
      content: `Accept a request from ${firstName} to start building your relationship!`,
      isError: false,
    }
  }

  if (effectiveGbv === 0 && pendingAmount > 0) {
    const futureIdx = tierIndexFor(pendingAmount)
    const amount = formatCAD(pendingAmount)
    if (futureIdx === 0) {
      return {
        content: `You have ${amount} in pending progress. Complete your booking(s) to unlock Tier 2 with ${firstName}.`,
        isError: false,
      }
    }
    return {
      content: `You have ${amount} in pending progress. Complete your booking(s) to reach Tier ${futureIdx + 1} with ${firstName}.`,
      isError: false,
    }
  }

  const idx = tierIndexFor(effectiveGbv)
  if (idx === 2) {
    const pct = Math.round(TIERS[2].sitterShare * 100)
    return {
      content: `You are earning ${pct}% with ${firstName}!`,
      isError: false,
    }
  }

  if (pendingAmount > 0) {
    const futureIdx = tierIndexFor(effectiveGbv + pendingAmount)
    const willCross = futureIdx > idx
    const amount = formatCAD(pendingAmount)
    const nextTierNum = idx + 2 // 0-based -> next tier (1-based)
    if (willCross) {
      return {
        content: `You have ${amount} in pending progress. Complete your booking to reach Tier ${nextTierNum} with ${firstName}.`,
        isError: false,
      }
    }
    return {
      content: `You have ${amount} in pending progress. Complete your next booking to make progress to Tier ${nextTierNum} with ${firstName}.`,
      isError: false,
    }
  }

  if (idx === 1) {
    const remaining = TIERS[1].threshold - effectiveGbv
    return {
      content: `You've unlocked higher earnings with ${firstName}! You're ${formatCAD(remaining)} away from Tier 3 with ${firstName}.`,
      isError: false,
    }
  }
  const remaining = TIERS[0].threshold - effectiveGbv
  return {
    content: `You're ${formatCAD(remaining)} away from Tier 2. Keep providing great care to unlock higher earnings with ${firstName}.`,
    isError: false,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
// Returns the full data object the RelationshipPage consumes for one client,
// derived deterministically from CLIENTS in contacts.js.
export const getRelationshipData = (ownerId) => {
  const client = CLIENTS.find(c => c.id === ownerId)
  if (!client) return null

  // gbv is null in two cases (matches production):
  //   1. Sitter not in alt-mon rollout
  //   2. In rollout, but no completed browsable bookings (cancelled or
  //      non-browsable services like training/grooming)
  // Either way, we render with $0 progress — no fallback fudging.
  const effectiveGbv = client.gbv ?? 0

  const currentTier = TIERS[tierIndexFor(effectiveGbv)]

  let past, upcoming, archived
  if (client.cancelledBookings) {
    // No-tier scenario: every booking was cancelled (deposit recaptured →
    // excluded from GBV). They land in the archived section, matching the
    // production BookingsMapper categorization for cancelled stays.
    past = []
    upcoming = []
    archived = buildCancelledArchived(client)
  } else {
    // Auto-generate completed bookings to reconcile to gbv.
    const totalBookings = client.bookingCount || 3
    const baseUpcoming = totalBookings >= 6 ? 2 : 1
    const upcomingCount = client.hasUpcoming === false ? 0 : baseUpcoming
    const archivedCount = totalBookings >= 12 ? 3 : totalBookings >= 6 ? 1 : 0
    const pastCount = Math.max(1, totalBookings - upcomingCount - archivedCount)

    past = buildPastBookings(client, pastCount, effectiveGbv)
    upcoming = buildUpcomingBookings(client, upcomingCount, currentTier)
    archived = buildArchivedBookings(client, archivedCount)
  }

  // Earnings totals are gross-value-aligned (mirrors EarningsMapper in
  // roverdotcom/web), so they reconcile against the GBV-denominated tier
  // thresholds shown in the progress bar. Per-booking sitter earnings still
  // live on each booking's `earnings` field.
  const completedAmount = effectiveGbv
  const pendingAmount = upcoming.reduce((s, b) => s + parseFloat(b.price.amount), 0)

  const tiers = buildTierStates(effectiveGbv, pendingAmount)
  const callout = calloutFor(client, effectiveGbv, pendingAmount)

  return {
    requester: {
      displayName: client.displayName,
      pets: client.subtitleText, // formatted pet names from contacts.js
      photo: client.imageUrl ?? peopleImages.owen,
      isActive: true,
    },
    progress: {
      heading: headingFor(effectiveGbv),
      tiers,
      callout,
      earnings: {
        completed: money(completedAmount),
        pending: money(pendingAmount),
      },
    },
    bookings: { upcoming, past, archived },
  }
}
