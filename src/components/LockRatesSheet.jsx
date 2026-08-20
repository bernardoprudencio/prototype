import React from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import { colors, textStyles, spacing } from '../tokens'
import {
  LOCK_SHEET_TITLE, lockSheetBody,
  UNLOCK_SHEET_TITLE, unlockSheetBody,
  RATE_LOCKED, unitAsSentence, SHEET_CLOSE,
} from '../data/lockedRatesCopy'

/**
 * LockRatesSheet — the lock/unlock confirmation sheet.
 *
 * Ported from production's `LockRatesModal.tsx`, which wraps Kibble's
 * `ScrollableModal`. At <=450px (`MQ.MOBILE`, MediaQuery.ts:26) ScrollableModal
 * renders a BottomSheet rather than a centred dialog (ScrollableModal.tsx:162,
 * 237-274), so `variant="full"` is the right container: sticky heading, scrolling
 * body, and a footer region reserved after the scroll area (L97-125).
 *
 * Structure and values, all from LockRatesModal.tsx:27-75:
 *   heading   Heading size="300" = 20/600/1.25, inherited colour
 *   body      Paragraph size="200" mt="2x" mb="8x" -> 16/400/1.5, text.primary,
 *             8 top / 32 bottom — NOT the muted secondary this sheet used before
 *   rows      Flex column py="2x" mb="2x"; inner row space-between; plain
 *             `Text size="200"` at default colour for BOTH label and price —
 *             not semibold, and not `colors.priceText`. No separators.
 *   footer    full-width primary submit whose label IS the title
 *             (`submitButtonText={title}`, L36), then a full-width secondary
 *             "Close" 12px below (`mb="3x"`, ScrollableModal.tsx:99-122) using
 *             the `flat` variant `closeButtonVariant="flat"` asks for (L35).
 *             Both at `buttonSize="small"` (L37).
 *
 * There is no per-row control: the API write is full-set replacement (lock POSTs
 * the whole computed list, unlock POSTs an empty one), so the sheet is purely
 * "here is what will apply, confirm or dismiss".
 *
 * The lock/unlock asymmetry is driven by the API, not by the view
 * (price_ledger.py:1705-1774):
 *   lock    `_get_lockable_rates_list` sends the rate about to be frozen with
 *           the real unit and NO locked_amount. With locked_amount absent, the
 *           modal moves the unit onto its own right-aligned line below the price
 *           (LockRatesModal.tsx:66-72), and there is no left-column sublabel.
 *   unlock  `_get_unlock_rates_list` overwrites unit with the literal
 *           "Locked rate", sets amount to the sitter's CURRENT DEFAULT rate and
 *           locked_amount to the frozen one — so unlock mode shows both prices
 *           per row: the default prominently, the frozen rate beneath it.
 *
 * Both modes use one title set. The web modal is the only locked-rates
 * confirmation production has; the question-form title and "Update to default
 * rates" CTA are iOS strings, and the modify-booking surface has no modal at all
 * (ModifyBooking.duck.ts:482-502). Hence no `titleVariant` prop.
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

  const title = locking ? LOCK_SHEET_TITLE : UNLOCK_SHEET_TITLE
  const body  = locking
    ? lockSheetBody(ownerFirstName, serviceName)
    : unlockSheetBody(ownerFirstName, serviceName)

  const header = (
    <div style={{ paddingBottom: spacing.lg }}>
      <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0 }}>
        {title}
      </h2>
    </div>
  )

  // Text size="200" at default colour, and size="100" at textColor="tertiary" —
  // the only two type styles the rate rows use.
  const amountSt = { ...textStyles.text200, color: colors.primary }
  const metaSt   = { ...textStyles.text100, color: colors.tertiary }

  const footer = (
    <>
      <Button
        variant="primary"
        size="small"
        fullWidth
        onClick={onConfirm}
        style={{ marginBottom: spacing.md }}
      >
        {title}
      </Button>
      {/* mobile-only 4px nudge below the dismiss button, ScrollableModal.tsx:112 */}
      <Button variant="flat" size="small" fullWidth onClick={onClose} style={{ marginBottom: spacing.xs }}>
        {SHEET_CLOSE}
      </Button>
    </>
  )

  return (
    <BottomSheet variant="full" onDismiss={onClose} header={header} footer={footer} zIndex={zIndex}>
      <p style={{
        ...textStyles.paragraph200,
        color: colors.primary,
        margin: 0,
        marginTop: spacing.sm,
        marginBottom: spacing.xxl,
      }}>
        {body}
      </p>

      {/* Flat local rows rather than the shared `Row`: production's label is a
          plain 16/400 with no minimum row height, and the right column stacks
          two values — neither of which `Row` expresses, and it is shared with
          other screens so it stays untouched. */}
      <div>
        {rates.map(rate => (
          <div key={rate.slug} style={{
            display: 'flex', flexDirection: 'column',
            paddingTop: spacing.sm, paddingBottom: spacing.sm,
            marginBottom: spacing.sm,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={amountSt}>{rate.label}</span>
                {!locking && <span style={metaSt}>{RATE_LOCKED}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                <span style={amountSt}>{`$${locking ? rate.lockedPrice : rate.defaultPrice}`}</span>
                {!locking && <span style={metaSt}>{`$${rate.lockedPrice}`}</span>}
              </div>
            </div>

            {locking && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={metaSt}>{unitAsSentence(rate.unit)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </BottomSheet>
  )
}
