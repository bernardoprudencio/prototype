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
 * the entry point is an offer rather than a switch.
 *
 * ── The offer (§3.1) ────────────────────────────────────────────────────────
 *   offer = isLocked ? 'manage' : 'lock'
 * Two offers, decided by the saved lock state alone. `lock` gets no padlock;
 * `manage` does. Only `lock` seeds the modal from the request's own prices and
 * opens with the switch already on, which is why Save is enabled the moment
 * that modal appears.
 *
 * There used to be a third offer, `update`, taken when a locked service's saved
 * amounts no longer matched the booked ones; it re-seeded the modal from the
 * request. It is gone by product decision, not because production lacks it: the
 * request's prices are consulted **only while locking**. Once a service is
 * locked, the surface offers `manage` and the sheet seeds purely from the saved
 * amounts — the way back to request-seeded amounts is to unlock and lock again.
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
  // One-time, not-yet-started bookings only. The recurring exclusion used to be
  // written out here and scoped to this flow; it now lives in
  // `isLockableConversation` alongside an ongoing exclusion, so both rates modes
  // agree. See the comment on that function for the divergence rationale.
  const passesGate = enabled && isLockableConversation(booking)
  const state = passesGate ? stateFor(serviceKey) : null
  const available = Boolean(state)

  // The prices the owner is actually booked at — all rates at the sitter's
  // default except the ones this request prices. One-off bookings carry them per
  // pet on `modify.rateRows` (relationshipData.js buildModifyFields); recurring
  // weeks have no modify block and publish `rateAmounts` instead. Either way the
  // seeded modal opens on the same numbers the ledger above it shows.
  //
  // Only the `lock` offer ever sees these: an already-locked service is seeded
  // from what is saved, never re-prefilled from a booking.
  const requestAmounts = (() => {
    if (!available) return null
    const out = { ...defaultAmountsFor(serviceKey) }
    const rows = booking?.modify?.rateRows ?? []
    rows.forEach(r => { out[r.slug] = r.pricePerUnit })
    Object.entries(booking?.rateAmounts ?? {}).forEach(([slug, amt]) => { out[slug] = amt })
    return out
  })()

  // §3.1 — set membership, not amount comparison, decides `isLocked`, and the
  // lock state alone decides the offer. The booked amounts are not consulted
  // here at all: a locked service always offers `manage`.
  const offer = (() => {
    if (!available) return null
    return state.locked ? 'manage' : 'lock'
  })()

  const openSheet = (key, opts = {}) => setSheet({
    serviceKey: key,
    opensLocked: Boolean(opts.opensLocked),
    requestAmounts: opts.requestAmounts ?? null,
  })

  // The conversation row opens the modal in place. Only `lock` is seeded from
  // the request — `manage` opens on the saved amounts, with the switch in its
  // saved position, so pressing the row can never quietly reprice a lock.
  const openFromRow = () => {
    if (!available) return
    const isLockOffer = offer === 'lock'
    openSheet(serviceKey, {
      opensLocked: isLockOffer,
      requestAmounts: isLockOffer ? requestAmounts : null,
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
    // `requestAmounts` is deliberately not returned: it is lock-path seeding
    // only, and it reaches the sheet through `sheet.requestAmounts`, which
    // `openFromRow` fills in on the `lock` offer and leaves null otherwise.
    serviceKey, state, offer,
    stateFor, seedFor: (key) => lockedSeedFor(client, key),
    sheet, openSheet, openFromRow, closeSheet,
    save,
  }
}
