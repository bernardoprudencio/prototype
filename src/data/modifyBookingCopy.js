/**
 * Modify booking — verbatim production copy.
 *
 * Every string below was read directly out of roverdotcom/web so user-test
 * findings transfer to the shipped feature. Do NOT paraphrase. Paths are
 * relative to the repo's `src/`; the modify-booking page lives at
 *   frontend/react-lib/src/pages/modify-booking/ModifyBookingPage/
 * abbreviated `MBP/` below.
 *
 * Scope of this file: the sitter-side, one-time (`hasStay && !isRecurring`)
 * branch of that page — production's `Modify booking`. The recurring branches
 * (`Modify request`, `Manage current week`) are included only where the same
 * string is shared, and are labelled where they are not.
 *
 * Production nuance worth preserving:
 *   - One page serves all three flows; the differences are section suppression,
 *     not different screens (MBP/components/ModifyBookingForm.utils.ts:74-89,
 *     :200-214).
 *   - The reason options are server-driven — they come from Django choices, not
 *     lingui (aplaceforrover/stays/constants.py:287-291).
 *   - The Rates heading is service-dependent, not a constant
 *     (frontend/constants/src/translations/services.constants.ts `ratesText`).
 *   - Ledger figures come from a server pricer round-trip on every field change
 *     (MBP/ModifyBooking.duck.ts:509-623). This prototype's numbers are static
 *     mock data; only the labels are production.
 */

// ── 1. Header ────────────────────────────────────────────────────────────────
// getHeaderText, MBP/components/ModifyBookingForm.utils.ts:208/:211/:213.
// The one-time sitter flow is the last return; the other two are kept so the
// discriminator is visible rather than implied.
export const HEADER_MODIFY_REQUEST     = 'Modify request'      // :208 — !hasStay
export const HEADER_MANAGE_CURRENT_WEEK = 'Manage current week' // :211 — isRecurring && hasStay
export const HEADER_MODIFY_BOOKING     = 'Modify booking'      // :213 — hasStay && !isRecurring

// ── 2. Reason for modifying ──────────────────────────────────────────────────
// MBP/components/ModifyBookingForm.tsx:688 / :692.
export const REASON_LABEL       = 'Why are you modifying this booking?'
export const REASON_PLACEHOLDER = 'Please select a reason'

// STAY_MODIFICATION_CHOICES (aplaceforrover/stays/constants.py:287-291), whose
// three members are defined at :178-181, :182-185 and :187-190. Server-driven,
// which is why they are not lingui strings like the rest of this file.
// `natural_disaster` and the grooming choices exist in constants.py but are not
// in STAY_MODIFICATION_CHOICES for this flow.
export const REASON_OPTIONS = [
  { value: 'owners_plans',       label: "The owner's plans changed" },        // :180
  { value: 'sitters_plans',      label: 'My plans changed' },                 // :184
  { value: 'need_cx_assistance', label: 'I need assistance from Rover Support' }, // :189
]

// ── 3. Dates ─────────────────────────────────────────────────────────────────
// MBP/components/ModifyBookingForm.tsx:753.
export const DATES_HEADING = 'Which dates?'
// MBP/components/ServiceDatePicker.tsx — the overnight (boarding / house
// sitting) branch labels its two ends explicitly; the plain DateRangePicker
// fallback at :222-231 passes neither. Start label :206, end label :127.
export const DATE_START_LABEL = 'When would you like to drop off?'
export const DATE_END_LABEL   = 'When would you like to pick up?'

// ── 4. Pets ──────────────────────────────────────────────────────────────────
// MBP/components/ModifyBookingForm.tsx:773.
export const PETS_HEADING = 'Which pets?'

// ── 5. Rates ─────────────────────────────────────────────────────────────────
// The heading is `getUnitRatesTextForServiceType(bookingServiceType)`
// (MBP/components/RatesComponent.tsx:73-75), which reads `ratesText` off the
// service constant — frontend/constants/src/translations/services.constants.ts
// :33 (boarding), :45 (house sitting), :57 (daycare), :69 (drop-in),
// :83 (training), :96 (walking), :108 (grooming).
export const RATES_HEADING = {
  boarding:       'Nightly rates',  // :33
  house_sitting:  'Nightly rates',  // :45
  dog_daycare:    'Daily rates',    // :57
  drop_in_visits: 'Visit rates',    // :69
  dog_training:   'Session rates',  // :83
  dog_walking:    'Walk rates',     // :96
  grooming:       'Grooming rates', // :108
}

// MBP/components/ServiceRateSelectorComponent.tsx:76 / :78 — which of the two
// renders is decided by `shouldIncludeOsf` (owner-service-fee-inclusive
// pricing), not by the surface.
export const priceOnProfile = (listPrice) => `Price on profile: ${listPrice}` // :76
export const listPrice      = (price)     => `List price: ${price}`           // :78

// ── 6. Extras and adjustments ────────────────────────────────────────────────
// getHeadingText, MBP/components/AdjustmentsListComponent.tsx:136-140. Note the
// capitalisation differs per audience and is reproduced as-is: grooming is
// sentence case (:137), the owner's is Title Case with "Upgrades" (:138), and
// the sitter's — the one this screen renders — is Title Case (:139).
export const ADJUSTMENTS_HEADING_GROOMING = 'Extras and adjustments' // :137
export const ADJUSTMENTS_HEADING_OWNER    = 'Extras and Upgrades'    // :138
export const ADJUSTMENTS_HEADING_SITTER   = 'Extras and Adjustments' // :139

// MBP/components/NoPenaltyInsertCard.tsx — shown when the modification is a
// price increase (AdjustmentsListComponent.tsx:218).
export const NO_PENALTY_TEXT     = 'No cancellation penalty applied.' // :23
export const NO_PENALTY_LINK     = 'Why is there no penalty?'         // :26
export const NO_PENALTY_POPOVER  = 'Due to sitter feedback, cancellation penalty is not charged when dates are modified without reducing the price of the stay.' // :19

// ── 7. Summary + ledger ──────────────────────────────────────────────────────
// MBP/components/ModifyBookedStayAPIForm.tsx:136.
export const SUMMARY_HEADING = 'Summary'

// MBP/components/ModifyBookingFormLedger.tsx.
export const LEDGER_SUBTOTAL      = 'Subtotal'      // :162
export const LEDGER_PREVIOUS_TOTAL = 'Previous total' // :170
export const LEDGER_AMOUNT_OWED   = 'Amount owed'   // :180 — replaces the summary
                                                    // label when priceDiff === 0
export const LEDGER_YOUR_EARNINGS = 'Your earnings' // :226 / :231

// getLedgerSummary, MBP/ModifyBooking.utils.ts:116-157. It dispatches on
// (isOwner x isRecurring x sign of priceDiff); all seven distinct sub-labels are
// kept so the sitter/one-time pair below is visibly one branch of a set.
// The two shared labels first (:67, :68):
export const SUMMARY_AMOUNT_DUE    = 'Amount due'    // :67
export const SUMMARY_REFUND_AMOUNT = 'Refund amount' // :68
// priceDiff === 0 — shared by every branch (:79).
export const SUMMARY_NO_CHANGE = 'No change in price.'
// Sitter, recurring (:84, :89).
export const summarySitterRecurringCharge = (additionalAmount) =>
  `Submitting these changes will charge the owner ${additionalAmount} to their original payment method.`
export const summarySitterRecurringRefund = (refundAmount) =>
  `Submitting these changes will refund the owner ${refundAmount} to their original payment method. No cancellation fee applied.`
// Owner, recurring (:96, :101).
export const summaryOwnerRecurringCharge = (additionalAmount) =>
  `Submitting these changes will charge you ${additionalAmount} to your original payment method.`
export const summaryOwnerRecurringRefund = (refundAmount) =>
  `Submitting these changes will refund you ${refundAmount} to your original payment method. No cancellation fee applied.`
// Sitter, one-time — THIS screen's two (:108, :113). Note the refund string
// takes no amount: production interpolates none.
export const summarySitterOneTimeCharge = (additionalAmount) =>
  `Submitting these changes will prompt the owner to confirm and pay ${additionalAmount}.`
export const SUMMARY_SITTER_ONE_TIME_REFUND =
  'Submitting these changes will prompt the owner to confirm and receive a refund.'

// ── 8. Message ───────────────────────────────────────────────────────────────
// MBP/components/ModifyBookedStayAPIForm.tsx:187-189 — the interpolated name is
// the *other* party, so on the sitter side it is the owner's.
export const messageLabel = (ownerName) =>
  `Write a message for ${ownerName} briefly explaining the changes`
export const MESSAGE_PLACEHOLDER = 'Write your message here' // :190
// Validators at :165-176: required + minLength(10) on this branch only.
export const MESSAGE_MIN_LENGTH = 10
export const MESSAGE_TOO_SHORT  = 'Please enter a message at least 10 characters long' // :172-174

// ── 9. 72-hour note ──────────────────────────────────────────────────────────
// MBP/components/ModifyBookedStayAPIForm.tsx:200-202.
export const confirmationWindowNote = (ownerName) =>
  `${ownerName} will have 72 hours to confirm the changes to this booking.`

// ── 10. CTAs ─────────────────────────────────────────────────────────────────
// MBP/components/ModifyBookedStayAPIForm.tsx:231/:263 and :234/:251/:273. The
// non-stacked layout renders Cancel twice, once before Submit and once after,
// gated `display={['none','block']}` / `display={['block','none']}` — which is
// the production statement that at the smallest breakpoint Submit comes first.
export const SUBMIT_CHANGES = 'Submit changes'
export const CANCEL         = 'Cancel'
