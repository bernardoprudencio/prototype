/**
 * Service catalog + per-service state model used by ServiceSettingsScreen.
 *
 * The screen renders the same shell for every provider; what differs is which
 * services are configured, which the provider could still add, and which
 * are available for sign-up in their geo. All of that is captured here so a
 * single state map produces every variant in the [UX2-2136 Figma](https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV).
 *
 * Two pieces of state combine to produce a variant:
 *   1. `serviceStates` — per-service state (ACTIVE or INACTIVE).
 *   2. `familyInGeo`   — per-family geo availability for `training` and
 *      `grooming` only. Pet sitting is treated as implicitly always in geo
 *      (it's available for sign-up in every geo), so it is not modeled here.
 *      Use `isFamilyInGeo(family, familyInGeo)` to read this with the
 *      pet-sitting exception applied.
 *
 * Rendering rules:
 *   - A family with any ACTIVE service → hub section with two rows, Services
 *     and Profile, each drilling into its own sub-page. The services sub-page
 *     lists every service in the family, INACTIVE ones included.
 *   - A family with no ACTIVE services but in geo (per `isFamilyInGeo`) →
 *     one row in the "Other services" section. Pet sitting is always in geo,
 *     so it always falls back to this row when no pet-sitting services are
 *     ACTIVE.
 *   - A family with no ACTIVE services and not in geo → omitted (only
 *     applies to training / grooming).
 */

// ─── Per-service state ───────────────────────────────────────────────────────
export const SERVICE_STATE = {
  ACTIVE:   'active',   // configured and searchable
  AWAY:     'away',     // active but not searchable
  PENDING:  'pending',  // submitted, awaiting Rover approval
  INACTIVE: 'inactive', // not configured
}

// ─── Per-service customer-acceptance restriction ─────────────────────────────
// Independent of SERVICE_STATE. Drives the "Not accepting new pet owners…" copy
// rendered after the inline status text on an ACTIVE/AWAY service row.
export const ACCEPTANCE_RESTRICTION = {
  NONE:           'none',
  REPEAT_ONLY:    'repeat_only',
  RECURRING_ONLY: 'recurring_only',  // not accepting new for weekly care
  ONE_TIME_ONLY:  'one_time_only',   // not accepting new for one-time care
}

// ─── Families ────────────────────────────────────────────────────────────────
export const SERVICE_FAMILY = {
  PET_SITTING: 'pet_sitting',
  TRAINING:    'training',
  GROOMING:    'grooming',
}

export const FAMILY_ORDER = [
  SERVICE_FAMILY.PET_SITTING,
  SERVICE_FAMILY.TRAINING,
  SERVICE_FAMILY.GROOMING,
]

export const FAMILY_LABEL = {
  [SERVICE_FAMILY.PET_SITTING]: 'Pet sitting',
  [SERVICE_FAMILY.TRAINING]:    'Training',
  [SERVICE_FAMILY.GROOMING]:    'Grooming',
}

// Content shown when a family appears as a single row in "Other services".
// Copy read from the Management-hub migration Figma (DEV-146752), mobile hub
// frame 4233:11300.
export const FAMILY_SIGNUP = {
  [SERVICE_FAMILY.PET_SITTING]: {
    label:    'Sign up for pet sitting services',
    sublabel: 'Get paid to play with pets.',
  },
  [SERVICE_FAMILY.TRAINING]: {
    label:    'Sign up for dog training',
    sublabel: 'Offer professional reward\u2013based dog training.',
  },
  [SERVICE_FAMILY.GROOMING]: {
    label:    'Sign up for grooming',
    sublabel: "Work from your home or the pet owner's home.",
  },
}

// ─── Family hub rows ─────────────────────────────────────────────────────────
// In the migrated IA each active family collapses to exactly two hub rows —
// Services and Profile — that drill into their own sub-page. Figma 4233:11300.
export const FAMILY_ROW_COPY = {
  [SERVICE_FAMILY.PET_SITTING]: {
    services: 'Configure your pet sitting services',
    profile:  'Edit your pet sitting profile, photos, and more',
  },
  [SERVICE_FAMILY.TRAINING]: {
    services: 'Configure your training services',
    profile:  'Edit your training profile, photos, and more',
  },
  [SERVICE_FAMILY.GROOMING]: {
    services: 'Configure your grooming services',
    profile:  'Edit your grooming profile, photos, and more',
  },
}

// ─── Service catalog ─────────────────────────────────────────────────────────
// `acceptingNew` controls the "Not accepting new pet owners" status sublabel
// shown beneath an ACTIVE service.
export const SERVICES = [
  { id: 'boarding',      family: SERVICE_FAMILY.PET_SITTING, label: 'Boarding',       acceptingNew: true  },
  { id: 'house_sitting', family: SERVICE_FAMILY.PET_SITTING, label: 'House Sitting',  acceptingNew: true  },
  { id: 'doggy_daycare', family: SERVICE_FAMILY.PET_SITTING, label: 'Doggy Day Care', acceptingNew: false },
  { id: 'drop_in',       family: SERVICE_FAMILY.PET_SITTING, label: 'Drop-In Visits', acceptingNew: true  },
  { id: 'dog_walking',   family: SERVICE_FAMILY.PET_SITTING, label: 'Dog Walking',    acceptingNew: true  },
  { id: 'dog_training',  family: SERVICE_FAMILY.TRAINING,    label: 'Dog Training',   acceptingNew: true  },
  { id: 'grooming',      family: SERVICE_FAMILY.GROOMING,    label: 'Grooming',       acceptingNew: true  },
]

// ─── Variant 2 default — matches Figma node 386:16335 ────────────────────────
// Boarding, Doggy Day Care, Drop-In active; House Sitting, Dog Walking inactive
// (listed with an "Inactive" status on the services sub-page); training +
// grooming available for sign-up.
export const DEFAULT_SERVICE_STATES = {
  boarding:      SERVICE_STATE.ACTIVE,
  house_sitting: SERVICE_STATE.INACTIVE,
  doggy_daycare: SERVICE_STATE.ACTIVE,
  drop_in:       SERVICE_STATE.ACTIVE,
  dog_walking:   SERVICE_STATE.INACTIVE,
  dog_training:  SERVICE_STATE.INACTIVE,
  grooming:      SERVICE_STATE.INACTIVE,
}

export const DEFAULT_FAMILY_IN_GEO = {
  [SERVICE_FAMILY.TRAINING]: true,
  [SERVICE_FAMILY.GROOMING]: true,
}

// Per-service acceptance restriction defaults — every service starts at NONE.
export const DEFAULT_ACCEPTANCE_RESTRICTIONS = {
  boarding:      ACCEPTANCE_RESTRICTION.NONE,
  house_sitting: ACCEPTANCE_RESTRICTION.NONE,
  doggy_daycare: ACCEPTANCE_RESTRICTION.NONE,
  drop_in:       ACCEPTANCE_RESTRICTION.NONE,
  dog_walking:   ACCEPTANCE_RESTRICTION.NONE,
  dog_training:  ACCEPTANCE_RESTRICTION.NONE,
  grooming:      ACCEPTANCE_RESTRICTION.NONE,
}

// ─── Variant presets ─────────────────────────────────────────────────────────
// Each preset bundles a full `(serviceStates, familyInGeo)` tuple so the
// variant-config sheet can swap variants from a single source of truth.
export const PRESETS = {
  pet_sitting_all: {
    serviceStates: {
      boarding:      SERVICE_STATE.ACTIVE,
      house_sitting: SERVICE_STATE.ACTIVE,
      doggy_daycare: SERVICE_STATE.ACTIVE,
      drop_in:       SERVICE_STATE.ACTIVE,
      dog_walking:   SERVICE_STATE.ACTIVE,
      dog_training:  SERVICE_STATE.INACTIVE,
      grooming:      SERVICE_STATE.INACTIVE,
    },
    familyInGeo: {
      [SERVICE_FAMILY.TRAINING]: true,
      [SERVICE_FAMILY.GROOMING]: true,
    },
  },
  pet_sitting_partial: {
    serviceStates: DEFAULT_SERVICE_STATES,
    familyInGeo:   DEFAULT_FAMILY_IN_GEO,
  },
  training_only: {
    serviceStates: {
      boarding:      SERVICE_STATE.INACTIVE,
      house_sitting: SERVICE_STATE.INACTIVE,
      doggy_daycare: SERVICE_STATE.INACTIVE,
      drop_in:       SERVICE_STATE.INACTIVE,
      dog_walking:   SERVICE_STATE.INACTIVE,
      dog_training:  SERVICE_STATE.ACTIVE,
      grooming:      SERVICE_STATE.INACTIVE,
    },
    familyInGeo: {
      [SERVICE_FAMILY.TRAINING]: true,
      [SERVICE_FAMILY.GROOMING]: false,
    },
  },
  grooming_only: {
    serviceStates: {
      boarding:      SERVICE_STATE.INACTIVE,
      house_sitting: SERVICE_STATE.INACTIVE,
      doggy_daycare: SERVICE_STATE.INACTIVE,
      drop_in:       SERVICE_STATE.INACTIVE,
      dog_walking:   SERVICE_STATE.INACTIVE,
      dog_training:  SERVICE_STATE.INACTIVE,
      grooming:      SERVICE_STATE.ACTIVE,
    },
    familyInGeo: {
      [SERVICE_FAMILY.TRAINING]: false,
      [SERVICE_FAMILY.GROOMING]: true,
    },
  },
  all_services: {
    serviceStates: {
      boarding:      SERVICE_STATE.ACTIVE,
      house_sitting: SERVICE_STATE.ACTIVE,
      doggy_daycare: SERVICE_STATE.ACTIVE,
      drop_in:       SERVICE_STATE.ACTIVE,
      dog_walking:   SERVICE_STATE.ACTIVE,
      dog_training:  SERVICE_STATE.ACTIVE,
      grooming:      SERVICE_STATE.ACTIVE,
    },
    familyInGeo: {
      [SERVICE_FAMILY.TRAINING]: true,
      [SERVICE_FAMILY.GROOMING]: true,
    },
  },
}

export const PRESET_ORDER = [
  'pet_sitting_all',
  'pet_sitting_partial',
  'training_only',
  'grooming_only',
  'all_services',
]

export const PRESET_LABEL = {
  pet_sitting_all:     'Pet sitting (all)',
  pet_sitting_partial: 'Pet sitting (partial) + extras',
  training_only:       'Training only',
  grooming_only:       'Grooming only',
  all_services:        'All services',
}

// ─── Family-specific Profile rows ────────────────────────────────────────────
/**
 * Rows rendered by `FamilyProfileScreen` (`/service-settings/profile/:family`).
 * Each family gets its own set per the Management-hub migration Figma —
 * pet sitting 582:57749, training 1194:52491, grooming 1194:52281.
 *
 * Each row is `{ id, label, sublabel }`. `needsReview` rows pick up the yellow
 * "Review" badge when their family's attention banner variant is on.
 */
export const FAMILY_PROFILE_ROWS = {
  [SERVICE_FAMILY.PET_SITTING]: [
    { id: 'about',        label: 'About',        sublabel: 'Share your pet care experience and approach.' },
    { id: 'photos',       label: 'Photos',       sublabel: 'Manage your profile gallery.' },
    { id: 'testimonials', label: 'Testimonials', sublabel: 'Ask people to write about your pet care experience.' },
  ],
  [SERVICE_FAMILY.TRAINING]: [
    { id: 'credentials',  label: 'Training credentials', sublabel: 'Add credentials to your profile.' },
    { id: 'details',      label: 'Training details',     sublabel: 'Fill out your training bio to highlight your training qualifications for pet owners.' },
    { id: 'photos',       label: 'Photos',               sublabel: 'Highlight your best work.' },
    { id: 'testimonials', label: 'Testimonials',         sublabel: 'Ask people to write about your training experience.' },
  ],
  [SERVICE_FAMILY.GROOMING]: [
    { id: 'about',        label: 'About',        sublabel: 'Headline, experience, and more' },
    { id: 'photos',       label: 'Photos',       sublabel: 'Highlight your best work' },
    { id: 'testimonials', label: 'Testimonials', sublabel: 'References from past clients' },
  ],
}

// Row that carries the "Review" badge on each family's profile sub-page when
// that family's attention banner is on (Figma 4233:17353 / 4233:17746).
export const FAMILY_PROFILE_REVIEW_ROW = {
  [SERVICE_FAMILY.PET_SITTING]: 'about',
  [SERVICE_FAMILY.TRAINING]:    'credentials',
  [SERVICE_FAMILY.GROOMING]:    'about',
}

export function getFamilyProfileRows(family) {
  return FAMILY_PROFILE_ROWS[family] ?? []
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function getFamilyServices(family) {
  return SERVICES.filter((s) => s.family === family)
}

export function getActiveServices(family, serviceStates) {
  return getFamilyServices(family).filter((s) => serviceStates[s.id] === SERVICE_STATE.ACTIVE)
}

export function getInactiveServices(family, serviceStates) {
  return getFamilyServices(family).filter((s) => serviceStates[s.id] === SERVICE_STATE.INACTIVE)
}

export function hasActiveServices(family, serviceStates) {
  return getActiveServices(family, serviceStates).length > 0
}

/**
 * Pet sitting is treated as always available in every geo, so `familyInGeo`
 * only stores training + grooming. This helper centralizes that exception.
 */
export function isFamilyInGeo(family, familyInGeo) {
  if (family === SERVICE_FAMILY.PET_SITTING) return true
  return !!familyInGeo[family]
}

/**
 * Returns the status lines under a service row.
 *
 * Back-compat: the original signature took only `svc` and used the per-service
 * `acceptingNew` boolean. Callers can now pass an optional `opts` object with
 * `{ state, restriction }` sourced from `SERVICE_STATE` / `ACCEPTANCE_RESTRICTION`.
 * When `restriction` is provided it wins over the legacy `acceptingNew` field.
 *
 * Lines:
 * - state=ACTIVE   → ['Active' tertiary, ...optional restriction line]
 * - state=AWAY     → ['Away' price, ...optional restriction line]
 * - state=PENDING  → ['Awaiting Approval' link]
 * - state=INACTIVE → ['Inactive' tertiary]
 *
 * The services sub-page lists every service in the family regardless of state,
 * so INACTIVE now renders a visible status line (Figma 582:56416) rather than
 * the empty array the old inline "Add a new service" expansion needed.
 *
 * Restriction copy (only appended when state is ACTIVE or AWAY):
 * - REPEAT_ONLY    → 'Not accepting new pet owners'
 * - RECURRING_ONLY → 'Not accepting new pet owners for weekly care'
 * - ONE_TIME_ONLY  → 'Not accepting new pet owners for one-time care'
 */
export function getActiveServiceStatusLines(svc, opts) {
  if (!svc) return []
  const state = opts?.state ?? SERVICE_STATE.ACTIVE
  // Prefer explicit restriction; fall back to legacy `acceptingNew === false`
  // for back-compat with call sites that haven't been updated yet.
  const restriction =
    opts?.restriction ??
    (svc.acceptingNew === false ? ACCEPTANCE_RESTRICTION.REPEAT_ONLY : ACCEPTANCE_RESTRICTION.NONE)

  if (state === SERVICE_STATE.INACTIVE) return [{ text: 'Inactive', color: 'tertiary' }]
  if (state === SERVICE_STATE.PENDING)  return [{ text: 'Awaiting Approval', color: 'tertiary' }]

  const lines = []
  if (state === SERVICE_STATE.AWAY) {
    lines.push({ text: 'Away', color: 'tertiary' })
  } else {
    lines.push({ text: 'Active', color: 'tertiary' })
  }

  if (restriction && restriction !== ACCEPTANCE_RESTRICTION.NONE) {
    let text = null
    if (restriction === ACCEPTANCE_RESTRICTION.REPEAT_ONLY)    text = 'Not accepting new pet owners'
    if (restriction === ACCEPTANCE_RESTRICTION.RECURRING_ONLY) text = 'Not accepting new pet owners for weekly care'
    if (restriction === ACCEPTANCE_RESTRICTION.ONE_TIME_ONLY)  text = 'Not accepting new pet owners for one-time care'
    if (text) lines.push({ text, color: 'tertiary' })
  }

  return lines
}

/**
 * Circular service-icon badge tones per state. Values read straight from the
 * Management-hub migration Figma (582:56416) and mapped onto `palette`.
 */
export const SERVICE_BADGE_TONE = {
  [SERVICE_STATE.ACTIVE]:   { bg: ['green',   200], fg: ['green',   800] },
  [SERVICE_STATE.AWAY]:     { bg: ['yellow',  200], fg: ['yellow',  700] },
  [SERVICE_STATE.PENDING]:  { bg: ['blue',    200], fg: ['blue',    800] },
  [SERVICE_STATE.INACTIVE]: { bg: ['neutral', 200], fg: ['neutral', 500] },
}

export function serviceBadgeTone(state) {
  return SERVICE_BADGE_TONE[state] ?? SERVICE_BADGE_TONE[SERVICE_STATE.INACTIVE]
}
