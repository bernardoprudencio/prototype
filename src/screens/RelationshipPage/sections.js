/**
 * sections — the relationship page's two-section IA, shared by both widths.
 *
 * The page is restructured around "Requests and bookings" and "Rates" so it
 * still reads as a structured page when the graduated take rate is off and the
 * progress tracker does not render (Figma 192:15290 desktop / 192:15414 mobile).
 * Desktop turns the list into a master-detail nav card (`SectionNav`), mobile
 * into a chip row plus one accordion per section (`SectionAccordion`) — both
 * read this one model, so the section set, order, labels and icons can only
 * disagree by being edited here.
 *
 * Pets and Notes appear in both frames and are deliberately out of scope; this
 * list is two entries on purpose.
 *
 * PROVENANCE: the section labels and the bookings sublabels below are
 * PROTOTYPE-ONLY — production has no relationship-page section nav, so there is
 * no string to port (the same reason lockedRatesCopy.js marks its own
 * relationship-page block PROTOTYPE-ONLY). The Rates label and its sublabels ARE
 * reused from that block rather than reinvented here.
 */
import { ChartIcon, LockIcon } from '../../assets/icons'
import { RATES_SECTION_TITLE, ratesLockedSubtitle, NO_LOCKED_RATES } from '../../data/lockedRatesCopy'

export const SECTION_BOOKINGS = 'bookings'
export const SECTION_RATES    = 'rates'

// PROTOTYPE-ONLY. Names the whole booking column — requests included, since a
// pending request is listed there alongside confirmed stays.
export const BOOKINGS_SECTION_TITLE = 'Requests and bookings'

// Icons are component references, not elements: this is a plain .js module, and
// the two renderers size and colour them differently (24px leading slot in the
// nav row, same in the accordion header).
export const SECTIONS = [
  { key: SECTION_BOOKINGS, label: BOOKINGS_SECTION_TITLE, icon: ChartIcon },
  { key: SECTION_RATES,    label: RATES_SECTION_TITLE,    icon: LockIcon },
]

/**
 * PROTOTYPE-ONLY. Reads the `bookings` object `getRelationshipData` returns
 * (`{ upcoming, past, archived }`). Upcoming wins when there is any, because
 * that is the actionable count; otherwise the page falls back to what the
 * relationship has already delivered, and only says "no bookings" when both are
 * empty. Archived is deliberately not counted — it is the tail of the list, not
 * a headline.
 */
export function bookingsSublabel(bookings) {
  const upcoming = bookings?.upcoming?.length ?? 0
  if (upcoming > 0) return `${upcoming} upcoming booking${upcoming === 1 ? '' : 's'}`
  const past = bookings?.past?.length ?? 0
  if (past > 0) return `${past} completed booking${past === 1 ? '' : 's'}`
  return 'No bookings yet'
}

// Same two strings the shipped Rates row already uses, so the section nav and
// that row can never describe the same state differently.
export function ratesSublabel(lockedCount) {
  return lockedCount > 0 ? ratesLockedSubtitle(lockedCount) : NO_LOCKED_RATES
}

/**
 * The render-ready model both widths consume: `SECTIONS` with each entry's
 * sublabel already derived.
 *   bookings    — data.bookings from `getRelationshipData`
 *   lockedCount — number of services locked for this client
 */
export function buildSections({ bookings, lockedCount = 0 } = {}) {
  return SECTIONS.map(section => ({
    ...section,
    sublabel: section.key === SECTION_RATES
      ? ratesSublabel(lockedCount)
      : bookingsSublabel(bookings),
  }))
}
