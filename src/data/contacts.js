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
    subtitleText: formatPetNames(petNames),
    bookingInfoText: formatBookingLine(count, gbv),
  }
}

// Pet helpers: pet IDs are local to each client (1..n). Image references come
// from src/assets/images.js so designers can swap them in one place.
const pet = (id, name, image) => ({ id, name, image })

export const CLIENTS = [
  client({
    id: 'owen',
    displayName: 'Owen O.',
    imageUrl: peopleImages.owen,
    pets: [pet(1, 'Koni', petImages.koni), pet(2, 'Burley', petImages.burley)],
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
          { petName: 'Koni',   rateType: 'Standard rate',       ratePerWalk: 20 },
          { petName: 'Burley', rateType: 'Additional dog rate', ratePerWalk: 10 },
        ],
        addOns: [{ label: '60-min add-on', ratePerWalk: 10 }],
      },
    },
  }),
  client({
    id: 'james',
    displayName: 'James T.',
    imageUrl: peopleImages.james,
    pets: [pet(1, 'Archie', petImages.archie)],
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
        pets: [{ petName: 'Archie', rateType: 'Standard rate', ratePerWalk: 20 }],
        addOns: [],
      },
    },
  }),
  // No tier: every walking booking was cancelled (deposit recaptured → excluded from GBV).
  client({
    id: 'sarah',
    displayName: 'Sarah S.',
    imageUrl: peopleImages.sarah,
    pets: [pet(1, 'Milo', petImages.milo)],
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
        pets: [{ petName: 'Milo', rateType: 'Standard rate', ratePerWalk: 20 }],
        addOns: [],
      },
    },
  }),
  client({
    id: 'marcus',
    displayName: 'Marcus B.',
    imageUrl: peopleImages.marcus,
    pets: [
      pet(1, 'Biscuit', petImages.biscuit),
      pet(2, 'Pepper',  petImages.pepper),
      pet(3, 'Luna',    petImages.luna),
    ],
    cancelledBookings: [
      { serviceKey: 'dog_walking', price: 25 },
    ],
  }),
  client({
    id: 'priya',
    displayName: 'Priya R.',
    imageUrl: peopleImages.priya,
    pets: [pet(1, 'Pickle', petImages.pickle)],
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
    pets: [pet(1, 'Mochi', petImages.mochi), pet(2, 'Yuzu', petImages.yuzu)],
    bookingCount: 24,
    gbv: 5640,
  }),
  // gbv is intentionally just below Tier 3 ($999) so the upcoming booking
  // crosses the milestone — exercises the willCross callout copy.
  client({
    id: 'diego',
    displayName: 'Diego M.',
    imageUrl: null,
    pets: [pet(1, 'Toby', petImages.toby)],
    bookingCount: 4,
    gbv: 960,
  }),
  client({
    id: 'amelia',
    displayName: 'Amelia W.',
    imageUrl: peopleImages.amelia,
    pets: [pet(1, 'Olive', petImages.olive), pet(2, 'Henry', petImages.henry)],
    bookingCount: 8,
    gbv: 1920,
    hasUpcoming: false,
  }),
  client({
    id: 'nora',
    displayName: 'Nora P.',
    imageUrl: peopleImages.nora,
    pets: [pet(1, 'Bean', petImages.bean)],
    bookingCount: 5,
    gbv: 400,
  }),
  client({
    id: 'takashi',
    displayName: 'Takashi I.',
    imageUrl: peopleImages.takashi,
    pets: [pet(1, 'Sushi', petImages.sushi)],
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
