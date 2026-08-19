/**
 * Locked rates — verbatim production copy.
 *
 * Every string here was read directly out of roverdotcom/web so user-test
 * findings transfer to the shipped feature. Do NOT paraphrase. Sources:
 *   conversations/api/mappers/details/price_ledger.py
 *   conversations/jstemplates/js/app/conversations/ConversationPageAddonsEditor.mustache
 *   frontend/react-lib/src/pages/modify-booking/.../LockedRatesComponent.tsx
 *   frontend/app/js/pages/conversation/{lockedratesview,ratedetailsview}.js
 *   conversations/api/mappers/details/relationship_progress/sections_mapper.py
 *   reactNativeApp/ios/Rover/Supporting Files/en-US.lproj/Rover.strings
 *   android/app/src/main/res/values/strings_inbox.xml
 *
 * Production nuance worth preserving:
 *   - Locking is per (sitter's service x owner x rate type), and the row's
 *     existence IS the state — there is no expiry or pending state.
 *   - The write is full-set replacement: unlock posts an empty list.
 *   - Recurring bookings are excluded (`.without_locked_rates()`), which is why
 *     none of this appears on the recurring-walk clients.
 */

// ── Toggle ───────────────────────────────────────────────────────────────────
// Production ships two phrasings of the same toggle. The possessive form is
// used by the editor/modify-booking surfaces; the plain form by the ledger.
export const toggleLabel       = (ownerFirstName) => `Lock your rates for future stays with ${ownerFirstName}`
export const toggleLabelLedger = (ownerFirstName) => `Lock rates for future stays with ${ownerFirstName}`
export const TOGGLE_ARIA_LABEL = 'Lock rates'

// ── Info tooltip / popover ───────────────────────────────────────────────────
export const TOOLTIP_TITLE = 'Locked rates'
export const tooltipBody = (ownerFirstName) =>
  `Locked rates will remain the same for ${ownerFirstName} even if you change your rates. Unlocking will restore standard rates for all future stays.`

// ── Lock sheet ───────────────────────────────────────────────────────────────
export const LOCK_SHEET_TITLE = 'Lock rates'
export const lockSheetBody = (ownerFirstName, serviceName) =>
  `${ownerFirstName} will pay these locked rates for all future ${serviceName} bookings, even if you change your rates. The numbers listed below are the rates owners see on your profile, and are inclusive of your earnings and service fees. You can change this setting at any time.`
export const LOCK_SHEET_CTA = 'Lock rates'

// Surfaced in production only in ConversationPagePetRateEditor.mustache.
export const HIGHER_PRICE_NOTE =
  'If you have different prices for the same type of rate, the higher price will be locked in.'

// ── Unlock sheet ─────────────────────────────────────────────────────────────
// Native uses the question form as the title; legacy web uses "Unlock rates".
export const unlockSheetTitle = (ownerFirstName) => `Do you want to charge ${ownerFirstName} your default rates?`
export const unlockSheetBody = (ownerFirstName, serviceName) =>
  `${ownerFirstName} will be charged your default rates for all future ${serviceName} requests. If you update your rates, ${ownerFirstName} will pay those updated rates.`
export const UNLOCK_SHEET_SUBTITLE = 'Your default rates'
export const UNLOCK_SHEET_CTA = 'Update to default rates'

// ── Rate row sublabels ───────────────────────────────────────────────────────
export const RATE_LOCKED     = 'Locked rate'
export const RATE_NOT_LOCKED = 'Not locked'

// ── Confirmation snackbars ───────────────────────────────────────────────────
// NB: the two iOS string keys are inverted in production
// (SNACK_BAR_RATES_LOCKED_MESSAGE holds the *unlocked* copy). These follow
// meaning, not key name.
export const snackbarLocked   = (ownerFirstName) => `Rates locked for ${ownerFirstName}`
export const SNACKBAR_UNLOCKED = 'Rates unlocked. Using default rates.'

// ── Relationship page "Rates" section ────────────────────────────────────────
export const RATES_SECTION_TITLE = 'Rates'
export const ratesLockedSubtitle = (count) =>
  `Rates locked for ${count} ${count === 1 ? 'service' : 'services'}`
export const NO_LOCKED_RATES = 'No locked rates'

// ── Ledger row ───────────────────────────────────────────────────────────────
// Sitter-facing. The owner-facing variant ("Your rates are locked with ...") is
// intentionally not mocked — this prototype is the sitter's app.
export const ledgerRowSitter = (ownerShortName) => `Rates are locked for ${ownerShortName}`
