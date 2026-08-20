import React, { useState } from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import SwitchField from './SwitchField'
import { InfoCircleIcon } from '../assets/icons'
import { colors, textStyles, spacing, radius } from '../tokens'
import {
  TOOLTIP_TITLE, tooltipBody, TOOLTIP_DISMISS, INFO_BUTTON_ARIA_LABEL,
} from '../data/lockedRatesCopy'

/**
 * LockRatesToggleRow — the locked-rates control.
 *
 * Thin composition over `SwitchField`; all row layout, typography, hover tint,
 * click target and label wiring live there. What is locked-rates-specific and
 * therefore stays here:
 *
 *   1. The copy, from lockedRatesCopy.
 *   2. The info affordance and its tooltip. Production's is a hover Popover
 *      around a small alert-info icon (`LockedRatesComponent.tsx:33-48`); on the
 *      price-ledger surface the equivalent control is
 *      `PriceLedger/components/AlertInfoButton.tsx:20-29` — a circular flat
 *      Button with zero padding and `color: neutral.900` (#1F2124), not the
 *      muted tertiary this row previously used. A hover popover has no mobile
 *      analogue, so the tooltip opens a BottomSheet instead.
 *   3. The non-optimistic contract. Tapping never commits: production's
 *      `ConversationLockRates.tsx:29-33` fires the modal-open event and then
 *      *resets* the field back to `toggle.initial`, so the visual state is only
 *      authoritative after the round-trip. Here the host owns LockRatesSheet and
 *      the switch simply reports the requested direction.
 *
 * Matches production exactly: `primaryLabelSize="100"`, no secondary label, no
 * divider, control on the right (ConversationLockRates.tsx:41-47).
 *
 * Props:
 *   label            string   — surface-specific phrasing from lockedRatesCopy
 *   ownerFirstName   string   — interpolated into the tooltip body
 *   checked          bool
 *   onRequestChange  (nextChecked) => void — host opens LockRatesSheet
 */
export default function LockRatesToggleRow({ label, ownerFirstName, checked, onRequestChange }) {
  const [tipOpen, setTipOpen] = useState(false)

  const infoButton = (
    <button
      type="button"
      data-switchfield-accessory
      aria-label={INFO_BUTTON_ARIA_LABEL}
      onClick={e => { e.stopPropagation(); setTipOpen(true) }}
      style={{
        width: 24, height: 24, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', padding: 0,
        borderRadius: radius.round,
        cursor: 'pointer', lineHeight: 1,
      }}
    >
      <InfoCircleIcon size={16} color={colors.primary} />
    </button>
  )

  return (
    <>
      <SwitchField
        primaryLabel={label}
        primaryLabelSize={100}
        labelAccessory={infoButton}
        checked={checked}
        onChange={next => onRequestChange?.(next)}
      />

      {tipOpen && (
        <BottomSheet variant="simple" onDismiss={() => setTipOpen(false)}>
          <div style={{ paddingTop: spacing.sm }}>
            <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0, marginBottom: spacing.md }}>
              {TOOLTIP_TITLE}
            </h2>
            <p style={{ ...textStyles.paragraph200, color: colors.secondary, margin: 0, marginBottom: spacing.xl }}>
              {tooltipBody(ownerFirstName)}
            </p>
            <Button variant="primary" size="default" fullWidth onClick={() => setTipOpen(false)}>
              {TOOLTIP_DISMISS}
            </Button>
          </div>
        </BottomSheet>
      )}
    </>
  )
}
