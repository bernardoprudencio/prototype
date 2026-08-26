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
  YOUR_EARNINGS_THIS_WEEK,
} from './bookingDetailsCopy'
import { lockedRatesFor } from './lockableRates'

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

// ── Booking generator ─────────────────────────────────────────────────────────
// Walks dates backwards from PROTO_TODAY and produces booking objects whose
// summed `price` values approximately reconcile to the client's gbv.
//
// `shareFor(gbv)` is passed in rather than a tier object: inside the rollout the
// share varies per booking with the running GBV, outside it every booking pays
// the flat BASELINE_SHARE — the builder never has to know which world it is in.
const buildPastBookings = (client, count, targetGbv, shareFor) => {
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
    const earnings = price * shareFor(cumulativeAfter)

    bookings.push({
      id: `${client.id}-past-${i + 1}`,
      price: money(price),
      dates: span === 1 ? `${fmt(start)}, ${start.getFullYear()}` : fmtRange(start, end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      serviceKey,
      earnings: money(earnings),
      serviceStatus: 'completed_service_deposit',
      conversationOpk: `${client.id}-conv-past-${i + 1}`,
      startDate: isoKey(start),
      endDate: isoKey(end),
      ...statusFields('completed_service_deposit', start, end, serviceKey, span),
      ...detailFields(start, end, serviceKey, span),
    })

    // Step cursor backwards: span days + 2-6 day gap.
    const gap = 2 + (seed % 5)
    cursor.setDate(cursor.getDate() - span - gap)
  }

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
    const price = Math.round(svc.daily * span)
    out.push({
      id: `${client.id}-up-active`,
      price: money(price),
      dates: fmtRange(start, end),
      startDate: isoKey(start),
      endDate: isoKey(end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      serviceKey: 'boarding',
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
  // This is the only booking carrying a `ledger`, because it is the only one
  // BookingDetailsScreen renders. The rows mirror
  // price_ledger.py:_get_rate_price(): one row per pet, titled with the pet's
  // name, described by the add-on type, with the "$X x N nights" multiplier as
  // a sub-line. A sitter's ledger ends at Subtotal + Your earnings — no
  // service fee, no tax, no due-now (`_get_requester_prices` returns [] for
  // providers).
  if (client.id === 'lena' && count > 0) {
    const start = new Date(PROTO_TODAY); start.setHours(0,0,0,0); start.setDate(start.getDate() + 6)
    const end   = new Date(PROTO_TODAY); end.setHours(0,0,0,0);   end.setDate(end.getDate() + 9)
    // Paid a week before "today" — derived from PROTO_TODAY, never hardcoded.
    const paid  = new Date(PROTO_TODAY); paid.setHours(0,0,0,0);  paid.setDate(paid.getDate() - 7)
    const locked = lockedRatesFor(client, 'boarding').rates
    const nights = 3
    const perNight = locked[0].lockedPrice + locked[1].lockedPrice
    const price = perNight * nights

    // First pet bills at the standard rate, each additional pet at the
    // additional-dog rate — the same shape as the BookingAddOn rows behind
    // production's ledger.
    const rateRows = client.pets.map((p, i) => {
      const rate = locked[i === 0 ? 0 : 1]
      return {
        title: p.name,
        description: rate.label,
        text: [rateMultiplier(`$${rate.lockedPrice}`, nights, rate.unit, `${rate.unit}s`)],
        amount: money(rate.lockedPrice * nights),
      }
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
      ledger: {
        sections: [
          { title: LEDGER_SECTION_TITLE, items: rateRows },
          { items: [{ title: SUBTOTAL, amount: money(price), style: 'bold' }] },
          { items: [{
              title: YOUR_EARNINGS,
              amount: money(price * share),
              style: 'bold',
              action: 'earnings',
            }] },
        ],
      },
    })
  }

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
      startDate: isoKey(start),
      endDate: isoKey(end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      serviceKey,
      earnings: money(price * share),
      serviceStatus: 'pending_service_deposit',
      conversationOpk: `${client.id}-conv-up-${i + 1}`,
      ...statusFields('pending_service_deposit', start, end, serviceKey, span),
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
  const perVisit =
    petRows.reduce((s, p) => s + p.ratePerWalk, 0) +
    addOnRows.reduce((s, a) => s + a.ratePerWalk, 0)
  const weeklyPrice = perVisit * visits

  const unit = SERVICE_DETAIL[RECURRING_SERVICE_KEY].unit
  const plural = `${unit}s`

  // One schedule row per service day, dated inside this week — production's
  // NonContiguousServiceDatesStringBuilder emits a real date per occurrence,
  // not a bare weekday name.
  const schedules = tpl.template.map((t) => {
    const idx = FULL_DAYS.indexOf(t.day)
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + ((idx + 6) % 7))
    return { day: fmtLong(d), times: [t.time] }
  })

  // Ledger rows mirror `_get_rate_price()` the same way Lena's do: one row per
  // pet titled with the pet's name and described by the add-on type, with the
  // "$X × N walks" multiplier as a sub-line, then the schedule's add-ons.
  const rateRows = [
    ...petRows.map(p => ({
      title: p.petName,
      description: p.rateType,
      text: [rateMultiplier(`$${p.ratePerWalk}`, visits, unit, plural)],
      amount: money(p.ratePerWalk * visits),
    })),
    ...addOnRows.map(a => ({
      title: a.label,
      text: [rateMultiplier(`$${a.ratePerWalk}`, visits, unit, plural)],
      amount: money(a.ratePerWalk * visits),
    })),
  ]

  // The owner is charged each Monday morning for the week ahead
  // (price_ledger.py:302-306), so this week's payment date is its Monday.
  const paidOn = fmt(weekStart)

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
    earnings: money(weeklyPrice * share),
    serviceStatus: 'completed_service_deposit',
    conversationOpk: `${client.id}-conv-recurring`,
    paidOn,
    ...statusFields(
      'completed_service_deposit', weekStart, weekEnd, RECURRING_SERVICE_KEY, visits,
      { recurring: true, skippedThisWeek },
    ),
    ...detailFields(weekStart, weekEnd, RECURRING_SERVICE_KEY, visits, { schedules }),
    ledger: {
      sections: [
        { title: LEDGER_SECTION_TITLE, items: rateRows },
        { items: [{ title: SUBTOTAL_THIS_WEEK, amount: money(weeklyPrice), style: 'bold' }] },
        { items: [{
            title: YOUR_EARNINGS_THIS_WEEK,
            amount: money(weeklyPrice * share),
            style: 'bold',
            action: 'earnings',
          }] },
      ],
    },
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
  const cfg = lockedRatesFor(client, booking.serviceKey)
  const units = booking.unitCount ?? 1
  const d = SERVICE_DETAIL[booking.serviceKey] ?? SERVICE_DETAIL.boarding

  // First pet bills at the standard rate, each additional pet at the
  // additional-dog rate — the same BookingAddOn shape the ledger uses.
  // `lockedPrice` is the rate the owner agreed to (the editable value);
  // `defaultPrice` is today's profile rate (production's "List price").
  const rateRows = (cfg?.rates?.length ? client.pets : []).map((p, i) => {
    const rate = cfg.rates[i === 0 ? 0 : 1] ?? cfg.rates[0]
    return {
      petName: p.name,
      slug: rate.slug,
      label: rate.label,
      pricePerUnit: rate.lockedPrice,
      listPrice: rate.defaultPrice,
      unit: rate.unit,
    }
  })

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

const withModifyFields = (client) => (booking) =>
  booking.isRecurring ? booking : { ...booking, modify: buildModifyFields(client, booking) }

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
      serviceKey,
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

    const item = {
      id: `${client.id}-arc-${i + 1}`,
      price: money(b.price),
      dates: span === 1 ? `${fmt(start)}, ${start.getFullYear()}` : fmtRange(start, end),
      serviceName: svc.name,
      serviceIcon: svc.icon,
      serviceKey: b.serviceKey,
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
      upcoming: upcoming.map(withModifyFields(client)),
      past: past.map(withModifyFields(client)),
      archived: archived.map(withModifyFields(client)),
    },
  }
}
