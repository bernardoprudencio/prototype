import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors, radius, shadows, spacing, textStyles, typography } from '../tokens'
import {
  BackIcon, ChevronDownIcon, ChevronUpIcon, ChevronRightIcon,
  InfoCircleIcon, CheckCircleIcon, CautionIcon,
} from '../assets/icons'
import { Button, BottomSheet, PetAvatar, LockRatesToggleRow, LockRatesSheet, Snackbar } from '../components'
import { getClient } from '../data/contacts'
import { getRelationshipData } from '../data/relationshipData'
import { useLockedRates } from '../lib/useLockedRates'
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

export default function BookingDetailsScreen() {
  const navigate = useNavigate()
  const { ownerId, conversationOpk } = useParams()
  const onBack = () => navigate(-1)

  const client = getClient(ownerId)
  const booking = (() => {
    const rel = getRelationshipData(ownerId)
    if (!rel) return null
    const { upcoming, past, archived } = rel.bookings
    const all = [...upcoming, ...past, ...archived]
    // A conversation opened without a thread id falls back to the synthetic
    // `${ownerId}-conv-recurring` opk, which no booking carries — production
    // always has a stay behind the conversation, so land on the client's most
    // relevant one rather than dead-ending.
    return all.find(b => b.conversationOpk === conversationOpk)
      ?? upcoming[0] ?? past[0] ?? archived[0] ?? null
  })()

  // Visibility is per conversation, so the resolved booking is what gates it.
  const lr = useLockedRates(client, booking)
  const [earningsOpen, setEarningsOpen] = useState(false)

  // `_is_collapsed`: a paid, unmodified, not-fully-refunded booking opens
  // collapsed — only the title and the "{owner} paid ... for this stay." line.
  const startsCollapsed = Boolean(booking?.isPaid && !booking?.hasModification && !booking?.isCancelled)
  const [ledgerOpen, setLedgerOpen] = useState(!startsCollapsed)

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
  const plainChips = [
    ...(booking.flexibleStartTime ? [copy.FLEXIBLE_START_TIME] : []),
    copy.unitCount(booking.unitCount ?? 1, booking.unitLabel ?? 'night', `${booking.unitLabel ?? 'night'}s`),
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
  const summaryLine = booking.isPaid
    ? copy.paidForStay(firstName, fmtMoney(booking.price), booking.paidOn)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {/* ─── Nav header — ConversationDetailsHeader.tsx:54-135 ───
          `flexDirection="row" gap="3x" px="4x"`: a back control with an
          underlined "Back" link, the React-Native-only centred title, and
          `details_buttons` at the right end. */}
      <div style={{
        background: colors.white, boxShadow: shadows.headerShadow, padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: spacing.md, height: 56, flexShrink: 0, zIndex: 3,
      }}>
        <div role="button" tabIndex={0} onClick={onBack} aria-label={copy.BACK_TEXT}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: spacing.xs, flexShrink: 0 }}>
          <BackIcon />
          <span style={{ ...textStyles.text100, color: colors.link, textDecoration: 'underline' }}>{copy.BACK_TEXT}</span>
        </div>
        <p style={{ ...tx(16, 700, colors.primary), flex: 1, textAlign: 'center' }}>{copy.PAGE_TITLE}</p>
        <Button variant="default" size="small" style={{ flexShrink: 0 }}>{copy.MODIFY_REQUEST}</Button>
      </div>

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>

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
        <div
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 12px', margin: '16px 0', cursor: 'pointer',
            background: colors.bgInfo, borderRadius: radius.primary,
          }}
        >
          <span style={{ ...textStyles.link100Semibold, color: colors.link }}>{copy.messageOwner(firstName)}</span>
          <ChevronRightIcon color={colors.link} />
        </div>

        {/* ─── 3. Service summary ─── */}
        <SectionTitle title={copy.SERVICE_SUMMARY_TITLE} />
        <div style={{ paddingBottom: spacing.lg }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, padding: '12px 0' }}>
            <p style={{ ...textStyles.text200Semibold, color: colors.primary, margin: 0 }}>{booking.serviceName}</p>
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
        </div>

        {/* ─── 4. Price ledger + the locked-rates switch ───
            ConversationPriceLedger.tsx wraps both in one `pb="4x" gap="4x"`
            column, so the switch sits 16px below the ledger as a sibling. */}
        {(booking.ledger || lr.available) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, paddingBottom: spacing.lg }}>
            {/* PriceLedgerAccordion: pt="4x" pb="0x", header row space-between
                with a 4px gap and no horizontal padding. Only the demo booking
                carries a ledger, so the switch below renders on its own for
                any other conversation — production's toggle is gated on the
                stay being paid, not on the ledger. */}
            {booking.ledger && <div style={{ paddingTop: spacing.lg }}>
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: summaryLine && !ledgerOpen ? spacing.lg : 0 }}>
                <div
                  role="button"
                  aria-label={copy.LEDGER_SECTION_TITLE}
                  onClick={() => startsCollapsed && setLedgerOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: spacing.xs, cursor: startsCollapsed ? 'pointer' : 'default',
                  }}
                >
                  <span style={{ ...textStyles.text200Semibold, color: colors.primary, flex: 1 }}>{copy.LEDGER_SECTION_TITLE}</span>
                  {startsCollapsed && <LedgerChevron open={ledgerOpen} />}
                </div>

                {summaryLine && !ledgerOpen && (
                  <span style={{ ...textStyles.text100, color: colors.secondary, lineHeight: 1.5 }}>{summaryLine}</span>
                )}
              </div>

              {/* PriceLedgerSection.tsx: `py="4x" gap="4x"` with a 1px
                  border.primary bottom rule — ConversationLedger passes
                  showBorderBottom on every section, including the last. */}
              {ledgerOpen && booking.ledger.sections.map((section, si) => (
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
            </div>}

            {/* ─── Locked rates — a switch BELOW the ledger, not a ledger row ─── */}
            {lr.available && (
              <LockRatesToggleRow
                label={toggleLabelLedger(lr.ownerFirstName)}
                ownerFirstName={lr.ownerFirstName}
                checked={lr.locked}
                onRequestChange={lr.requestChange}
              />
            )}
          </div>
        )}

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

      {lr.sheetMode && (
        <LockRatesSheet
          mode={lr.sheetMode}
          ownerFirstName={lr.ownerFirstName}
          serviceName={lr.config.serviceName}
          rates={lr.config.rates}
          onConfirm={lr.confirm}
          onClose={lr.closeSheet}
        />
      )}

      <Snackbar message={lr.snackbar} onDone={lr.dismissSnackbar} />
    </div>
  )
}
