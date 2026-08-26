/**
 * granularRatesCopy — every string the POC proposal's locked-rates surfaces use.
 *
 * Ported verbatim from the POC branch `locked-rates-client-management-poc`:
 *   src/frontend/pages/src/account/lockedRates/rateCopy.ts
 *   src/frontend/pages/src/account/lockedRates/serviceRateStates.ts
 *   src/frontend/pages/src/account/conversations/details/ConversationRatesRow.tsx
 *
 * `lockedRatesCopy.js` is the CURRENT experience's copy and is deliberately left
 * untouched — both live side by side behind the `ratesMode` flag.
 *
 * Apostrophes are the curly ones the POC ships (’), not ASCII. Sentences with a
 * client name all have a nameless fallback, because production's row renders
 * before the conversation's participant has resolved.
 */

// ── The conversation / booking-details rates row (ConversationRatesRow.tsx) ──
// Three offers, decided by the lock state and whether the booked prices still
// match what is locked. The padlock renders on `update` and `manage` only.
export const ratesRowCopy = (offer, clientName, lockedAt, locale) => {
  const name = clientName?.trim() || null
  switch (offer) {
    case 'update':
      return {
        title: name ? `Update ${name}’s locked rates` : 'Update this client’s locked rates',
        subtitle: lockedOnLine(lockedAt, locale),
      }
    case 'manage':
      return {
        title: name ? `Manage ${name}’s locked rates` : 'Manage this client’s locked rates',
        subtitle: lockedOnLine(lockedAt, locale),
      }
    case 'lock':
    default:
      return {
        title: name ? `Lock these rates for ${name}` : 'Lock these rates for this client',
        subtitle: name
          ? `${name} will keep these rates, even if your default rates change.`
          : 'This client will keep these rates, even if your default rates change.',
      }
  }
}

export const showsPadlock = (offer) => offer === 'update' || offer === 'manage'

// ── Dates (serviceRateStates.ts formatLockedAt) ──────────────────────────────
export const formatLockedAt = (lockedAt, locale) => {
  if (!lockedAt) return null
  const date = lockedAt instanceof Date ? lockedAt : new Date(lockedAt)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
}

const lockedOnLine = (lockedAt, locale) => {
  const on = formatLockedAt(lockedAt, locale)
  return on ? `Locked on ${on}` : 'Rates locked for this client'
}

// ── Status lines (serviceRateStates.ts lockStatusLine) ───────────────────────
// The saved state, never the staged switch.
export const lockStatusLine = (isCustom, lockedAt, locale) => {
  if (!isCustom) return 'Using default rates'
  const on = formatLockedAt(lockedAt, locale)
  return on ? `Rates locked ${on}` : 'Rates locked for this client'
}

export const INACTIVE_SERVICE = 'Inactive service'

// ── The modal (ManageRatesModal.tsx + RatesModalTitleRow.tsx) ────────────────
export const modalTitle = (serviceName) => `${serviceName} rates`

export const lockToggleLabel = (clientName) =>
  clientName ? `Lock ${clientName}’s rates` : 'Lock this client’s rates'

export const lockToggleNote = (isOn, clientName) => {
  const payer = clientName || 'This client'
  return isOn
    ? `${payer} will keep these rates, even if your default rates change. Turn it off to charge your default rates.`
    : `${payer} will be charged your default rates. Turn it on to lock and charge custom rates.`
}

export const lockToggleAnnouncement = (isOn, clientName, serviceName, isEditable = true) => {
  const who = clientName || 'this client'
  const what = serviceName ? `${serviceName} rates` : 'rates'
  if (!isOn) return `${what} for ${who} will unlock when you save.`
  return isEditable
    ? `${what} for ${who} will lock when you save. Every rate below is editable.`
    : `${what} for ${who} will lock when you save.`
}

export const defaultRateHelper = (amount) => `Default rate is ${amount}`
// RateEditor.tsx:212-213 — replaces the helper line on a failed save attempt.
export const AMOUNT_REQUIRED = 'Enter an amount for this rate.'
export const USE_DEFAULT = 'Use default'

export const COL_DEFAULT_RATE = 'Default rate'
export const COL_LOCKED_RATE  = 'Locked rate'
export const COL_CURRENT_RATE = 'Current rate'

export const SAVE   = 'Save rates'
export const CANCEL = 'Cancel'

// `unitAsSentence` matches lockedRatesCopy.js so both modes read the same.
export const unitAsSentence = (unit) => `per ${unit}`

// ── The review step (ReviewRatesStep.tsx) ────────────────────────────────────
export const REVIEW_HEADING = 'Review rates'

export const reviewIntentLine = (intent, clientName) => {
  const who = clientName || 'this client'
  const verb = intent === 'unlocking' ? 'unlocking' : intent === 'updating' ? 'updating' : 'locking'
  return `You are ${verb} ${who}’s rates.`
}

export const wasAmount = (amount) => `Was ${amount}`
export const CONFIRM = 'Confirm'
export const GO_BACK = 'Go back'

// ── The discard confirm (ManageRatesModal.tsx) ───────────────────────────────
export const DISCARD_TITLE = 'Unsaved changes'
export const DISCARD_BODY  = 'Your changes to these rates won’t be saved.'
export const KEEP_EDITING  = 'Keep editing'
export const DISCARD       = 'Discard changes'

// ── Save reports (rateCopy.ts) ───────────────────────────────────────────────
export const savedLockedReport = (clientName, serviceName) => serviceName
  ? `Saved. ${clientName}’s ${serviceName} rates are locked.`
  : `Saved. ${clientName}’s rates are locked.`

export const savedUnlockedReport = (clientName, serviceName) => serviceName
  ? `Saved. ${clientName}’s ${serviceName} rates follow your defaults again.`
  : `Saved. ${clientName}’s rates follow your defaults again.`

export const savedUpdatedReport = (clientName, serviceName) => serviceName
  ? `Saved. ${clientName}’s ${serviceName} rates are locked at the new amounts.`
  : `Saved. ${clientName}’s rates are locked at the new amounts.`

// ── The relationship page rate sheet (RelationshipRatesContent + variants) ───
export const RATES_SECTION_HEADING = 'Rates'
export const GROUP_BOOKED     = 'Previously booked'
export const GROUP_NOT_BOOKED = 'Not booked'
export const NO_SERVICES = 'Add a service to your profile to customize rates for a client.'
export const SERVICES_ERROR = 'We couldn’t load your services. Refresh to try again.'
