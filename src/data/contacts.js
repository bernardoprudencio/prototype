import { peopleImages } from '../assets/images'

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
  if (names.length === 2) return `${names[0]} & ${names[1]}`
  return `${names[0]} & ${names.length - 1} others`
}

const formatBookingLine = (count, gbv) => {
  const label = count === 1 ? '1 booking' : `${count} bookings`
  return gbv == null ? label : `${label} · ${formatCAD(gbv)} complete`
}

const client = ({ id, displayName, imageUrl = null, petNames = [], bookingCount = 0, gbv = null }) => ({
  id,
  displayName,
  imageUrl,
  tierName: tierFor(gbv),
  bookingCount,
  gbv,
  subtitleText: formatPetNames(petNames),
  bookingInfoText: formatBookingLine(bookingCount, gbv),
})

export const CLIENTS = [
  client({ id: 'owen',    displayName: 'Owen O.',          imageUrl: peopleImages.owen,    petNames: ['Koni', 'Burley'],            bookingCount: 12, gbv: 3580 }),
  client({ id: 'james',   displayName: 'James T.',         imageUrl: peopleImages.james,   petNames: ['Archie'],                    bookingCount: 6,  gbv: 1240 }),
  client({ id: 'sarah',   displayName: 'Sarah S.',         imageUrl: peopleImages.sarah,   petNames: ['Milo'],                      bookingCount: 3 }),
  client({ id: 'marcus',  displayName: 'Marcus B.',        imageUrl: peopleImages.marcus,  petNames: ['Biscuit', 'Pepper', 'Luna'], bookingCount: 1 }),
  client({ id: 'priya',   displayName: 'Priya R.',         imageUrl: peopleImages.priya,   petNames: ['Pickle'],                    bookingCount: 3 }),
  client({ id: 'lena',    displayName: 'Lena K.',          imageUrl: peopleImages.lena,    petNames: ['Mochi', 'Yuzu'],             bookingCount: 24, gbv: 5640 }),
  client({ id: 'diego',   displayName: 'Diego M.',         imageUrl: null,                 petNames: ['Toby'],                      bookingCount: 4,  gbv: 880 }),
  client({ id: 'amelia',  displayName: 'Amelia Wentworth', imageUrl: peopleImages.amelia,  petNames: ['Olive', 'Henry'],            bookingCount: 8,  gbv: 1920 }),
  client({ id: 'nora',    displayName: 'Nora P.',          imageUrl: peopleImages.nora,    petNames: ['Bean'],                      bookingCount: 5,  gbv: 400 }),
  client({ id: 'takashi', displayName: 'Takashi I.',       imageUrl: peopleImages.takashi, petNames: ['Sushi'],                     bookingCount: 2,  gbv: 750 }),
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
