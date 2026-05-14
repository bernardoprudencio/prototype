import React from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import { colors, textStyles, spacing } from '../tokens'

/**
 * ConfirmDeactivationModal — destructive-action confirmation shown when a
 * sitter removes/deactivates a service on Rover.
 *
 * Props:
 *   open       boolean
 *   onConfirm  () => void
 *   onCancel   () => void
 */
export default function ConfirmDeactivationModal({ open, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <BottomSheet variant="simple" onDismiss={onCancel}>
      <div style={{ paddingTop: spacing.sm }}>
        <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0, marginBottom: spacing.lg }}>
          Confirm deactivation
        </h2>

        <p style={{ ...textStyles.paragraph200, color: colors.secondary, margin: 0, marginBottom: spacing.lg }}>
          Confirm that you no longer want to provide services on Rover.
        </p>

        <p style={{ ...textStyles.paragraph200, color: colors.secondary, margin: 0, marginBottom: spacing.sm }}>
          After you click "Confirm":
        </p>

        <ul style={{ ...textStyles.paragraph200, color: colors.secondary, margin: 0, marginBottom: spacing.xl, paddingLeft: spacing.xl }}>
          <li style={{ marginBottom: spacing.sm }}>
            Your account will revert to a pet parent account. To reactivate your sitter account, click on "Become a sitter" again.
          </li>
          <li>
            Your future confirmed bookings remain scheduled. If you can no longer provide service for these bookings, cancel them through the app.
          </li>
        </ul>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <Button variant="primary" size="default" fullWidth onClick={onConfirm}>
            Confirm
          </Button>
          <Button variant="default" size="default" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
