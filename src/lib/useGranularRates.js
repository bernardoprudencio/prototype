import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { isLockableConversation, defaultAmountsFor, lockedSeedFor } from '../data/lockableRates'

/**
 * useGranularRates — shared wiring for the POC proposal's locked-rates surfaces:
 * the conversation/booking-details rates row and the relationship page's rate
 * sheet. The sibling hook `useLockedRates` still serves `ratesMode === 'current'`
 * and is deliberately untouched.
 *
 * ── What changed from the current experience ────────────────────────────────
 * The lock is still all-or-nothing per service — there is no per-rate lock and
 * no per-rate revert (01-locked-rates-client-management.md §1). What is new is
 * that each rate carries an *amount* the provider sets while locking, and that
 * the entry point is one of three offers rather than a switch.
 *
 * ── The offer (§3.1) ────────────────────────────────────────────────────────
 *   offer = !isLocked           ? 'lock'
 *         : bookedDiffersFromLocked ? 'update'
 *         :                      'manage'
 * `lock` gets no padlock; the other two do. `lock` and `update` seed the modal
 * from the request's own prices and open with the switch already on, which is
 * why Save is enabled the moment the modal appears.
 *
 * @param client  the contacts.js client, or null
 * @param booking the conversation's booking, or null on the relationship page —
 *                which summarises across services rather than sitting on one.
 */
export function useGranularRates(client, booking = null) {
  const { showLockedRates, ratesMode, getRatesState, commitRatesState } = useApp()
  const [sheet, setSheet] = useState(null)      // { serviceKey, opensLocked, requestAmounts }

  const clientName = client?.displayName?.split(' ')[0] ?? ''
  const enabled = Boolean(showLockedRates && ratesMode === 'granular' && client)

  const stateFor = (serviceKey) => (enabled ? getRatesState(client, serviceKey) : null)

  // ── This conversation's service ────────────────────────────────────────────
  const serviceKey = booking?.serviceKey ?? null
  // The proposal does not offer locking on recurring weeks — one-time bookings
  // only. Production's `_get_lock_rates_toggle()` has no such check (the
  // recurring exclusion lives on the retiring legacy stay page), so this is a
  // deliberate divergence, scoped to the granular flow.
  const passesGate = enabled && isLockableConversation(booking) && !booking?.isRecurring
  const state = passesGate ? stateFor(serviceKey) : null
  const available = Boolean(state)

  // The prices the owner is actually booked at. One-off bookings carry them per
  // pet on `modify.rateRows` (relationshipData.js buildModifyFields); recurring
  // weeks have no modify block and publish `rateAmounts` instead. Either way the
  // seeded modal opens on the same numbers the ledger above it shows. Rates the
  // request doesn't price fall back to the sitter's default.
  const requestAmounts = (() => {
    if (!available) return null
    const out = { ...defaultAmountsFor(serviceKey) }
    const rows = booking?.modify?.rateRows ?? []
    rows.forEach(r => { out[r.slug] = r.pricePerUnit })
    Object.entries(booking?.rateAmounts ?? {}).forEach(([slug, amt]) => { out[slug] = amt })
    return out
  })()

  // §3.1 — set membership, not amount comparison, decides `isLocked`; the
  // amounts only decide `update` vs `manage`.
  const offer = (() => {
    if (!available) return null
    if (!state.locked) return 'lock'
    const differs = Object.keys(state.amounts).some(
      slug => Number(requestAmounts?.[slug]) !== Number(state.amounts[slug])
    )
    return differs ? 'update' : 'manage'
  })()

  const openSheet = (key, opts = {}) => setSheet({
    serviceKey: key,
    opensLocked: Boolean(opts.opensLocked),
    requestAmounts: opts.requestAmounts ?? null,
  })

  // The conversation row opens the modal in place, seeded from the request on
  // the two offers that have one.
  const openFromRow = () => {
    if (!available) return
    openSheet(serviceKey, {
      opensLocked: offer === 'lock' || offer === 'update',
      requestAmounts,
    })
  }

  const closeSheet = () => setSheet(null)

  // One save writes the whole set. No confirmation toast: the sheet closes and
  // the row underneath already states the new locked state, so a snackbar only
  // repeats what the screen shows. `ratesMode === 'current'` keeps its own.
  const save = (key, { locked, amounts }) => {
    commitRatesState(client, key, { locked, amounts })
    setSheet(null)
  }

  return {
    enabled, available, clientName,
    serviceKey, state, offer, requestAmounts,
    stateFor, seedFor: (key) => lockedSeedFor(client, key),
    sheet, openSheet, openFromRow, closeSheet,
    save,
  }
}
