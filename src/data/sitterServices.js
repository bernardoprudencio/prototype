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
  INACTIVE: 'inactive', // not configured; appears under "Add a new service"
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
    label:    'Sign-up to pet sitting',
    sublabel: 'Boarding, House Sitting, Doggy Day Care, Drop-In Visits and Dog Walking',
  },
  [SERVICE_FAMILY.TRAINING]: {
    label:    'Sign-up to dog training',
    sublabel: 'Credentials are required',
  },
  [SERVICE_FAMILY.GROOMING]: {
    label:    'Sign-up to grooming',
    sublabel: "In your place or the client's place",
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

// ─── Variant 2 default — matches Figma node 386:16335 ────────────────────────
// Boarding, Doggy Day Care, Drop-In active; House Sitting, Dog Walking inactive
// (revealed via "Add a new service"); training + grooming available for sign-up.
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
    { id: 'information',  label: 'Information',  sublabel: 'Edit your pet profile information' },
    { id: 'photos',       label: 'Photos',       sublabel: 'Manage your profile gallery' },
    { id: 'testimonials', label: 'Testimonials', sublabel: 'Ask people to write about your pet care experience.', completionKey: 'petSitting.testimonialsComplete' },
  ],
  [SERVICE_FAMILY.TRAINING]: [
    { id: 'trainer_experience', label: 'Trainer experience', sublabel: 'Fill out your training bio to highlight your training qualifications for pet parents.' },
    { id: 'photos',             label: 'Photos',             sublabel: 'Manage your profile gallery' },
    { id: 'credentials',        label: 'Credentials',        sublabel: 'This will show on your profile and the search page.' },
    { id: 'testimonials',       label: 'Testimonials',       sublabel: 'Ask people to write about your trainer experience.', completionKey: 'training.testimonialsComplete' },
  ],
  [SERVICE_FAMILY.GROOMING]: [
    { id: 'edit_profile', label: 'Edit profile', sublabel: 'Build your Grooming profile' },
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
 * Returns the status lines under an ACTIVE service row.
 * - active + acceptingNew=true  → ['Active' tertiary]
 * - active + acceptingNew=false → ['Active' tertiary, 'Not accepting…' tertiary]
 */
export function getActiveServiceStatusLines(svc) {
  if (!svc) return []
  const lines = [{ text: 'Active', color: 'tertiary' }]
  if (svc.acceptingNew === false) {
    lines.push({ text: 'Not accepting new customers', color: 'tertiary' })
  }
  return lines
}

/**
 * Joins inactive service labels into the "Add a new service" sublabel.
 * Two items → "A or B". 3+ items → "A, B or C".
 */
export function joinServiceLabels(services) {
  const labels = services.map((s) => s.label)
  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')} or ${labels[labels.length - 1]}`
}
