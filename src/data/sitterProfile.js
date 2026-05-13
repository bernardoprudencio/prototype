/**
 * Sitter profile / Service settings data
 *
 * Mirrors the shape used in `roverdotcom/web` provider-profile (the source of
 * truth for Service Settings). The web app fetches this data from the backend
 * and renders the same sections (Services, Profile, Business, About you,
 * Destructive area). Here we hardcode a single sitter so the prototype can
 * exercise the layout, status states, and "complete" indicators.
 *
 * Icons are intentionally not embedded — the screen file owns icon mapping so
 * this module can stay framework-agnostic.
 */

// ─── Service status ──────────────────────────────────────────────────────────
export const SERVICE_STATUS = {
  ACTIVE: 'active',
  AWAY: 'away',
  INACTIVE: 'inactive',
}

export const SERVICE_STATUS_LABEL = {
  active: 'Active',
  away: 'Away',
  inactive: 'Inactive',
}

/**
 * Returns the status lines to render under a service label.
 * Each entry is `{ text, color }` where `color` is a token name
 * (`'tertiary'` | `'secondary'`) — the screen maps it to a hex value.
 *
 * - active + acceptingNew=true   → ['Active' tertiary]
 * - active + acceptingNew=false  → ['Active' tertiary, 'Not accepting…' tertiary]
 * - away                         → ['Away' secondary]
 * - inactive                     → ['Inactive' secondary]
 */
export function getServiceStatusLines(svc) {
  if (!svc) return []
  if (svc.status === SERVICE_STATUS.ACTIVE) {
    const lines = [{ text: 'Active', color: 'tertiary' }]
    if (svc.acceptingNew === false) {
      lines.push({ text: 'Not accepting new customers', color: 'tertiary' })
    }
    return lines
  }
  if (svc.status === SERVICE_STATUS.AWAY) {
    return [{ text: 'Away', color: 'secondary' }]
  }
  if (svc.status === SERVICE_STATUS.INACTIVE) {
    return [{ text: 'Inactive', color: 'secondary' }]
  }
  return []
}

// ─── Cancellation policy options ─────────────────────────────────────────────
// Mirrors roverdotcom/web `provider-profile/CancellationPolicy.constants`.
export const CANCELLATION_POLICY = {
  FLEXIBLE: 'flexible',
  MODERATE: 'moderate',
  STRICT: 'strict',
}

export const CANCELLATION_POLICY_OPTIONS = [
  {
    value: CANCELLATION_POLICY.FLEXIBLE,
    label: 'Flexible',
    sublabel: 'Free cancellation if the booking is cancelled at least one day before noon.',
  },
  {
    value: CANCELLATION_POLICY.MODERATE,
    label: 'Moderate',
    sublabel: 'Free cancellation if the booking is cancelled at least three days before noon.',
  },
  {
    value: CANCELLATION_POLICY.STRICT,
    label: 'Strict',
    sublabel: 'Free cancellation if the booking is cancelled at least seven days before noon.',
  },
]

// ─── Boarding service details (mirrors prod ProviderProfileHostingService) ───
// Fields aligned with the form data shape used by
// `roverdotcom/web HostingServiceForm.tsx`. Only the fields visible in the
// prototype shell are kept here.
export const BOARDING_SETTINGS = {
  slug: 'overnight-boarding',
  displayName: 'Boarding',
  description: 'Overnight pet care in your home',

  // Search Settings
  active: true,
  isAway: false,
  isAcceptingNewCustomers: true,
  isAcceptingNewRecurringClients: true,
  canUpdateAcceptingRecurringClients: true,

  // Pet care (pet-care-modes experiment)
  dogCareEnabled: true,
  petPreferences: {
    cats: false,
    smallDogs: true,
    mediumDogs: true,
    largeDogs: true,
    giantDogs: false,
    puppies: true,
  },

  // Rates
  baseRate: 45,
  baseRateUnit: 'night',
  autoUpdateAdditionalRates: true,
  additionalRates: [
    { slug: 'additional-dog',   label: 'Additional dog',   price: 35, unit: 'night',   active: true,  isFree: false },
    { slug: 'puppy',            label: 'Puppy care',       price: 10, unit: 'night',   active: true,  isFree: false },
    { slug: 'holiday',          label: 'Holiday rate',     price: 15, unit: 'night',   active: false, isFree: false },
    { slug: 'bath',             label: 'Bathing',          price: 20, unit: 'service', active: false, isFree: true  },
    { slug: 'short-notice',     label: 'Short notice',     price: 10, unit: 'night',   active: false, isFree: false, isNew: true },
    { slug: 'pickup-dropoff',   label: 'Pickup / dropoff', price: 25, unit: 'service', active: false, isFree: false },
  ],

  // Availability
  availabilityPreferences: {
    isAlwaysAvailable: false,
    // Mon=true, Tue=true, ... — keys are 'mon','tue','wed','thu','fri','sat','sun'
    daysOfWeek: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
    spacesAvailable: 2,
    leadTimeHours: 24,
  },
  preferences: {
    timeAloneHours: 4,
    homeType: 'House',
    yardType: 'Fenced yard',
    ownersExpect: ['Dogs allowed on furniture', 'Dogs allowed on bed'],
    hostingOptions: ['Non-smoking household', 'Person home all day'],
  },

  // Cancellation
  cancellationPolicy: CANCELLATION_POLICY.MODERATE,
}

// ─── Sitter profile (hardcoded for prototype) ────────────────────────────────
export const SITTER_PROFILE = {
  services: [
    { id: 'boarding',      label: 'Boarding',       status: SERVICE_STATUS.ACTIVE,   acceptingNew: true  },
    { id: 'doggy_daycare', label: 'Doggy Day Care', status: SERVICE_STATUS.ACTIVE,   acceptingNew: false },
    { id: 'drop_in',       label: 'Drop-In Visits', status: SERVICE_STATUS.ACTIVE,   acceptingNew: true  },
    { id: 'dog_walking',   label: 'Dog Walking',    status: SERVICE_STATUS.AWAY,     acceptingNew: true  },
    { id: 'house_sitting', label: 'House Sitting',  status: SERVICE_STATUS.INACTIVE, acceptingNew: true  },
  ],
  boarding: BOARDING_SETTINGS,
  profile: {
    petSitting: { testimonialsComplete: true },
    training:   { testimonialsComplete: false },
    grooming:   {},
  },
  business: {
    backgroundCheckPassed: true,
  },
  // Stub destinations — all unused by the prototype today; included so that
  // future wiring of rows to outbound links has a single place to update.
  destinations: {
    viewProfile:           'https://www.rover.com/members/sitter-prototype',
    receivePayments:       'https://dashboard.stripe.com',
    promote:               '/service-settings/promote',
    availability:          '/service-settings/availability',
    insights:              '/service-settings/insights',
    backgroundCheck:       '/service-settings/background-check',
    information:           '/service-settings/information',
    photos:                '/service-settings/photos',
    testimonials:          '/service-settings/testimonials',
    details:               '/service-settings/details',
    pets:                  '/service-settings/pets',
    phoneNumbers:          '/service-settings/phone-numbers',
    paymentMethods:        '/service-settings/payment-methods',
    stopProvidingServices: '/service-settings/stop',
  },
}
