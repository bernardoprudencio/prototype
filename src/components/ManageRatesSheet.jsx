import React, { useMemo, useState } from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import SwitchField from './SwitchField'
import DiscardChangesConfirm from './DiscardChangesConfirm'
import ReviewRatesStep from './ReviewRatesStep'
import { colors, textStyles, spacing, radius } from '../tokens'
import { useIsWide } from '../lib/useMediaQuery'
import { formatRateAmount } from '../data/relationshipData'
import {
  AMOUNT_REQUIRED,
  modalTitle, lockStatusLine, lockToggleLabel, lockToggleNote,
  defaultRateHelper, USE_DEFAULT, COL_DEFAULT_RATE, unitAsSentence,
  SAVE, CANCEL,
} from '../data/granularRatesCopy'

/**
 * A rate is a whole unit of currency: the pricing system offers no way to charge
 * or edit cents, so a price with ".00" on the end advertises two digits nobody
 * can reach (POC `rateAmount.ts`). These two are its `toWholeAmount` and
 * `keepWholeAmountDigits`.
 *
 * Everything from the decimal separator on is discarded rather than parsed —
 * dropping the separator from "30.5" would leave 305, a tenfold error one
 * keystroke deep. Empty survives as empty, which is what the save gate reads.
 */
const toWholeAmount = (amount) => {
  const parsed = Number(amount)
  return Number.isFinite(parsed) ? String(Math.round(parsed)) : ''
}
const keepWholeAmountDigits = (value) => value.split('.')[0].replace(/[^0-9]/g, '')

/** The amount a field holds, as a number, or `null` while it is empty or unparseable. */
const resolveAmount = (input) => {
  if (!input || !input.trim()) return null
  const parsed = Number(input)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * One editable rate: the amount, its `Use default` way back to the provider's
 * own price, and the default itself for reference.
 *
 * Presentational and controlled — it never writes. `Use default` only *fills the
 * field*: it writes the default amount into the draft, so the rate stays this
 * client's own and Save is still the one commit point. There is no per-rate
 * revert, because the lock is not a per-rate property — unpinning stays one
 * gesture for the whole service (POC `RateEditor.tsx`).
 */
function RateAmountField({ rate, value, isInvalid, onChange }) {
  const isDefaultAmount = resolveAmount(value) === Number(rate.defaultPrice)

  return (
    <div style={{ marginBottom: spacing.lg }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: spacing.sm, marginBottom: spacing.xs, minHeight: 32,
      }}>
        <label
          htmlFor={`rate-${rate.slug}`}
          style={{ ...textStyles.text100Semibold, color: colors.primary }}
        >
          {rate.label}
        </label>
        {/* Compared as amounts rather than as strings, so "45" and "45.00" are
            the same price and the link stays away while one is being typed. */}
        {!isDefaultAmount && (
          <Button
            variant="flat"
            size="small"
            onClick={() => onChange(toWholeAmount(rate.defaultPrice))}
            style={{ paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }}
          >
            {USE_DEFAULT}
          </Button>
        )}
      </div>

      {/* The field itself knows nothing about money: the symbol leads and the
          unit trails, the way `AffixedTextField` places them for a left-symbol
          locale (POC RateEditor.tsx). */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: spacing.sm,
        padding: `0 ${spacing.md}px`,
        minHeight: 48,
        border: `2px solid ${isInvalid ? colors.borderError : colors.borderInteractive}`,
        borderRadius: radius.secondary,
        background: colors.white,
        boxSizing: 'border-box',
      }}>
        <span style={{ ...textStyles.text200, color: colors.tertiary }}>$</span>
        <input
          id={`rate-${rate.slug}`}
          inputMode="numeric"
          value={value}
          onChange={e => onChange(keepWholeAmountDigits(e.target.value))}
          aria-label={rate.label}
          aria-invalid={isInvalid || undefined}
          style={{
            ...textStyles.text200,
            flex: 1, minWidth: 0,
            border: 'none', outline: 'none', background: 'transparent',
            color: colors.primary, textAlign: 'right', padding: 0,
          }}
        />
        {/* A rate billed per stay has no unit noun, and renders a bare `/`
            if handed one anyway. */}
        {!!rate.unit && (
          <span style={{ ...textStyles.text200, color: colors.tertiary }}>{`/ ${rate.unit}`}</span>
        )}
      </div>

      {/* One line, two jobs — the POC's `helperMessage` / `errorMessage` pair
          share this slot (RateEditor.tsx:207-216). At rest it says the one thing
          a provider prices against, their own default; a failed save swaps in
          the error sentence and recolours the field's border with it. */}
      <p style={{
        ...textStyles.paragraph100,
        color: isInvalid ? colors.destructive : colors.tertiary,
        margin: 0,
        marginTop: spacing.xs,
      }}>
        {isInvalid ? AMOUNT_REQUIRED : defaultRateHelper(formatRateAmount(rate.defaultPrice))}
      </p>
    </div>
  )
}

/**
 * One rate, read rather than set. The off state is the view-only modal's
 * unlocked state down to the row: the amounts a save would leave this client on
 * (POC `RateAmountRow.tsx`).
 */
function RateAmountRow({ rate }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
      gap: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, minHeight: 56,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <span style={{ ...textStyles.text200, color: colors.primary }}>{rate.label}</span>
        {!!rate.unit && (
          <span style={{ ...textStyles.paragraph100, color: colors.tertiary }}>
            {unitAsSentence(rate.unit)}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end' }}>
        <span style={{ ...textStyles.text200, color: colors.primary, textAlign: 'right' }}>
          {formatRateAmount(rate.defaultPrice)}
        </span>
      </div>
    </div>
  )
}

/**
 * ManageRatesSheet — the POC's `ManageRatesModal`, as this prototype's
 * BottomSheet. One modal, opened from all three surfaces.
 *
 * Three things this sheet gets deliberately, each of which reads as a bug on
 * first meeting and is not:
 *
 *  1. **Locking is all-or-nothing per service.** A client either pays the
 *     provider's own prices or follows the defaults, so there is one switch
 *     outside the list and no per-rate lock — a switch on each row would offer a
 *     state the model cannot hold (POC `ServiceLockToggle.tsx`; design doc §5,
 *     "Three modes per rate", which was tried and dropped).
 *  2. **The status line tracks the SAVED state, never the switch.** A sheet
 *     opened from the `lock` offer therefore shows a switch that is ON above
 *     `Using default rates`. The line answers "what is this client on today",
 *     the switch answers "what will this save do", and the design depends on
 *     keeping the two apart (doc 01 §4.1; doc 02, "§4's subheading rule stands,
 *     and looks contradictory on purpose"). Do not "fix" it.
 *  3. **Save is armed on open when `opensLocked`.** That reverses the letter of
 *     §4.1's "never armed on open" while keeping its reason: what that rule
 *     forbids is arming from "there exists a write we could send". Here the
 *     arming has provenance — the provider pressed a row that said
 *     `Lock these rates for Sam` (doc 02, "What opening dirty forces").
 *
 * Props:
 *   serviceName     string          — "Boarding"; the heading is `{serviceName} rates`
 *   clientName      string          — first name
 *   rates           [{ slug, label, defaultPrice, unit }]
 *   savedLocked     bool            — the SAVED lock state (drives the status line)
 *   savedAmounts    { [slug]: number }
 *   lockedAt        Date | null
 *   opensLocked     bool            — seeded from a `lock`/`update` offer: switch opens ON
 *   requestAmounts  { [slug]: number } | null — prefill from the request's prices
 *   onSave          ({ locked, amounts }) => void
 *   onClose         () => void
 */
export default function ManageRatesSheet({
  serviceName,
  clientName,
  rates = [],
  savedLocked = false,
  savedAmounts = {},
  lockedAt = null,
  opensLocked = false,
  requestAmounts = null,
  onSave,
  onClose,
}) {
  /**
   * The staged switch. `null` is "the provider has not touched it", which keeps
   * the saved state authoritative until they do and lets the switch be moved
   * back to where it started and stop counting as a change. `opensLocked` is the
   * one caller-supplied opening position (doc 01 §4.1; doc 02 ask (a)).
   */
  /**
   * Presentation only: at >=769px this same flow is a centred modal rather than
   * a bottom sheet (the POC's desktop `ScrollableModal`). Nothing below this
   * line branches on it except the rate list's height cap, which is a
   * bottom-sheet measurement — the modal caps itself and scrolls its own body.
   */
  const isWide = useIsWide()

  const [stagedLock, setStagedLock] = useState(opensLocked ? true : null)
  const isLockedOnServer = savedLocked
  const isLockOn = stagedLock ?? isLockedOnServer
  const isLockStaged = stagedLock !== null && stagedLock !== isLockedOnServer

  /**
   * Opening values. A rate seeds from the request's price where there is one,
   * otherwise from what this client is charged today — the pinned amount if
   * there is one, the default otherwise. Held as typed, not as a number, so the
   * field stays usable mid-entry ("", "4").
   */
  const [amounts, setAmounts] = useState(() => {
    const seeded = {}
    rates.forEach(rate => {
      const request = requestAmounts?.[rate.slug]
      const saved = savedAmounts?.[rate.slug]
      seeded[rate.slug] = toWholeAmount(request ?? saved ?? rate.defaultPrice)
    })
    return seeded
  })

  // Which amounts the PROVIDER moved. A seeded draft is untouched by
  // construction, which is what keeps it from arming the close guard
  // (POC `useRateDrafts.ts`'s `touchedSlugs`).
  const [touched, setTouched] = useState(() => new Set())
  const [hasMovedSwitch, setHasMovedSwitch] = useState(false)
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)

  const setAmount = (slug, next) => {
    setAmounts(prev => ({ ...prev, [slug]: next }))
    setTouched(prev => new Set(prev).add(slug))
  }

  const handleToggle = (next) => {
    setStagedLock(next)
    setHasMovedSwitch(true)
  }

  const savedAmountOf = (rate) => savedAmounts?.[rate.slug] ?? rate.defaultPrice

  // The off state has no fields, so an amount typed before the switch moved is
  // not part of what a save would write and must not arm it either.
  const providerChanged = useMemo(() => (
    isLockOn && rates.some(rate => (
      touched.has(rate.slug) && resolveAmount(amounts[rate.slug]) !== Number(savedAmountOf(rate))
    ))
  ), [isLockOn, rates, touched, amounts, savedAmounts])

  /**
   * A seeded amount that is not what this client is charged today. Provenance
   * the phrase "there is a write we could send" does not have: the caller is
   * holding a request priced away from this client's rates. Used for enablement
   * and nothing else — it is not a change of theirs, so it must not make closing
   * ask (doc 02).
   */
  const seedDiverges = useMemo(() => (
    isLockOn && !!requestAmounts && rates.some(rate => {
      const seeded = requestAmounts[rate.slug]
      return seeded !== undefined && Number(seeded) !== Number(savedAmountOf(rate))
    })
  ), [isLockOn, requestAmounts, rates, savedAmounts])

  // Never "there exists a write we could send" — see note 3 in this component's
  // doc comment for why the seeded term is allowed to arm it anyway.
  const hasWriteToOffer = isLockStaged || providerChanged || seedDiverges || (opensLocked && isLockOn)

  // Over every rate a save would write, not just the edited ones: a seeded
  // amount is untouched by construction, and a rate that is in the write is in
  // the validation (doc 02, "What a seeded draft does to the new validation gate").
  const invalidSlugs = useMemo(() => (
    isLockOn ? rates.filter(rate => resolveAmount(amounts[rate.slug]) === null).map(r => r.slug) : []
  ), [isLockOn, rates, amounts])

  // A bad amount does not disable Save — pressing it is what raises the
  // per-field errors, so the button has to stay pressable while one is wrong.
  const isSaveDisabled = !hasWriteToOffer

  /**
   * The intent this save carries, and each rate across the write.
   *
   *   locking    (off -> on)              previous is the DEFAULT
   *   unlocking  (on  -> off)             previous is the locked amount
   *   updating   (on  -> on, with edits)  previous is the old locked amount
   *
   * `locking` keeping the default as `previousAmount` is doc 02's call: the
   * review step is reviewing the lock, not the stay, and locking is
   * forward-looking — it does not reprice a booked stay (doc 01 §3.1). So a
   * request already charging $60 against a $45 default reviews as $60 with $45
   * struck through, which is intended.
   */
  const review = useMemo(() => {
    const intent = !isLockOn ? 'unlocking' : (isLockedOnServer ? 'updating' : 'locking')

    const rows = rates.map(rate => {
      const newAmount = isLockOn ? resolveAmount(amounts[rate.slug]) : Number(rate.defaultPrice)
      const previousAmount = intent === 'locking'
        ? Number(rate.defaultPrice)
        : Number(savedAmountOf(rate))

      return {
        slug: rate.slug,
        label: rate.label,
        unit: rate.unit,
        newAmount,
        previousAmount,
        hasChanged: Number(previousAmount) !== Number(newAmount),
      }
    })

    return { intent, rows }
  }, [isLockOn, isLockedOnServer, rates, amounts, savedAmounts])

  /**
   * The footer primary, which does not write: it opens the review step, and the
   * write waits behind that step's own primary.
   */
  const handleSubmit = () => {
    if (isSaveDisabled) return
    if (invalidSlugs.length > 0) {
      setHasAttemptedSave(true)
      return
    }
    setIsReviewing(true)
  }

  /**
   * The only write. It reports the staged position and the amounts behind it;
   * with the switch off there is nothing to send but the position.
   */
  const handleConfirm = () => {
    const saved = {}
    if (isLockOn) rates.forEach(rate => { saved[rate.slug] = resolveAmount(amounts[rate.slug]) })
    onSave?.({ locked: isLockOn, amounts: saved })
  }

  /**
   * Every way out arrives here, so one guard covers the footer's Cancel and the
   * overlay both. It asks only about the provider's own work: a sheet that
   * opened armed and was closed untouched has nothing of theirs to lose, and
   * §4.3 gives the confirm two answers and no escape hatch.
   */
  const handleClose = () => {
    if (hasWriteToOffer && (hasMovedSwitch || providerChanged)) {
      setIsConfirmingClose(true)
      return
    }
    onClose?.()
  }

  // Returned from the same position as the rates, so there is one sheet and one
  // way out of the flow rather than a second overlay over the first.
  if (isConfirmingClose) {
    return (
      <DiscardChangesConfirm
        onKeepEditing={() => setIsConfirmingClose(false)}
        onDiscard={() => onClose?.()}
      />
    )
  }

  /**
   * The review step, swapped into this sheet in place of the rates. Its
   * secondary is `Go back`, which is deliberately NOT the close guard: stepping
   * back off this screen discards nothing, and the discard question belongs to
   * the rates. So the overlay lands there too.
   */
  if (isReviewing) {
    const goBack = () => setIsReviewing(false)
    return (
      <BottomSheet variant="simple" wideModal onDismiss={goBack}>
        <ReviewRatesStep
          intent={review.intent}
          clientName={clientName}
          rows={review.rows}
          onConfirm={handleConfirm}
          onGoBack={goBack}
        />
      </BottomSheet>
    )
  }

  return (
    <BottomSheet variant="simple" wideModal onDismiss={handleClose}>
      {/* The title block, `RatesModalTitleRow`'s pairing: the service, and under
          it the line saying whose rates these are and since when. Not the shared
          `Row`, whose label is a bold 16 rather than the heading this needs. The
          heading names the service only — the client is named on the switch row
          below, so it no longer carries both. */}
      <div style={{ paddingBottom: spacing.sm }}>
        <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0 }}>
          {modalTitle(serviceName)}
        </h2>
        <p style={{
          ...textStyles.paragraph100, color: colors.tertiary, margin: 0, marginTop: spacing.xs,
        }}>
          {lockStatusLine(isLockedOnServer, lockedAt)}
        </p>
      </div>

      {/* It stages, it does not write. A control whose effect is deferred has to
          say so, which is what the note is for. */}
      <SwitchField
        primaryLabel={lockToggleLabel(clientName)}
        primaryLabelSize={200}
        useBoldPrimaryLabel
        secondaryLabel={lockToggleNote(isLockOn, clientName)}
        checked={isLockOn}
        onChange={handleToggle}
      />

      <div
        className="hide-scrollbar"
        style={{
          paddingTop: spacing.lg, paddingBottom: spacing.lg,
          ...(isWide ? null : { maxHeight: '46vh', overflowY: 'auto' }),
        }}
      >
        {/* Only the off state has a column to head: with the switch on every
            amount is a field the provider is setting, and each one labels
            itself. */}
        {!isLockOn && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            paddingTop: spacing.sm, paddingBottom: spacing.sm,
          }}>
            <span style={{ ...textStyles.text100, color: colors.tertiary, textAlign: 'right' }}>
              {COL_DEFAULT_RATE}
            </span>
          </div>
        )}

        {rates.map(rate => (isLockOn ? (
          <RateAmountField
            key={rate.slug}
            rate={rate}
            value={amounts[rate.slug] ?? ''}
            isInvalid={hasAttemptedSave && invalidSlugs.includes(rate.slug)}
            onChange={next => setAmount(rate.slug, next)}
          />
        ) : (
          <RateAmountRow key={rate.slug} rate={rate} />
        )))}
      </div>

      <Button
        variant="primary"
        size="default"
        fullWidth
        disabled={isSaveDisabled}
        onClick={handleSubmit}
      >
        {SAVE}
      </Button>
      <Button
        variant="default"
        size="default"
        fullWidth
        onClick={handleClose}
        style={{ marginTop: spacing.md }}
      >
        {CANCEL}
      </Button>
    </BottomSheet>
  )
}
