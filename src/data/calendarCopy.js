/**
 * Sitter calendar — verbatim POC copy.
 *
 * Every string here was read directly out of roverdotcom/web on branch
 * `ai-pilot-web-calendar` (PR 93051), the Statsig-gated React replacement for
 * the legacy jQuery /account/calendar page. Do NOT paraphrase — user-test
 * findings only transfer to the shipped feature if the words match.
 *
 * Source root:
 *   src/frontend/react-lib/src/pages/account/NewCalendarPage/
 * and within it:
 *   NewCalendarContainer.tsx
 *   utils.ts
 *   layouts/NewCalendarPageMonth.tsx
 *   components/{CalendarHeader,CalendarLegendContent,CompactSelectionBar,
 *               CompactWeekStrip,NewCalendarHelpSheet,NoBookingsEmptyState,
 *               SelectionSummary,ServiceListPanel,ServiceRow,
 *               SyncCalendarPanel,AvailabilitySettingsPanel}.tsx
 *   layouts/v1/{V1EventCard,V1GcaBlurb}.tsx
 *
 * Surface notes worth preserving:
 *   - The POC is one page at three layouts (Month default, ThreeDay alternate,
 *     Compact <=750px). Month got all twelve build phases and the a11y pass;
 *     the other two share its copy rather than having their own.
 *   - Lingui `plural(...)` becomes a function here. The POC's `#` placeholder
 *     is the count, so `plural(1, {one: '# booking', other: '# bookings'})`
 *     renders "1 booking".
 *   - Announcement strings are read by an `aria-live` region, not rendered.
 *     Politeness matters: success is polite, failure is assertive
 *     (useOptimisticMutation.ts).
 *   - Anything with no POC equivalent is marked PROTOTYPE-ONLY.
 */

// ── Page chrome — CalendarHeader.tsx ────────────────────────────────────────
// The Beta pill and Help link render in both the wide and compact headers
// (:80/:192 and :87/:199 — the duplicated line numbers are the two variants).
export const HEADER = {
  beta: 'Beta',                          // CalendarHeader.tsx:80,192
  help: 'Help',                          // CalendarHeader.tsx:87,199
  viewLabel: 'Calendar view',            // CalendarHeader.tsx:97
  viewThreeDay: '3-day',                 // CalendarHeader.tsx:105
  viewMonthly: 'Monthly',                // CalendarHeader.tsx:106
  syncCalendar: 'Sync your calendar',    // CalendarHeader.tsx:120,123,211
  availabilitySettings: 'Availability settings', // CalendarHeader.tsx:132,134,221
  showCalendar: 'Show calendar',         // CalendarHeader.tsx:185 (compact toggle)
  hideCalendar: 'Hide calendar',         // CalendarHeader.tsx:185
  prevMonth: 'Previous month',           // NewCalendarPageMonth.tsx:271
  nextMonth: 'Next month',               // NewCalendarPageMonth.tsx:279
  prevWeek: 'Previous week',             // CompactWeekStrip.tsx:149
  nextWeek: 'Next week',                 // CompactWeekStrip.tsx:157
}

// PROTOTYPE-ONLY. The POC removed the 3-day chevrons from the UI while leaving
// `onPrevThreeDay` / `onNextThreeDay` plumbed and uninvoked
// (NewCalendarPageThreeDay.tsx). Shipping an unnavigable view would be a bug,
// so the chevrons come back and need labels the POC never wrote.
export const THREE_DAY_NAV = {
  prev: 'Previous 3 days',
  next: 'Next 3 days',
}

// ── Selection summary / compact selection bar ───────────────────────────────
// The same three action labels appear in the rail overlay (SelectionSummary)
// and the fixed compact bar (CompactSelectionBar); both call
// `getPrimaryActionForSelection` and pick the label off the returned `kind`.
export const SELECTION = {
  editAvailability: 'Edit my availability',        // SelectionSummary.tsx:154 / CompactSelectionBar.tsx:140
  markAvailable: 'Mark services as available',     // SelectionSummary.tsx:167 / CompactSelectionBar.tsx:152
  markUnavailable: 'Mark services as unavailable', // SelectionSummary.tsx:180 / CompactSelectionBar.tsx:164
  shareProfile: 'Share my profile',                // SelectionSummary.tsx:192
  barAriaLabel: 'Current selection',               // CompactSelectionBar.tsx:113
  notAvailable: 'Not available',                   // utils.ts:497 (getSelectionSubtitle)
}

// SelectionSummary.tsx:97 and ServiceListPanel.tsx:269 — the same plural.
export const bookedSpacesLabel = (n) => (n === 1 ? '1 booked space' : `${n} booked spaces`)

// ── Booking list — NoBookingsEmptyState.tsx / V1EventCard.tsx ───────────────
export const BOOKINGS = {
  empty: 'You have no bookings',                              // NoBookingsEmptyState.tsx:24
  openConversation: (title) => `Open conversation for ${title}`, // V1EventCard.tsx:84
  petAvatar: (name) => (name ? `${name} avatar` : 'Pet avatar'),  // V1EventCard.tsx:138
  moreInCell: (n) => `+${n} more`,                            // NewCalendarPageMonth.tsx:605
}

// ── GCA blurb (calendar-freshness prompt) — V1GcaBlurb.tsx ──────────────────
// "GCA" is Google Calendar Accuracy in the POC's own naming: the days-since
// -last-update nudge, not a sync integration.
export const GCA = {
  upToDateTitle: 'Your calendar is up to date',                 // V1GcaBlurb.tsx:39
  daysSince: (n) => `Days since last update: ${n}`,             // V1GcaBlurb.tsx:41
  neverUpdated: 'Days since last update: Never updated',        // V1GcaBlurb.tsx:43
  needsAttentionBody:
    'Keep your calendar up-to-date to get requests that match your availability', // V1GcaBlurb.tsx:46
  upToDateBody: 'Thanks for keeping your calendar up to date!',  // V1GcaBlurb.tsx:47
  confirmCta: 'Confirm my calendar',                            // V1GcaBlurb.tsx:93
  confirming: 'Confirming your calendar…',                 // NewCalendarContainer.tsx:189
  confirmed: 'Calendar confirmed. Thanks!',                     // NewCalendarContainer.tsx:191
}

// ── Legend — CalendarLegendContent.tsx:93-114 ──────────────────────────────
// Four rows, and note the deliberate label collision: two rows read
// "Available" and two read "Not available". The sublabel is what distinguishes
// them, which is exactly why the labels are not deduplicated here.
export const LEGEND = {
  intro: 'Here’s what the colors mean:',                   // CalendarLegendContent.tsx:131
  clickHint:
    'Click on a date to see all your bookings for the day, and edit your availability for that day.', // :122
  rangeHint:
    'To edit several days at once, click a start day, then click a later day to select the range. Click any day after that to start over.', // :127
  rows: [
    { state: 'fullyAvailable', label: 'Available',     body: 'You can take bookings on this day' },
    { state: 'someBookings',   label: 'Available',     body: 'You can take more bookings this day' },
    { state: 'notAvailable',   label: 'Not available', body: 'Marked yourself unavailable on this day' },
    { state: 'fullyBooked',    label: 'Not available', body: 'You’re fully booked for this day' },
  ],
}

// ── Help sheet — NewCalendarHelpSheet.tsx ──────────────────────────────────
export const HELP = {
  title: 'How to manage your new calendar',   // NewCalendarHelpSheet.tsx:42
  betaBody:
    'You’re using a beta version of the calendar. We’re still improving and may ask for your feedback to help make it better.', // :52-55
  whatsNew: 'What’s new',                // NewCalendarHelpSheet.tsx:58
  bullets: [
    'Switch between 3-day and month views.',        // :63
    'Manage availability with finer controls.',     // :68
    'See your schedule at a glance',                // :73 (no period, as shipped)
  ],
  // :79-83 — one sentence with an inline mailto in the middle, so it ports as
  // lead + link + tail rather than a single string.
  feedbackLead:
    'This is a limited beta and we’re learning from your feedback as we go. Tell us what’s working, what isn’t, and how we can improve at ',
  feedbackEmail: 'product-feedback@rover.com',
  feedbackTail: '.',
  dismiss: 'Got it',                          // NewCalendarHelpSheet.tsx:95,97
}

// ── Availability editor — ServiceListPanel.tsx / ServiceRow.tsx ─────────────
export const EDITOR = {
  save: 'Save changes',                       // ServiceListPanel.tsx:341
  cancel: 'Cancel',                           // ServiceListPanel.tsx:351
  away: 'Away',                               // ServiceRow.tsx:64
  available: 'Available',                     // ServiceRow.tsx:66
  unavailable: 'Unavailable',                 // ServiceRow.tsx:68
  // ServiceRow.tsx:89 — the trailing noun is the service's own capacity unit,
  // supplied by the caller.
  occupancy: (occupied, capacity, unit) => `${occupied} of ${capacity} ${unit}`,
  resetToDefault: 'Reset to default',         // ServiceRow.tsx:191
}

// ── Availability settings panel — AvailabilitySettingsPanel.tsx ─────────────
// A separate surface from the per-day editor above: sitter-wide defaults,
// reached from the header action.
export const SETTINGS = {
  title: 'Availability settings',             // AvailabilitySettingsPanel.tsx:722
  away: 'Away',                               // :197
  awayBody: 'Pause requests while you take a break.',  // :200
  oneTime: 'One-time care for new customers', // :217
  weekly: 'Weekly care for new customers',    // :231
  newCustomers: 'New customers',              // :247
  newCustomersBody:
    'Receive requests from pet parents you haven’t booked with before.', // :250
  spacesAvailable: 'Spaces available',        // :267
  dailyAvailability: 'Daily availability',    // :292
  dailyPrompt: 'Which days are you typically available?',  // :295
  dailyError: 'Please select at least one day.',           // :306
  leadTime: 'Lead time for requests',         // :323
  leadTimePlaceholder: 'Select lead time',    // :359
  leadTimeSameDay: 'Same day',                // :116
  leadTimeOneDay: '1 day',                    // :117
  leadTimeOneWeek: '1 week',                  // :118
  leadTimeTwoWeeks: '2 weeks',                // :119
  leadTimeDays: (days) => `${days} days`,     // :120
  saveError: 'Could not save all changes. Please try again.',  // :624
  save: 'Save',                               // :653
  close: 'Close',                             // :662
  loading: 'Loading…',                        // :675
  loadError: 'Could not load availability settings.', // :681
  noServices: 'No services to manage.',       // :694

  // Per-control accessible names. Each switch and the lead-time select are
  // visually labelled once per card and repeated per service, so the POC gives
  // every control a service-qualified name of its own.
  awayFor: (name) => `Away for ${name}`,                              // :208
  acceptOneTimeFor: (name) => `Accept one-time care for ${name}`,     // :225
  acceptWeeklyFor: (name) => `Accept weekly care for ${name}`,        // :239
  acceptNewCustomersFor: (name) => `Accept new customers for ${name}`, // :258
  leadTimeFor: (name) => `Lead time for requests for ${name}`,        // :331
  saveAria: 'Save availability changes',      // :651
  discardAria: 'Discard changes',             // :660

  // :146-179 — single letters so all seven chips stay on one row, Monday-first.
  // The POC carries a translator `context` per letter to disambiguate the two
  // Ts and two Ss; there is no i18n layer here, so the day key does that job.
  dayLetters: {
    monday: 'M', tuesday: 'T', wednesday: 'W', thursday: 'T',
    friday: 'F', saturday: 'S', sunday: 'S',
  },
}

// ── Sync panel — SyncCalendarPanel.tsx ─────────────────────────────────────
export const SYNC = {
  title: 'Sync your calendar',                // SyncCalendarPanel.tsx:111
  close: 'Close',                             // :112
  includeHeading: 'Include',                  // :183
  requests: 'Requests',                       // :132
  bookings: 'Bookings',                       // :133
  meetAndGreets: 'Meet & Greets',             // :136
  displayHeading: 'Calendar display',         // :193
  showFullDuration: 'Show entire booking duration',   // :146
  showPickupDropoff: 'Show pick-up & drop-off dates', // :151
  addToICal: 'Add to iCal',                   // :215
  addToGoogle: 'Add to Google Calendar',      // :228
  copyPrompt: 'Or copy & paste the URL below:',       // :234
  copy: 'Copy',                               // :275
  copied: 'Copied!',                          // :275
  copiedAnnouncement: 'URL copied to clipboard.',     // :284
  copyFailed:
    'Could not copy automatically. Please select the URL and copy it manually.', // :289-291
}

// ── Screen-reader announcements — NewCalendarContainer.tsx / utils.ts ───────
// Read by an aria-live region. `saved` / `dayCount` are polite;
// `saveFailed` is assertive (useOptimisticMutation.ts).
export const ANNOUNCE = {
  pastNotEditable: 'Past dates are not editable.',      // NewCalendarContainer.tsx:329
  saveInProgress: 'Save in progress. Please wait for it to finish.', // :343,476,484
  selected: (date) => `Selected ${date}`,               // NewCalendarContainer.tsx:357,374
  rangeSelected: (a, b) => `Range ${a} to ${b} selected`, // NewCalendarContainer.tsx:388
  updating: 'Updating calendar',                        // NewCalendarContainer.tsx:441
  saved: 'Availability saved.',                         // NewCalendarContainer.tsx:447
  daysUpdated: (n) => (n === 1 ? '1 day updated' : `${n} days updated`), // :448
  saveFailed: 'Could not save availability. Your changes were reverted.', // :450
  // NewCalendarContainer.tsx:451-456 — the range form of the same failure.
  saveFailedDays: (n) => (n === 1
    ? 'Could not update availability. 1 day reverted.'
    : `Could not update availability. ${n} days reverted.`),
  weekOf: (label) => `Week of ${label}`,                // CompactWeekStrip.tsx:108
}

// utils.ts:317-323 — day-state phrases used inside the day cell's aria-label.
export const DAY_STATE_PHRASE = {
  fullyAvailable: 'available',
  someBookings: 'has bookings',
  fullyBooked: 'fully booked',
  notAvailable: 'unavailable',
}

// utils.ts:423 and :436-445 — the remaining aria-label fragments, joined with
// ", " by `composeDayCellAriaLabel`.
export const bookingCountLabel = (n) => (n === 1 ? '1 booking' : `${n} bookings`)

export const DAY_CELL_PHRASE = {
  today: 'today',
  rangeStart: 'range start',
  rangeEnd: 'range end',
  inRange: 'in selected range',
  selected: 'selected',
}

// ── Success banner — useCalendarSuccessBanner.tsx:141-157 ─────────────────
// One builder, four branches, mirroring `buildSuccessBannerMessage`. The
// service list is joined with ", " and the last item with " and " — no Oxford
// comma, as shipped. The date labels differ by branch and the caller supplies
// them already formatted: a single day gets the long no-comma form, a range
// gets the short no-comma form at both ends.
export const successBannerMessage = ({ services, startLabel, endLabel }) => {
  const list = [...services]
  const last = list.pop() ?? ''
  const isRange = Boolean(endLabel) && endLabel !== startLabel
  const subject = list.length > 0 ? `${list.join(', ')} and ${last}` : last
  return isRange
    ? `You changed your availability for ${subject} from ${startLabel} to ${endLabel}.`
    : `You changed your availability for ${subject} on ${startLabel}.`
}
