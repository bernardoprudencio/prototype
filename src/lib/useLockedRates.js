import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { snackbarLocked, SNACKBAR_UNLOCKED } from '../data/lockedRatesCopy'

/**
 * useLockedRates — shared wiring for every surface that hosts the locked-rates
 * control (booking details, pricing ledger, relationship page "Rates" row).
 *
 * The lock state lives in AppContext keyed on owner + service, so toggling on one
 * surface is immediately reflected on the others — which is how production
 * behaves, since all of them read the same LockedServiceAddOn rows.
 *
 * Returns:
 *   available       bool     — flag on AND this client can have locked rates
 *   locked          bool
 *   config          the client's lockedRates block (null when unavailable)
 *   ownerFirstName  string
 *   sheetMode       'lock' | 'unlock' | null   — pass to LockRatesSheet
 *   requestChange   (nextChecked) => void      — opens the confirmation sheet
 *   confirm         () => void                 — commits + fires the snackbar
 *   closeSheet      () => void
 *   snackbar        string | null
 *   dismissSnackbar () => void
 */
export function useLockedRates(client) {
  const { showLockedRates, isRatesLocked, setRatesLocked } = useApp()
  const [sheetMode, setSheetMode] = useState(null)
  const [snackbar, setSnackbar] = useState(null)

  // Production gates the control on the sitter being the provider and the
  // conversation being paid, browsable and not cancelled. In the prototype the
  // presence of a `lockedRates` block on a non-recurring client stands in for
  // all of that — see the note in src/data/contacts.js.
  const config = client?.lockedRates ?? null
  const available = Boolean(showLockedRates && config)
  const locked = available ? isRatesLocked(client) : false
  const ownerFirstName = client?.displayName?.split(' ')[0] ?? ''

  const requestChange = (nextChecked) => setSheetMode(nextChecked ? 'lock' : 'unlock')
  const closeSheet = () => setSheetMode(null)

  const confirm = () => {
    const nextLocked = sheetMode === 'lock'
    setRatesLocked(client, nextLocked)
    setSnackbar(nextLocked ? snackbarLocked(ownerFirstName) : SNACKBAR_UNLOCKED)
    setSheetMode(null)
  }

  return {
    available, locked, config, ownerFirstName,
    sheetMode, requestChange, confirm, closeSheet,
    snackbar, dismissSnackbar: () => setSnackbar(null),
  }
}
