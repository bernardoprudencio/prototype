import React from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import Row from './Row'
import { colors, textStyles, spacing } from '../tokens'
import {
  LOCK_SHEET_TITLE, lockSheetBody, LOCK_SHEET_CTA, HIGHER_PRICE_NOTE,
  unlockSheetTitle, unlockSheetBody, UNLOCK_SHEET_SUBTITLE, UNLOCK_SHEET_CTA,
  RATE_LOCKED, RATE_NOT_LOCKED,
} from '../data/lockedRatesCopy'

/**
 * LockRatesSheet — the lock/unlock confirmation sheet.
 *
 * Production has no per-row control here: the API write is full-set replacement
 * (lock POSTs the whole computed rate list, unlock POSTs an empty one), so the
 * sheet is purely "here is what will apply, confirm or dismiss".
 *
 * Lock mode shows the rates that will be frozen for this owner. Unlock mode
 * shows the sitter's *default* rates, because that is what the owner snaps to.
 *
 * Props:
 *   mode            'lock' | 'unlock'
 *   ownerFirstName  string
 *   serviceName     string   — e.g. 'dog boarding'
 *   rates           [{ slug, label, lockedPrice, defaultPrice, unit }]
 *   onConfirm       () => void
 *   onClose         () => void
 *   zIndex          number   — above the host sheet (default 320)
 */
export default function LockRatesSheet({ mode, ownerFirstName, serviceName, rates = [], onConfirm, onClose, zIndex = 320 }) {
  const locking = mode === 'lock'

  const title = locking ? LOCK_SHEET_TITLE : unlockSheetTitle(ownerFirstName)
  const body  = locking
    ? lockSheetBody(ownerFirstName, serviceName)
    : unlockSheetBody(ownerFirstName, serviceName)
  const cta   = locking ? LOCK_SHEET_CTA : UNLOCK_SHEET_CTA

  const header = (
    <div style={{ paddingBottom: spacing.lg }}>
      <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0 }}>
        {title}
      </h2>
    </div>
  )

  return (
    <BottomSheet variant="full" onDismiss={onClose} header={header} zIndex={zIndex}>
      <p style={{ ...textStyles.paragraph200, color: colors.secondary, margin: 0 }}>
        {body}
      </p>

      {locking && (
        <p style={{ ...textStyles.text100, color: colors.tertiary, margin: 0, marginTop: spacing.md }}>
          {HIGHER_PRICE_NOTE}
        </p>
      )}

      {!locking && (
        <p style={{ ...textStyles.text200Semibold, color: colors.primary, margin: 0, marginTop: spacing.xl }}>
          {UNLOCK_SHEET_SUBTITLE}
        </p>
      )}

      <div style={{ marginTop: locking ? spacing.xl : spacing.sm, marginBottom: spacing.xl }}>
        {rates.map((rate, i) => {
          const price = locking ? rate.lockedPrice : rate.defaultPrice
          return (
            <Row
              key={rate.slug}
              firstRow={i === 0}
              label={rate.label}
              sublabel={locking ? RATE_LOCKED : RATE_NOT_LOCKED}
              rightItem={
                <span style={{ ...textStyles.text200Semibold, color: colors.priceText }}>
                  {`$${price}`}
                  <span style={{ ...textStyles.text100, color: colors.tertiary }}>{` / ${rate.unit}`}</span>
                </span>
              }
            />
          )
        })}
      </div>

      <Button variant="primary" size="default" fullWidth onClick={onConfirm}>
        {cta}
      </Button>
    </BottomSheet>
  )
}
