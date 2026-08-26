import React from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import { colors, textStyles, spacing } from '../tokens'
import { DISCARD_TITLE, DISCARD_BODY, KEEP_EDITING, DISCARD } from '../data/granularRatesCopy'

/**
 * DiscardChangesConfirm — "Unsaved changes". Not dismissable; the only two ways
 * out are its own controls.
 *
 * Ported from the branch that carries the POC's `ManageRatesModal.tsx`, whose
 * `isConfirmingClose` branch returns a `ScrollableModal` from the same position
 * as the rates — `isDismissable={false}`, `showCloseIcon={false}` — so React
 * reconciles it into the dialog already open rather than mounting a second one.
 * `ManageRatesSheet` does the same: it returns this instead of its own sheet,
 * which is why this component owns the `BottomSheet` and takes no zIndex.
 *
 * A question with exactly two answers, and the one that keeps the provider's
 * work is the primary. Every escape route the sheet cannot suppress — the
 * overlay, a back swipe — therefore lands on `Keep editing` and not on the
 * destructive answer (ManageRatesModal.tsx, the `isConfirmingClose` branch).
 *
 * It carries `wideModal` for the same reason `ManageRatesSheet` does: it is
 * returned from that sheet's position, so it has to be presented the same way —
 * a bottom sheet sliding up under a centred modal would read as two dialogs.
 *
 * Props:
 *   onKeepEditing () => void
 *   onDiscard     () => void
 */
export default function DiscardChangesConfirm({ onKeepEditing, onDiscard }) {
  return (
    <BottomSheet variant="simple" wideModal onDismiss={onKeepEditing}>
      <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0 }}>
        {DISCARD_TITLE}
      </h2>

      <p style={{
        ...textStyles.paragraph200,
        color: colors.primary,
        margin: 0,
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
      }}>
        {DISCARD_BODY}
      </p>

      <Button variant="primary" size="default" fullWidth onClick={onKeepEditing}>
        {KEEP_EDITING}
      </Button>

      {/* Kibble spells this `<Button fullWidth destructive mt="3x">` — a
          secondary in the footer slot, tinted destructive. This Button has no
          `destructive` modifier on top of a variant, so the destructive variant
          stands in; it is the only red the prototype has. 12px above it is
          Kibble's `mt="3x"`. */}
      <Button
        variant="destructive"
        size="default"
        fullWidth
        onClick={onDiscard}
        style={{ marginTop: spacing.md }}
      >
        {DISCARD}
      </Button>
    </BottomSheet>
  )
}
