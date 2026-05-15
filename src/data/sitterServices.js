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
 *   - A family with any ACTIVE service → primary section with that family's
 *     services list + Profile rows. INACTIVE services in the same family
 *     appear under an "Add a new service" expandable row.
 *   - A family with no ACTIVE services but in geo (per `isFamilyInGeo`) →
 *     one row in the "Other services" section. Pet sitting is always in geo,
 *     so it always falls back to this row when no pet-sitting services are
 *     ACTIVE.
 *   - A family with no ACTIVE services and not in geo → omitted (only
 *     applies to training / grooming).
 */

// ─── Per-service state ───────────────────────────────────────────────────────
export const SERVICE_STATE = {
  ACTIVE:   'active',   // configured; appears in the family's services list
  AWAY:     'away',     // active but not searchable
  INACTIVE: 'inactive', // not configured; appears under "Add a new service"
}

// ─── Per-service customer-acceptance restriction ─────────────────────────────
// Independent of SERVICE_STATE. Drives the "Not accepting new customers…" copy
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
export const FAMILY_SIGNUP = {
  [SERVICE_FAMILY.PET_SITTING]: {
    label:    'Get started with pet sitting',
    sublabel: 'Boarding, House Sitting, Doggy Day Care, Drop-In Visits, and Dog Walking',
  },
  [SERVICE_FAMILY.TRAINING]: {
    label:    'Get started with dog training',
    sublabel: 'Credentials required. Share your training certifications to get started.',
  },
  [SERVICE_FAMILY.GROOMING]: {
    label:    'Get started with grooming',
    sublabel: "In your place or the pet parent's home",
  },
}

// ─── Service catalog ─────────────────────────────────────────────────────────
// `acceptingNew` controls the "Not accepting new customers" status sublabel
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

// ─── User-testing default ────────────────────────────────────────────────────
// Boarding, Doggy Day Care, Dog Walking, and Dog Training active so participants
// see two primary family sections (Pet sitting + Training) and the
// Services/Profile collapse pattern is exercised; House Sitting and Drop-In
// remain inactive under Pet sitting's `Add a new service`; Grooming is the only
// family left in `Other services`.
export const DEFAULT_SERVICE_STATES = {
  boarding:      SERVICE_STATE.ACTIVE,
  house_sitting: SERVICE_STATE.INACTIVE,
  doggy_daycare: SERVICE_STATE.ACTIVE,
  drop_in:       SERVICE_STATE.INACTIVE,
  dog_walking:   SERVICE_STATE.ACTIVE,
  dog_training:  SERVICE_STATE.ACTIVE,
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

// Row ids that render the "Missing information" status line when the
// `showMissingInfo` testing-mode toggle is on, scoped per family. The
// user-testing scenario isolates the missing-information treatment to Pet
// sitting → Profile → About — a single, unambiguous surface. Other families'
// `about` rows (e.g. Training → Profile → About) intentionally do NOT light up.
//
// Shape: `{ [family]: [rowId, ...] }`. Families absent from the map have no
// missing-info rows. Row ids can refer to either a service id (e.g.
// `'boarding'`) or a profile row id (e.g. `'about'`); the calling site decides
// which is which via the `family` it passes to `isMissingInfoRow`.
export const MISSING_INFO_DEMO_ROWS = {
  [SERVICE_FAMILY.PET_SITTING]: ['about'],
}

export function isMissingInfoRow(rowId, family) {
  const rows = MISSING_INFO_DEMO_ROWS[family]
  return !!rows && rows.includes(rowId)
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
 * Rows that render under the Profile subsection of each active family in
 * ServiceSettingsScreen. Rows are family-specific — pet sitting, training, and
 * grooming each show a different set per Figma (UX2-2136).
 *
 * Each row is `{ id, label, sublabel, completionKey? }`. `completionKey` is a
 * dotted path into `SITTER_PROFILE.profile` (see `src/data/sitterProfile.js`)
 * that the screen reads to decide whether to show a green check on that row.
 */
export const FAMILY_PROFILE_ROWS = {
  [SERVICE_FAMILY.PET_SITTING]: [
    { id: 'about',        label: 'About',        sublabel: 'Share your pet care experience and approach.' },
    { id: 'photos',       label: 'Photos',       sublabel: 'Manage your profile gallery.' },
    { id: 'testimonials', label: 'Testimonials', sublabel: 'Ask people to write about your pet care experience.', completionKey: 'petSitting.testimonialsComplete' },
  ],
  [SERVICE_FAMILY.TRAINING]: [
    { id: 'about',        label: 'About',        sublabel: 'Highlight your training experience and qualifications.' },
    { id: 'photos',       label: 'Photos',       sublabel: 'Manage your profile gallery.' },
    { id: 'credentials',  label: 'Credentials',  sublabel: 'This will show on your profile and the search page.' },
    { id: 'testimonials', label: 'Testimonials', sublabel: 'Ask people to write about your trainer experience.', completionKey: 'training.testimonialsComplete' },
  ],
  [SERVICE_FAMILY.GROOMING]: [
    { id: 'edit_profile', label: 'Edit profile', sublabel: 'Bio, photos, credentials, testimonials, and more — all in one place.' },
  ],
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
 * - state=ACTIVE        → ['Active' tertiary, ...optional restriction line]
 * - state=AWAY          → ['Away' price, ...optional restriction line]
 * - state=INACTIVE      → []  (no inline status rendered for inactive rows)
 *
 * Restriction copy (only appended when state is ACTIVE or AWAY):
 * - REPEAT_ONLY    → 'Not accepting new customers'
 * - RECURRING_ONLY → 'Not accepting new customers for weekly care'
 * - ONE_TIME_ONLY  → 'Not accepting new customers for one-time care'
 */
export function getActiveServiceStatusLines(svc, opts) {
  if (!svc) return []
  const state = opts?.state ?? SERVICE_STATE.ACTIVE
  // Prefer explicit restriction; fall back to legacy `acceptingNew === false`
  // for back-compat with call sites that haven't been updated yet.
  const restriction =
    opts?.restriction ??
    (svc.acceptingNew === false ? ACCEPTANCE_RESTRICTION.REPEAT_ONLY : ACCEPTANCE_RESTRICTION.NONE)

  if (state === SERVICE_STATE.INACTIVE) return []

  const lines = []
  if (state === SERVICE_STATE.AWAY) {
    lines.push({ text: 'Away', color: 'price' })
  } else {
    lines.push({ text: 'Active', color: 'tertiary' })
  }

  if (restriction && restriction !== ACCEPTANCE_RESTRICTION.NONE) {
    let text = null
    if (restriction === ACCEPTANCE_RESTRICTION.REPEAT_ONLY)    text = 'Not accepting new customers'
    if (restriction === ACCEPTANCE_RESTRICTION.RECURRING_ONLY) text = 'Not accepting new customers for weekly care'
    if (restriction === ACCEPTANCE_RESTRICTION.ONE_TIME_ONLY)  text = 'Not accepting new customers for one-time care'
    if (text) lines.push({ text, color: 'tertiary' })
  }

  return lines
}

/**
 * Joins inactive service labels into the "Add a new service" sublabel.
 * Two items → "A or B". 3+ items → "A, B, or C" (Rover style uses the Oxford comma).
 */
export function joinServiceLabels(services) {
  const labels = services.map((s) => s.label)
  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, or ${labels[labels.length - 1]}`
}
