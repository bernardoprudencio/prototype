/**
 * Locked rates — verbatim production copy.
 *
 * Every string here was read directly out of roverdotcom/web so user-test
 * findings transfer to the shipped feature. Do NOT paraphrase. Sources:
 *   conversations/api/mappers/details/price_ledger.py
 *   conversations/jstemplates/js/app/conversations/ConversationPageAddonsEditor.mustache
 *   frontend/react-lib/src/pages/modify-booking/.../LockedRatesComponent.tsx
 *   frontend/app/js/pages/conversation/{lockedratesview,ratedetailsview}.js
 *   reactNativeApp/ios/Rover/Supporting Files/en-US.lproj/Rover.strings
 *   android/app/src/main/res/values/strings_inbox.xml
 *
 * Production nuance worth preserving:
 *   - Locking is per (sitter's service x owner x rate type), and the row's
 *     existence IS the state — there is no expiry or pending state.
 *   - The write is full-set replacement: unlock posts an empty list.
 *   - Production prices recurring sentinel requests `.without_locked_rates()`
 *     (recurring/models.py), so a lock never *applies* to a recurring booking.
 *     It is still *offered* on them: the `if self.stay.is_recurring: return None`
 *     guard exists only on the retiring legacy stay page, and the canonical
 *     `_get_lock_rates_toggle()` has no recurring check.
 *   - Which conversations offer the control is a per-conversation decision
 *     (paid, browsable, not cancelled), while the lock itself is keyed on
 *     (requester x service). See src/lib/useLockedRates.js.
 */

// ── Toggle ───────────────────────────────────────────────────────────────────
// Production ships two phrasings of the same toggle. The possessive form is
// used by the editor/modify-booking surfaces; the plain form by the ledger.
// The possessive form is rendered by ModifyBookingScreen's Rates section
// (production: LockedRatesComponent.tsx:30, nested in RatesComponent.tsx:104);
// the ledger form by the booking-details / relationship / current-week surfaces.
export const toggleLabel       = (ownerFirstName) => `Lock your rates for future stays with ${ownerFirstName}`
export const toggleLabelLedger = (ownerFirstName) => `Lock rates for future stays with ${ownerFirstName}`
// NB: production's toggle text does not change when the switch is on
// (`_get_lock_rates_toggle`, price_ledger.py:1732-1737, has a single string),
// and there is no aria-label on the control: Kibble's SwitchField associates the
// visible <label htmlFor> as the accessible name (SwitchField.tsx:145-156).

// ── Info tooltip / popover ───────────────────────────────────────────────────
// PROTOTYPE-ONLY. Production's affordance is a hover Popover with no title
// (`LockedRatesComponent.tsx:33-48`); this heading exists because the mobile
// stand-in is a BottomSheet, which needs one.
export const TOOLTIP_TITLE = 'Locked rates'
export const tooltipBody = (ownerFirstName) =>
  `Locked rates will remain the same for ${ownerFirstName} even if you change your rates. Unlocking will restore standard rates for all future stays.`
// PROTOTYPE-ONLY dismiss label for that stand-in sheet — a hover popover needs none.
export const TOOLTIP_DISMISS = 'Got it'
// AlertInfoButton.tsx:24 — `aria-label={t`Info`}`.
export const INFO_BUTTON_ARIA_LABEL = 'Info'

// ── Lock sheet ───────────────────────────────────────────────────────────────
export const LOCK_SHEET_TITLE = 'Lock rates'
export const lockSheetBody = (ownerFirstName, serviceName) =>
  `${ownerFirstName} will pay these locked rates for all future ${serviceName} bookings, even if you change your rates. The numbers listed below are the rates owners see on your profile, and are inclusive of your earnings and service fees. You can change this setting at any time.`
// The submit button repeats the title rather than carrying its own string:
// LockRatesModal.tsx:36 passes `submitButtonText={title}`. So there is no
// separate lock/unlock CTA copy.

// UNUSED. Surfaced in production only in ConversationPagePetRateEditor.mustache:5,
// as a sticky popover on the pet rate editor — it is NOT on the lock modal.
export const HIGHER_PRICE_NOTE =
  'If you have different prices for the same type of rate, the higher price will be locked in.'

// ── Unlock sheet ─────────────────────────────────────────────────────────────
// Two titles ship. The canonical web/RN booking details modal is titled
// "Unlock rates" (`_get_lock_rates_action`, and LockRatesModal repeats the
// title on its submit button); native uses the question form.
export const UNLOCK_SHEET_TITLE = 'Unlock rates'
export const unlockSheetBody = (ownerFirstName, serviceName) =>
  `${ownerFirstName} will be charged your default rates for all future ${serviceName} requests. If you updated your rates, ${ownerFirstName} will pay those updated rates.`
// UNUSED, iOS-only. The canonical — and only — locked-rates confirmation is the
// web LockRatesModal, titled "Unlock rates" with that title repeated on submit.
// The modify-booking surface has no modal at all: LockedRatesComponent commits
// straight through (ModifyBooking.duck.ts:482-502). So the question form and the
// "Update to default rates" CTA below are RN app strings with no web equivalent.
export const unlockSheetTitle = (ownerFirstName) => `Do you want to charge ${ownerFirstName} your default rates?`
export const UNLOCK_SHEET_CTA_NATIVE = 'Update to default rates'
// UNUSED. The modal body is paragraph -> rate rows -> footer with no interstitial
// heading (LockRatesModal.tsx:42-75).
export const UNLOCK_SHEET_SUBTITLE = 'Your default rates'

// ── Rate rows ────────────────────────────────────────────────────────────────
// In unlock mode the API overwrites each row's real unit with this literal
// (`_get_unlock_rates_list`, price_ledger.py:1768) — so it is the unit string,
// not a status sublabel. Lock mode carries the real unit and no sublabel at all.
export const RATE_LOCKED = 'Locked rate'
// Lock mode carries the real unit, which the API sends as
// `add_on_type.unit_as_sentence` (price_ledger.py:1709) — a phrase, not the bare
// noun. `lockableRates.js` stores the bare noun because relationshipData.js also
// pluralises it, so the phrasing is applied here.
export const unitAsSentence = (unit) => `per ${unit}`

// ── Sheet footer ─────────────────────────────────────────────────────────────
// ScrollableModal's secondary button, hardcoded there: content.constants.ts:3.
export const SHEET_CLOSE = 'Close'

// ── Confirmation snackbars ───────────────────────────────────────────────────
// NB: the two iOS string keys are inverted in production
// (SNACK_BAR_RATES_LOCKED_MESSAGE holds the *unlocked* copy). These follow
// meaning, not key name.
export const snackbarLocked   = (ownerFirstName) => `Rates locked for ${ownerFirstName}`
export const SNACKBAR_UNLOCKED = 'Rates unlocked. Using default rates.'

// ── Relationship page "Rates" section ────────────────────────────────────────
// PROTOTYPE-ONLY, all three strings below. There is no relationship-page rates
// section in production: no `relationship_progress/sections_mapper.py` exists,
// and "Rates locked for N services" appears nowhere in roverdotcom/web — the
// only repo-wide matches are the iOS/Android snackbar strings above. This
// section is this prototype's own aggregate entry point into the lock sheet, so
// its copy is invented rather than sourced. The plural branch is currently
// unexercised: every seeded client locks exactly one service.
export const RATES_SECTION_TITLE = 'Rates'
export const ratesLockedSubtitle = (count) =>
  `Rates locked for ${count} ${count === 1 ? 'service' : 'services'}`
export const NO_LOCKED_RATES = 'No locked rates'

// ── Ledger row ───────────────────────────────────────────────────────────────
// LEGACY ONLY. This line does not exist on the canonical booking details page —
// it lives in account/templates/.../locked_rates.html and the Backbone
// app/js/pages/conversation/ratedetailsview.js. Kept because CurrentWeekScreen's
// PricingLedger still renders it; BookingDetailsScreen deliberately does not.
// The owner-facing variant ("Your rates are locked with ...") is intentionally
// not mocked — this prototype is the sitter's app.
export const ledgerRowSitter = (ownerShortName) => `Rates are locked for ${ownerShortName}`
