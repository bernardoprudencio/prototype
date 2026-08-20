/**
 * Lockable rates — the sitter's own rate list per service, plus each client's
 * locked snapshot of it.
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 * Production keys a lock on (sitter's service x owner x rate type):
 * `ConversationApplicableLockedServiceAddOnsDescriptor` filters
 * `requester=conversation.requester_id, service=conversation.service_id`
 * (conversations/descriptors.py:707-716). So the *capability* belongs to every
 * client for every service they could book, and only the *rows* vary.
 *
 * The rate list itself is the sitter's, not the client's:
 * `_get_lockable_add_ons()` (price_ledger.py:1659-1675) reads
 * `conv.service.serviceaddon_set` and filters
 *   - `active=True`
 *   - `_price_per_unit > 0`, or zero-priced when the slug is in
 *     ZERO_PRICE_LOCKABLE_ADD_ON_TYPE_SLUGS (additional-dog, additional-cat)
 *   - not in NON_LOCKABLE_ADD_ON_TYPE_SLUGS (cost-adjustments,
 *     cancellation-penalty, extended-care, missing-service-deliveries)
 *   - short-notice dropped unless `should_show_short_notice(person)`
 * Both filters are applied below.
 *
 * ── Known divergences, deliberate ──────────────────────────────────────────
 * - Rate labels are sentence case ('Additional dog rate'). Production's
 *   `add_on_type.name` is Title Case ('Additional Dog Rate',
 *   services/constants.py:457-462). Sentence case is used because the rest of
 *   this prototype's rate data already is (contacts.js `recurringSchedule`,
 *   sitterProfile.js `additionalRates`), and mixing the two inside one sheet
 *   would read as a bug.
 * - Only boarding has real rate data in this prototype
 *   (sitterProfile.js BOARDING_SETTINGS). The other four browsable services
 *   are authored here in the same shape, priced off the daily figures in
 *   relationshipData.js SERVICES.
 */

import { BOARDING_SETTINGS } from './sitterProfile'

// Production's `service_type.display_name` (services/constants.py:29-49) —
// this is what `_get_lock_rates_action` interpolates into the sheet body, so it
// is Title Case there too ("...for all future Boarding bookings").
export const SERVICE_DISPLAY_NAME = {
  boarding:       'Boarding',
  house_sitting:  'House Sitting',
  dog_walking:    'Dog Walking',
  drop_in_visits: 'Drop-In Visits',
  dog_daycare:    'Doggy Day Care',
}

// BROWSABLE_SERVICE_TYPES (services/constants.py:96-102, 117-119). Gate 4 of
// `_get_lock_rates_toggle` is membership in this set; training and grooming are
// out, which is also why they never appear in relationshipData.js SERVICES.
export const BROWSABLE_SERVICE_KEYS = Object.keys(SERVICE_DISPLAY_NAME)

// NON_LOCKABLE_ADD_ON_TYPE_SLUGS (services/constants.py:709-714).
const NON_LOCKABLE_SLUGS = new Set([
  'cost-adjustments', 'cancellation-penalty', 'extended-care',
  'missing-service-deliveries',
])

// ZERO_PRICE_LOCKABLE_ADD_ON_TYPE_SLUGS (services/constants.py:718-721) — these
// stay lockable at $0; everything else needs a price above zero.
const ZERO_PRICE_LOCKABLE_SLUGS = new Set(['additional-dog', 'additional-cat'])

const isLockable = (rate) =>
  rate.active !== false &&
  !NON_LOCKABLE_SLUGS.has(rate.slug) &&
  (rate.defaultPrice > 0 || ZERO_PRICE_LOCKABLE_SLUGS.has(rate.slug))

// ── Boarding: derived, so the numbers stay single-sourced ────────────────────
// The base rate is add-on type `standard-rate`; the rest come straight from
// BOARDING_SETTINGS.additionalRates. `holiday`, `bath`, `short-notice` and
// `pickup-dropoff` are `active: false` there, so production's `active=True`
// filter drops them — which is why the boarding sheet shows three rows.
const boardingRates = () => [
  {
    slug: 'standard-rate',
    label: 'Standard rate',
    defaultPrice: BOARDING_SETTINGS.baseRate,
    unit: BOARDING_SETTINGS.baseRateUnit,
    active: true,
  },
  ...BOARDING_SETTINGS.additionalRates.map(r => ({
    slug: r.slug,
    // BOARDING_SETTINGS labels the noun ('Additional dog', 'Puppy care'); the
    // add-on types they map to are named as rates ('Additional Dog Rate',
    // 'Puppy Rate'), which is the form the lock sheet renders.
    label: RATE_LABEL[r.slug] ?? r.label,
    defaultPrice: r.isFree ? 0 : r.price,
    unit: r.unit,
    active: r.active,
  })),
]

// Add-on type names, sentence-cased. Keys are the slugs used in
// sitterProfile.js; values follow ADD_ON_TYPE_SLUGS (services/constants.py:457).
const RATE_LABEL = {
  'standard-rate':  'Standard rate',
  'additional-dog': 'Additional dog rate',
  'additional-cat': 'Additional cat rate',
  puppy:            'Puppy rate',
  holiday:          'Holiday rate',
  'holiday-rate':   'Holiday rate',
  'long-walk':      '60 minute rate',
  'long-drop-in':   '60 minute rate',
}

// ── The sitter's lockable rates, per browsable service ───────────────────────
// Only rows surviving `_get_lockable_add_ons()` are listed for the four
// hand-authored services, so no `active: false` entries appear here.
const RATE_TABLE = {
  boarding: boardingRates(),
  house_sitting: [
    { slug: 'standard-rate',  label: RATE_LABEL['standard-rate'],  defaultPrice: 60, unit: 'night' },
    { slug: 'additional-dog', label: RATE_LABEL['additional-dog'], defaultPrice: 30, unit: 'night' },
    { slug: 'puppy',          label: RATE_LABEL.puppy,             defaultPrice: 10, unit: 'night' },
  ],
  dog_daycare: [
    { slug: 'standard-rate',  label: RATE_LABEL['standard-rate'],  defaultPrice: 45, unit: 'day' },
    { slug: 'additional-dog', label: RATE_LABEL['additional-dog'], defaultPrice: 25, unit: 'day' },
    { slug: 'puppy',          label: RATE_LABEL.puppy,             defaultPrice: 10, unit: 'day' },
  ],
  drop_in_visits: [
    { slug: 'standard-rate',  label: RATE_LABEL['standard-rate'],  defaultPrice: 30, unit: 'visit' },
    { slug: 'additional-dog', label: RATE_LABEL['additional-dog'], defaultPrice: 15, unit: 'visit' },
    { slug: 'long-drop-in',   label: RATE_LABEL['long-drop-in'],   defaultPrice: 15, unit: 'visit' },
  ],
  dog_walking: [
    { slug: 'standard-rate',  label: RATE_LABEL['standard-rate'],  defaultPrice: 25, unit: 'walk' },
    { slug: 'additional-dog', label: RATE_LABEL['additional-dog'], defaultPrice: 12, unit: 'walk' },
    { slug: 'long-walk',      label: RATE_LABEL['long-walk'],      defaultPrice: 12, unit: 'walk' },
  ],
}

// Gates 1, 3, 4 and 5 of production's `_get_lock_rates_toggle`
// (price_ledger.py:1720-1742), which decides whether the locked-rates control is
// offered on a given conversation: browsable (non-grooming) service type, paid,
// and no cancelled stay. Gate 2 (the viewer is the provider) is structurally free
// here — the sitter always is. Note there is deliberately no recurring check.
export const isLockableConversation = (booking) => Boolean(
  booking &&
  BROWSABLE_SERVICE_KEYS.includes(booking.serviceKey) &&
  booking.isPaid &&
  !booking.isCancelled
)

export const lockableRatesFor = (serviceKey) =>
  (RATE_TABLE[serviceKey] ?? []).filter(isLockable)

// ── Each client's locked snapshot ────────────────────────────────────────────
// A LockedServiceAddOn row stores the price the owner actually agreed to on the
// booking, not the sitter's current profile rate — so a locked price is a
// snapshot that sits at or below today's default. Rather than hand-write one
// block per client per service, the snapshot is derived from a hash of
// (client, service, rate), the same deterministic trick relationshipData.js
// uses for bookings. Clients whose exact numbers other data depends on are
// pinned in LOCKED_PRICE_OVERRIDES below.

const hash = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Lena's boarding numbers are load-bearing: relationshipData.js prices her demo
// booking's ledger off `standard-rate` + `additional-dog`.
const LOCKED_PRICE_OVERRIDES = {
  'lena:boarding': { 'standard-rate': 38, 'additional-dog': 28, puppy: 8 },
}

const lockedPriceFor = (clientId, serviceKey, rate) => {
  const pinned = LOCKED_PRICE_OVERRIDES[`${clientId}:${serviceKey}`]?.[rate.slug]
  if (pinned != null) return pinned
  if (rate.defaultPrice === 0) return 0
  // 10, 15, 20 or 25% below today's default.
  const pct = 10 + (hash(`${clientId}:${serviceKey}:${rate.slug}`) % 4) * 5
  return Math.max(1, Math.round((rate.defaultPrice * (100 - pct)) / 100))
}

/**
 * The lockable-rates config for one client on one service, or null when the
 * service is not browsable (production gate 4 — grooming and training).
 *
 *   { serviceKey, serviceName, locked, rates: [{ slug, label, lockedPrice, defaultPrice, unit }] }
 *
 * `locked` is the *seed* only; live state lives in AppContext, which keys on
 * `${clientId}:${serviceKey}` exactly as production keys on (requester, service).
 */
export const lockedRatesFor = (client, serviceKey) => {
  if (!client || !serviceKey) return null
  const rates = lockableRatesFor(serviceKey)
  if (rates.length === 0) return null
  return {
    serviceKey,
    serviceName: SERVICE_DISPLAY_NAME[serviceKey],
    locked: Boolean(client.lockedServices?.includes(serviceKey)),
    rates: rates.map(r => ({
      slug: r.slug,
      label: r.label,
      lockedPrice: lockedPriceFor(client.id, serviceKey, r),
      defaultPrice: r.defaultPrice,
      unit: r.unit,
    })),
  }
}
