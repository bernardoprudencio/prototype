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

// ── Rate bounds ──────────────────────────────────────────────────────────────
// Production reads these from *country config*, not from the sitter's profile:
// `get_addon_type_min_price` (services/utils.py:774-781) and
// `get_addon_type_max_price` (:784-798) look up
// `minimum_service_add_on_prices` / `maximum_service_add_on_prices` on
// `CountryConfigurationAbstractNA` (i18n/configuration.py:1612, :1665-1717).
// `CountryConfigurationCA` (:1948) inherits both and overrides only currency and
// legal amounts, so the NA numbers apply to this prototype's CAD figures too.
//
// Anything absent from the map falls to ALT_MINIMUM_ADD_ON_PRICE = 0
// (services/constants.py:1633). `maximum_service_add_on_prices` carries entries
// only for grooming and dog training, so every browsable service takes the
// blanket `max_add_on_price` (i18n/configuration.py:1732).
const MAX_ADD_ON_PRICE = 250

// Keys are this file's slugs. Production keys the holiday minimum on
// `holiday-rate` and the cat minimum on `cat-care`; boarding's profile data uses
// `holiday` and `additional-cat`, so both spellings are listed.
const MIN_ADD_ON_PRICE = {
  // "boarding & traveling" in the config — house sitting is the traveling one.
  boarding:       { 'standard-rate': 15, holiday: 15, 'holiday-rate': 15, 'extended-stay': 15, puppy: 15, 'additional-cat': 10, 'cat-care': 10 },
  house_sitting:  { 'standard-rate': 15, holiday: 15, 'holiday-rate': 15, 'extended-stay': 15, puppy: 15, 'additional-cat': 10, 'cat-care': 10 },
  drop_in_visits: { 'standard-rate': 10, holiday: 10, 'holiday-rate': 10, 'extended-stay': 10, puppy: 10, 'additional-cat': 7,  'cat-care': 7  },
  dog_daycare:    { 'standard-rate': 15, holiday: 15, 'holiday-rate': 15, 'extended-stay': 15, puppy: 15 },
  dog_walking:    { 'standard-rate': 10, holiday: 10, 'holiday-rate': 10, 'extended-stay': 10, puppy: 10 },
}

const minPriceFor = (serviceKey, slug) => MIN_ADD_ON_PRICE[serviceKey]?.[slug] ?? 0

// ── Boarding: derived, so the numbers stay single-sourced ────────────────────
// The base rate is add-on type `standard-rate`; the rest come straight from
// BOARDING_SETTINGS.additionalRates, which now carries all eight of boarding's
// production add-ons as `active: true` — nine rows with the base rate. The
// `active` and price filters below still run, so deactivating a rate in the
// sitter's profile still removes it from the lock sheet.
const boardingRates = () => [
  {
    slug: 'standard-rate',
    label: 'Standard rate',
    defaultPrice: BOARDING_SETTINGS.baseRate,
    unit: BOARDING_SETTINGS.baseRateUnit,
    minPrice: minPriceFor('boarding', 'standard-rate'),
    maxPrice: MAX_ADD_ON_PRICE,
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
    // Bounds come from country config, never from the sitter's own profile.
    minPrice: minPriceFor('boarding', r.slug),
    maxPrice: MAX_ADD_ON_PRICE,
    active: r.active,
  })),
]

// Add-on type names, sentence-cased. Keys are the slugs used in
// sitterProfile.js; values follow ADD_ON_TYPE_SLUGS (services/constants.py:457).
const RATE_LABEL = {
  'standard-rate':          'Standard rate',
  'additional-dog':         'Additional dog rate',
  'additional-cat':         'Additional cat rate',
  puppy:                    'Puppy rate',
  holiday:                  'Holiday rate',
  'holiday-rate':           'Holiday rate',
  'long-walk':              '60 minute rate',
  'long-drop-in':           '60 minute rate',
  'extended-stay':          'Extended stay rate',
  'bathing-grooming':       'Bathing / grooming',
  'pick-up-drop-off':       'Pick-up / drop-off',
  'daily-pick-up-drop-off': 'Daily pick-up / drop-off',
  'short-notice':           'Short notice rate',
}

// ── The sitter's lockable rates, per browsable service ───────────────────────
// Only rows surviving `_get_lockable_add_ons()` are listed for the four
// hand-authored services, so no `active: false` entries appear here.
//
// The set per service is `ALLOWED_ADDITIONAL_RATES_FOR_SERVICE_TYPE`
// (services/constants.py:812-866) plus the base `standard-rate`; the `unit` is
// `SERVICE_TYPE_PRICE_UNITS` (:321-329). Prices are the prototype's own,
// anchored on the daily figures in relationshipData.js SERVICES, and every
// default sits at or above its own `minPrice` — a default below its floor could
// not be saved. The two flat-fee add-ons (bathing / grooming, pick-up /
// drop-off) keep unit 'service' rather than the service's own unit, matching how
// BOARDING_SETTINGS already prices them; daycare's pick-up / drop-off is the
// `daily-` variant and so is priced per day.
//
// ── NOT ESTABLISHED — four open questions on this table ─────────────────────
// The rows below are read off production source, but four things about them are
// unconfirmed. Confirm before treating the table as production-accurate:
//
// 1. `ALLOWED_ADDITIONAL_RATES_FOR_SERVICE_TYPE` is explicitly scoped "for
//    sitters in the SSU (pet-care-modes) experience". Whether every
//    locked-rates sitter is in that experience is unconfirmed.
// 2. `bathing-grooming` is in FREE_ADD_ON_SLUGS and *not* in
//    ZERO_PRICE_LOCKABLE_ADD_ON_TYPE_SLUGS, so at $0 `_get_lockable_add_ons()`
//    drops it. Does the boarding sheet in production show 9 rows or 8? This
//    prototype prices it non-zero, so it shows 9.
// 3. `short-notice` appears only when `should_show_short_notice(person)` is
//    true. Unconfirmed for the demo persona; assumed true here.
// 4. The POC's `RateEditor` comment says "Eleven of these stack in one column",
//    but the largest set derivable from the source is 9. Unexplained, and
//    deliberately not rounded up to eleven.
const RATE_TABLE = {
  // 9 rows: standard-rate, holiday-rate, additional-dog, puppy, additional-cat,
  // extended-stay, bathing-grooming, pick-up-drop-off, short-notice.
  boarding: boardingRates(),

  // 7 rows. No bathing-grooming and no pick-up-drop-off: the sitter travels to
  // the pet, so there is nothing to collect and nowhere to bathe.
  house_sitting: [
    { slug: 'standard-rate',  label: RATE_LABEL['standard-rate'],  defaultPrice: 65, unit: 'night', minPrice: minPriceFor('house_sitting', 'standard-rate'),  maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'holiday-rate',   label: RATE_LABEL['holiday-rate'],   defaultPrice: 20, unit: 'night', minPrice: minPriceFor('house_sitting', 'holiday-rate'),   maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'additional-dog', label: RATE_LABEL['additional-dog'], defaultPrice: 30, unit: 'night', minPrice: minPriceFor('house_sitting', 'additional-dog'), maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'puppy',          label: RATE_LABEL.puppy,             defaultPrice: 15, unit: 'night', minPrice: minPriceFor('house_sitting', 'puppy'),          maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'additional-cat', label: RATE_LABEL['additional-cat'], defaultPrice: 25, unit: 'night', minPrice: minPriceFor('house_sitting', 'additional-cat'), maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'extended-stay',  label: RATE_LABEL['extended-stay'],  defaultPrice: 55, unit: 'night', minPrice: minPriceFor('house_sitting', 'extended-stay'),  maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'short-notice',   label: RATE_LABEL['short-notice'],   defaultPrice: 10, unit: 'night', minPrice: minPriceFor('house_sitting', 'short-notice'),   maxPrice: MAX_ADD_ON_PRICE },
  ],

  // 7 rows. Daycare's collection add-on is the daily variant, and there is no
  // additional-cat or extended-stay in its allowed set.
  dog_daycare: [
    { slug: 'standard-rate',          label: RATE_LABEL['standard-rate'],          defaultPrice: 45, unit: 'day',     minPrice: minPriceFor('dog_daycare', 'standard-rate'),          maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'holiday-rate',           label: RATE_LABEL['holiday-rate'],           defaultPrice: 15, unit: 'day',     minPrice: minPriceFor('dog_daycare', 'holiday-rate'),           maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'additional-dog',         label: RATE_LABEL['additional-dog'],         defaultPrice: 25, unit: 'day',     minPrice: minPriceFor('dog_daycare', 'additional-dog'),         maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'puppy',                  label: RATE_LABEL.puppy,                     defaultPrice: 15, unit: 'day',     minPrice: minPriceFor('dog_daycare', 'puppy'),                  maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'bathing-grooming',       label: RATE_LABEL['bathing-grooming'],       defaultPrice: 20, unit: 'service', minPrice: minPriceFor('dog_daycare', 'bathing-grooming'),       maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'daily-pick-up-drop-off', label: RATE_LABEL['daily-pick-up-drop-off'], defaultPrice: 15, unit: 'day',     minPrice: minPriceFor('dog_daycare', 'daily-pick-up-drop-off'), maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'short-notice',           label: RATE_LABEL['short-notice'],           defaultPrice: 10, unit: 'day',     minPrice: minPriceFor('dog_daycare', 'short-notice'),           maxPrice: MAX_ADD_ON_PRICE },
  ],

  // 9 rows — the longest list alongside boarding. `long-drop-in` is the
  // 60-minute variant of the visit.
  drop_in_visits: [
    { slug: 'standard-rate',    label: RATE_LABEL['standard-rate'],    defaultPrice: 30, unit: 'visit',   minPrice: minPriceFor('drop_in_visits', 'standard-rate'),    maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'long-drop-in',     label: RATE_LABEL['long-drop-in'],     defaultPrice: 15, unit: 'visit',   minPrice: minPriceFor('drop_in_visits', 'long-drop-in'),     maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'holiday-rate',     label: RATE_LABEL['holiday-rate'],     defaultPrice: 12, unit: 'visit',   minPrice: minPriceFor('drop_in_visits', 'holiday-rate'),     maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'additional-dog',   label: RATE_LABEL['additional-dog'],   defaultPrice: 15, unit: 'visit',   minPrice: minPriceFor('drop_in_visits', 'additional-dog'),   maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'puppy',            label: RATE_LABEL.puppy,               defaultPrice: 10, unit: 'visit',   minPrice: minPriceFor('drop_in_visits', 'puppy'),            maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'additional-cat',   label: RATE_LABEL['additional-cat'],   defaultPrice: 12, unit: 'visit',   minPrice: minPriceFor('drop_in_visits', 'additional-cat'),   maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'extended-stay',    label: RATE_LABEL['extended-stay'],    defaultPrice: 15, unit: 'visit',   minPrice: minPriceFor('drop_in_visits', 'extended-stay'),    maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'bathing-grooming', label: RATE_LABEL['bathing-grooming'], defaultPrice: 20, unit: 'service', minPrice: minPriceFor('drop_in_visits', 'bathing-grooming'), maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'short-notice',     label: RATE_LABEL['short-notice'],     defaultPrice: 10, unit: 'visit',   minPrice: minPriceFor('drop_in_visits', 'short-notice'),     maxPrice: MAX_ADD_ON_PRICE },
  ],

  // 6 rows — the shortest list. No cat, extended-stay or grooming add-on.
  dog_walking: [
    { slug: 'standard-rate',  label: RATE_LABEL['standard-rate'],  defaultPrice: 25, unit: 'walk', minPrice: minPriceFor('dog_walking', 'standard-rate'),  maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'long-walk',      label: RATE_LABEL['long-walk'],      defaultPrice: 12, unit: 'walk', minPrice: minPriceFor('dog_walking', 'long-walk'),      maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'holiday-rate',   label: RATE_LABEL['holiday-rate'],   defaultPrice: 12, unit: 'walk', minPrice: minPriceFor('dog_walking', 'holiday-rate'),   maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'additional-dog', label: RATE_LABEL['additional-dog'], defaultPrice: 12, unit: 'walk', minPrice: minPriceFor('dog_walking', 'additional-dog'), maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'puppy',          label: RATE_LABEL.puppy,             defaultPrice: 10, unit: 'walk', minPrice: minPriceFor('dog_walking', 'puppy'),          maxPrice: MAX_ADD_ON_PRICE },
    { slug: 'short-notice',   label: RATE_LABEL['short-notice'],   defaultPrice: 8,  unit: 'walk', minPrice: minPriceFor('dog_walking', 'short-notice'),   maxPrice: MAX_ADD_ON_PRICE },
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
      // The allowed band travels with the rate: the manage sheet validates
      // against it, and it is picked here explicitly like every other field.
      minPrice: r.minPrice,
      maxPrice: r.maxPrice,
    })),
  }
}

// ── Granular locked rates (POC proposal) ─────────────────────────────────────
// The proposal keeps the lock all-or-nothing per service but makes each rate's
// *amount* something the provider sets while locking, and it surfaces when the
// lock was taken. `lockedRatesFor` above already derives a per-rate snapshot, so
// this only adds the timestamp and reshapes it into the map the modal edits.
//
// The seed date is derived, never hardcoded: three weeks before module load, so
// "Locked on <date>" always reads as a past event whenever the prototype runs.
const SEED_LOCK_AGE_DAYS = 21
export const SEEDED_LOCKED_AT = (() => {
  const d = new Date()
  d.setDate(d.getDate() - SEED_LOCK_AGE_DAYS)
  d.setHours(0, 0, 0, 0)
  return d
})()

/**
 * The untouched starting point for one (client x service): what the server
 * would return before the sitter does anything this session.
 *
 *   { locked, amounts: { [slug]: number }, lockedAt: Date | null, rates, serviceName }
 *
 * AppContext layers this session's edits on top — see `getRatesState`.
 */
export const lockedSeedFor = (client, serviceKey) => {
  const config = lockedRatesFor(client, serviceKey)
  if (!config) return null
  const amounts = {}
  config.rates.forEach(r => { amounts[r.slug] = r.lockedPrice })
  return {
    serviceKey,
    serviceName: config.serviceName,
    rates: config.rates,
    locked: config.locked,
    amounts,
    lockedAt: config.locked ? SEEDED_LOCKED_AT : null,
  }
}

/**
 * Default amounts for a service — what an unlocked client is charged, and what
 * `Use default` restores a field to.
 */
export const defaultAmountsFor = (serviceKey) => {
  const out = {}
  lockableRatesFor(serviceKey).forEach(r => { out[r.slug] = r.defaultPrice })
  return out
}
