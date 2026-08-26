import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors, radius, shadows, spacing, textStyles, typography } from '../tokens'
import { BackIcon, InfoCircleIcon } from '../assets/icons'
import {
  Button, BottomSheet, CalInput, Chip, Select, Switch, Textarea,
  LockRatesToggleRow,
} from '../components'
import { getClient } from '../data/contacts'
import { useApp } from '../context/AppContext'
import { lockableRatesFor, lockedRatesFor } from '../data/lockableRates'
import { useLockedRates } from '../lib/useLockedRates'
import { useRelationshipData } from '../lib/useRelationshipData'
import { toggleLabel } from '../data/lockedRatesCopy'
import * as copy from '../data/modifyBookingCopy'

/**
 * ModifyBookingScreen — a mock of production's sitter-facing MODIFY BOOKING page
 * (frontend/react-lib/src/pages/modify-booking/ModifyBookingPage/, abbreviated
 * `MBP/` below), on the one-time branch: `hasStay && !isRecurring`.
 *
 * ONE PAGE, THREE FLOWS. Production does not have separate screens for
 * "Modify request", "Manage current week" and "Modify booking" — it has this one
 * form, and the differences are section suppression plus a header string
 * (MBP/components/ModifyBookingForm.utils.ts:74-89 and :200-214). This file
 * implements only the third, which is the flow no prototype surface had.
 *
 * SECTION ORDER — MBP/components/ModifyBookingForm.tsx:664-965 wrapping
 * MBP/components/ModifyBookedStayAPIForm.tsx:135-276, filtered to the sitter
 * one-time branch:
 *   1  header                     ModifyBookingForm.utils.ts:213
 *   2  reason select              ModifyBookingForm.tsx:686-704
 *   3  which dates                ModifyBookingForm.tsx:753 + ServiceDatePicker
 *   4  which pets                 ModifyBookingForm.tsx:773 + DogSelectorComponent
 *   5  rates                      RatesComponent.tsx:73-104
 *   5a locked rates               RatesComponent.tsx:104 (nested in 5)
 *   6  extras and adjustments     AdjustmentsListComponent.tsx:160-220
 *   7  summary + ledger           ModifyBookedStayAPIForm.tsx:135-150
 *   8  message                    ModifyBookedStayAPIForm.tsx:180-191
 *   9  72-hour note               ModifyBookedStayAPIForm.tsx:200-202
 *   10 submit / cancel            ModifyBookedStayAPIForm.tsx:222-276
 *
 * MOBILE LAYOUT (375-first). Production's button block is
 * `flexDirection={['column','column','row']}` with Cancel rendered TWICE, gated
 * `display={['none','block']}` before Submit and `display={['block','none']}`
 * after it (:249, :271) — i.e. at the smallest breakpoint Submit is on top. That
 * is the order below. `ServiceDatePicker.tsx:44` and
 * `ServiceRateSelectorComponent.tsx:88-95` carry the other two SM_DOWN branches:
 * the picker hides its field icons and the rate row wraps its pet label onto its
 * own full-width line. Both are reflected here.
 *
 * PRICING IS STATIC MOCK DATA. Production re-prices on every field change via a
 * server round-trip (`checkPrice` / `getExtrasAndAdjustments`,
 * MBP/ModifyBooking.duck.ts:509-623, 776-836). Nothing here recomputes: the
 * ledger below is one derived "added a night" scenario so the price-increase
 * branches (Amount due, NoPenaltyInsertCard) are visible. Only the LABELS are
 * production; the numbers are the prototype's.
 *
 * Deliberately out of scope, per the plan: the grooming date/time picker, the
 * Bright Horizons credit ledgers, `ContactRoverSupportForm`, the price
 * validators, penalty/waiver arithmetic, the holiday RateModal, the impersonator
 * "Suppress Notifications" checkbox, the four non-range date-picker branches,
 * and the request path (`hasStay: false`).
 */

const tx = (size, weight, color) => ({
  fontFamily: typography.fontFamily, fontSize: size, fontWeight: weight, color, margin: 0,
})

const money = (n) => `$${Number(n).toFixed(2)}`

// PROTOTYPE-ONLY. Production has no "Back" chrome on this page — it is a routed
// page with a Cancel button. The prototype reaches it as a slide-in overlay, so
// it needs the same back affordance every other overlay here has.
const BACK_TEXT = 'Back'

// ── Section heading — production is a plain `Heading size="300" mb="4x"` with no
// rule (RatesComponent.tsx:73-75, AdjustmentsListComponent.tsx:165-167,
// ModifyBookedStayAPIForm.tsx:136). Not the BookingDetails SectionTitle, which
// has a trailing divider this page does not.
const SectionHeading = ({ children }) => (
  <h3 style={{ ...textStyles.heading300, color: colors.primary, margin: 0, marginBottom: spacing.lg }}>
    {children}
  </h3>
)

// ── ModifyBookingCurrencyInput (AdjustmentComponent.tsx:29, :115-152) ────────
// A narrow numeric field with the currency symbol inside it. `minWidth: 95px`
// there; the border/radius/type match this codebase's other inputs.
const CurrencyInput = ({ value, onChange, ariaLabel }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: spacing.xs,
    // `flex: '0 1 95px'` pins the basis to production's `minWidth: 95px`. Without
    // an explicit basis the inner <input>'s intrinsic width (~20ch) sizes this
    // flex item instead, which starves the sibling in both rows that use it —
    // the rate-type Select truncates to "Standard r…" and the adjustment labels
    // hyphenate down a 60px column at 375.
    flex: '0 1 95px',
    minWidth: 95, minHeight: 48, boxSizing: 'border-box',
    padding: `${spacing.md}px ${spacing.md}px`,
    border: `2px solid ${colors.borderInteractive}`,
    borderRadius: radius.secondary, background: colors.white,
  }}>
    <span style={{ ...textStyles.text200, color: colors.tertiary }}>$</span>
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={value}
      onChange={e => onChange?.(e.target.value.replace(/[^0-9.]/g, ''))}
      style={{
        ...textStyles.text200, color: colors.primary,
        border: 'none', outline: 'none', background: 'transparent',
        width: '100%', minWidth: 0, padding: 0,
      }}
    />
  </div>
)

// ── NoPenaltyInsertCard.tsx:21-29 ────────────────────────────────────────────
// `Card cardStyle="inset"` — a grey inset block, text then an inline link whose
// Popover carries the explanation. A hover popover has no mobile analogue, so
// the link opens a BottomSheet, the same substitution LockRatesToggleRow makes.
const NoPenaltyCard = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div style={{
        background: colors.bgSecondary, borderRadius: radius.primary, padding: spacing.lg,
      }}>
        <p style={{ ...textStyles.paragraph100, color: colors.primary, margin: 0 }}>
          {copy.NO_PENALTY_TEXT}{' '}
          <span role="button" tabIndex={0} onClick={() => setOpen(true)}
            style={{ ...textStyles.link100, color: colors.link, textDecoration: 'underline', cursor: 'pointer' }}>
            {copy.NO_PENALTY_LINK}
          </span>
        </p>
      </div>
      {open && (
        <BottomSheet variant="simple" onDismiss={() => setOpen(false)}>
          <div style={{ paddingTop: spacing.sm }}>
            <p style={{ ...textStyles.paragraph200, color: colors.secondary, margin: 0, marginBottom: spacing.xl }}>
              {copy.NO_PENALTY_POPOVER}
            </p>
            <Button variant="primary" size="default" fullWidth onClick={() => setOpen(false)}>Got it</Button>
          </div>
        </BottomSheet>
      )}
    </>
  )
}

// ── ShortNoticeBanner.tsx:20-41 ──────────────────────────────────────────────
// Kibble `Banner severity="warning"`. Which of the two strings shows is real
// logic, reproduced from :25-34 — and it is date-derived, so it follows
// PROTO_TODAY rather than a literal.
const shortNoticeMessage = (startDateKey, active, price) => {
  if (!startDateKey) return null
  const start = new Date(`${startDateKey}T00:00:00`)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const daysUntilStart = Math.max(0, Math.round((start - today) / 86400000))
  const isShortNotice = daysUntilStart < 2
  const hasValue = Boolean(parseFloat(price))
  if (active && daysUntilStart >= 2 && hasValue) return copy.SHORT_NOTICE_REMOVE_FEE
  if (isShortNotice && (!active || !hasValue)) return copy.SHORT_NOTICE_ADD_FEE
  return null
}

const WarningBanner = ({ text }) => (
  <div style={{
    background: colors.yellow100, borderRadius: radius.secondary, padding: spacing.lg,
    display: 'flex', gap: spacing.md, alignItems: 'flex-start',
  }}>
    <div style={{ flexShrink: 0, display: 'flex' }}><InfoCircleIcon size={16} color={colors.cautionText} /></div>
    <p style={{ ...textStyles.paragraph100, color: colors.primary, margin: 0 }}>{text}</p>
  </div>
)

// ── Adjustments — STATIC MOCK DATA ───────────────────────────────────────────
// Production gets these off the pricer response (`addOns`), each row an
// OnOffSwitch plus a currency input (AdjustmentComponent.tsx:45-61, :115-152).
// `SLUGS_NOT_SHOWN_IN_ADJUSTMENTS` (AdjustmentsListComponent.tsx:124-134) drops
// cost-adjustments, cancellation-penalty, extended-care, missing-service-
// deliveries and advanced-coat, so none of those appear.
// Names are sentence case, matching the rest of this prototype's rate data
// (see the same deliberate divergence noted in lockableRates.js); production's
// `add_on_type.name` is Title Case (services/constants.py:457-462).
const ADJUSTMENTS = [
  { slug: 'short-notice',    name: 'Short notice',          price: '10.00', active: true  },
  { slug: 'holiday-rate',    name: 'Holiday rate',          price: '15.00', active: false },
  { slug: 'pick-up-drop-off', name: 'Sitter pick-up and drop-off', price: '25.00', active: false },
]

export default function ModifyBookingScreen() {
  const { ownerId, conversationOpk } = useParams()
  const navigate = useNavigate()

  const client = getClient(ownerId)
  const rel = useRelationshipData(ownerId)

  // The booking this page modifies. When the route carries an opk that is the
  // whole answer — production's modify page is per-conversation, so the CTA that
  // sent us here already names the booking.
  //
  // Without an opk, fall back to the paid demo booking (the one carrying a
  // ledger), then any upcoming one — a page that modifies a booking needs a
  // future booking to modify. The past-booking fallback exists only so the route
  // never renders empty for a client with no upcoming stay (amelia); production
  // would not offer the CTA there at all.
  //
  // Recurring bookings are excluded from every fallback. A recurring client's
  // current week sits at the head of `upcoming` (relationshipData.js
  // buildRecurringWeekBooking) and it is not this page's subject: production
  // routes a recurring conversation to ModifyScheduleProviderButton instead
  // (booking_ctas.py:265-267), and `withModifyFields` correspondingly gives
  // recurring bookings no `modify` block.
  //
  // `getOwnerRelUnit` is deliberately NOT used: it is the recurring-template
  // accessor and throws for clients without a template, which is every client
  // this page serves.
  const booking = useMemo(() => {
    const upcoming = (rel?.bookings?.upcoming ?? []).filter(b => !b.isRecurring)
    const past = (rel?.bookings?.past ?? []).filter(b => !b.isRecurring)
    if (conversationOpk) {
      // Archived is searched too: the conversation screen offers the CTA on
      // every thread, so an archived opk should still resolve to its booking
      // rather than render the empty state. Production gates the CTA itself and
      // would not offer modify on a cancelled booking at all.
      const archived = (rel?.bookings?.archived ?? []).filter(b => !b.isRecurring)
      return [...upcoming, ...past, ...archived]
        .find(b => b.conversationOpk === conversationOpk) ?? null
    }
    return upcoming.find(b => b.ledger) ?? upcoming[0] ?? past[0] ?? null
  }, [rel, conversationOpk])

  const ownerFirstName = client?.displayName?.split(' ')[0] ?? ''

  // ── Form state ─────────────────────────────────────────────────────────────
  // Seeded from `booking`, so it has to be re-seeded when `booking` changes.
  // In normal use it never does — the overlay mounts fresh from the CTA — but
  // the opk is a route param, so an in-place URL change swaps the booking under
  // a live component and the dates would keep the previous stay's values.
  const [reason, setReason] = useState('')
  const [startDate, setStartDate] = useState(booking?.startDate ?? '')
  const [endDate, setEndDate] = useState(booking?.endDate ?? '')
  const [selectedPets, setSelectedPets] = useState(() => (client?.pets ?? []).map(p => p.id))
  const [petRates, setPetRates] = useState({})
  const [adjustments, setAdjustments] = useState(
    () => Object.fromEntries(ADJUSTMENTS.map(a => [a.slug, { active: a.active, price: a.price }]))
  )
  const [message, setMessage] = useState('')
  const [messageTouched, setMessageTouched] = useState(false)

  // Re-seed on booking change. An effect rather than a render-phase assignment:
  // a render-phase update here is silently dropped, so the dates would keep the
  // previous stay's values.
  const bookingId = booking?.id ?? null
  const seededFor = useRef(bookingId)
  useEffect(() => {
    if (seededFor.current === bookingId) return
    seededFor.current = bookingId
    setStartDate(booking?.startDate ?? '')
    setEndDate(booking?.endDate ?? '')
    setSelectedPets((client?.pets ?? []).map(p => p.id))
    setPetRates({})
  }, [bookingId, booking, client])

  const serviceKey = booking?.serviceKey ?? null

  // Rate options for the Select: the sitter's own lockable add-ons for this
  // service (production's `addOnOptions`, RatesComponent.tsx:96-99 →
  // ServiceRateSelectorComponent.tsx:135-140).
  const rateOptions = serviceKey ? lockableRatesFor(serviceKey) : []
  const lockedConfig = client && serviceKey ? lockedRatesFor(client, serviceKey) : null

  // 5a. Locked rates. Production's modify-booking path has NO confirmation
  // modal and no toast: the switch calls `onLockedRateChange`
  // (ModifyBookingForm.tsx:836-844) straight into ModifyBooking.duck.ts:483-503,
  // which dispatches and POSTs immediately. Hence `mode: 'immediate'` and
  // `snackbar: false` — the opt-in variant added to useLockedRates for exactly
  // this surface. Every other caller keeps the sheet, which is its default.
  const lr = useLockedRates(client, booking, { mode: 'immediate', snackbar: false })

  // ── The `ratesMode` fork ───────────────────────────────────────────────────
  // In the POC proposal the lock/unlock interaction is gone from the modify step
  // ENTIRELY (01-locked-rates-client-management.md §3.3): the gesture cannot be
  // triggered consistently across web, Android and iOS, so it does not belong on
  // a screen all three share. The decision removed the *interaction*, not the
  // state — production keeps `isRatesLocked` and its setters in the duck — which
  // is why the hook above still runs and only its control is withheld below.
  // The pet rate rows are untouched in both modes.
  const { ratesMode } = useApp()

  // ── Static mock ledger ─────────────────────────────────────────────────────
  // One scenario: the modification extends the stay by a night, so the price
  // goes UP. That makes the `priceDiff > 0` branch of `getLedgerSummary`
  // (MBP/ModifyBooking.utils.ts:108) and the NoPenaltyInsertCard
  // (AdjustmentsListComponent.tsx:218) the ones on screen. Derived from the
  // booking rather than typed in, so it stays consistent with whatever client
  // this route is opened for.
  const ledger = useMemo(() => {
    if (!booking) return null
    const previousTotal = parseFloat(booking.price.amount)
    const perUnit = (lockedConfig?.rates ?? []).length
      ? (client.pets ?? [{}]).reduce(
          (sum, _p, i) => sum + (lockedConfig.rates[i === 0 ? 0 : 1]?.lockedPrice ?? 0), 0
        )
      : Math.round(previousTotal / 3)
    const subtotal = previousTotal + perUnit
    const earningsRatio = previousTotal > 0 && booking.earnings
      ? parseFloat(booking.earnings.amount) / previousTotal
      : 0
    return {
      previousTotal,
      subtotal,
      amountDue: subtotal - previousTotal,
      earnings: subtotal * earningsRatio,
      isPriceIncrease: subtotal > previousTotal,
    }
  }, [booking, client, lockedConfig])

  const messageError = messageTouched && message.trim().length < copy.MESSAGE_MIN_LENGTH
    ? copy.MESSAGE_TOO_SHORT
    : null
  // `disabled={!isSubmitReady}` (ModifyBookedStayAPIForm.tsx:228, :260) — the
  // one-time branch's validators are required + minLength(10) on the message
  // (:165-176), plus a reason.
  const canSubmit = Boolean(reason) && message.trim().length >= copy.MESSAGE_MIN_LENGTH

  const onBack = () => navigate(-1)

  if (!client || !booking || !ledger) {
    return (
      <div style={{ height: '100%', background: colors.white, padding: spacing.lg }}>
        <Button variant="flat" size="small" onClick={onBack}>{BACK_TEXT}</Button>
      </div>
    )
  }

  const shortNotice = adjustments['short-notice']
  const shortNoticeText = shortNoticeMessage(startDate, shortNotice.active, shortNotice.price)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {/* ─── 1. Header ─── */}
      <div style={{
        background: colors.white, boxShadow: shadows.headerShadow, padding: `0 ${spacing.lg}px`,
        display: 'flex', alignItems: 'center', gap: spacing.md, height: 56, flexShrink: 0, zIndex: 3,
      }}>
        <div role="button" tabIndex={0} onClick={onBack} aria-label={BACK_TEXT}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: spacing.xs, flexShrink: 0 }}>
          <BackIcon />
          <span style={{ ...textStyles.text100, color: colors.link, textDecoration: 'underline' }}>{BACK_TEXT}</span>
        </div>
        <p style={{ ...tx(16, 700, colors.primary), flex: 1, textAlign: 'center' }}>
          {copy.HEADER_MODIFY_BOOKING}
        </p>
        {/* Balances the back control so the title stays optically centred. */}
        <div style={{ width: 56, flexShrink: 0 }} />
      </div>

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{
          padding: `${spacing.xl}px ${spacing.lg}px ${spacing.xxl}px`,
          display: 'flex', flexDirection: 'column', gap: spacing.xl,
        }}>
          {/* ─── 2. Reason ─── */}
          <Select
            id="modify-reason-selector"
            label={copy.REASON_LABEL}
            placeholder={copy.REASON_PLACEHOLDER}
            value={reason}
            onChange={setReason}
            options={copy.REASON_OPTIONS}
          />

          {/* ─── 3. Which dates? ───
              ServiceDatePicker's overnight branch labels the two ends
              explicitly (:206 drop off, :127 pick up). */}
          <div>
            <SectionHeading>{copy.DATES_HEADING}</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                <span style={{ ...textStyles.text100Semibold, color: colors.primary }}>{copy.DATE_START_LABEL}</span>
                <CalInput value={startDate} onChange={setStartDate} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                <span style={{ ...textStyles.text100Semibold, color: colors.primary }}>{copy.DATE_END_LABEL}</span>
                <CalInput value={endDate} onChange={setEndDate} minDate={startDate} />
              </div>
            </div>
          </div>

          {/* ─── 4. Which pets? ───
              DogSelectorComponent is a multi-select of the owner's pets; Chip in
              checkmark mode is this codebase's equivalent affordance. */}
          <div>
            <SectionHeading>{copy.PETS_HEADING}</SectionHeading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
              {client.pets.map(p => (
                <Chip
                  key={p.id}
                  label={p.name}
                  checkmark
                  selected={selectedPets.includes(p.id)}
                  onClick={() => setSelectedPets(prev =>
                    prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                  )}
                />
              ))}
            </div>
          </div>

          {/* ─── 5. Rates ───
              Heading is `getUnitRatesTextForServiceType(bookingServiceType)`
              (RatesComponent.tsx:73-75), so it reads "Nightly rates" for
              boarding, "Walk rates" for walking, and so on. */}
          <div>
            <SectionHeading>{copy.RATES_HEADING[serviceKey] ?? copy.RATES_HEADING.boarding}</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
              {client.pets.map((p, i) => {
                const defaultSlug = rateOptions[i === 0 ? 0 : 1]?.slug ?? rateOptions[0]?.slug ?? ''
                const slug = petRates[p.id]?.slug ?? defaultSlug
                const lockedRate = (lockedConfig?.rates ?? []).find(r => r.slug === slug)
                const profileRate = rateOptions.find(r => r.slug === slug)
                const price = petRates[p.id]?.price
                  ?? String(lockedRate?.lockedPrice ?? profileRate?.defaultPrice ?? '')
                const setPet = (patch) => setPetRates(prev => ({
                  ...prev, [p.id]: { slug, price, ...patch },
                }))
                return (
                  // SM_DOWN: the pet label is `flex: 0 1 100%`, i.e. its own
                  // full-width line above the controls
                  // (ServiceRateSelectorComponent.tsx:88-95).
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                    <span style={{ ...textStyles.text200, color: colors.primary }}>{p.name}</span>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Select
                          id={`rate-select-${p.id}`}
                          value={slug}
                          onChange={v => setPet({ slug: v })}
                          options={rateOptions.map(r => ({ value: r.slug, label: r.label }))}
                        />
                      </div>
                      <CurrencyInput
                        value={price}
                        onChange={v => setPet({ price: v })}
                        ariaLabel={`${p.name} rate`}
                      />
                    </div>
                    {/* :74-80 — right-aligned, tertiary, size 100. Which of the
                        two strings renders is `shouldIncludeOsf`; the sitter's
                        rate list here is the profile (owner-facing) one, so it
                        is the "Price on profile" phrasing. */}
                    <span style={{ ...textStyles.text100, color: colors.tertiary, textAlign: 'right' }}>
                      {copy.priceOnProfile(money(profileRate?.defaultPrice ?? 0))}
                    </span>
                  </div>
                )
              })}

              {/* ─── 5a. Locked rates ───
                  Nested INSIDE the Rates section, after the pet rows — the
                  non-Bright-Horizons position (RatesComponent.tsx:104; the BH
                  branch at :77-81 puts it above them instead). The label is the
                  possessive phrasing this surface uses
                  (LockedRatesComponent.tsx:30), not the ledger's. Production
                  pairs it with a hover Popover, suppressed under
                  `isMobileEmbedded()` (:31); at 375 LockRatesToggleRow's
                  BottomSheet stand-in is the mobile equivalent.

                  `current` mode only — §3.3 deletes this block outright in the
                  granular proposal, so nothing at all renders here then. */}
              {ratesMode === 'current' && lr.available && (
                <LockRatesToggleRow
                  label={toggleLabel(lr.ownerFirstName)}
                  ownerFirstName={lr.ownerFirstName}
                  checked={lr.locked}
                  onRequestChange={lr.requestChange}
                />
              )}
            </div>
          </div>

          {/* ─── 6. Extras and Adjustments ─── */}
          <div>
            <SectionHeading>{copy.ADJUSTMENTS_HEADING_SITTER}</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
              {ADJUSTMENTS.map(a => {
                const state = adjustments[a.slug]
                return (
                  <React.Fragment key={a.slug}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                      <Switch
                        id={`adjustment-${a.slug}`}
                        ariaLabel={a.name}
                        checked={state.active}
                        onChange={next => setAdjustments(prev => ({
                          ...prev, [a.slug]: { ...prev[a.slug], active: next },
                        }))}
                      />
                      <span style={{ ...textStyles.text200, color: colors.primary, flex: 1, minWidth: 0 }}>{a.name}</span>
                      <CurrencyInput
                        value={state.price}
                        onChange={v => setAdjustments(prev => ({
                          ...prev, [a.slug]: { ...prev[a.slug], price: v },
                        }))}
                        ariaLabel={`${a.name} amount`}
                      />
                    </div>
                    {/* The banner is inserted immediately after the
                        short-notice row, not at the end of the list
                        (AdjustmentsListComponent.tsx:198-205). */}
                    {a.slug === 'short-notice' && shortNoticeText && (
                      <WarningBanner text={shortNoticeText} />
                    )}
                  </React.Fragment>
                )
              })}
              {ledger.isPriceIncrease && <NoPenaltyCard />}
            </div>
          </div>

          {/* ─── 7. Summary ───
              ModifyBookingFormLedger.tsx: Subtotal (:162), Previous total
              (:170), then the getLedgerSummary row whose label falls back to
              `Amount owed` when the difference is zero (:180), then Your
              earnings (:226). The summary row is only pushed `if (summary &&
              hasStay)` (:207), which this branch satisfies. */}
          <div>
            <SectionHeading>{copy.SUMMARY_HEADING}</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md }}>
                <span style={{ ...textStyles.text200Semibold, color: colors.primary }}>{copy.LEDGER_SUBTOTAL}</span>
                <span style={{ ...textStyles.text200Semibold, color: colors.primary }}>{money(ledger.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md }}>
                <span style={{ ...textStyles.text200, color: colors.secondary }}>{copy.LEDGER_PREVIOUS_TOTAL}</span>
                <span style={{ ...textStyles.text200, color: colors.secondary }}>{money(ledger.previousTotal)}</span>
              </div>

              <div style={{
                borderTop: `1px solid ${colors.border}`, paddingTop: spacing.md,
                display: 'flex', flexDirection: 'column', gap: spacing.xs,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md }}>
                  <span style={{ ...textStyles.text200Semibold, color: colors.primary }}>
                    {ledger.amountDue === 0 ? copy.LEDGER_AMOUNT_OWED : copy.SUMMARY_AMOUNT_DUE}
                  </span>
                  <span style={{ ...textStyles.text200Semibold, color: colors.primary }}>{money(ledger.amountDue)}</span>
                </div>
                <p style={{ ...textStyles.paragraph100, color: colors.tertiary, margin: 0 }}>
                  {ledger.amountDue === 0
                    ? copy.SUMMARY_NO_CHANGE
                    : copy.summarySitterOneTimeCharge(money(ledger.amountDue))}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md }}>
                <span style={{ ...textStyles.text200Semibold, color: colors.primary }}>{copy.LEDGER_YOUR_EARNINGS}</span>
                <span style={{ ...textStyles.text200Semibold, color: colors.primary }}>{money(ledger.earnings)}</span>
              </div>
            </div>
          </div>

          {/* ─── 8. Message ─── */}
          <div onBlur={() => setMessageTouched(true)}>
            <Textarea
              id="modify-booking-message"
              label={copy.messageLabel(ownerFirstName)}
              placeholder={copy.MESSAGE_PLACEHOLDER}
              value={message}
              onChange={setMessage}
              error={messageError}
            />
          </div>

          {/* ─── 9. 72-hour note ─── */}
          <p style={{ ...textStyles.paragraph100, color: colors.secondary, margin: 0 }}>
            {copy.confirmationWindowNote(ownerFirstName)}
          </p>

          {/* ─── 10. Submit / Cancel ───
              Column order at 375: Submit first, Cancel second
              (ModifyBookedStayAPIForm.tsx:249 vs :271). Submitting is inert —
              the write is a server round-trip this prototype does not have. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <Button variant="primary" size="default" fullWidth disabled={!canSubmit}>
              {copy.SUBMIT_CHANGES}
            </Button>
            <Button variant="default" size="default" fullWidth onClick={onBack}>
              {copy.CANCEL}
            </Button>
          </div>
        </div>
      </div>

      {/* No LockRatesSheet and no Snackbar on this surface: `mode: 'immediate'`
          never sets `sheetMode` and `snackbar: false` suppresses the toast,
          which is what production does here — the switch commits straight
          through (ModifyBooking.duck.ts:483-503) with no modal and no
          confirmation toast. */}
    </div>
  )
}
