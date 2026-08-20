import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { snackbarLocked, SNACKBAR_UNLOCKED } from '../data/lockedRatesCopy'
import { lockedRatesFor, isLockableConversation, BROWSABLE_SERVICE_KEYS } from '../data/lockableRates'

/**
 * useLockedRates — shared wiring for every surface that hosts the locked-rates
 * control (booking details, pricing ledger, relationship page "Rates" row).
 *
 * Two different keys are at play, and production keeps them separate:
 *
 *   - The lock itself is per (requester x service). That is what
 *     `ConversationApplicableLockedServiceAddOnsDescriptor` reads
 *     (conversations/descriptors.py:707-716 — `requester=conversation.requester_id,
 *     service=conversation.service_id`), and it lives in AppContext so a toggle on
 *     one surface is reflected on all of them.
 *   - The control's *visibility* is per conversation, gated by
 *     `_get_lock_rates_toggle` (price_ledger.py:1720-1742). All five of its
 *     conditions:
 *       1. not conv.is_grooming
 *       2. the viewer is the provider
 *       3. financial_calculator.is_paid()
 *       4. conv.service_type in BROWSABLE_SERVICE_TYPES
 *       5. not (conv.stay and conv.stay.is_cancelled)
 *     There is deliberately NO recurring check — see lockedRatesCopy.js.
 *
 * In this prototype 1, 2 and 4 are structurally free: the sitter is always the
 * provider, and `SERVICES` in relationshipData.js is already exactly
 * BROWSABLE_SERVICE_TYPES (training and grooming are excluded). So only the paid
 * and cancelled gates discriminate, and both are derived from the booking's
 * `serviceStatus` by `paymentFields()` in relationshipData.js.
 *
 * ── Two commit interactions, both production ────────────────────────────────
 * The ConversationPage / price-ledger surfaces confirm through a modal before
 * writing: `ConversationLockRates.tsx:29-33` fires the modal-open event and
 * resets the switch, and `LockRatesModal.tsx` owns the commit. That is this
 * hook's default (`mode: 'sheet'`) and the behaviour every existing caller gets.
 *
 * The modify-booking page has no modal at all: the switch calls
 * `onLockedRateChange` (`ModifyBookingForm.tsx:836-844`) straight into
 * `ModifyBooking.duck.ts:483-503`, which dispatches, POSTs and fires analytics
 * immediately — persistence of the rest of the form is deferred to submit
 * (`:644-663`). `mode: 'immediate'` is that path. It also fires no toast, which
 * is why `snackbar` can be turned off.
 *
 * @param client  the contacts.js client, or null
 * @param booking the conversation's booking — needs `serviceKey`, `isPaid`,
 *                `isCancelled`. Pass null to get an unavailable result.
 * @param options `mode`     'sheet' (default) — `requestChange` opens the
 *                           confirmation sheet, which commits on `confirm`.
 *                           'immediate' — `requestChange` commits on the spot
 *                           and `sheetMode` stays null, so the host renders no
 *                           sheet.
 *                `snackbar` default true; false suppresses the toast.
 *
 * Returns:
 *   available          bool   — dev flag on AND this conversation passes the gate
 *   locked             bool
 *   config             the (client x service) locked-rates block, null when unavailable
 *   lockedServiceCount how many browsable services this client has locked
 *   ownerFirstName     string
 *   sheetMode          'lock' | 'unlock' | null   — pass to LockRatesSheet
 *   requestChange      (nextChecked) => void      — opens the confirmation sheet,
 *                                                   or commits directly in 'immediate' mode
 *   confirm            () => void                 — commits + fires the snackbar
 *   closeSheet         () => void
 *   snackbar           string | null
 *   dismissSnackbar    () => void
 */
export function useLockedRates(client, booking = null, options = {}) {
  const { mode = 'sheet', snackbar: notify = true } = options
  const { showLockedRates, isRatesLocked, setRatesLocked } = useApp()
  const [sheetMode, setSheetMode] = useState(null)
  const [snackbar, setSnackbar] = useState(null)

  const serviceKey = booking?.serviceKey ?? null
  const passesGate = Boolean(client) && isLockableConversation(booking)

  const config = passesGate ? lockedRatesFor(client, serviceKey) : null
  const available = Boolean(showLockedRates && config)
  const locked = available ? isRatesLocked(client, serviceKey) : false
  const ownerFirstName = client?.displayName?.split(' ')[0] ?? ''

  // The relationship page summarises across services rather than sitting on one
  // conversation, so it needs the count, not this booking's single boolean.
  const lockedServiceCount = client && showLockedRates
    ? BROWSABLE_SERVICE_KEYS.filter(k => isRatesLocked(client, k)).length
    : 0

  // The write itself, shared by both interactions.
  const commit = (nextLocked) => {
    setRatesLocked(client, serviceKey, nextLocked)
    if (notify) setSnackbar(nextLocked ? snackbarLocked(ownerFirstName) : SNACKBAR_UNLOCKED)
    setSheetMode(null)
  }

  const requestChange = (nextChecked) => {
    if (mode === 'immediate') { commit(nextChecked); return }
    setSheetMode(nextChecked ? 'lock' : 'unlock')
  }
  const closeSheet = () => setSheetMode(null)

  const confirm = () => commit(sheetMode === 'lock')

  return {
    available, locked, config, lockedServiceCount, ownerFirstName,
    sheetMode, requestChange, confirm, closeSheet,
    snackbar, dismissSnackbar: () => setSnackbar(null),
  }
}
