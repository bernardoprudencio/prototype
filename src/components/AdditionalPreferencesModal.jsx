import React from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import { colors, textStyles, spacing } from '../tokens'

/**
 * AdditionalPreferencesModal — nudges newly-approved sitters to set
 * additional service preferences for better matching.
 *
 * Props:
 *   open     boolean
 *   onClose  () => void
 */
export default function AdditionalPreferencesModal({ open, onClose }) {
  if (!open) return null

  return (
    <BottomSheet variant="simple" onDismiss={onClose}>
      <div style={{ paddingTop: spacing.sm }}>
        <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0, marginBottom: spacing.md }}>
          Important Next Step
        </h2>

        <p style={{ ...textStyles.paragraph200, color: colors.secondary, margin: 0, marginBottom: spacing.xl }}>
          Set additional service preferences. Now that you've submitted your profile, you can access additional non-required settings for every service to get the best matches for you.
        </p>

        <Button variant="primary" size="default" fullWidth onClick={onClose}>
          Got it
        </Button>
      </div>
    </BottomSheet>
  )
}
