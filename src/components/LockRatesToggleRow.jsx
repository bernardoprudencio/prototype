import React, { useState } from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import OnOffSwitch from './OnOffSwitch'
import { InfoCircleIcon } from '../assets/icons'
import { colors, textStyles, spacing } from '../tokens'
import { TOGGLE_ARIA_LABEL, TOOLTIP_TITLE, tooltipBody } from '../data/lockedRatesCopy'

/**
 * LockRatesToggleRow — the locked-rates control, shared by every surface that
 * hosts it (booking details price ledger, modification-screen ledger).
 *
 * In production the affordance next to the label is a muted info/question-circle
 * icon that opens a tooltip (web) or popover (native) — there is no padlock
 * badge on the toggle itself. Tapping the switch does not commit: it opens the
 * lock/unlock confirmation sheet, which the host owns.
 *
 * Props:
 *   label            string   — surface-specific phrasing from lockedRatesCopy
 *   ownerFirstName   string   — interpolated into the tooltip body
 *   checked          bool
 *   onRequestChange  (nextChecked) => void — host opens LockRatesSheet
 */
export default function LockRatesToggleRow({ label, ownerFirstName, checked, onRequestChange }) {
  const [tipOpen, setTipOpen] = useState(false)

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: spacing.sm,
        minHeight: 56, padding: '8px 0',
      }}>
        <span style={{ ...textStyles.text200, color: colors.primary, flex: 1 }}>
          {label}
          {' '}
          <button
            type="button"
            aria-label={TOOLTIP_TITLE}
            onClick={() => setTipOpen(true)}
            style={{
              background: 'transparent', border: 'none', padding: 0,
              cursor: 'pointer', verticalAlign: 'middle', lineHeight: 1,
            }}
          >
            <InfoCircleIcon size={16} color={colors.tertiary} style={{ verticalAlign: 'middle' }} />
          </button>
        </span>

        <OnOffSwitch
          checked={checked}
          ariaLabel={TOGGLE_ARIA_LABEL}
          onChange={next => onRequestChange?.(next)}
        />
      </div>

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
              Got it
            </Button>
          </div>
        </BottomSheet>
      )}
    </>
  )
}
