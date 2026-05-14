import React from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import { colors, textStyles, spacing } from '../tokens'

/**
 * AvailabilityModal — one-time post-submission modal that thanks the sitter
 * and prompts them to confirm their two-week availability.
 *
 * The inline availability picker is intentionally stubbed for now — see TODO.
 *
 * Props:
 *   open     boolean
 *   onClose  () => void
 */
export default function AvailabilityModal({ open, onClose }) {
  if (!open) return null

  return (
    <BottomSheet variant="simple" onDismiss={onClose}>
      <div style={{ paddingTop: spacing.sm }}>
        <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0, marginBottom: spacing.md }}>
          Thanks for completing your sitter profile!
        </h2>

        <p style={{ ...textStyles.paragraph200, color: colors.secondary, margin: 0, marginBottom: spacing.lg }}>
          New sitters and walkers may be approved and start receiving requests within 72 hours after profile submission.
        </p>

        {/* TODO: Replace this placeholder with the real availability picker
            (two-week calendar with per-day deselect). */}
        <p style={{ ...textStyles.paragraph100, color: colors.tertiary, margin: 0, marginBottom: spacing.xl, fontStyle: 'italic' }}>
          Deselect any days you cannot provide service over the next two weeks.
        </p>

        <Button variant="primary" size="default" fullWidth onClick={onClose}>
          Confirm Availability
        </Button>
      </div>
    </BottomSheet>
  )
}
