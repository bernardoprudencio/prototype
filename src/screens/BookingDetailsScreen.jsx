import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors, radius, shadows, spacing, textStyles, typography } from '../tokens'
import {
  BackIcon, ChevronDownIcon, ChevronUpIcon, ChevronRightIcon,
  InfoCircleIcon, CheckCircleIcon, CautionIcon,
} from '../assets/icons'
import {
  Button, BottomSheet, PetAvatar, LockRatesToggleRow, LockRatesSheet, Snackbar,
  RatesRow, ManageRatesSheet,
} from '../components'
import { getClient } from '../data/contacts'
import { useApp } from '../context/AppContext'
import { useLockedRates } from '../lib/useLockedRates'
import { useIsWide } from '../lib/useMediaQuery'
import { webColumn } from '../lib/webColumn'
import { useGranularRates } from '../lib/useGranularRates'
import { useRelationshipData } from '../lib/useRelationshipData'
import { toggleLabelLedger } from '../data/lockedRatesCopy'
import * as copy from '../data/bookingDetailsCopy'

/**
 * BookingDetailsScreen — a mock of production's sitter-facing booking details
 * PAGE (/account/conversations/<opk>/details, rendered by
 * frontend/pages/src/account/ConversationPage/ConversationDetailsPage.tsx).
 *
 * Section order is ConversationDetailsContent.tsx verbatim, minus the three
 * sections hard-gated off for providers (Warnings, the RoverProtect T&S
 * message, and the other-party details block). Every string comes from
 * bookingDetailsCopy.js.
 *
 * VISUAL CONTRACT — all of it read out of roverdotcom/web:
 *   - The page is WHITE. ConversationDetailsPage.tsx:40-56 wraps the mobile
 *     panel in `background="primary"`, and on mobile that panel replaces the
 *     thread column entirely, so the conversation page's grey never shows.
 *   - There are NO cards. Every section is a flat block in a single column with
 *     16px of page padding (ConversationDetailsContent.tsx:50 `px="4x"`).
 *   - Only three 1px rules exist: SectionTitle's trailing divider
 *     (separator.primary #D7DCE0), each ledger section's bottom border
 *     (border.primary #C9CFD4), and the vertical rule between Starts and Ends.
 *   - Modify / Cancel do NOT live on this page at mobile widths:
 *     ConversationDetailsActions.tsx:28 is `if (isSmDown) return null`. Cancel
 *     booking moves into the conversation header's more-menu
 *     (message_header.py:334) and the modify CTA is deep-copied, retitled
 *     "Modify request" (:342-359) and returned as `details_buttons`, rendered at
 *     the right end of this page's own header.
 *
 * The locked-rates switch is a SIBLING below the whole ledger accordion inside
 * one shared 16px-gap column (ConversationPriceLedger.tsx:75-89) — it is not a
 * ledger row. Like production's SwitchField it does not toggle optimistically:
 * it opens the confirmation sheet and snaps back until the sheet is confirmed.
 */

// Demo-only values with no home in the data layer. Production reads these from
// the sitter's profile, the stay address, and the brand's support number.
const SUPPORT_PHONE = '1-888-453-7889'
const CONNECT_PHONE = '(647) 555-0132'
const PHONE_SUFFIX  = 'Rover'
const DISTANCE      = ['2.4', 'km']

const tx = (size, weight, color) => ({
  fontFamily: typography.fontFamily, fontSize: size, fontWeight: weight, color, margin: 0,
})

const fmtMoney = (m) => (m ? `$${parseFloat(m.amount).toFixed(2)}` : '')

// Care happens at the sitter's home for these services, so production drops the
// Location section entirely.
const LOCATION_SUPPRESSED_SERVICES = ['Boarding', 'Daycare']

// ── SectionTitle — components/src/SectionTitle/SectionTitle.tsx:20-26 ────────
// A 20/600 heading, an optional info button, and a rule filling only the width
// remaining to its right.
const SectionTitle = ({ title, onInfo }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
    <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0, flexShrink: 0 }}>{title}</h2>
    {onInfo && (
      <button type="button" aria-label={title} onClick={onInfo}
        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1, display: 'flex' }}>
        <InfoCircleIcon size={16} color={colors.tertiary} />
      </button>
    )}
    <div style={{ flexGrow: 1, borderTop: `1px solid ${colors.border}` }} />
  </div>
)

// ── Bullet — common/Bullet/Bullet.tsx:9-10 ──────────────────────────────────
// A 10px dot with 6px of margin either side.
const Bullet = () => <span aria-hidden="true" style={{ fontSize: 10, margin: '0 6px' }}>•</span>

// ── Status glyph ────────────────────────────────────────────────────────────
// icons.jsx's CheckCircleIcon and CautionIcon are fixed 24px SVGs with no size
// prop and a hardcoded fill; production renders the status glyph at 32×32.
// Scaling here keeps the shared components untouched — other surfaces render
// them at their natural 24. (A side effect: the caution and error variants look
// identical, since CautionIcon hardcodes destructive red.)
const StatusIcon = ({ variant }) => (
  <span style={{
    display: 'flex', width: 32, height: 32, flexShrink: 0,
    transform: 'scale(1.3333)', transformOrigin: 'top left',
  }}>
    {variant === 'success' ? <CheckCircleIcon /> : <CautionIcon />}
  </span>
)

// ── Ledger chevron — ConversationLedger.tsx passes iconStyle 24w × 32h ──────
const LedgerChevron = ({ open }) => (
  <span style={{ display: 'inline-flex', width: 24, height: 32, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
  </span>
)

// ── Ledger row — PriceLedgerSectionItem.tsx ─────────────────────────────────
// title / description / text[] on the left, amount right-aligned, both columns
// bottom-aligned, 16px between them. The row itself has NO vertical padding:
// the section's `gap="4x"` provides the rhythm.
//
// `bold`, `green` and `summary` render the amount semibold; those plus
// `default` render the title semibold — so a `default` row is a semibold label
// against a regular figure. An item with no style is regular throughout.
const SEMIBOLD_TITLE  = ['bold', 'green', 'summary', 'default']
const SEMIBOLD_AMOUNT = ['bold', 'green', 'summary']

const LedgerRow = ({ item, onAction }) => {
  const size  = item.style === 'summary' ? 20 : 16
  const color = item.style === 'green' ? colors.success : colors.primary

  // `action.event.lineItem === 'sitter_earnings'` routes the row to
  // PriceLedgerSectionButtonItem.tsx: title and amount both become semibold
  // blue links (the title underlined) and there is NO info icon.
  if (item.action) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.lg }}>
        <button type="button" onClick={onAction} aria-label={item.title}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ ...textStyles.link200Semibold, color: colors.link, textDecoration: 'underline' }}>{item.title}</span>
        </button>
        <button type="button" onClick={onAction} aria-label={`${item.title} ${fmtMoney(item.amount)}`}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
          <span style={{ ...textStyles.link200Semibold, color: colors.link }}>{fmtMoney(item.amount)}</span>
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.lg }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, flex: 1, minWidth: 0 }}>
        <p style={{ ...tx(size, SEMIBOLD_TITLE.includes(item.style) ? 600 : 400, color) }}>{item.title}</p>
        <div>
          {item.description && <p style={{ ...tx(16, 400, colors.tertiary) }}>{item.description}</p>}
          {(item.text ?? []).map((line, i) => (
            <p key={i} style={{ ...tx(16, 400, colors.primary) }}>{line}</p>
          ))}
        </div>
      </div>
      <p style={{ ...tx(size, SEMIBOLD_AMOUNT.includes(item.style) ? 600 : 400, color), textAlign: 'right', flexShrink: 0 }}>
        {fmtMoney(item.amount)}
      </p>
    </div>
  )
}

// ── Flat list row — Pets and Additional information ─────────────────────────
// Deliberately local rather than the shared `Row` primitive: production's label
// is semibold (600) where Row hardcodes 700, its first sublabel line is primary
// rather than tertiary, and the pet row is a 64px avatar beside a three-line
// column that Row's two-slot API cannot express. Keeping it local means no
// shared primitive changes weight for the other surfaces that use it.
const FlatRow = ({ leftItem, label, lines = [] }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, padding: '8px 0' }}>
    {leftItem}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ ...textStyles.text200Semibold, color: colors.primary, margin: 0 }}>{label}</p>
      {lines.filter(Boolean).map((line, i) => (
        <p key={i} style={{ ...textStyles.text100, color: i === 0 ? colors.primary : colors.secondary, margin: 0, marginTop: 2, lineHeight: 1.5 }}>
          {line}
        </p>
      ))}
    </div>
    <ChevronRightIcon color={colors.primary} />
  </div>
)

/**
 * One component, two wrappers.
 *
 * `chrome` is what separates them. As the mobile overlay (`chrome: true`) this
 * is production's `/account/conversations/<opk>/details` page: its own 56px nav
 * header, its own scroll region. As the desktop conversation's left rail
 * (`chrome: false`) it is headerless and hands scroll ownership up to the page —
 * production does exactly this, `ConversationDetailsHeader` returning `null`
 * when `!isSmDown` (ConversationDetailsHeader.tsx:57) and the rail box carrying
 * `height: "fit-content"` rather than a scroller (ConversationDetailsPage.tsx:24-38).
 *
 * `opk` overrides the URL's `conversationOpk`: the rail renders inside a
 * conversation route that may carry no thread segment at all, so the caller
 * passes the opk it already resolved.
 *
 * `ctas` is the stacked button block. Production drops it into the rail between
 * the price ledger and the pets section (ConversationDetailsContent.tsx:49-65,
 * DetailsActions after DetailsWarnings), which is where it renders below.
 */
function BookingDetails({ chrome = true, opk: opkProp, ctas = null }) {
  // Only the standalone page (`chrome`) has a viewport to overrun; the rail
  // variant is already inside a column its parent page sized.
  const isWide = useIsWide()
  const column = webColumn(chrome && isWide)
  const navigate = useNavigate()
  const { ownerId, conversationOpk: opkFromUrl } = useParams()
  const conversationOpk = opkProp ?? opkFromUrl
  const onBack = () => navigate(-1)

  const client = getClient(ownerId)
  // Hooks cannot run inside the IIFE below, so the relationship data is read at
  // the top level. `useRelationshipData` folds in the alt-monetization rollout
  // flag so this ledger's earnings figures never disagree with the relationship
  // page's (production gates on `is_rollout_alt_monetisation`,
  // views.py:1011-1013).
  const rel = useRelationshipData(ownerId)
  const booking = (() => {
    if (!rel) return null
    const { upcoming, past, archived } = rel.bookings
    // Every conversation resolves to exactly one booking, recurring included:
    // `${ownerId}-conv-recurring` is now carried by the client's current-week
    // booking (relationshipData.js buildRecurringWeekBooking). There is
    // deliberately NO fallback — a miss is a genuine not-found, the way a bad
    // opk 404s in production, rather than silently rendering someone else's
    // booking.
    return [...upcoming, ...past, ...archived]
      .find(b => b.conversationOpk === conversationOpk) ?? null
  })()

  // Visibility is per conversation, so the resolved booking is what gates it.
  //
  // ── The `ratesMode` fork ──────────────────────────────────────────────────
  // Both hooks run unconditionally (hooks cannot be called behind a branch) and
  // each returns `available: false` outside its own mode, so exactly one of the
  // two locked-rates surfaces below can ever render:
  //   'current'  → the shipped binary switch + LockRatesSheet (`lr`)
  //   'granular' → the POC proposal's three-offer RatesRow + ManageRatesSheet
  //                (`gr`, 01-locked-rates-client-management.md §3.1)
  // `useGranularRates` already tests `ratesMode === 'granular'` internally;
  // `useLockedRates` predates the flag, so the current-mode gate is written out
  // at its render sites.
  const { ratesMode } = useApp()
  const lr = useLockedRates(client, booking)
  const gr = useGranularRates(client, booking)
  const [earningsOpen, setEarningsOpen] = useState(false)

  // `_is_collapsed()` (price_ledger.py:1650-1657) OR'd with
  // `should_collapse_financial_sections()` (base.py:389-397) — both folded into
  // `booking.ledgerCollapsed` by relationshipData.js's `withDerivedFields`, so
  // every booking now carries the answer rather than this screen re-deriving it.
  //
  // Collapsibility drives THREE things, exactly as production does with the one
  // `isCollapsible={collapsed}` prop (ConversationLedger.tsx:38): the initial
  // open state, whether the chevron renders, and whether the header row is
  // clickable. A non-collapsed ledger has no chevron and cannot be re-collapsed.
  const ledgerCollapsible = Boolean(booking?.ledgerCollapsed)
  const [ledgerOpen, setLedgerOpen] = useState(!ledgerCollapsible)

  // `useState` seeds once, but `booking` can change identity under a live
  // component — the rail renders inside a conversation route whose opk can
  // change in place. Re-seed so the open state always describes THIS booking.
  const seededFor = useRef(booking?.id ?? null)
  useEffect(() => {
    const id = booking?.id ?? null
    if (seededFor.current === id) return
    seededFor.current = id
    setLedgerOpen(!ledgerCollapsible)
  }, [booking, ledgerCollapsible])

  if (!client || !booking) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <p style={{ ...tx(16, 400, colors.primary) }}>Booking not found</p>
        <Button variant="default" style={{ marginTop: spacing.lg }} onClick={onBack}>{copy.BACK_TEXT}</Button>
      </div>
    )
  }

  const firstName = client.displayName.split(' ')[0]
  const petNames = client.pets.map(p => p.name)
  // booking_status.py:58-77 has a dead branch that interpolates only the FIRST
  // pet's name for a two-pet stay. That is a production bug — testers would
  // read it as a data error — so this renders both names.
  const petNamesText = petNames.length === 2
    ? `${petNames[0]} and ${petNames[1]}`
    : petNames.join(', ')

  // Resolve the key once — `confirmed` is the only variant whose sentence takes
  // (petNames, unit); every other one takes the owner's first name. Testing the
  // raw field instead of the resolved key sends an unkeyed booking down the
  // wrong branch. Every booking carries a derived key (see statusFields in
  // relationshipData.js); the fallback only covers a hand-built booking.
  const statusKey = booking.statusKey ?? 'confirmed'
  const status = copy.STATUS[statusKey]
  const statusText = statusKey === 'confirmed'
    ? status.text(petNamesText, booking.statusUnit ?? 'stay')
    : status.text(firstName)
  const statusIcon = copy.STATUS_ICON[statusKey] ?? 'success'

  // `_is_stay_active()` — the Additional information rows only appear once the
  // stay is ongoing or in pending-reviews. Nothing renders pre-stay.
  const stayActive = Boolean(booking.isOngoing || booking.isCompleted || booking.isCancelled)
  const showLocation = !LOCATION_SUPPRESSED_SERVICES.includes(booking.serviceName)

  // service_summary.py:300 prepends "Flexible start time" for a stay whose
  // drop-off is a window rather than a time, and the start half then shows the
  // window's opening time. Boarding has an agreed drop-off, so Lena's booking
  // leaves the flag unset — it is here for the drop-in and walk service types.
  // service_summary.py:429-431, :452-464 — the recurring builder appends
  // SERVICE_INFO_SUFFIX ("this week") to the unit count, so the same chip reads
  // "3 walks this week" on a recurring conversation.
  const unitChip = copy.unitCount(booking.unitCount ?? 1, booking.unitLabel ?? 'night', `${booking.unitLabel ?? 'night'}s`)
  const plainChips = [
    ...(booking.flexibleStartTime ? [copy.FLEXIBLE_START_TIME] : []),
    booking.unitSuffix ? `${unitChip} ${booking.unitSuffix}` : unitChip,
  ]

  const additionalRows = []
  if (stayActive) {
    additionalRows.push({ key: 'ts',    label: copy.TRUST_AND_SAFETY, sublabel: copy.trustAndSafetySubtitle(SUPPORT_PHONE) })
    additionalRows.push({ key: 'print', label: copy.PRINT_BOOKING_DETAILS })
    additionalRows.push({ key: 'vet',   label: copy.VET_INFORMATION })
    additionalRows.push({ key: 'care',  label: copy.careInstructions(petNames[0]) })
    additionalRows.push({ key: 'ec',    label: copy.EMERGENCY_CONTACT, sublabel: copy.emergencyContactSubtitle(client.displayName, CONNECT_PHONE) })
  }

  // `_get_provider_title` — shown only while the accordion is collapsed
  // (PriceLedgerAccordion.tsx renders `text` on `text && !expanded`).
  // price_ledger.py:346-353 forks the same line on recurring-ness: one week's
  // payment ("…for this week.") instead of the whole stay's.
  // The two mutually exclusive locked-rates surfaces. `gr.available` already
  // carries the granular-mode test (useGranularRates), so only the current one
  // needs the flag spelled out.
  const showCurrentLock = ratesMode === 'current' && lr.available

  // The ledger's own figures, so the summary line and the earnings subtitle can
  // never disagree with the rows behind them. The earnings row is the only item
  // carrying an `action` (buildLedger routes it to the breakdown modal); the
  // subtotal is the last bold item that is not it.
  const ledgerItems    = (booking.ledger?.sections ?? []).flatMap(s => s.items ?? [])
  const earningsItem   = ledgerItems.find(i => i.action)
  const subtotalItem   = [...ledgerItems].reverse().find(i => i.style === 'bold' && !i.action)
  const hasLedgerBody  = ledgerItems.length > 0 || Boolean(booking.weeklyTotal)

  // `should_collapse_financial_sections()` (base.py:389-397) — the mobile
  // provider branch, i.e. an unbooked/unpaid conversation. It is the FIRST
  // check in `_get_title_text()` (price_ledger.py:249-260), before the paid
  // fork, and it short-circuits to `get_total_price_data()` (base.py:319-331).
  const collapsedUnpaid = !booking.isPaid

  // `_get_provider_title()` (price_ledger.py:321-364) resolves in this exact
  // order: cancelled, then has_modification, then recurring, then the plain
  // stay line — cancelled and modified PRE-EMPT the recurring branch.
  // `_get_price_label()` (base.py:306-314) returns SUBTOTAL under earnings
  // transparency, which this prototype models as ON, so PRICE never renders.
  const summaryLine = collapsedUnpaid
    ? (subtotalItem ? copy.totalPriceLine(copy.SUBTOTAL, fmtMoney(subtotalItem.amount)) : null)
    : booking.isCancelled
      ? copy.cancelledFinalAmount(fmtMoney(booking.price), firstName, booking.paidOn)
      : booking.hasModification
        ? copy.paidAfterModifications(firstName, booking.paidOn, fmtMoney(booking.price))
        : booking.isRecurring
          ? copy.paidForWeek(firstName, fmtMoney(booking.price), booking.paidOn)
          : copy.paidForStay(firstName, fmtMoney(booking.price), booking.paidOn)

  // `_get_provider_earnings_subtitle()` (price_ledger.py:226-247) — returned
  // ONLY while the financial sections are collapsed for an unbooked request;
  // once a stay exists it returns None and the paid-provider copy above stands
  // alone. So it is gated on the same condition as the branch above and never
  // accompanies a "paid on" line. Rendered as PriceLedgerAccordion's `subText`
  // (:98-102): a second 100/secondary line, with the summary above it picking
  // up `mb="1x"` when it is present.
  const earningsSubtitle = collapsedUnpaid && earningsItem
    ? (booking.isRecurring
        ? copy.providerEarningsPerWeek(fmtMoney(earningsItem.amount))
        : copy.providerEarnings(fmtMoney(earningsItem.amount)))
    : null

  return (
    <div style={chrome
      ? { display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }
      : { background: colors.white }}>
      {chrome && <>
      {/* ─── Nav header — ConversationDetailsHeader.tsx:54-135 ───
          `flexDirection="row" gap="3x" px="4x"`: a back control with an
          underlined "Back" link, the React-Native-only centred title, and
          `details_buttons` at the right end. */}
      {/* The bar is app chrome and stays as-is: the `chrome` variant is
          mobile-only by route (App.jsx early-returns null at wide, mirroring
          ConversationDetailsPage.tsx:24), so there is no wide presentation of
          this header to design. */}
      <div style={{
        background: colors.white, boxShadow: shadows.headerShadow, padding: '0 16px',
        height: 56, flexShrink: 0, zIndex: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, height: '100%', width: '100%', ...column }}>
        <div role="button" tabIndex={0} onClick={onBack} aria-label={copy.BACK_TEXT}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: spacing.xs, flexShrink: 0 }}>
          <BackIcon />
          <span style={{ ...textStyles.text100, color: colors.link, textDecoration: 'underline' }}>{copy.BACK_TEXT}</span>
        </div>
        <p style={{ ...tx(16, 700, colors.primary), flex: 1, textAlign: 'center' }}>{copy.PAGE_TITLE}</p>
        {/* `details_buttons` — message_header.py:341-357 deep-copies whichever
            modify CTA the conversation has and overwrites its title with
            TEXT_MODIFY_BUTTON (:46, "Modify request") *unconditionally*, so the
            LABEL does not fork on recurring-ness even though the underlying
            button class does (booking_ctas.py:265-267). What forks is the
            destination: ModifyBookingProviderButton → the modify screen;
            ModifyScheduleProviderButton → the recurring schedule surfaces,
            which in this prototype need navigation state only
            ConversationScreen assembles, so the recurring button stays inert
            here rather than landing on an empty agenda. */}
        <Button
          variant="default"
          size="small"
          style={{ flexShrink: 0 }}
          onClick={booking.isRecurring ? undefined : () => navigate(`/conversation/${ownerId}/thread/${conversationOpk}/modify`)}
        >
          {copy.MODIFY_REQUEST}
        </Button>
      </div>
      </div>
      </>}

      {/* At wide width the page owns the scroll and the rail's own container
          owns the padding, so this stops being a scroller. */}
      <div className="hide-scrollbar" style={chrome
        ? { flex: 1, overflowY: 'auto', padding: '0 16px' }
        : { height: 'auto', overflowY: 'visible' }}>
      <div style={column}>

        {/* ─── 1. Booking status — pt="6x" pb="2x", column gap="2x" ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, paddingTop: spacing.xl, paddingBottom: spacing.sm }}>
          {/* The row sets no alignItems, so the glyph sits on the heading's first line. */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md }}>
            <StatusIcon variant={statusIcon} />
            <h1 style={{ ...textStyles.heading400, color: colors.primary, margin: 0 }}>{status.title}</h1>
          </div>
          <p style={{ ...textStyles.text200, color: colors.primary, margin: 0 }}>{statusText}</p>
        </div>

        {/* ─── 2. Message {shortName} ─── */}
        {/* A way back to the thread — which only means anything while the thread
            is the page you left. In the rail it is already on screen, so the row
            goes rather than sitting there inert. */}
        {chrome && <div
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 12px', margin: '16px 0', cursor: 'pointer',
            background: colors.bgInfo, borderRadius: radius.primary,
          }}
        >
          <span style={{ ...textStyles.link100Semibold, color: colors.link }}>{copy.messageOwner(firstName)}</span>
          <ChevronRightIcon color={colors.link} />
        </div>}

        {/* ─── 3. Service summary ─── */}
        <SectionTitle title={copy.SERVICE_SUMMARY_TITLE} />
        <div style={{ paddingBottom: spacing.lg }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, padding: '12px 0' }}>
            {/* service_summary.py:448-451 — the recurring builder's `get_title()`
                is `super().get_title() + " " + _("Weekly")`, so the DETAILS page
                appends the word ("Dog walking Weekly") where the conversation
                booking card prefixes it (booking_card.py:82). `serviceName`
                carries the card form; `serviceSummaryTitle` the details form. */}
            <p style={{ ...textStyles.text200Semibold, color: colors.primary, margin: 0 }}>{booking.serviceSummaryTitle ?? booking.serviceName}</p>
            {/* ConversationServiceSummarySubtitle.tsx: 14px primary chips, pet
                names as semibold blue Links, separated by 10px bullets.
                Production emits a Bullet after EVERY plain chip, leaving a
                trailing one before the links — that is a bug, so this
                separates instead of appending. */}
            <p style={{ ...textStyles.text100, color: colors.primary, margin: 0 }}>
              {plainChips.map((chip, i) => (
                <React.Fragment key={chip}>{i > 0 && <Bullet />}{chip}</React.Fragment>
              ))}
              {petNames.map(name => (
                <React.Fragment key={name}>
                  <Bullet />
                  <span style={{ ...textStyles.link100Semibold, color: colors.link }}>{name}</span>
                </React.Fragment>
              ))}
            </p>
          </div>

          {/* ConversationServiceSummary.tsx:32 — two halves at flexBasis 50%,
              the end half right-aligned with a 1px left rule and NO horizontal
              padding, so its text sits flush against the rule. No margins
              between label, date and time: the rhythm is pure line-height. */}
          {booking.schedules ? (
            /* service_summary.py:397-420 `build_schedule_section()` — a
               recurring conversation is non-contiguous, so the contiguous
               Starts/Ends pair is replaced by a titled list of the days the
               service actually happens on, one row per day with its times.
               Title comes from the builder's SCHEDULE_TITLE (:467-468). */
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, paddingTop: spacing.sm }}>
              <span style={{ ...textStyles.text100, color: colors.tertiary }}>{booking.scheduleTitle}</span>
              {booking.schedules.map(s => (
                <div key={s.day} style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md }}>
                  <span style={{ ...textStyles.text200Semibold, color: colors.primary }}>{s.day}</span>
                  <span style={{ ...textStyles.text200, color: colors.primary, textAlign: 'right' }}>{(s.times ?? []).join(', ')}</span>
                </div>
              ))}
            </div>
          ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: spacing.sm }}>
            <div style={{ flexBasis: '50%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ ...textStyles.text100, color: colors.tertiary }}>{copy.STARTS}</span>
              <span style={{ ...textStyles.text200Semibold, color: colors.primary }}>{booking.startLabel}</span>
              {booking.startTime && <span style={{ ...textStyles.text200, color: colors.primary }}>{booking.startTime}</span>}
            </div>
            <div style={{ flexBasis: '50%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderLeft: `1px solid ${colors.border}` }}>
              <span style={{ ...textStyles.text100, color: colors.tertiary }}>{copy.ENDS}</span>
              <span style={{ ...textStyles.text200Semibold, color: colors.primary }}>{booking.endLabel}</span>
              {booking.endTime && <span style={{ ...textStyles.text200, color: colors.primary }}>{booking.endTime}</span>}
            </div>
          </div>
          )}
        </div>

        {/* ─── 4. Price ledger + the locked-rates switch ───
            ConversationPriceLedger.tsx wraps both in one `pb="4x" gap="4x"`
            column, so the switch sits 16px below the ledger as a sibling. */}
        {(hasLedgerBody || showCurrentLock || gr.available) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, paddingBottom: spacing.lg }}>
            {/* PriceLedgerAccordion: pt="4x" pb="0x", header row space-between
                with a 4px gap and no horizontal padding. `PriceLedgerMapper.map()`
                builds a ledger for EVERY conversation, so this is no longer the
                demo booking's privilege — the only ledger-less case is
                `is_cancelled_with_full_refund()` (price_ledger.py:439-440), which
                yields `sections: []`. That renders nothing at all here rather
                than an empty bordered box with a header over it, and the locked-
                rates switch below still stands on its own. */}
            {hasLedgerBody && <div style={{ paddingTop: spacing.lg }}>
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: summaryLine && !ledgerOpen ? spacing.lg : 0 }}>
                <div
                  role="button"
                  aria-label={copy.LEDGER_SECTION_TITLE}
                  onClick={() => ledgerCollapsible && setLedgerOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: spacing.xs, cursor: ledgerCollapsible ? 'pointer' : 'default',
                  }}
                >
                  <span style={{ ...textStyles.text200Semibold, color: colors.primary, flex: 1 }}>{copy.LEDGER_SECTION_TITLE}</span>
                  {ledgerCollapsible && <LedgerChevron open={ledgerOpen} />}
                </div>

                {summaryLine && !ledgerOpen && (
                  <span style={{
                    ...textStyles.text100, color: colors.secondary, lineHeight: 1.5,
                    // PriceLedgerAccordion.tsx:92 — `mb="1x"` on the summary
                    // line only while the subText below it renders.
                    marginBottom: earningsSubtitle ? spacing.xs : 0,
                  }}>{summaryLine}</span>
                )}
                {earningsSubtitle && !ledgerOpen && (
                  <span style={{ ...textStyles.text100, color: colors.secondary, lineHeight: 1.5 }}>{earningsSubtitle}</span>
                )}
              </div>

              {/* PriceLedgerSection.tsx: `py="4x" gap="4x"` with a 1px
                  border.primary bottom rule — ConversationLedger passes
                  showBorderBottom on every section, including the last. */}
              {ledgerOpen && (booking.ledger?.sections ?? []).map((section, si) => (
                <div key={si} style={{
                  display: 'flex', flexDirection: 'column', gap: spacing.lg,
                  padding: '16px 0', borderBottom: `1px solid ${colors.borderInteractive}`,
                }}>
                  {/* ConversationLedger suppresses a section header that duplicates the ledger title. */}
                  {section.title && section.title !== copy.LEDGER_SECTION_TITLE && (
                    <SectionTitle title={section.title} />
                  )}
                  {section.items.map((item, ii) => (
                    <LedgerRow key={ii} item={item} onAction={() => setEarningsOpen(true)} />
                  ))}
                </div>
              ))}

              {/* price_ledger.py:504-507 — recurring only, ONE more PriceSection
                  appended after the standard ones:
                    if self.conv.is_recurring:
                        price_sections.append(PriceSection(items=[
                            self._get_total_price_per_week(request)]))
                  Its title is `_get_total_price_per_week_title()` (:1097-1100)
                  and its description the provider half of
                  `_get_total_price_per_week()` (:1119-1123). Same section markup
                  as the loop above — an extra section, not a reshaped ledger. */}
              {ledgerOpen && booking.weeklyTotal && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: spacing.lg,
                  padding: '16px 0', borderBottom: `1px solid ${colors.borderInteractive}`,
                }}>
                  <LedgerRow item={{ ...booking.weeklyTotal, style: 'bold' }} />
                </div>
              )}
            </div>}

            {/* `_get_info_text()` (price_ledger.py:1850-1858) — the recurring
                provider's Rover Card reminder, None everywhere else.
                ConversationPriceLedger.tsx:82-86 puts it in this same 16px-gap
                column, BETWEEN the ledger and the lock-rates control, as a
                `Paragraph size="100" textColor="tertiary"`. */}
            {booking.ledgerInfo && (
              <p style={{ ...textStyles.paragraph100, color: colors.tertiary, margin: 0 }}>
                {booking.ledgerInfo}
              </p>
            )}

            {/* ─── Locked rates — a sibling BELOW the ledger, not a ledger row ───
                Both modes render in this same slot, inside the shared 16px-gap
                column, so the surface's position is unchanged by the flag —
                only what occupies it. */}

            {/* `current` — the shipped binary switch, untouched. */}
            {showCurrentLock && (
              <LockRatesToggleRow
                label={toggleLabelLedger(lr.ownerFirstName)}
                ownerFirstName={lr.ownerFirstName}
                checked={lr.locked}
                onRequestChange={lr.requestChange}
              />
            )}

            {/* `granular` — the POC's three-offer row (§3.1). It carries no
                service name (every title interpolates the client and nothing
                else) and it does NOT navigate: `onManage` opens the management
                modal in place, because "lock rates based on this request" only
                means anything where the request's rates are in scope. */}
            {gr.available && (
              <RatesRow
                offer={gr.offer}
                clientName={gr.clientName}
                lockedAt={gr.state?.lockedAt ?? null}
                onPress={gr.openFromRow}
              />
            )}
          </div>
        )}

        {/* ─── Booking CTAs — rail only.
             ConversationDetailsActions.tsx:27 returns null when `isSmDown`, so
             this block exists at desktop and nowhere else; below the breakpoint
             the same CTAs live in the conversation header's scroller
             (ConversationUnderHeaderButtons.tsx:39-48). ─── */}
        {ctas && <div style={{ paddingBottom: spacing.xl }}>{ctas}</div>}

        {/* ─── 5. Pets information (sitter-only) ─── */}
        <SectionTitle title={copy.petsTitle(client.pets.length)} />
        <div style={{ paddingBottom: spacing.xl }}>
          {client.pets.map(p => (
            <FlatRow
              key={p.id}
              leftItem={<PetAvatar size={64} images={[p.image]} />}
              label={p.name}
              lines={p.details
                ? [p.details.breeds, `${p.details.gender}, ${p.details.birthday}, ${p.details.weight}`]
                : [copy.UNKNOWN]}
            />
          ))}
        </div>

        {/* ─── 6. Location (sitter-only; suppressed for boarding and daycare) ─── */}
        {showLocation && (
          <>
            <SectionTitle title={copy.LOCATION_TITLE} />
            <div style={{ paddingBottom: spacing.xl }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, padding: '8px 0' }}>
                <span style={{ ...textStyles.text100, color: colors.tertiary }}>{copy.ADDRESS_AFTER_CONFIRMED}</span>
                <span style={{ ...textStyles.paragraph100, color: colors.secondary }}>{copy.distanceLine(...DISTANCE)}</span>
              </div>
              {/* Production renders a static map image at radius "primary". */}
              <div style={{ padding: '12px 0' }}>
                <div style={{ height: 100, borderRadius: radius.primary, background: colors.bgTertiary }} />
              </div>
            </div>
          </>
        )}

        {/* ─── 7. Additional information (nothing renders pre-stay) ─── */}
        {additionalRows.length > 0 && (
          <>
            <SectionTitle title={copy.ADDITIONAL_INFO_TITLE} />
            <div style={{ paddingBottom: spacing.xl }}>
              {additionalRows.map(r => (
                <FlatRow key={r.key} label={r.label} lines={[r.sublabel]} />
              ))}
            </div>
          </>
        )}

        {/* ─── 8. Connect through Rover — ConversationPhoneSection.tsx:70-81 ─── */}
        <SectionTitle title={copy.CONNECT_TITLE} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, paddingBottom: spacing.xl }}>
          <p style={{ ...textStyles.paragraph200, color: colors.secondary, margin: 0 }}>
            {copy.connectBody(firstName, PHONE_SUFFIX)}
          </p>
          {/* A square-cornered `p="2x"` block filled with
              background.interactive.button_primary_inverse_base (#ECF1FB). */}
          <div style={{ background: colors.bgInfo, padding: spacing.sm }}>
            <p style={{ ...textStyles.heading300, color: colors.link, margin: 0, textAlign: 'center' }}>
              {CONNECT_PHONE}
            </p>
          </div>
          {/* The call-availability ClickableInput: label above, value inside. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <span style={{ ...textStyles.text100, color: colors.tertiary }}>
              {copy.callPreference(firstName, PHONE_SUFFIX)}
            </span>
            <div role="button" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: `1px solid ${colors.borderInteractive}`, borderRadius: radius.primary,
              padding: '12px 16px', cursor: 'pointer',
            }}>
              <span style={{ ...textStyles.text200, color: colors.primary }}>{copy.CALL_PREFERENCE_ANYTIME}</span>
              <ChevronRightIcon color={colors.primary} />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ─── Modals ─── */}
      {earningsOpen && (
        <BottomSheet variant="simple" onDismiss={() => setEarningsOpen(false)}>
          <div style={{ paddingTop: spacing.sm }}>
            <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0, marginBottom: spacing.md }}>
              {copy.YOUR_EARNINGS_TITLE}
            </h2>
            {copy.YOUR_EARNINGS_HELP_TEXT.map((para, i) => (
              <p key={i} style={{ ...textStyles.paragraph200, color: colors.secondary, margin: 0, marginBottom: spacing.lg }}>{para}</p>
            ))}
            <Button variant="primary" size="default" fullWidth onClick={() => setEarningsOpen(false)}>{copy.CLOSE_TEXT}</Button>
          </div>
        </BottomSheet>
      )}

      {ratesMode === 'current' && lr.sheetMode && (
        <LockRatesSheet
          mode={lr.sheetMode}
          ownerFirstName={lr.ownerFirstName}
          serviceName={lr.config.serviceName}
          rates={lr.config.rates}
          onConfirm={lr.confirm}
          onClose={lr.closeSheet}
        />
      )}

      {/* The granular modal, opened in place by the row above. `gr.sheet` names
          the service; the SAVED state for it comes back through `stateFor`, so
          the modal always seeds from what is committed rather than from this
          conversation's own booking — the request only supplies `opensLocked`
          and the prefill amounts. */}
      {gr.sheet && (() => {
        const saved = gr.stateFor(gr.sheet.serviceKey)
        if (!saved) return null
        return (
          <ManageRatesSheet
            serviceName={saved.serviceName}
            clientName={gr.clientName}
            rates={saved.rates}
            savedLocked={saved.locked}
            savedAmounts={saved.amounts}
            lockedAt={saved.lockedAt}
            opensLocked={gr.sheet.opensLocked}
            requestAmounts={gr.sheet.requestAmounts}
            onSave={payload => gr.save(gr.sheet.serviceKey, payload)}
            onClose={gr.closeSheet}
          />
        )
      })()}

      {/* Only `ratesMode === 'current'` toasts; the granular save is silent. */}
      <Snackbar message={lr.snackbar} onDone={lr.dismissSnackbar} />
    </div>
  )
}

/** The mobile overlay at `/conversation/:ownerId/thread/:opk/details`. */
export default function BookingDetailsScreen() {
  return <BookingDetails chrome />
}

/** The desktop conversation's left rail. */
export function BookingDetailsPane({ opk, ctas }) {
  return <BookingDetails chrome={false} opk={opk} ctas={ctas} />
}
