import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { getRelationshipData } from '../data/relationshipData'

/**
 * useRelationshipData — the single entry point every screen uses to read a
 * client's relationship data, so the graduated-take-rate / alt-monetization
 * experiment is gated in exactly one place.
 *
 * Production gates this on `is_rollout_alt_monetisation`
 * (roverdotcom/web :: RelationshipProgressScreenView, views.py:1011-1013). The
 * prototype's equivalent is the `altMonetizationRollout` dev flag in
 * AppContext; folding it into the data call here follows the same convention as
 * `useLockedRates` (useLockedRates.js:72-88), which derives one value from the
 * flag rather than letting every component test `flag && …` for itself.
 *
 * Why ALL four call sites must go through this hook rather than just the
 * relationship page: the flag does not only hide the tier tracker, it changes
 * the *money*. With alt-monetization off there are no tiers, so earnings fall
 * back to the baseline 80% take rate. If only RelationshipPage knew about the
 * flag, BookingDetailsScreen's price ledger and ModifyBookingScreen's ledger
 * would keep rendering tier-derived earnings (90%) while the relationship page
 * showed 80% for the same client — two numbers for one booking.
 *
 * `progress.heading`, `progress.tiers` and `progress.callout` come back null
 * when the flag is off (that null is the render gate — screens read the data,
 * not the flag); `progress.earnings.completed` / `.pending` stay populated in
 * both states, just at the different rate.
 *
 * @param ownerId the client id from the route
 * @returns the relationship data object, or null when the client is unknown
 */
export const useRelationshipData = (ownerId) => {
  const { altMonetizationRollout } = useApp()
  return useMemo(
    () => getRelationshipData(ownerId, { altMonetization: altMonetizationRollout }),
    [ownerId, altMonetizationRollout],
  )
}
