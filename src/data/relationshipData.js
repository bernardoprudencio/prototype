// Graduated take-rate (Canada) — mirrors roverdotcom/web
// src/aplaceforrover/conversations/take_rates/constants.py.
// `sitterShare` is the provider earnings percentage (1 - rover fee).
// `roverFeePercentage` is misnamed in production: it actually carries the
// sitter's earnings share (e.g. "0.70" = "Earn 70%"). See the in-code comment
// in TierStatus.tsx.

import { CLIENTS } from './contacts'
import { peopleImages } from '../assets/images'
import { PROTO_TODAY } from './owners'
import {
  LEDGER_SECTION_TITLE, SUBTOTAL, YOUR_EARNINGS, rateMultiplier,
  RECURRING_SCHEDULE_TITLE, RECURRING_UNIT_SUFFIX, WEEKLY_PREFIX, WEEKLY_SUFFIX,
  SUBTOTAL_THIS_WEEK, SUBTOTAL_PER_WEEK, PAID_EACH_TUESDAY,
  YOUR_EARNINGS_THIS_WEEK, RECURRING_ROVER_CARD_INFO,
} from './bookingDetailsCopy'
import { lockedRatesFor, SERVICE_STATE_KEY } from './lockableRates'
import { DEFAULT_SERVICE_STATES, SERVICE_STATE } from './sitterServices'

// ── isRecurringClient ────────────────────────────────────────────────────────
// Production derives recurring-ness from FK presence:
// `recurring_billing_relationship_id is not None`
// (conversations/models/conversation.py:632-633). The prototype's stand-in for
// that FK is the client's `recurringSchedule` block, which is present on
// exactly owen, james and sarah and absent on the other seven clients
// (contacts.js).
//
// This is a *client*-level question ("does a recurring relationship exist?"),
// which is only the right input for deciding whether to build a recurring-week
// booking at all. It is NOT the input for the conversation screen's CTA fork:
// production's `self.conv.is_recurring` is per-conversation, and a recurring
// client's one-off stays are plain non-recurring conversations. That fork reads
// `booking.isRecurring` instead — see ConversationScreen.jsx.
export const isRecurringClient = (client) => Boolean(client?.recurringSchedule)

export const TIERS = [
  { tierName: 'Tier 1', threshold: 499,      sitterShare: 0.70 },
  { tierName: 'Tier 2', threshold: 999,      sitterShare: 0.85 },
  { tierName: 'Tier 3', threshold: Infinity, sitterShare: 0.90 },
]

// Standard Rover take rate outside the alt-monetization rollout: the sitter
// keeps 80% of the service subtotal. Tier shares only exist inside the test.
const BASELINE_SHARE = 0.80

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const fmt = (d) => `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`

// Production's MONTH_DAY_WEEK_MED (`"D, M d"`, l10n/formats/en_US/formats.py)
// as used by the booking-details service summary: weekday abbreviation, month
// abbreviation, zero-padded day, and no year.
const SHORT_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const fmtLong = (d) =>
  `${SHORT_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`

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

// A bare rate amount — the granular locked-rates surfaces hold numbers, not
// Money objects, because the modal edits them as whole dollars.
export const formatRateAmount = (n) => formatCAD(Number(n) || 0)

const money = (amount) => ({ amount: amount.toFixed(2), currencyIso: 'CAD' })

// ── Service catalog ───────────────────────────────────────────────────────────
// `serviceIcon` keys match rover-icons.css class suffixes. These are the
// browsable services per roverdotcom/web :: services/constants.py. Training
// and grooming are intentionally excluded — the production view 404s
// relationship pages with no browsable conversations
// (RelationshipProgressScreenView), so they're never shown here either.
export const SERVICES = {
  dog_walking:    { name: 'Dog walking',    icon: 'walking',     daily: 25, span: 1, multiDay: false },
  dog_daycare:    { name: 'Daycare',        icon: 'daycare',     daily: 45, span: 1, multiDay: false },
  drop_in_visits: { name: 'Drop-in visit',  icon: 'drop-in',     daily: 30, span: 1, multiDay: false },
  boarding:       { name: 'Boarding',       icon: 'sitter-home', daily: 70, span: 3, multiDay: true  },
  house_sitting:  { name: 'House sitting',  icon: 'homevists',   daily: 65, span: 3, multiDay: true  },
}

const SERVICE_KEYS = Object.keys(SERVICES)

// ── Per-client service pool ───────────────────────────────────────────────────
// The relationship page's Rates section splits the catalogue into "Previously
// booked" / "Not booked" from the client's actual bookings
// (RelationshipPage.jsx builds `bookedServiceKeys` from upcoming ∪ past ∪
// archived). Generating each booking's service as
// `SERVICE_KEYS[seed % SERVICE_KEYS.length]` spread a client with several
// bookings across all five browsable services, which made that split say
// nothing: every client had booked everything.
//
// Real relationships are narrow — an owner comes back for the same one or two
// services — so each client gets a pool of at most two service keys and every
// generator draws from it. Everything downstream of a booking's service
// (price, ledger rows, the inbox thread's service label) moves with it.
//
// SERVICES lists the browsable catalogue, not what THIS sitter offers. A
// generated booking for a service the sitter never turned on would put a row
// under "Previously booked" that reads "Inactive service" — plausible in
// production (a sitter can retire a service they used to offer) but noise as a
// default. So the derived candidates are the intersection with the sitter's own
// active services, which means crossing the two service-key namespaces through
// SERVICE_STATE_KEY: DEFAULT_SERVICE_STATES speaks `doggy_daycare` / `drop_in`,
// this file speaks `dog_daycare` / `drop_in_visits` (CLAUDE.md, "Two service-key
// namespaces"). With the shipped defaults that leaves dog_daycare,
// drop_in_visits and boarding, in SERVICES key order.
//
// These are the *defaults*, deliberately, not the live `serviceStates` dev
// flag: booking history is generated once per client and must not reshuffle
// when the sitter deactivates a service mid-session.
const OFFERED_SERVICE_KEYS = (() => {
  const offered = SERVICE_KEYS.filter(
    k => DEFAULT_SERVICE_STATES[SERVICE_STATE_KEY[k]] !== SERVICE_STATE.INACTIVE,
  )
  // A preset that turns everything off would otherwise leave nothing to book.
  return offered.length > 0 ? offered : SERVICE_KEYS
})()

// Services a client is booked for by hand, which the pool has to own or the
// booked group grows a third entry behind its back. Both are the demo stays in
// buildUpcomingBookings below: owen's active 4-night boarding and lena's paid
// boarding, the one that makes the locked-rates surfaces reachable.
// lauren is pinned to both of her services rather than one: the user-testing
// scenario names them ("drop-in visits most weeks, house sitting when they
// travel"), and the pool caps at two, so this IS her whole pool — her generated
// history can never wander into a third service.
const PINNED_SERVICE_KEYS = {
  owen: ['boarding'],
  lena: ['boarding'],
  lauren: ['drop_in_visits', 'house_sitting'],
}

// Memoised per client id so all three generation sites (past, upcoming,
// archived) agree — they are called from different places and must not derive
// the pool independently.
const servicePoolCache = new Map()

const servicePoolFor = (client) => {
  const cached = servicePoolCache.get(client.id)
  if (cached) return cached

  const pool = []
  const add = (key) => { if (key && !pool.includes(key)) pool.push(key) }

  // First the keys that are not ours to choose. RECURRING_SERVICE_KEY is
  // declared further down (its comment belongs with buildRecurringWeekBooking);
  // the reference resolves at call time, not at module init.
  if (isRecurringClient(client)) add(RECURRING_SERVICE_KEY)
  ;(PINNED_SERVICE_KEYS[client.id] ?? []).forEach(add)

  // Hand-authored history wins outright: `cancelledBookings` in contacts.js
  // already names 1–2 services per client (priya is the widest — dog_walking
  // plus drop_in_visits), and buildCancelledArchived bills each entry off its
  // own serviceKey, so the pool has to report them rather than pick.
  if (client.cancelledBookings) {
    const authored = []
    client.cancelledBookings.forEach(b => {
      if (!authored.includes(b.serviceKey)) authored.push(b.serviceKey)
    })
    authored.slice(0, 2).forEach(add)
    servicePoolCache.set(client.id, pool)
    return pool
  }

  // Otherwise derive: one or two services, off the same deterministic hash the
  // generators use, walking OFFERED_SERVICE_KEYS from a per-client offset so
  // the picks can never collide.
  const want = Math.max(pool.length, 1 + (hash(client.id, 7) % 2))
  const start = hash(client.id, 13) % OFFERED_SERVICE_KEYS.length
  for (let i = 0; pool.length < Math.min(want, 2) && i < OFFERED_SERVICE_KEYS.length; i++) {
    add(OFFERED_SERVICE_KEYS[(start + i) % OFFERED_SERVICE_KEYS.length])
  }

  servicePoolCache.set(client.id, pool)
  return pool
}

// ── Booking-details Starts/Ends presentation ────────────────────────────────
// Production formats times `g:i A` (service_summary.py) and prints each half's
// date as MONTH_DAY_WEEK_MED. The overnight services have an agreed drop-off
// and pick-up, so both halves carry a concrete time; the daytime services are
// booked as a window, which production renders as a "Flexible start time"
// chip plus the window's opening time (service_summary.py:95-96, :300).
// `unit` is the subtitle chip's noun ("3 nights", "1 walk").
const SERVICE_DETAIL = {
  dog_walking:    { start: '11:00 AM', end: '1:00 PM',  unit: 'walk',  flexible: true },
  dog_daycare:    { start: '8:00 AM',  end: '6:00 PM',  unit: 'day'  },
  drop_in_visits: { start: '11:00 AM', end: '1:00 PM',  unit: 'visit', flexible: true },
  boarding:       { start: '9:00 AM',  end: '11:00 AM', unit: 'night' },
  house_sitting:  { start: '5:00 PM',  end: '9:00 AM',  unit: 'night' },
}

// Every booking needs these: BookingDetailsScreen is reachable from any
// conversation thread, so the Starts/Ends columns and the subtitle chip must
// resolve for past and archived bookings too — not just the one demo booking
// that carries a ledger.
//
// RECURRING VARIANT (`opts.schedules`). A recurring conversation is dispatched
// to a RecurringNonContiguousServiceSummaryBuilder subclass rather than the
// contiguous one (service_summary.py:752-755), and that builder replaces the
// Starts/Ends block with a *schedule section*: `build_schedule_section()`
// (:397-420) emits SCHEDULE_TITLE plus one ScheduleItem(day, times) per service
// day. For a week already under way the subclass is
// OngoingRecurringSummaryBuilder, whose title is "This week's service happens
// on" (:467-468). The subtitle also gains the "this week" suffix (:429-431).
//
// The week window is still carried as startLabel/endLabel so any consumer that
// wants a date range has one; the details screen branches on `scheduleTitle`.
const detailFields = (start, end, serviceKey, span, opts = {}) => {
  const d = SERVICE_DETAIL[serviceKey] ?? SERVICE_DETAIL.boarding
  if (opts.schedules) {
    return {
      startLabel: fmtLong(start),
      endLabel: fmtLong(end),
      scheduleTitle: RECURRING_SCHEDULE_TITLE,
      schedules: opts.schedules,
      unitCount: span,
      unitLabel: d.unit,
      unitSuffix: RECURRING_UNIT_SUFFIX,
    }
  }
  return {
    startLabel: fmtLong(start),
    endLabel: fmtLong(end),
    startTime: d.start,
    endTime: d.end,
    unitCount: span,
    unitLabel: d.unit,
    ...(d.flexible ? { flexibleStartTime: true } : {}),
  }
}

// ── Booking state: payment gates + status block ──────────────────────────────
// Two consumers, one derivation, because production derives both from the same
// place — the stay's status and dates.
//
// Payment: gates 3 and 5 of `_get_lock_rates_toggle` (price_ledger.py:1725-1727)
// need `financial_calculator.is_paid()` and a stay that is not cancelled. Also
// feeds BookingDetailsScreen's `_is_collapsed` ledger check.
//
// Status: `BookingStatusMapper.get_conversation_status()` (booking_status.py).
// Only the provider-side, non-training, non-grooming branches are reachable
// here. `serviceStatus` stands in for the stay status, so derive the key rather
// than hand-setting it — an unkeyed booking used to default to 'confirmed' and
// claim "This booking is paid and confirmed" on an unpaid request.
//
//   no_service_deposit        no deposit ever taken. An old request that was
//                             never booked has no stay, so the provider sees
//                             `_get_inactive_request_status` → 'archived'
//                             (booking_status.py:174-176); an explicitly
//                             cancelled booking had a stay → STAY_STATUS_CANCELLED
//                             → 'cancelled' (:149-150). Callers pass which.
//   pending_service_deposit   accepted but unpaid, so there is no stay yet:
//                             `_get_no_stay_provider_status` → is_pending_status()
//                             with the provider as request creator →
//                             'waitingForPayment' (:198-201).
//   completed_service_deposit `_get_ongoing_stay_status` (:360-406) — starts in
//                             the future → 'confirmed'; starts later today →
//                             'confirmedSameDay'; under way → 'ongoing'; already
//                             ended → 'complete' (STAY_STATUS_COMPLETED, :146).
//                             Production shows 'leaveFeedback' instead while the
//                             stay sits in pending-reviews and is still ratable
//                             by the sitter; ratability is not modelled here.
//
// `isOngoing` / `isCompleted` fall out of the same comparison and gate
// BookingDetailsScreen's Additional information rows (`_is_stay_active`).
//
// `statusUnit` is `alternative_rate_unit_translated`, pluralised when
// `num_units > 1` (booking_status.py:379-381) — that resolves to the service's
// price unit (services/constants.py:308-316: night / day / visit / walk), which
// SERVICE_DETAIL above already carries.
const startOfDay = (d) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c }

// `earliest_datetime > today` (booking_status.py:391-394) — a stay starting
// later on today's date is still "confirmed", not yet "ongoing".
const startsLaterToday = (start, timeLabel) => {
  const now = new Date()
  const m = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(timeLabel ?? '')
  if (!m) return false
  const t = new Date(start)
  t.setHours((Number(m[1]) % 12) + (/pm/i.test(m[3]) ? 12 : 0), Number(m[2]), 0, 0)
  return t > now
}

const statusFields = (serviceStatus, start, end, serviceKey, span, opts = {}) => {
  const d = SERVICE_DETAIL[serviceKey] ?? SERVICE_DETAIL.boarding
  const base = {
    isPaid: false,
    isCancelled: false,
    hasModification: false,
    isOngoing: false,
    isCompleted: false,
    statusUnit: span > 1 ? `${d.unit}s` : d.unit,
  }

  if (serviceStatus === 'no_service_deposit') {
    return { ...base, isCancelled: true, statusKey: opts.statusKey ?? 'cancelled' }
  }
  if (serviceStatus !== 'completed_service_deposit') {
    return { ...base, statusKey: 'waitingForPayment' }
  }

  const today = startOfDay(new Date())
  const s = startOfDay(start)
  const e = startOfDay(end)
  if (s > today) return { ...base, isPaid: true, statusKey: 'confirmed' }

  // Recurring branch — booking_status.py:400-404, the tail of
  // `_get_ongoing_stay_status()`. It sits *after* the future-start check (which
  // returns ConfirmedStatus for recurring too, :382-383) and after the same-day
  // check, and *before* the plain OngoingStatus fallthrough:
  //
  //   if self.conv.is_recurring:
  //       if self.conv.recurring_billing_relationship.service_skipped_this_week:
  //           return statuses.SkippedWeekStatus()
  //       return statuses.OngoingRecurringStatus()
  //
  // `skippedThisWeek` is passed in rather than invented here, mirroring the fact
  // that production reads it off the RBR row. Note the recurring branch has no
  // `complete` state: each Conversation IS one week, and the week containing
  // today can never have ended.
  if (opts.recurring) {
    return {
      ...base,
      isPaid: true,
      isOngoing: true,
      statusKey: opts.skippedThisWeek ? 'skippedWeek' : 'ongoingRecurring',
    }
  }

  if (e < today) return { ...base, isPaid: true, isCompleted: true, statusKey: 'complete' }
  if (s.getTime() === today.getTime() && startsLaterToday(start, d.start)) {
    return { ...base, isPaid: true, statusKey: 'confirmedSameDay' }
  }
  return { ...base, isPaid: true, isOngoing: true, statusKey: 'ongoing' }
}

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

// The machine-readable half of a booking's dates. `dates` above is the display
// string; every builder also emits this pair because ModifyBookingScreen seeds
// its date inputs off `startDate` / `endDate`, and the conversation screen can
// route any conversation's opk to that screen.
const isoKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

// ── Rate rows ────────────────────────────────────────────────────────────────
// One builder behind every ledger row and every generated price, so a booking's
// subtotal is the CONSEQUENCE of its rate rows instead of a number invented
// alongside them.
//
// Row shape is production's `_get_rate_price()` (price_ledger.py:620-663): one
// BookingAddOn per pet, titled with the pet's name, described by the add-on
// type, with the "$X × N nights" multiplier as a sub-line.
//
// Pet 0 bills at `standard-rate`, pets 1..n at `additional-dog` — looked up BY
// SLUG, never by index. The rate list is ordered per service
// (lockableRates.js RATE_TABLE), so position 1 is `additional-dog` for boarding
// only: it is `holiday-rate` for house sitting, `long-walk` for dog walking and
// `long-drop-in` for drop-in visits.
//
// Options:
//   units      number  nights / walks / visits being billed
//   unitLabel  string  overrides the rate's own price unit in the multiplier
//   pets       array   the billed pets in order; `{ name }` or `{ petName }`
//   perUnit    number  overrides the standard rate's price. The generators
//                      jitter a round rate off the client's locked one and
//                      hand it back in here.
//   amounts    map     slug → price, overriding the locked snapshot. The
//                      recurring week bills off its own `pricing` block.
//   extraRows  array   already-priced rows appended after the pets:
//                      `{ title, pricePerUnit, unit }` (the recurring add-ons)
//
// Returns `{ rows, assignments, perUnit, subtotal }`. `assignments` is the
// pet → rate pairing behind the rows, which is what `buildModifyFields` needs:
// its rate rows carry the same pairing in a different shape.
export const buildRateRows = (client, serviceKey, {
  units = 1, unitLabel, pets, perUnit, amounts, extraRows = [],
} = {}) => {
  const rates = lockedRatesFor(client, serviceKey)?.rates ?? []
  const billed = pets ?? client?.pets ?? []
  const standard = rates.find(r => r.slug === 'standard-rate') ?? rates[0] ?? null
  // Fall back to the standard rate when a service has no additional-dog row at
  // all, so extra pets bill at a rate that means something rather than at
  // whatever happens to sit second in the list.
  const additional = rates.find(r => r.slug === 'additional-dog') ?? standard

  const priceOf = (rate, i) =>
    (i === 0 && perUnit != null) ? perUnit : (amounts?.[rate.slug] ?? rate.lockedPrice)

  const assignments = standard
    ? billed.map((p, i) => {
        const rate = i === 0 ? standard : additional
        return { pet: p, rate, pricePerUnit: priceOf(rate, i) }
      })
    : []

  const multiplier = (price, unit) =>
    rateMultiplier(`$${price}`, units, unitLabel ?? unit, `${unitLabel ?? unit}s`)

  const rows = [
    ...assignments.map(({ pet, rate, pricePerUnit }) => ({
      title: pet.name ?? pet.petName,
      description: rate.label,
      text: [multiplier(pricePerUnit, rate.unit)],
      amount: money(pricePerUnit * units),
    })),
    ...extraRows.map(r => ({
      title: r.title,
      text: [multiplier(r.pricePerUnit, r.unit)],
      amount: money(r.pricePerUnit * units),
    })),
  ]

  // Summed from the same per-unit numbers the rows were priced from, so the
  // subtotal reconciles to `rows` by construction rather than by agreement.
  const subtotal = [
    ...assignments.map(a => a.pricePerUnit),
    ...extraRows.map(r => r.pricePerUnit),
  ].reduce((s, n) => s + n * units, 0)

  return { rows, assignments, perUnit: standard ? priceOf(standard, 0) : 0, subtotal }
}

// The client's locked standard rate for a service — the anchor every generated
// price is jittered off. Falls back to the service's list day rate if the
// service carries no lockable rows at all.
const standardRateFor = (client, serviceKey) => {
  const rates = lockedRatesFor(client, serviceKey)?.rates ?? []
  const standard = rates.find(r => r.slug === 'standard-rate') ?? rates[0]
  return standard?.lockedPrice ?? SERVICES[serviceKey].daily
}

// Rates stay whole dollars, and stay inside the add-on's country-config band —
// `minimum_service_add_on_prices` / `max_add_on_price`, carried on each rate as
// minPrice / maxPrice (lockableRates.js). The ceiling matters because the GBV
// nudge below solves for whatever rate closes the remaining gap, and an
// unreachable target would otherwise produce a $2,000 dog walk: a price the
// sitter could not have set in the first place, on a prototype whose rate rows
// are the thing under test. Clamping trades exact past-sum reconciliation to
// `client.gbv` for plausibility, which costs nothing on screen — the sum of
// past prices is never displayed (`completedAmount` reads the gbv directly, and
// `pendingAmount` sums only upcoming bookings).
const clampRate = (client, serviceKey, n) => {
  const rates = lockedRatesFor(client, serviceKey)?.rates ?? []
  const standard = rates.find(r => r.slug === 'standard-rate') ?? rates[0]
  const floor = standard?.minPrice || 1
  const ceiling = standard?.maxPrice ?? Infinity
  return Math.min(ceiling, Math.max(floor, Math.round(n)))
}

// The round standard rate whose subtotal lands closest to `target`. A subtotal
// is linear in the standard rate — `units × rate + fixed`, where `fixed` is the
// additional pets and add-ons — so the closest round rate is a division, not a
// search. Used by the GBV nudge and by the authored cancelled-booking prices.
const rateForTarget = (client, serviceKey, opts, target) => {
  const { subtotal: fixed } = buildRateRows(client, serviceKey, { ...opts, perUnit: 0 })
  const units = opts.units || 1
  return clampRate(client, serviceKey, (target - fixed) / units)
}

// ── The price ledger ─────────────────────────────────────────────────────────
// `PriceLedgerMapper.map()` builds a ledger for EVERY conversation — production
// has no "some bookings have prices" state. A sitter's ledger ends at Subtotal
// + Your earnings: no service fee, no tax, no due-now, because
// `_get_requester_prices()` returns [] for providers.
//
// `booking.rateRows` is the Services & Charges section verbatim, put on the
// booking by whichever builder priced it, so the subtotal here is the same sum
// that produced `booking.price`.
export const buildLedger = (client, booking, share) => {
  // The one early-out: `_get_price_sections()` returns [] outright when
  // `financial_calculator.is_cancelled_with_full_refund()` (price_ledger.py:439-440).
  //
  // Currently UNREACHABLE, and encoded anyway so the shape stays honest if such
  // a booking is ever added: the prototype models cancelled and archived
  // bookings as requests that were never booked (`no_service_deposit`, no
  // stay), and the production predicate needs a stay that was cancelled and
  // fully refunded.
  if (booking.hasStay && booking.isCancelled && booking.refundedInFull) return { sections: [] }

  const rows = booking.rateRows ?? buildRateRows(client, booking.serviceKey, {
    units: booking.unitCount ?? 1,
  }).rows
  const subtotal = rows.reduce((s, r) => s + parseFloat(r.amount.amount), 0)

  // `_get_total_price_title()` (:1069-1080) and `_get_total_earnings()`
  // (:511-514) both fork on `conv.is_recurring`.
  const subtotalTitle = booking.isRecurring ? SUBTOTAL_THIS_WEEK : SUBTOTAL
  const earningsTitle = booking.isRecurring ? YOUR_EARNINGS_THIS_WEEK : YOUR_EARNINGS

  // The earnings row is deliberately `share × subtotal`, NOT `booking.earnings`.
  // Archived bookings carry `earnings: $0` because they realised no GBV, but
  // production's `_get_total_earnings()` computes off the request's price
  // regardless of whether it was ever paid — so the ledger shows what the stay
  // would have earned. The divergence from `booking.earnings` is intentional
  // and production-faithful.
  return {
    sections: [
      { title: LEDGER_SECTION_TITLE, items: rows },
      { items: [{ title: subtotalTitle, amount: money(subtotal), style: 'bold' }] },
      { items: [{
          title: earningsTitle,
          amount: money(share * subtotal),
          style: 'bold',
          action: 'earnings',
        }] },
    ],
  }
}

// ── Plausible booking sizes ──────────────────────────────────────────────────
// The ceiling on how many units one past booking may absorb. Real booking data
// varies duration far more than it varies rate, so the GBV nudge below reaches
// for units first and only fine-tunes the rate; these are the numbers past which
// a sitter reading the list would blink. Two weeks is the outside for an
// overnight stay; the daytime services run a couple of weeks of daily visits or
// a fortnight of walks.
const MAX_UNITS = {
  boarding:       14,
  house_sitting:  14,
  dog_daycare:    10,
  drop_in_visits: 14,
  dog_walking:    10,
}

// How far a booking's rate may travel from the client's locked standard rate
// while the nudge is fine-tuning it. The absolute [minPrice, maxPrice] band from
// country config still applies on top, via clampRate.
const RATE_BAND = 0.25

// ── Booking generator ─────────────────────────────────────────────────────────
// Walks dates backwards from PROTO_TODAY and produces booking objects whose
// summed `price` values reconcile to the client's gbv.
//
// That sum is on screen: RelationshipPage renders `progress.earnings.completed`
// (which is `client.gbv`) as the section header directly above this list, so a
// list that does not add up to it is two numbers disagreeing on one screen.
//
// The reconciliation runs on THREE levers, in order of how much a sitter would
// notice them:
//   1. units   — duration, the lever real booking data actually varies. Capped
//                per service by MAX_UNITS.
//   2. rate    — fine-tuning only, inside RATE_BAND of the client's locked
//                standard rate and always inside the country-config band.
//   3. count   — if the whole roster still cannot absorb the gbv, another past
//                booking is added rather than one being inflated.
//
// `shareFor(gbv)` is passed in rather than a tier object: inside the rollout the
// share varies per booking with the running GBV, outside it every booking pays
// the flat BASELINE_SHARE — the builder never has to know which world it is in.
const buildPastBookings = (client, count, targetGbv, shareFor) => {
  if (count === 0) return []

  // Everything a booking is before it is priced: which service, at roughly what
  // rate, with what the additional pets add on top. Resolved for every booking
  // up front so the roster's total capacity is known before any of it is spent.
  const planFor = (i) => {
    const seed = hash(client.id, i + 1)
    const pool = servicePoolFor(client)
    const serviceKey = pool[seed % pool.length]
    const jitter = ((seed % 41) - 20) / 100 // -0.20 .. +0.20
    const rate = clampRate(client, serviceKey, standardRateFor(client, serviceKey) * (1 + jitter))
    return {
      seed,
      serviceKey,
      rate,
      // The fixed per-unit cost of every pet after the first.
      extras: buildRateRows(client, serviceKey, { units: 1, perUnit: 0 }).subtotal,
      lo: clampRate(client, serviceKey, rate * (1 - RATE_BAND)),
      hi: clampRate(client, serviceKey, rate * (1 + RATE_BAND)),
      maxUnits: MAX_UNITS[serviceKey],
    }
  }

  const plans = []
  for (let i = 0; i < count; i++) plans.push(planFor(i))

  // Prefer another booking over an improbable one: a client who has spent
  // thousands has booked more often, not once at an impossible price. Capped so
  // a pathological gbv can never generate an unbounded list.
  const MAX_EXTRA_BOOKINGS = 24

  // Capacity is measured at the plan's OWN jittered rate rather than the top of
  // its band, and then discounted: the allocator wobbles each booking's share
  // ±25% and rounds units to whole days, so what a plan realistically absorbs
  // is well under `maxUnits × hi`. Counting that theoretical maximum let the
  // guard pass on a roster that then underspent — which surfaced once each
  // client's bookings were narrowed to one or two services (servicePoolFor
  // above), because the rolling remainder can land on a tail booking whose
  // service is rate-capped low. Under-counting capacity only ever adds a
  // booking, which is the lever this builder already prefers.
  const REALISED_CAPACITY = 0.75
  const capacityOf = (p) => p.maxUnits * (p.rate + p.extras) * REALISED_CAPACITY
  if (targetGbv > 0) {
    let capacity = plans.reduce((s, p) => s + capacityOf(p), 0)
    while (capacity < targetGbv && plans.length < count + MAX_EXTRA_BOOKINGS) {
      const p = planFor(plans.length)
      plans.push(p)
      capacity += capacityOf(p)
    }
  }

  const bookings = []
  const cursor = new Date(PROTO_TODAY)
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() - 4) // start a few days before "today"

  let runningGbv = 0

  plans.forEach((p, i) => {
    const { seed, serviceKey } = p
    const svc = SERVICES[serviceKey]

    let units
    let perUnit
    if (targetGbv > 0) {
      // Fair share of what is left, recomputed every booking so a booking that
      // could not absorb its share rolls the remainder forward rather than
      // stranding it on the last one.
      const left = plans.length - i
      // Wobble each share ±25% on the booking's own seed so the list does not
      // read as N identical totals. The last booking takes the exact remainder,
      // and every share is recomputed from what is actually left, so the wobble
      // costs nothing in reconciliation.
      const wobble = left > 1 ? 1 + (((seed % 51) - 25) / 100) : 1
      const share = Math.max(1, ((targetGbv - runningGbv) / left) * wobble)
      units = Math.min(p.maxUnits, Math.max(1, Math.round(share / (p.rate + p.extras))))
      // Then the closest round rate at that duration — subtotal is linear in the
      // rate, so this is a division, not a search — held inside the band.
      perUnit = Math.min(p.hi, Math.max(p.lo, Math.round(share / units - p.extras)))
    } else {
      // No gbv to reconcile to: multi-day services pick 1-4 nights on the seed.
      units = svc.multiDay ? 1 + (seed % 4) : 1
      perUnit = p.rate
    }

    // The date range IS the unit count — a 10-walk booking runs a walk a day, a
    // 6-night stay runs six nights — so `unitCount` and the "$X × N nights"
    // multiplier can never disagree with the dates above them.
    const end = new Date(cursor)
    const start = new Date(cursor)
    start.setDate(end.getDate() - (units - 1))

    const { rows: rateRows, subtotal: price } = buildRateRows(client, serviceKey, {
      units, unitLabel: SERVICE_DETAIL[serviceKey].unit, perUnit,
    })
    runningGbv += price

    // Earnings: tier the booking landed in (based on cumulative gbv at that point).
    const cumulativeAfter = runningGbv
    const earnings = price * shareFor(cumulativeAfter)

    bookings.push({
      id: `${client.id}-past-${i + 1}`,
      price: money(price),
      dates: units === 1 ? `${fmt(start)}, ${start.getFullYear()}` : fmtRange(start, end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      serviceKey,
      rateRows,
      // The generated standard rate this booking was priced from. buildModifyFields
      // must seed the rate selector with it, not with the locked snapshot, or the
      // modify screen opens showing a per-unit rate the ledger never charged.
      perUnit,
      earnings: money(earnings),
      serviceStatus: 'completed_service_deposit',
      conversationOpk: `${client.id}-conv-past-${i + 1}`,
      startDate: isoKey(start),
      endDate: isoKey(end),
      ...statusFields('completed_service_deposit', start, end, serviceKey, units),
      ...detailFields(start, end, serviceKey, units),
    })

    // Step cursor backwards: the booking's own days + a 2-6 day gap.
    const gap = 2 + (seed % 5)
    cursor.setDate(cursor.getDate() - units - gap)
  })

  return bookings
}


// `share` is the sitter's earnings fraction as a plain number, so this builder
// never has to know whether tiers exist.
const buildUpcomingBookings = (client, count, share) => {
  const out = []

  // Owen gets one demo "active" stay — a 4-night boarding that started 2 days
  // before PROTO_TODAY, mirroring production's `active_stay` state. Mapped to
  // serviceStatus 'completed_service_deposit' so it doesn't get categorized as
  // pending in getInboxThreads.
  if (client.id === 'owen' && count > 0) {
    const start = new Date(PROTO_TODAY); start.setHours(0,0,0,0); start.setDate(start.getDate() - 2)
    const end   = new Date(PROTO_TODAY); end.setHours(0,0,0,0);   end.setDate(end.getDate() + 1)
    const svc = SERVICES.boarding
    const span = 4
    // Priced off owen's locked boarding rates, like every other booking: the
    // total is the sum of the pets' rate rows, never a figure set beside them.
    const { rows: rateRows, subtotal: price } = buildRateRows(client, 'boarding', {
      units: span, unitLabel: SERVICE_DETAIL.boarding.unit,
    })
    out.push({
      id: `${client.id}-up-active`,
      price: money(price),
      dates: fmtRange(start, end),
      startDate: isoKey(start),
      endDate: isoKey(end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      serviceKey: 'boarding',
      rateRows,
      earnings: money(price * share),
      serviceStatus: 'completed_service_deposit',
      conversationOpk: `${client.id}-conv-up-active`,
      ...statusFields('completed_service_deposit', start, end, 'boarding', span),
      ...detailFields(start, end, 'boarding', span),
    })
  }

  // Lena gets one demo paid boarding booking, which is what makes the locked
  // rates surfaces reachable: production gates the lock toggle on the
  // conversation being `is_paid()`, browsable and not cancelled. Priced at her
  // *locked* rates (see lockableRates.js) rather than the sitter's defaults —
  // 3 nights x ($38 standard + $28 additional dog).
  //
  // Every booking now carries a `ledger` — production builds one for every
  // conversation (see buildLedger above) — but this is the one whose figures
  // are pinned: LOCKED_PRICE_OVERRIDES in lockableRates.js fixes her boarding
  // rates at $38 / $28 so the locked-rates demo always shows the same numbers.
  if (client.id === 'lena' && count > 0) {
    const start = new Date(PROTO_TODAY); start.setHours(0,0,0,0); start.setDate(start.getDate() + 6)
    const end   = new Date(PROTO_TODAY); end.setHours(0,0,0,0);   end.setDate(end.getDate() + 9)
    // Paid a week before "today" — derived from PROTO_TODAY, never hardcoded.
    const paid  = new Date(PROTO_TODAY); paid.setHours(0,0,0,0);  paid.setDate(paid.getDate() - 7)
    const nights = 3
    // First pet bills at the standard rate, each additional pet at the
    // additional-dog rate — the same shape as the BookingAddOn rows behind
    // production's ledger. 3 nights × ($38 standard + $28 additional dog).
    const { rows: rateRows, subtotal: price } = buildRateRows(client, 'boarding', {
      units: nights, unitLabel: SERVICE_DETAIL.boarding.unit,
    })

    out.push({
      id: `${client.id}-up-locked`,
      price: money(price),
      dates: fmtRange(start, end),
      startDate: isoKey(start),
      endDate: isoKey(end),
      serviceName: SERVICES.boarding.name,
      serviceIcon: SERVICES.boarding.icon,
      serviceKey: 'boarding',
      rateRows,
      earnings: money(price * share),
      serviceStatus: 'completed_service_deposit',
      conversationOpk: `${client.id}-conv-up-locked`,

      // ── Booking details page fields ──
      // Gating inputs for BookingDetailsScreen: a paid, unmodified,
      // uncancelled stay renders the ledger collapsed (`_is_collapsed`) and
      // shows the lock-rates switch (`_get_lock_rates_toggle`).
      ...statusFields('completed_service_deposit', start, end, 'boarding', nights),
      paidOn: fmt(paid),
      // The Starts/Ends columns need their own labels and times: `dates` is a
      // collapsed range ("Aug 25 to 28, 2026") that can't be split back apart.
      // See detailFields / SERVICE_DETAIL above.
      ...detailFields(start, end, 'boarding', nights),
    })
  }

  // Lauren gets the locked-rates user-testing request: a 5-night house sitting
  // stay priced BELOW the sitter's own rates. Her drop-in visits are already
  // locked (contacts.js `lockedServices`), house sitting is not — so this booking
  // is the one the tester is asked to lock, and the sheet must open seeded from
  // the request's own prices rather than from the sitter's defaults.
  //
  // `perUnit` is what carries the standard-rate override end to end: the ledger
  // prices from it here, `buildModifyFields` re-prices the rate selector from it,
  // and `useGranularRates`'s `requestAmounts` reads it back off
  // `modify.rateRows[].pricePerUnit` to seed the lock sheet. The additional-dog
  // override rides along on LOCKED_PRICE_OVERRIDES['lauren:house_sitting'].
  //
  // Paid rather than truly pending, deliberately: `isLockableConversation()`
  // (lockableRates.js) gates the whole rates surface on `booking.isPaid`, so an
  // unpaid request would render no rates row at all. The cost is that its inbox
  // thread reads 'upcoming' rather than 'pending'.
  if (client.id === 'lauren' && count > 0) {
    const start = new Date(PROTO_TODAY); start.setHours(0,0,0,0); start.setDate(start.getDate() + 9)
    const end   = new Date(PROTO_TODAY); end.setHours(0,0,0,0);   end.setDate(end.getDate() + 14)
    const paid  = new Date(PROTO_TODAY); paid.setHours(0,0,0,0);  paid.setDate(paid.getDate() - 1)
    const nights = 5
    // The override: the sitter's house sitting standard rate is $65
    // (lockableRates.js RATE_TABLE.house_sitting), Lauren's request is at $58.
    const perUnit = 58
    const { rows: rateRows, subtotal: price } = buildRateRows(client, 'house_sitting', {
      units: nights, unitLabel: SERVICE_DETAIL.house_sitting.unit, perUnit,
    })

    out.push({
      id: `${client.id}-up-request`,
      price: money(price),
      dates: fmtRange(start, end),
      startDate: isoKey(start),
      endDate: isoKey(end),
      serviceName: SERVICES.house_sitting.name,
      serviceIcon: SERVICES.house_sitting.icon,
      serviceKey: 'house_sitting',
      rateRows,
      perUnit,
      earnings: money(price * share),
      serviceStatus: 'completed_service_deposit',
      conversationOpk: `${client.id}-conv-up-request`,
      ...statusFields('completed_service_deposit', start, end, 'house_sitting', nights),
      paidOn: fmt(paid),
      ...detailFields(start, end, 'house_sitting', nights),
    })
  }

  const cursor = new Date(PROTO_TODAY)
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 5)

  // Generated upcoming bookings are *confirmed* one-time bookings, for the same
  // reason Lauren's request above is paid rather than truly pending:
  // `isLockableConversation()` gates the whole rates surface on `booking.isPaid`,
  // so a pending seed renders no rates row at all. Doing it by hand for one
  // booking left every generated one — including Lauren's own drop-in visit,
  // the service she already has locked — with no way to reach the control.
  // 'completed_service_deposit' plus a future start sends statusFields down its
  // `s > today` branch for `isPaid: true, statusKey: 'confirmed'`.
  //
  // Same cost as Lauren's, now paid across the board: no seeded booking is
  // 'pending_service_deposit' any more, so the Inbox "Pending" filter lists
  // nothing. threads.js still categorises one if a pending booking is re-seeded.
  //
  // Paid a week before "today", derived from PROTO_TODAY and never hardcoded.
  // Invariant across the loop, so it is computed once.
  const paidAt = new Date(PROTO_TODAY)
  paidAt.setHours(0, 0, 0, 0)
  paidAt.setDate(paidAt.getDate() - 7)

  for (let i = 0; i < count; i++) {
    const seed = hash(client.id, 100 + i)
    const pool = servicePoolFor(client)
    const serviceKey = pool[seed % pool.length]
    const svc = SERVICES[serviceKey]
    const span = svc.multiDay ? 1 + (seed % 4) : 1
    const start = new Date(cursor)
    const end = new Date(cursor)
    end.setDate(start.getDate() + (span - 1))

    // Same rule as the past bookings: jitter the round standard rate, then let
    // the rate rows decide the total.
    const jitter = ((seed % 31) - 15) / 100
    const perUnit = clampRate(client, serviceKey, standardRateFor(client, serviceKey) * (1 + jitter))
    const { rows: rateRows, subtotal: price } = buildRateRows(client, serviceKey, {
      units: span, unitLabel: SERVICE_DETAIL[serviceKey].unit, perUnit,
    })

    out.push({
      id: `${client.id}-up-${i + 1}`,
      price: money(price),
      dates: span === 1 ? `${fmt(start)}, ${start.getFullYear()}` : fmtRange(start, end),
      startDate: isoKey(start),
      endDate: isoKey(end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      serviceKey,
      rateRows,
      // The generated standard rate this booking was priced from. buildModifyFields
      // must seed the rate selector with it, not with the locked snapshot, or the
      // modify screen opens showing a per-unit rate the ledger never charged.
      perUnit,
      earnings: money(price * share),
      serviceStatus: 'completed_service_deposit',
      conversationOpk: `${client.id}-conv-up-${i + 1}`,
      ...statusFields('completed_service_deposit', start, end, serviceKey, span),
      paidOn: fmt(paidAt),
      ...detailFields(start, end, serviceKey, span),
    })

    cursor.setDate(cursor.getDate() + span + (3 + (seed % 6)))
  }

  return out
}

// ── The recurring week booking ───────────────────────────────────────────────
// Production has NO separate recurring details page: one route, one mapper set,
// one payload (ConversationDetailsMapper.map(),
// conversations/api/mappers/conversation.py). Recurring-ness is a per-mapper
// branch, and — critically — **each Conversation IS one week**. The recurring
// billing relationship cycles initial_conversation / active_conversation /
// next_conversation (recurring/models.py:238,244,250), so "the booking" behind a
// recurring conversation is that conversation's own week.
//
// The prototype's recurring conversations use the synthetic opk
// `${client.id}-conv-recurring` (see ConversationScreen / threads.js), which
// until now matched no booking at all — which is why the Details CTA was
// permanently disabled. This builder gives it a real one, so the existing
// `all.find(b => b.conversationOpk === effectiveOpk)` lookup resolves with no
// change to that lookup.
//
// Every `recurringSchedule` in contacts.js is a walk schedule (owen 60-min,
// james and sarah 30-min), which is also what threads.js labels the recurring
// thread ("Dog walking · repeats weekly").
const RECURRING_SERVICE_KEY = 'dog_walking'

const FULL_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

// Monday of the week containing PROTO_TODAY. getDay() is 0=Sunday, so
// (getDay() + 6) % 7 is the number of days back to Monday.
const mondayOfWeek = (from) => {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

// `skippedThisWeek` mirrors `rbr.service_skipped_this_week`
// (booking_status.py:401-402). Nothing in the prototype flips it yet; it is a
// parameter rather than a hardcoded false so the `skippedWeek` status can be
// exercised without touching the derivation.
export const buildRecurringWeekBooking = (client, share, skippedThisWeek = false) => {
  const tpl = client?.recurringSchedule
  if (!tpl) return null

  const weekStart = mondayOfWeek(PROTO_TODAY)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const svc = SERVICES[RECURRING_SERVICE_KEY]
  const visits = tpl.template.length

  // Per-visit price: every pet's rate plus every add-on, exactly as the
  // recurringSchedule.pricing block is shaped in contacts.js.
  const petRows = tpl.pricing.pets
  const addOnRows = tpl.pricing.addOns ?? []

  const unit = SERVICE_DETAIL[RECURRING_SERVICE_KEY].unit

  // One schedule row per service day, dated inside this week — production's
  // NonContiguousServiceDatesStringBuilder emits a real date per occurrence,
  // not a bare weekday name.
  const schedules = tpl.template.map((t) => {
    const idx = FULL_DAYS.indexOf(t.day)
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + ((idx + 6) % 7))
    return { day: fmtLong(d), times: [t.time] }
  })

  // Ledger rows come from the shared builder, the same as every other booking.
  // The week bills off its own `pricing` block rather than off the client's
  // locked snapshot, so the per-rate figures travel in as `amounts` (keyed by
  // the slug each pricing row already carries) and the 60-min add-on as an
  // extra row. `weeklyPrice` is the sum of those rows, never a figure set
  // beside them.
  const { rows: rateRows, subtotal: weeklyPrice } = buildRateRows(client, RECURRING_SERVICE_KEY, {
    units: visits,
    unitLabel: unit,
    pets: petRows,
    amounts: Object.fromEntries(petRows.map(p => [p.slug, p.ratePerWalk])),
    extraRows: addOnRows.map(a => ({ title: a.label, pricePerUnit: a.ratePerWalk, unit })),
  })

  // The owner is charged each Monday morning for the week ahead
  // (price_ledger.py:302-306), so this week's payment date is its Monday.
  const paidOn = fmt(weekStart)

  // Per-rate amounts this week is actually booked at, keyed by add-on slug.
  // One-off bookings carry the same figures on `modify.rateRows`; recurring
  // weeks have no modify block, so they publish the map directly. The granular
  // rates modal seeds from this, so the sheet opens on the ledger's numbers.
  // Currently unread: `passesGate` in useGranularRates.js closes recurring weeks
  // out of the granular flow. Retained deliberately, in case that gate reopens.
  const rateAmounts = {}
  ;[...petRows, ...addOnRows].forEach(r => {
    if (r.slug) rateAmounts[r.slug] = r.ratePerWalk
  })

  return {
    id: `${client.id}-recurring-week`,
    isRecurring: true,
    price: money(weeklyPrice),
    dates: fmtRange(weekStart, weekEnd),
    startDate: isoKey(weekStart),
    endDate: isoKey(weekEnd),
    // booking_card.py:80-82 PREFIXES "Weekly" onto the card's service title…
    serviceName: `${WEEKLY_PREFIX} ${svc.name}`,
    // …while service_summary.py:448-451 APPENDS it for the details page's
    // service-summary heading. Two production surfaces, two orders.
    serviceSummaryTitle: `${svc.name} ${WEEKLY_SUFFIX}`,
    serviceIcon: svc.icon,
    serviceKey: RECURRING_SERVICE_KEY,
    rateRows,
    rateAmounts,
    earnings: money(weeklyPrice * share),
    serviceStatus: 'completed_service_deposit',
    conversationOpk: `${client.id}-conv-recurring`,
    paidOn,
    ...statusFields(
      'completed_service_deposit', weekStart, weekEnd, RECURRING_SERVICE_KEY, visits,
      { recurring: true, skippedThisWeek },
    ),
    ...detailFields(weekStart, weekEnd, RECURRING_SERVICE_KEY, visits, { schedules }),
    // The recurring-ONLY extra section, kept off `ledger.sections` on purpose:
    // production appends it as a separate PriceSection after the standard ones
    // (price_ledger.py:504-507), so the details screen appends it too rather
    // than the ledger shape changing for everyone. Title from
    // `_get_total_price_per_week_title()` (:1097-1100), description from the
    // provider half of `_get_total_price_per_week()` (:1119-1123).
    weeklyTotal: {
      title: SUBTOTAL_PER_WEEK,
      description: PAID_EACH_TUESDAY,
      amount: money(weeklyPrice),
    },
  }
}

// ── One-time booking fields the Modify booking screen consumes ───────────────
// Shape (also documented for the ModifyBookingScreen author):
//
//   booking.modify = {
//     units:            number    // nights / walks / visits being modified
//     unitLabel:        string    // 'night' | 'day' | 'visit' | 'walk'
//     unitLabelPlural:  string
//     rateRows: [{                // one per pet — ServiceRateSelectorComponent
//       petName:        string    //   the row's left-hand label (:96)
//       slug:           string    //   add-on type slug, e.g. 'standard-rate'
//       label:          string    //   'Standard rate' | 'Additional dog rate'
//       pricePerUnit:   number    //   the EDITABLE value in the rate input
//       listPrice:      number    //   the sitter's profile rate, rendered as
//                                 //   `List price: {x}` (:69-80)
//       unit:           string    //   'night' | 'day' | 'visit' | 'walk'
//     }]
//     adjustments: []             // Extras and Adjustments rows. Always empty:
//                                 // penalty/waiver math is server-side
//                                 // (AdjustmentsListComponent) and out of scope
//     subtotal:        Money      // ModifyBookingFormLedger `subtotalPrice`
//     previousTotal:   Money      // ledger `oldSubtotalPrice` — equal to
//                                 //   subtotal on load; the screen recomputes
//                                 //   subtotal as rate rows are edited
//     amountOwed:      Money      // $0 while subtotal === previousTotal
//     earnings:        Money      // ledger `providerEarnings`
//   }
//
// Money is this file's `{ amount: '12.00', currencyIso: 'CAD' }`, formatted by
// the exported `formatMoney`.
//
// Present on every NON-recurring booking (production suppresses the whole rates
// and adjustments block when `isRecurring && hasStay` —
// ModifyBookingForm.utils.ts:74-89), and on all three lists, because the modify
// screen is reachable from any conversation.
//
// The figures are static mock data by design: production recomputes them with a
// server pricer round-trip on every field change (`checkPrice`,
// ModifyBooking.duck.ts), which is explicitly out of scope.
const buildModifyFields = (client, booking) => {
  const units = booking.unitCount ?? 1
  const d = SERVICE_DETAIL[booking.serviceKey] ?? SERVICE_DETAIL.boarding

  // Same pet → rate pairing the ledger uses, reshaped for the rate selector.
  // `pricePerUnit` is the rate the owner agreed to (the editable value);
  // `defaultPrice` is today's profile rate (production's "List price").
  // `booking.perUnit` is the generated standard rate the booking was priced
  // from. Omitting it re-reads the locked snapshot, which is a different number
  // — the modify screen would then open showing a per-unit rate that disagrees
  // with the details ledger and with `previousTotal`.
  const { assignments } = buildRateRows(client, booking.serviceKey, {
    units, unitLabel: d.unit, perUnit: booking.perUnit,
  })
  const rateRows = assignments.map(({ pet, rate, pricePerUnit }) => ({
    petName: pet.name ?? pet.petName,
    slug: rate.slug,
    label: rate.label,
    pricePerUnit,
    listPrice: rate.defaultPrice,
    unit: rate.unit,
  }))

  return {
    units,
    unitLabel: d.unit,
    unitLabelPlural: `${d.unit}s`,
    rateRows,
    adjustments: [],
    subtotal: booking.price,
    previousTotal: booking.price,
    amountOwed: money(0),
    earnings: booking.earnings,
  }
}

// ── The one per-booking mapper ───────────────────────────────────────────────
// Everything derived from a finished booking object is attached here, from one
// place, so upcoming / past / archived get it identically.
const withDerivedFields = (client, share) => (booking) => ({
  ...booking,
  // Production's collapsed summary reads `payment.date_paid`
  // (price_ledger.py:321-364), which exists for every paid conversation. Only
  // the two hand-written bookings carried a `paidOn` before every booking had
  // a ledger, so the generated ones would interpolate `undefined` into
  // "{owner} paid $X on … for this stay". Rover charges when the service
  // begins, so the booking's own start date is the honest stand-in.
  ...(booking.isPaid && !booking.paidOn && booking.startDate
    ? { paidOn: fmt(new Date(`${booking.startDate}T00:00:00`)) }
    : {}),
  // Production suppresses the whole rates block on a recurring stay
  // (ModifyBookingForm.utils.ts:74-89), so a recurring week gets no modify block.
  ...(booking.isRecurring ? {} : { modify: buildModifyFields(client, booking) }),
  ledger: buildLedger(client, booking, share),
  // `_is_collapsed()` (price_ledger.py:1650-1657) OR'd with
  // `should_collapse_financial_sections()` (base.py:389-397), whose mobile
  // provider branch collapses an unpaid conversation outright. Two deliberate
  // simplifications: production's second clause is is_cancelled_with_full_refund
  // rather than plain cancellation, and `hasModification` is always false here.
  ledgerCollapsed: !booking.isPaid || (booking.isPaid && !booking.hasModification && !booking.isCancelled),
  // `_get_info_text()` (price_ledger.py:1850-1858): the provider on a recurring
  // conversation is reminded to send a Rover Card, unless the stay is cancelled.
  ledgerInfo: booking.isRecurring && !booking.isCancelled ? RECURRING_ROVER_CARD_INFO : null,
})

const buildArchivedBookings = (client, count) => {
  const out = []
  const cursor = new Date(PROTO_TODAY)
  cursor.setHours(0, 0, 0, 0)
  // Archived = much older history (a year+ back).
  cursor.setDate(cursor.getDate() - 400)

  for (let i = 0; i < count; i++) {
    const seed = hash(client.id, 999 + i)
    const pool = servicePoolFor(client)
    const serviceKey = pool[seed % pool.length]
    const svc = SERVICES[serviceKey]
    const span = svc.multiDay ? 1 + (seed % 3) : 1
    const start = new Date(cursor)
    const end = new Date(cursor)
    end.setDate(start.getDate() + (span - 1))

    // Year-old history, so the rate sits slightly below today's locked one.
    const perUnit = clampRate(client, serviceKey, standardRateFor(client, serviceKey) * 0.95)
    const { rows: rateRows, subtotal: price } = buildRateRows(client, serviceKey, {
      units: span, unitLabel: SERVICE_DETAIL[serviceKey].unit, perUnit,
    })

    out.push({
      id: `${client.id}-arc-${i + 1}`,
      price: money(price),
      dates: span === 1 ? `${fmt(start)}, ${start.getFullYear()}` : fmtRange(start, end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      serviceKey,
      rateRows,
      // The generated standard rate this booking was priced from. buildModifyFields
      // must seed the rate selector with it, not with the locked snapshot, or the
      // modify screen opens showing a per-unit rate the ledger never charged.
      perUnit,
      earnings: money(0),
      serviceStatus: 'no_service_deposit',
      conversationOpk: `${client.id}-conv-arc-${i + 1}`,
      startDate: isoKey(start),
      endDate: isoKey(end),
      // An old request that was never booked, so there is no stay behind it.
      ...statusFields('no_service_deposit', start, end, serviceKey, span, { statusKey: 'archived' }),
      ...detailFields(start, end, serviceKey, span),
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

    // `b.price` is the authored figure, but the rate rows are what the ledger
    // shows — so it becomes a target: pick the round standard rate landing
    // closest to it, and take the resulting subtotal as the price. A client
    // with more pets than the authored number assumed therefore prices higher.
    const opts = { units: span, unitLabel: SERVICE_DETAIL[b.serviceKey].unit }
    const perUnit = rateForTarget(client, b.serviceKey, opts, b.price)
    const { rows: rateRows, subtotal: price } = buildRateRows(client, b.serviceKey, { ...opts, perUnit })

    const item = {
      id: `${client.id}-arc-${i + 1}`,
      price: money(price),
      dates: span === 1 ? `${fmt(start)}, ${start.getFullYear()}` : fmtRange(start, end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      serviceKey: b.serviceKey,
      rateRows,
      // The generated standard rate this booking was priced from. buildModifyFields
      // must seed the rate selector with it, not with the locked snapshot, or the
      // modify screen opens showing a per-unit rate the ledger never charged.
      perUnit,
      earnings: money(0),
      serviceStatus: 'no_service_deposit',
      conversationOpk: `${client.id}-conv-arc-${i + 1}`,
      startDate: isoKey(start),
      endDate: isoKey(end),
      ...statusFields('no_service_deposit', start, end, b.serviceKey, span),
      ...detailFields(start, end, b.serviceKey, span),
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
//
// `altMonetization` mirrors production's `is_rollout_alt_monetisation` gate on
// RelationshipProgressScreenView (views.py:1011-1013): outside the rollout the
// graduated take rate does not exist, so no tier mapper is put on the payload
// and every booking earns the flat BASELINE_SHARE.
export const getRelationshipData = (ownerId, { altMonetization = false } = {}) => {
  const client = CLIENTS.find(c => c.id === ownerId)
  if (!client) return null

  // gbv is null in two cases (matches production):
  //   1. Sitter not in alt-mon rollout
  //   2. In rollout, but no completed browsable bookings (cancelled or
  //      non-browsable services like training/grooming)
  // Either way, we render with $0 progress — no fallback fudging.
  const effectiveGbv = client.gbv ?? 0

  // One resolver for every builder: inside the rollout the share is the tier the
  // cumulative amount lands in, outside it the standard 80%. No builder sees a
  // tier object, so none of them can leak tier semantics into the non-rollout
  // state.
  const shareFor = (gbv) => (altMonetization ? TIERS[tierIndexFor(gbv)].sitterShare : BASELINE_SHARE)

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

    past = buildPastBookings(client, pastCount, effectiveGbv, shareFor)
    upcoming = buildUpcomingBookings(client, upcomingCount, shareFor(effectiveGbv))
    archived = buildArchivedBookings(client, archivedCount)
  }

  // A recurring client's current week is a real booking, and it goes at the head
  // of `upcoming` so the conversation screen's existing opk lookup finds it.
  // Both branches above need it: sarah is recurring *and* takes the
  // cancelledBookings branch, which leaves `upcoming` empty.
  const recurringWeek = isRecurringClient(client)
    ? buildRecurringWeekBooking(client, shareFor(effectiveGbv))
    : null
  if (recurringWeek) upcoming = [recurringWeek, ...upcoming]

  // Earnings totals are gross-value-aligned (mirrors EarningsMapper in
  // roverdotcom/web), so they reconcile against the GBV-denominated tier
  // thresholds shown in the progress bar. Per-booking sitter earnings still
  // live on each booking's `earnings` field.
  //
  // The recurring week is excluded: it is this week's already-charged
  // conversation, not pending future work, and counting it would move the tier
  // progress bar and the callout copy for owen / james / sarah.
  const completedAmount = effectiveGbv
  const pendingAmount = upcoming
    .filter(b => !b.isRecurring)
    .reduce((s, b) => s + parseFloat(b.price.amount), 0)

  // Tier states, heading and callout are the rollout-only half of the payload,
  // so they are not even computed outside the test.
  const tiers = altMonetization ? buildTierStates(effectiveGbv, pendingAmount) : null
  const callout = altMonetization ? calloutFor(client, effectiveGbv, pendingAmount) : null
  const heading = altMonetization ? headingFor(effectiveGbv) : null

  return {
    requester: {
      displayName: client.displayName,
      pets: client.subtitleText, // formatted pet names from contacts.js
      photo: client.imageUrl ?? peopleImages.owen,
      isActive: true,
    },
    // `earnings` stays populated in BOTH states: `completed` is gross booking
    // value and `pending` is a sum of upcoming prices — neither is a tier
    // artifact, and the booking-list section headers
    // (screens/RelationshipPage/BookingItems.jsx:15-29) read them regardless.
    // Only heading / tiers / callout go null, which mirrors production simply
    // not putting the progress mapper on the payload; a consumer gating on
    // `progress.tiers` therefore can never render a half-populated tracker.
    progress: {
      heading,
      tiers,
      callout,
      earnings: { completed: money(completedAmount), pending: money(pendingAmount) },
    },
    // `modify` is attached last so every list gets it from one place. It only
    // adds a key — no existing field is touched — so the surfaces that render
    // these bookings today are unaffected.
    bookings: {
      upcoming: upcoming.map(withDerivedFields(client, shareFor(effectiveGbv))),
      past: past.map(withDerivedFields(client, shareFor(effectiveGbv))),
      archived: archived.map(withDerivedFields(client, shareFor(effectiveGbv))),
    },
  }
}
