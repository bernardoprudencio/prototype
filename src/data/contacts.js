import { peopleImages, petImages } from '../assets/images'

// Production tier rules (roverdotcom/web :: take_rates/constants.py)
// Derived server-side from cumulativeGrossValue (CAD) for sitters in the
// Canada alt-monetization rollout. Outside the rollout, both tierName AND
// cumulativeGrossValue are null — they always travel together.
const TIER_THRESHOLDS = [
  { name: 'Tier 1', max: 499 },
  { name: 'Tier 2', max: 999 },
  { name: 'Tier 3', max: Infinity },
]

const tierFor = (gbv) => {
  if (gbv == null || gbv <= 0) return null
  return TIER_THRESHOLDS.find(t => gbv < t.max)?.name ?? null
}

// Mirrors useRebookUserCardData.ts → formatCurrency(amount, 'CAD', 'en-CA', { includeDecimal: false })
const formatCAD = (amount) => new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
}).format(amount)

const formatPetNames = (names) => {
  if (!names || names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

const formatBookingLine = (count, gbv) => {
  const label = count === 1 ? '1 booking' : `${count} bookings`
  return gbv == null ? label : `${label} · ${formatCAD(gbv)} complete`
}

const client = ({
  id,
  displayName,
  imageUrl = null,
  pets = [],
  bookingCount = 0,
  gbv = null,
  cancelledBookings = null,
  hasUpcoming = true,
  recurringSchedule = null,
  lockedServices = [],
}) => {
  // No-tier clients pass an explicit cancelledBookings list. Per the
  // CumulativeGrossBookingValueCalculator in roverdotcom/web, cancelled
  // stays with recaptured deposits are excluded from GBV — so gbv stays
  // null and no tier pill is shown, but they still count toward
  // bookingCount (matches `relationship.bookedStayCount`).
  const count = cancelledBookings ? cancelledBookings.length : bookingCount
  const petNames = pets.map(p => p.name)
  return {
    id,
    displayName,
    imageUrl,
    pets,
    tierName: tierFor(gbv),
    bookingCount: count,
    gbv,
    cancelledBookings,
    hasUpcoming,
    recurringSchedule,
    // Service keys whose rates start out locked for this client. Production has
    // no per-client capability flag: a lock is just the presence of
    // LockedServiceAddOn rows for (requester, service), so every client can
    // lock every browsable service and this list is only the seed state.
    // See src/data/lockableRates.js.
    lockedServices,
    subtitleText: formatPetNames(petNames),
    bookingInfoText: formatBookingLine(count, gbv),
  }
}

// Pet helpers: pet IDs are local to each client (1..n). Image references come
// from src/assets/images.js so designers can swap them in one place.
// `details` is optional and only populated where a surface renders the
// production "Pets" section (mappers/base.py:236-270 — subtitle is
// `pet.get_breeds_display()`, text is "{gender}, {birthday}, {weight}").
const pet = (id, name, image, details = null) => ({ id, name, image, details })

export const CLIENTS = [
  client({
    id: 'owen',
    displayName: 'Owen O.',
    imageUrl: peopleImages.owen,
    pets: [
      pet(1, 'Koni',   petImages.koni,   { breeds: 'Siberian Husky', gender: 'Female', birthday: '4 years old', weight: '48 lbs' }),
      pet(2, 'Burley', petImages.burley, { breeds: 'Labrador Retriever mix', gender: 'Male', birthday: '7 years old', weight: '72 lbs' }),
    ],
    bookingCount: 12,
    gbv: 3580,
    recurringSchedule: {
      service: 'Weekly 60 min walks',
      serviceDuration: 60,
      address: '123 Fourth Ave, Seattle, WA',
      template: [
        { day: 'Monday',    time: '9:00 AM' },
        { day: 'Wednesday', time: '9:00 AM' },
        { day: 'Friday',    time: '9:00 AM' },
      ],
      pricing: {
        pets: [
          { petName: 'Koni',   rateType: 'Standard rate',       ratePerWalk: 20, slug: 'standard-rate' },
          { petName: 'Burley', rateType: 'Additional dog rate', ratePerWalk: 10, slug: 'additional-dog' },
        ],
        addOns: [{ label: '60-min add-on', ratePerWalk: 10, slug: 'long-walk' }],
      },
    },
  }),
  client({
    id: 'james',
    displayName: 'James T.',
    imageUrl: peopleImages.james,
    pets: [pet(1, 'Archie', petImages.archie, { breeds: 'Golden Retriever', gender: 'Male', birthday: '2 years old', weight: '65 lbs' })],
    bookingCount: 3,
    gbv: 320,
    hasUpcoming: false,
    recurringSchedule: {
      service: 'Weekly 30 min walks',
      serviceDuration: 30,
      address: '450 Pine St, Seattle, WA',
      template: [
        { day: 'Tuesday',  time: '2:00 PM' },
        { day: 'Thursday', time: '2:00 PM' },
      ],
      pricing: {
        pets: [{ petName: 'Archie', rateType: 'Standard rate', ratePerWalk: 20, slug: 'standard-rate' }],
        addOns: [],
      },
    },
  }),
  // No tier: every walking booking was cancelled (deposit recaptured → excluded from GBV).
  client({
    id: 'sarah',
    displayName: 'Sarah S.',
    imageUrl: peopleImages.sarah,
    pets: [pet(1, 'Milo', petImages.milo, { breeds: 'Beagle', gender: 'Male', birthday: '6 years old', weight: '24 lbs' })],
    cancelledBookings: [
      { serviceKey: 'dog_walking', price: 25 },
      { serviceKey: 'dog_walking', price: 25 },
      { serviceKey: 'dog_walking', price: 25 },
    ],
    recurringSchedule: {
      service: 'Weekly 30 min walks',
      serviceDuration: 30,
      address: '88 Union St, Seattle, WA',
      template: [
        { day: 'Monday',    time: '4:00 PM' },
        { day: 'Wednesday', time: '4:00 PM' },
        { day: 'Friday',    time: '4:00 PM' },
      ],
      pricing: {
        pets: [{ petName: 'Milo', rateType: 'Standard rate', ratePerWalk: 20, slug: 'standard-rate' }],
        addOns: [],
      },
    },
  }),
  client({
    id: 'marcus',
    displayName: 'Marcus B.',
    imageUrl: peopleImages.marcus,
    pets: [
      pet(1, 'Biscuit', petImages.biscuit, { breeds: 'Cocker Spaniel', gender: 'Female', birthday: '5 years old', weight: '26 lbs' }),
      pet(2, 'Pepper',  petImages.pepper,  { breeds: 'Miniature Schnauzer', gender: 'Female', birthday: '8 years old', weight: '15 lbs' }),
      pet(3, 'Luna',    petImages.luna,    { breeds: 'Border Collie', gender: 'Female', birthday: '3 years old', weight: '38 lbs' }),
    ],
    cancelledBookings: [
      { serviceKey: 'dog_walking', price: 25 },
    ],
  }),
  client({
    id: 'priya',
    displayName: 'Priya R.',
    imageUrl: peopleImages.priya,
    pets: [pet(1, 'Pickle', petImages.pickle, { breeds: 'French Bulldog', gender: 'Male', birthday: '1 year old', weight: '22 lbs' })],
    cancelledBookings: [
      { serviceKey: 'dog_walking',    price: 25 },
      { serviceKey: 'drop_in_visits', price: 30 },
      { serviceKey: 'dog_walking',    price: 25 },
    ],
  }),
  client({
    id: 'lena',
    displayName: 'Lena K.',
    imageUrl: peopleImages.lena,
    pets: [
      pet(1, 'Mochi', petImages.mochi, { breeds: 'Shiba Inu',              gender: 'Female', birthday: '3 years old', weight: '19 lbs' }),
      pet(2, 'Yuzu',  petImages.yuzu,  { breeds: 'Corgi, Australian Shepherd mix', gender: 'Male', birthday: '5 years old', weight: '27 lbs' }),
    ],
    bookingCount: 24,
    gbv: 5640,
    // Lena is the long-running boarding client the locked-rates feature was
    // built for, so her boarding rates start locked. In production this is not a
    // client attribute at all — it is the presence of LockedServiceAddOn rows
    // for (requester, service), unique_together on
    // (service, requester, add_on_type). Every client here can lock every
    // browsable service; this list is only which ones begin locked.
    //
    // The mock collapses the per-row model to one boolean per service because
    // the API write is full-set replacement (unlock POSTs an empty list), so
    // per-row toggling never happens. Her rate numbers live in
    // src/data/lockableRates.js — relationshipData.js prices her demo booking's
    // ledger off them.
    lockedServices: ['boarding'],
  }),
  // gbv is intentionally just below Tier 3 ($999) so the upcoming booking
  // crosses the milestone — exercises the willCross callout copy.
  client({
    id: 'diego',
    displayName: 'Diego M.',
    imageUrl: null,
    pets: [pet(1, 'Toby', petImages.toby, { breeds: 'Jack Russell Terrier', gender: 'Male', birthday: '9 years old', weight: '17 lbs' })],
    bookingCount: 4,
    gbv: 960,
  }),
  client({
    id: 'amelia',
    displayName: 'Amelia W.',
    imageUrl: peopleImages.amelia,
    pets: [
      pet(1, 'Olive', petImages.olive, { breeds: 'Dachshund', gender: 'Female', birthday: '4 years old', weight: '12 lbs' }),
      pet(2, 'Henry', petImages.henry, { breeds: 'Bernese Mountain Dog', gender: 'Male', birthday: '6 years old', weight: '88 lbs' }),
    ],
    bookingCount: 8,
    gbv: 1920,
    hasUpcoming: false,
    // A second seeded lock, on a different service, so the surfaces can be
    // checked for per-(client x service) independence rather than one global flag.
    lockedServices: ['dog_walking'],
  }),
  client({
    id: 'nora',
    displayName: 'Nora P.',
    imageUrl: peopleImages.nora,
    pets: [pet(1, 'Bean', petImages.bean, { breeds: 'Chihuahua, Terrier mix', gender: 'Male', birthday: '11 years old', weight: '9 lbs' })],
    bookingCount: 5,
    gbv: 400,
  }),
  client({
    id: 'takashi',
    displayName: 'Takashi I.',
    imageUrl: peopleImages.takashi,
    pets: [pet(1, 'Sushi', petImages.sushi, { breeds: 'Shiba Inu', gender: 'Female', birthday: '2 years old', weight: '18 lbs' })],
    bookingCount: 2,
    gbv: 750,
  }),
]

const sitter = ({ id, displayName, imageUrl = null, locationText, mostRecentService }) => ({
  id,
  displayName,
  imageUrl,
  subtitleText: locationText,
  bookingInfoText: `Most recent booking: ${mostRecentService}`,
})

export const SITTERS = [
  sitter({ id: 'rachel', displayName: 'Rachel C.', imageUrl: peopleImages.rachel, locationText: 'Greenwood, Seattle WA',  mostRecentService: 'Boarding' }),
  sitter({ id: 'tom',    displayName: 'Tom H.',    imageUrl: peopleImages.tom,    locationText: 'Ballard, Seattle WA',    mostRecentService: 'Drop-in visits' }),
  sitter({ id: 'sofia',  displayName: 'Sofia A.',  imageUrl: peopleImages.sofia,  locationText: 'Fremont, Seattle WA',    mostRecentService: 'Dog walking' }),
  sitter({ id: 'david',  displayName: 'David L.',  imageUrl: peopleImages.david,  locationText: 'Queen Anne, Seattle WA', mostRecentService: 'Daycare' }),
  sitter({ id: 'hannah', displayName: 'Hannah W.', imageUrl: peopleImages.hannah, locationText: 'Capitol Hill, WA',       mostRecentService: 'House sitting' }),
  sitter({ id: 'marco',  displayName: 'Marco V.',  imageUrl: null,                locationText: 'Wallingford, Seattle WA', mostRecentService: 'Dog walking' }),
]

export const SORT_OPTIONS = [
  { value: 'alphabetical',   label: 'First name (A to Z)' },
  { value: 'total_bookings', label: 'Total bookings (high to low)' },
  { value: 'gbv_progress',   label: 'Progress (high to low)' },
]

export const sortClients = (clients, order) => {
  const arr = [...clients]
  if (order === 'alphabetical')   return arr.sort((a, b) => a.displayName.localeCompare(b.displayName))
  if (order === 'total_bookings') return arr.sort((a, b) => b.bookingCount - a.bookingCount)
  if (order === 'gbv_progress')   return arr.sort((a, b) => (b.gbv ?? 0) - (a.gbv ?? 0))
  return arr
}

export const getClient = (id) => CLIENTS.find(c => c.id === id) ?? null

// ── Alt-monetization gate (roverdotcom/web :: RelationshipProgressScreenView,
// views.py:1011-1013) ────────────────────────────────────────────────────────
// `tierName` and `bookingInfoText` are baked at module load in the `client()`
// factory, so they cannot read a runtime flag. This is a selector over a client
// rather than a reshaping of CLIENTS.
//
// Outside the rollout production returns tierName and cumulativeGrossValue as
// null together (see the note at the top of this file), so the contacts card
// drops both the tier pill and the "· $X complete" clause on its own.
export const withAltMonetization = (client, on) => (on || !client) ? client : ({
  ...client,
  tierName: null,
  gbv: null,
  bookingInfoText: formatBookingLine(client.bookingCount, null),
})

// "Progress (high to low)" only exists because of the graduated take rate test.
export const sortOptionsFor = (on) =>
  on ? SORT_OPTIONS : SORT_OPTIONS.filter(o => o.value !== 'gbv_progress')
