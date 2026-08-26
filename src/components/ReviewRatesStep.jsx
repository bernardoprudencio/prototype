import React from 'react'
import Button from './Button'
import { colors, textStyles, spacing } from '../tokens'
import { useIsWide } from '../lib/useMediaQuery'
import { formatRateAmount } from '../data/relationshipData'
import {
  REVIEW_HEADING, reviewIntentLine, unitAsSentence, wasAmount, CONFIRM, GO_BACK,
} from '../data/granularRatesCopy'

// Visually hidden, still read: Kibble's `A11yHiddenBox`. The struck-through
// previous amount is `aria-hidden` because a bare figure read out of context is
// ambiguous, so this sentence is what actually says what it was
// (POC ReviewRatesStep.tsx, `ReviewRateRow`).
const a11yHidden = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
}

/**
 * One rate across the write: its name and unit on the left, what it will charge
 * on the right — plus, only where the save moves the number, the old amount
 * struck through underneath.
 *
 * No column heads: the Figma table prints one amount per row rather than two to
 * diff, so there is nothing to head. That is the rework doc 02 records against
 * §4.2's two-column table, which is superseded.
 */
function ReviewRateRow({ row }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
      gap: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <span style={{ ...textStyles.text200, color: colors.primary }}>{row.label}</span>
        {/* Empty for a one-off rate, which has no unit to be priced by. */}
        {!!row.unit && (
          <span style={{ ...textStyles.paragraph100, color: colors.tertiary }}>
            {unitAsSentence(row.unit)}
          </span>
        )}
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        flex: 1, minWidth: 0,
      }}>
        <span style={{ ...textStyles.text200Semibold, color: colors.primary, textAlign: 'right' }}>
          {formatRateAmount(row.newAmount)}
        </span>
        {row.hasChanged && (
          <>
            <span aria-hidden="true" style={{
              ...textStyles.text100,
              color: colors.tertiary,
              textDecoration: 'line-through',
              textAlign: 'right',
            }}>
              {formatRateAmount(row.previousAmount)}
            </span>
            <span style={a11yHidden}>{wasAmount(formatRateAmount(row.previousAmount))}</span>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * ReviewRatesStep — the POC's `ReviewRatesStep`. Gates the write.
 *
 * The last screen before the write: it **names the numbers**. Nothing before it
 * does — the rate fields show what was typed, not what it replaces.
 *
 * A plain component, not a sheet of its own. `ManageRatesSheet` swaps it into
 * the body of the `BottomSheet` it already has, the way the POC returns a
 * different `ScrollableModal` body from the same position, so there is one
 * dialog and one way out of the flow.
 *
 * It writes nothing and decides nothing: `onConfirm` runs the save the sheet
 * already assembled and `onGoBack` returns to the rates untouched — which is why
 * it takes rows as data rather than the rates and the drafts. `onGoBack` must
 * not reach the discard confirm: nothing has been discarded.
 *
 * Its three regions are handed back to the caller when `children` is a
 * function, so the sheet can *place* them: at >=769px the heading goes in
 * `BottomSheet`'s header slot and the buttons in its footer, leaving only the
 * rows in the scroller, which is what keeps `Confirm` on screen with nine of
 * them. Called any other way it renders the same three in the same order it
 * always has, which is what the narrow sheet still wants.
 *
 * Props:
 *   intent      'locking' | 'unlocking' | 'updating'
 *   clientName  string
 *   rows        [{ slug, label, unit, newAmount, previousAmount, hasChanged }]
 *   onConfirm   () => void
 *   onGoBack    () => void
 *   children    (({ header, body, actions }) => ReactNode) | undefined
 */
export default function ReviewRatesStep({ intent, clientName, rows = [], onConfirm, onGoBack, children }) {
  const isWide = useIsWide()

  const header = (
    <>
      <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0, paddingTop: spacing.sm }}>
        {REVIEW_HEADING}
      </h2>

      <p style={{
        ...textStyles.paragraph200,
        color: colors.primary,
        margin: 0,
        paddingTop: spacing.sm,
      }}>
        {reviewIntentLine(intent, clientName)}
      </p>
    </>
  )

  const body = (
    <div
      className="hide-scrollbar"
      style={{
        paddingTop: spacing.lg,
        paddingBottom: spacing.lg,
        // Narrow only, and for the same reason the rate list carries one: the
        // `simple` variant has no height of its own, so with nine rows the top
        // of the sheet runs off the screen and `Confirm` off the bottom.
        ...(isWide ? null : { maxHeight: '38vh', overflowY: 'auto' }),
      }}
    >
      {rows.map(row => <ReviewRateRow key={row.slug} row={row} />)}
    </div>
  )

  // The step brings its own primary and secondary — a `Save rates` under a
  // `Confirm` would read as saving twice (POC ManageRatesModal.tsx, the
  // `isReviewing` branch, which leaves the modal footer empty).
  const actions = (
    <>
      <Button variant="primary" size="default" fullWidth onClick={onConfirm}>
        {CONFIRM}
      </Button>
      <Button
        variant="default"
        size="default"
        fullWidth
        onClick={onGoBack}
        style={{ marginTop: spacing.md }}
      >
        {GO_BACK}
      </Button>
    </>
  )

  if (typeof children === 'function') return children({ header, body, actions })

  return (
    <div>
      {header}
      {body}
      {actions}
    </div>
  )
}
