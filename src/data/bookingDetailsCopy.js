/**
 * Booking details page — verbatim production copy.
 *
 * Every string here was read directly out of roverdotcom/web (master) so
 * user-test findings transfer to the shipped feature. Do NOT paraphrase.
 * Sources:
 *   frontend/pages/src/account/ConversationPage/ConversationDetailsContent.tsx
 *   frontend/pages/src/account/ConversationPage/ConversationDetailsHeader.tsx
 *   frontend/pages/src/account/ConversationPage/components/details/*.tsx
 *   conversations/api/domain/items/statuses.py
 *   conversations/api/mappers/details/{price_ledger,service_summary,booking_ctas}.py
 *   conversations/api/mappers/base.py
 *   conversations/constants.py
 *
 * Surface notes worth preserving:
 *   - This is a full PAGE, not a sheet: the sitter taps "View details" on the
 *     conversation booking card and lands on
 *     /account/conversations/<opk>/details. Web and React Native render the
 *     same ConversationDetailsContent.
 *   - Three of the twelve sections are role-gated off for sitters: Warnings
 *     (`person.id != conv.requester_id`), the RoverProtect T&S message
 *     (`_is_requester()`), and the other-party details block (`isProvider`).
 *   - Sitters never see fees, taxes, refunds or due-now rows:
 *     `_get_requester_prices()` opens with `if self._is_provider(): return []`.
 *   - On mobile `ConversationDetailsActions` returns null and the CTAs move
 *     into the header.
 */

// ── Page header — ConversationDetailsHeader.tsx ──────────────────────────────
// Capital D, and distinct from the service-summary section title below. The
// centred title is React Native ONLY (web renders the header with no title);
// this prototype mocks the native app, so it renders.
export const PAGE_TITLE = 'Booking Details'
export const BACK_TEXT  = 'Back'

// ── 1. Booking status — conversations/api/domain/items/statuses.py ───────────
// Sitter-visible states only. The owner-side statuses (AcceptAndPayStatus,
// RequestSentStatus, RebookStatus, LeaveReviewStatus, …) are omitted.
export const STATUS = {
  confirmed: {
    title: 'Booking confirmed',
    text: (petNames, unit) =>
      `This booking is paid and confirmed. Get ready for ${petNames}'s Rover ${unit}!`,
  },
  ongoing: {
    title: 'Booking ongoing',
    text: () => 'This booking is currently active.',
  },
  ongoingRecurring: {
    title: 'Booking ongoing',
    text: () => 'This booking is set to repeat each week.',
  },
  cancelled: {
    title: 'Booking cancelled',
    text: () => 'This booking has been cancelled.',
  },
  complete: {
    title: 'Booking complete',
    text: (otherPersonName) => `Your booking with ${otherPersonName} has ended.`,
  },
  leaveFeedback: {
    title: 'Leave feedback',
    text: (requesterName) => `Your booking with ${requesterName} has ended.`,
  },
  archived: {
    title: 'Request archived',
    text: () => 'This request has been archived.',
  },
  expired: {
    title: 'Request expired',
    text: () => 'This request has been expired.',
  },
  waitingForPayment: {
    title: 'Waiting for payment',
    text: (requesterName) =>
      `You accepted this request. The booking will be confirmed once ${requesterName} accepts and pays.`,
  },
  reviewRequest: {
    title: 'Review request',
    text: (requesterName) =>
      `Review a new request from ${requesterName}. You may not appear in search results until the request is booked or archived.`,
  },
  // ConfirmedSameDayProviderStatus — the same-day variant of `confirmed`; its
  // sentence takes no interpolation.
  confirmedSameDay: {
    title: 'Booking confirmed',
    text: () => 'You can leave feedback as soon as the booking is over.',
  },
  declined: {
    title: 'Request declined',
    text: () => 'This request has been declined.',
  },
  modificationsSent: {
    title: 'Modifications sent',
    text: (otherPersonName) =>
      `You asked for a modification. ${otherPersonName} has 48h to accept or reject any changes.`,
  },
  reviewModifications: {
    title: 'Review modifications',
    text: (otherPersonName) =>
      `${otherPersonName} asked for a modification. These changes may affect the details and price of your request. Review the changes before accepting.`,
  },
  skippedWeek: {
    title: 'Skipped week',
    text: () => 'This week has been skipped.',
  },
}

// `icon` / `icon_color` per status, from the same classes. Drives which glyph
// and colour the status block renders; anything unlisted falls back to success.
export const STATUS_ICON = {
  cancelled:           'error',
  declined:            'error',
  archived:            'error',
  expired:             'error',
  modificationsSent:   'caution',
  reviewModifications: 'caution',
  waitingForPayment:   'caution',
  reviewRequest:       'caution',
}

// ── 2. Message row — ConversationMessageOwner.tsx ────────────────────────────
export const messageOwner = (shortName) => `Message ${shortName}`

// ── 3. Service summary — mappers/details/service_summary.py ──────────────────
// "Booking details" once a stay exists; "Request details" before.
export const SERVICE_SUMMARY_TITLE = 'Booking details'
export const REQUEST_SUMMARY_TITLE = 'Request details'
export const STARTS = 'Starts'
export const ENDS   = 'Ends'
export const FLEXIBLE_START_TIME = 'Flexible start time'
export const unitCount   = (n, unit, plural) => `${n} ${n === 1 ? unit : plural}`
export const minutesEach = (minutes) => `${minutes} min each`

// ── 3a. Recurring service summary — the same mapper, recurring branch ────────
// A recurring conversation is dispatched to a
// RecurringNonContiguousServiceSummaryBuilder subclass
// (service_summary.py:681-701, :752-755), which replaces the contiguous
// Starts/Ends block with a *schedule section*: a title plus one row per service
// day. `OngoingRecurringSummaryBuilder` is the one that applies to a week
// already under way.
//
// mappers/details/service_summary.py:467-468 —
//   class OngoingRecurringSummaryBuilder(...):
//       SCHEDULE_TITLE = gettext_lazy("This week's service happens on")
export const RECURRING_SCHEDULE_TITLE = "This week's service happens on"

// mappers/details/service_summary.py:448-451 — `get_title()` on
// RecurringNonContiguousServiceSummaryBuilder is
// `super().get_title() + " " + gettext_lazy("Weekly")`, so on the DETAILS page
// "Weekly" is APPENDED to the service name ("Dog walking Weekly").
export const WEEKLY_SUFFIX = 'Weekly'

// mappers/details/booking_card.py:80-82 — the conversation BOOKING CARD builds
// the same idea the other way round: `" ".join([_("Weekly"), service_title])`.
// Two surfaces, two orders; both strings are production's.
export const WEEKLY_PREFIX = 'Weekly'

// mappers/details/service_summary.py:429-431 —
//   SERVICE_INFO_SUFFIX = gettext_lazy("this week")
// appended to the unit count in the subtitle, e.g. "3 walks this week"
// (:452-464, `"{service_part} {suffix}"`).
export const RECURRING_UNIT_SUFFIX = 'this week'

// mappers/details/booking_card.py:118-122 — a recurring conversation shows
// `" ".join((_("Starts"), start_date))` only while its start date is still in
// the future; once the relationship has begun the field is deliberately "".
export const startsOn = (date) => `${STARTS} ${date}`

// ── 4. Price ledger — mappers/details/price_ledger.py ────────────────────────
// `rate_section_title`; the sitter-interest variant is "Potential Earnings".
export const LEDGER_SECTION_TITLE = 'Services & Charges'
export const SUBTOTAL = 'Subtotal'
export const YOUR_EARNINGS = 'Your earnings'

// `_get_rate_price`: rate_text = [f"{price_text} × {add_on.num_units} {price_unit}"]
// U+00D7 multiplication sign, not the letter x.
export const rateMultiplier = (priceText, n, unit, plural) =>
  `${priceText} × ${n} ${n === 1 ? unit : plural}`

// `_get_provider_title` — the collapsed-ledger summary line.
export const paidForStay = (ownerName, finalAmount, datePaid) =>
  `${ownerName} paid ${finalAmount} on ${datePaid} for this stay.`

// ── 4a. Recurring price ledger — same mapper, recurring branches ─────────────
// Every string below was read out of
// mappers/details/price_ledger.py and mappers/base.py on master.
//
// mappers/base.py:306-314 — `_get_price_label()`. Earnings-transparency wins
// first ("Subtotal"); otherwise a recurring conversation gets the week-scoped
// pair, with "Price this week" while today falls inside the conversation's own
// week and "Price per week" outside it.
export const PRICE_THIS_WEEK = 'Price this week'
export const PRICE_PER_WEEK  = 'Price per week'

// mappers/details/price_ledger.py:1069-1080 — `_get_total_price_title()`.
// Non-recurring returns "Subtotal" (already exported above). Recurring forks on
// `is_date_in_or_after_service_start_week` and then again on
// earnings-transparency, which this prototype models as ON (it is what puts the
// "Your earnings" row on the ledger at all, :498-502).
export const SUBTOTAL_THIS_WEEK   = 'Subtotal this week'
export const FIRST_WEEK_SUBTOTAL  = 'First week subtotal'
// The non-earnings-transparency halves of the same two branches (:1077, :1080).
export const TOTAL_THIS_WEEK      = 'Total this week'
export const TOTAL_FIRST_WEEK     = 'Total first week'

// mappers/details/price_ledger.py:511-514 — `_get_total_earnings()`.
export const YOUR_EARNINGS_THIS_WEEK = 'Your earnings this week'

// ── The recurring-only extra ledger section ─────────────────────────────────
// price_ledger.py:504-507 appends one more PriceSection, recurring only:
//   if self.conv.is_recurring:
//       price_sections.append(PriceSection(items=[self._get_total_price_per_week(request)]))
//
// Its title comes from `_get_total_price_per_week_title()` (:1097-1100) — again
// forked on earnings-transparency.
export const SUBTOTAL_PER_WEEK    = 'Subtotal per week'
export const TOTAL_PRICE_PER_WEEK = 'Total price per week'

// …and its description from `_get_total_price_per_week()` (:1119-1123), which
// forks on ROLE, not on recurring-ness:
//   description = _("Paid on each Tuesday. Please allow 3-5 days for bank processing.")
//                 if self._is_provider() else _("Charged each Monday morning")
// This prototype is the sitter (provider) surface, so PAID_EACH_TUESDAY is the
// one that renders. CHARGED_EACH_MONDAY is kept for provenance — it is the
// OWNER's string, and also the one `_get_requester_title()` interpolates into
// "Price per week — {final_amount} — Charged each Monday morning" (:302-306).
// Neither is reachable from a sitter's screen.
export const PAID_EACH_TUESDAY    = 'Paid on each Tuesday. Please allow 3-5 days for bank processing.'
export const CHARGED_EACH_MONDAY  = 'Charged each Monday morning'

// mappers/details/price_ledger.py:346-353 — `_get_provider_title()`, recurring
// branch. The sitter-side collapsed-ledger summary line for one week:
//   _("{owner_name} paid {final_amount} on {date_paid} for this week.")
export const paidForWeek = (ownerName, finalAmount, datePaid) =>
  `${ownerName} paid ${finalAmount} on ${datePaid} for this week.`

// conversations/constants.py — YOUR_EARNINGS_TITLE / YOUR_EARNINGS_HELP_TEXT.
// The production string is HTML; the anchor around "Service fees" points at the
// help centre. Rendered here as two paragraphs.
export const YOUR_EARNINGS_TITLE = 'Understanding your earnings'
export const YOUR_EARNINGS_HELP_TEXT = [
  'Your earnings are the amount you take home after service fees apply. You earn a percent of the service subtotal, and you can adjust the amount you charge for services at any time.',
  'Service fees help provide 24/7 support, marketing campaigns that bring in more pet parents, new features that make it easier to run your business, and more. You can focus on what you do best—caring for pets.',
]

// ── 5. CTAs — mappers/details/booking_ctas.py ────────────────────────────────
// `_get_stay_without_modifications_buttons`, provider branch, non-recurring.
export const MODIFY_BOOKING  = 'Modify booking'
export const MODIFY_SCHEDULE = 'Modify schedule'   // recurring variant
export const CANCEL_BOOKING  = 'Cancel booking'

// message_header.py:342-359 deep-copies the modify CTA and overwrites its title
// for `details_buttons` — the one button the details page keeps on mobile.
// MODIFY_BOOKING / CANCEL_BOOKING belong to the desktop-only
// ConversationDetailsActions block and to the conversation screen's own button
// row; `ConversationDetailsActions` returns null at <=991px, and Cancel booking
// moves into the conversation header's more-menu (message_header.py:334).
export const MODIFY_REQUEST = 'Modify request'

// ── 6. Pets information (sitter-only) ────────────────────────────────────────
export const petsTitle = (count) => `${count === 1 ? 'Pet' : 'Pets'} (${count})`
export const UNKNOWN = 'Unknown'

// ── 7. Location (sitter-only) ────────────────────────────────────────────────
// Suppressed entirely for boarding and doggy day care — care happens at the
// sitter's home — so this section does not render for a boarding client.
export const LOCATION_TITLE = 'Location'
export const ADDRESS_AFTER_CONFIRMED = 'Exact address displayed after booking is confirmed'
export const distanceLine = (distance, distanceUnit) =>
  `${distance} ${distanceUnit} from your home • Actual travel distance may vary`

// ── 8. Additional information ────────────────────────────────────────────────
export const ADDITIONAL_INFO_TITLE = 'Additional information'
export const TRUST_AND_SAFETY = 'Call Rover Trust & Safety'
export const trustAndSafetySubtitle = (supportPhoneNumber) => `Get help 24/7: ${supportPhoneNumber}`
export const PRINT_BOOKING_DETAILS = 'Print booking details'
export const VET_INFORMATION = 'Vet information'
export const careInstructions = (petName) => `Care instructions for ${petName}`
export const EMERGENCY_CONTACT = 'Emergency contact info'
export const emergencyContactSubtitle = (name, phone) => `${name}: ${phone}`

// ── 9. Connect through Rover ─────────────────────────────────────────────────
export const CONNECT_TITLE = 'Connect through Rover'
export const connectBody = (otherParticipantName, suffix) =>
  `We don't share personal phone numbers, but you can reach ${otherParticipantName} at this ${suffix} number:`
export const callPreference = (otherParticipantName, suffix) =>
  `When can ${otherParticipantName} call your ${suffix} number?`
// ConversationPhoneSection.tsx renders `callPreference` as the label above a
// ClickableInput whose value is the sitter's saved availability.
export const CALL_PREFERENCE_ANYTIME = 'Anytime'

// ── Modals — ModalTypes.common.ts ────────────────────────────────────────────
export const CLOSE_TEXT = 'Close'
