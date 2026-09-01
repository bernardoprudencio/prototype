import React, { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors, typography, radius, shadows } from '../../tokens'
import { getClient } from '../../data/contacts'
import { LockRatesSheet, Snackbar, ManageRatesSheet } from '../../components'
import { useLockedRates } from '../../lib/useLockedRates'
import { useGranularRates } from '../../lib/useGranularRates'
import { useRelationshipData } from '../../lib/useRelationshipData'
import {
  isLockableConversation, BROWSABLE_SERVICE_KEYS, SERVICE_DISPLAY_NAME,
} from '../../data/lockableRates'
import { useApp } from '../../context/AppContext'
import { useIsWide } from '../../lib/useMediaQuery'
import { webColumn } from '../../lib/webColumn'
import RelationshipPageHeader from './RelationshipPageHeader'
import RelationshipProgressTracker from './RelationshipProgressTracker'
import BookingItems from './BookingItems'
import RatesPanel from './RatesPanel'
import SectionNav from './SectionNav'
import SectionAccordion, { SectionChipRow } from './SectionAccordion'
import { buildSections, SECTION_BOOKINGS, SECTION_RATES } from './sections'

export default function RelationshipPage() {
  const navigate = useNavigate()
  const { ownerId } = useParams()
  const isWide = useIsWide()
  const data = useRelationshipData(ownerId)
  const client = getClient(ownerId)
  // The relationship page is not a conversation, so it has no gate of its own.
  // It summarises across services, and its sheet needs one concrete service to
  // act on — so drive it off the client's most relevant lockable booking.
  const repBooking = (() => {
    if (!data) return null
    const { upcoming, past, archived } = data.bookings
    return [...upcoming, ...past, ...archived].find(isLockableConversation) ?? null
  })()
  const lr = useLockedRates(client, repBooking)

  // ── Rates mode fork ─────────────────────────────────────────────────────────
  // `current` keeps the shipped experience: one row that opens the binary
  // LockRatesSheet, driven by `useLockedRates` above.
  // `granular` is the POC proposal (01-locked-rates-client-management.md §3.2):
  // the section becomes a read-only rate sheet listing every browsable service,
  // each row opening the shared ManageRatesSheet. Both hooks are called
  // unconditionally — hook order cannot fork — and only the render does.
  const { ratesMode } = useApp()
  const gr = useGranularRates(client, null)

  // ── Section IA ──────────────────────────────────────────────────────────────
  // Wide is master–detail: one selected section, its pane on the right.
  // Narrow is accordions: a set of open sections, Rates open on arrival
  // (Figma 192:15414 draws it expanded). The two never coexist, but both states
  // are held unconditionally — a resize across the breakpoint must not lose the
  // reader's place, and hooks cannot fork.
  const [section, setSection] = useState(SECTION_BOOKINGS)
  const [openSections, setOpenSections] = useState(() => new Set([SECTION_RATES]))
  const sectionRefs = useRef({})

  // GroupedServiceRates.tsx: `booked` is set membership over the bookings the
  // page already has, not a per-service request. Production's payload is paged,
  // so it warns the split can misplace a service; here every booking is present,
  // so it is exact.
  const bookedServiceKeys = (() => {
    if (!data) return new Set()
    const { upcoming, past, archived } = data.bookings
    return new Set([...upcoming, ...past, ...archived].map(b => b.serviceKey))
  })()

  // The provider's catalogue, in the order lockableRates.js lists it. A service
  // with no lockable rates has no state and is dropped rather than shown with an
  // empty sheet behind it.
  const rateServices = gr.enabled
    ? BROWSABLE_SERVICE_KEYS
        .map(key => ({ key, state: gr.stateFor(key) }))
        .filter(s => s.state)
        .map(s => ({
          key: s.key,
          // `stateFor` carries the Title Case display name production
          // interpolates; SERVICE_DISPLAY_NAME is the fallback for a service
          // whose seed omits it.
          name: s.state.serviceName ?? SERVICE_DISPLAY_NAME[s.key],
          locked: s.state.locked,
          lockedAt: s.state.lockedAt,
        }))
    : []

  const bookedServices    = rateServices.filter(s => bookedServiceKeys.has(s.key))
  const notBookedServices = rateServices.filter(s => !bookedServiceKeys.has(s.key))

  // The sheet reads the SAVED state for whichever service the row opened. This
  // page passes no seeding — it is not opened from a request (§3.2), so there is
  // no `opensLocked` and no `requestAmounts`, and the sheet opens on what is
  // saved.
  const sheetState = gr.sheet ? gr.stateFor(gr.sheet.serviceKey) : null

  if (!data) {
    return (
      <div style={{ padding: 24, fontFamily: typography.fontFamily }}>
        Client not found.
      </div>
    )
  }

  const { requester, progress, bookings } = data

  // Production opens the conversation for that booking; its "Details" CTA is
  // the entry point to BookingDetailsScreen.
  const handleCardClick = (conversationOpk) => {
    navigate(`/conversation/${ownerId}/thread/${conversationOpk}`, { state: { type: 'today' } })
  }

  const handleRebook = () => {
    // eslint-disable-next-line no-console
    console.log('rebook click', ownerId)
  }

  const handleProfile = () => {
    // eslint-disable-next-line no-console
    console.log('profile click', ownerId)
  }

  // Rates earns a section only when there is something behind it: a lockable
  // config in `current` mode, a catalogue in `granular`. A client with neither
  // reads as a one-section page rather than a row into an empty pane.
  const ratesAvailable = ratesMode === 'granular' ? gr.enabled : lr.available
  const lockedCount = ratesMode === 'granular'
    ? rateServices.filter(s => s.locked).length
    : lr.lockedServiceCount

  const sections = buildSections({ bookings, lockedCount })
    .filter(s => s.key !== SECTION_RATES || ratesAvailable)

  // `current` mode has no grouped panel to open, so its Rates row keeps the
  // shipped behaviour: it fires the binary lock straight into LockRatesSheet
  // rather than selecting a pane or expanding a body. Returning true here means
  // "handled, do not touch the section state".
  const openedLegacyRatesSheet = (key) => {
    if (key !== SECTION_RATES || ratesMode === 'granular') return false
    lr.requestChange(!lr.locked)
    return true
  }

  const selectSection = (key) => {
    if (openedLegacyRatesSheet(key)) return
    setSection(key)
  }

  const toggleSection = (key) => {
    if (openedLegacyRatesSheet(key)) return
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // A chip never closes a section — it opens it and brings it into view, so the
  // row reads as navigation rather than a second set of toggles.
  const jumpToSection = (key) => {
    if (openedLegacyRatesSheet(key)) return
    setOpenSections(prev => new Set(prev).add(key))
    requestAnimationFrame(() => {
      sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  // Flags can retire the selected section mid-session (rates mode, the locked
  // rates flag); fall back rather than render an empty pane.
  const activeSection = sections.some(s => s.key === section) ? section : SECTION_BOOKINGS

  // `bare` inside the mobile accordion: the card is already white, and a list
  // drawing its own box would nest one white surface in another. The wide pane
  // has no card of its own, so the lists keep theirs.
  const bookingLists = (bare) => (
    <>
      {bookings.upcoming.length > 0 && (
        <BookingItems
          type="upcoming"
          bookings={bookings.upcoming}
          earningsAmount={progress.earnings.pending.amount}
          currencyIso={progress.earnings.pending.currencyIso}
          onCardClick={handleCardClick}
          bare={bare}
        />
      )}

      {bookings.past.length > 0 && (
        <BookingItems
          type="past"
          bookings={bookings.past}
          earningsAmount={progress.earnings.completed.amount}
          currencyIso={progress.earnings.completed.currencyIso}
          onCardClick={handleCardClick}
          bare={bare}
        />
      )}

      {bookings.archived.length > 0 && (
        <BookingItems
          type="archived"
          bookings={bookings.archived}
          onCardClick={handleCardClick}
          bare={bare}
        />
      )}
    </>
  )

  const ratesPanel = (showHeading) => (
    <RatesPanel
      bookedServices={bookedServices}
      notBookedServices={notBookedServices}
      onOpenSheet={(key) => gr.openSheet(key, {})}
      showHeading={showHeading}
    />
  )

  // The data gate is the single source of truth: `progress.tiers` is null unless
  // the alt-monetization rollout is on, so no component here reads the flag.
  // Production gates the same screen on `is_rollout_alt_monetisation`
  // (views.py:1011-1013). The tracker sits above the section IA at both widths —
  // the IA is additive to the rollout, not a fork of it.
  const tracker = progress.tiers && (
    <RelationshipProgressTracker
      heading={progress.heading}
      tiers={progress.tiers}
      callout={progress.callout}
      earnings={progress.earnings}
      ownerAvatarUrl={requester.photo}
    />
  )

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      position: 'relative',
      background: colors.bgSecondary,
      fontFamily: typography.fontFamily,
    }}>
      {/* App chrome only. At the wide breakpoint the web navbar is the
          navigation and the identity moves into the left column as a card
          (Figma 192:15290), so this bar — and the only in-page back
          affordance — belongs to the narrow layout alone. */}
      {!isWide && (
        <RelationshipPageHeader
          ownerName={requester.displayName}
          petNames={requester.pets}
          avatarUrl={requester.photo}
          onBack={() => navigate(-1)}
          onRebookPress={requester.isActive ? handleRebook : undefined}
          onProfilePress={requester.isActive ? handleProfile : undefined}
        />
      )}

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {isWide ? (
          // Master–detail (Figma 192:15290): the left column selects, the right
          // pane renders. 375 is the frame's master width.
          <div style={webColumn(true, {
            display: 'flex', alignItems: 'flex-start', gap: 40,
            padding: '48px 16px 24px',
          })}>
            <div style={{
              width: 375, flexShrink: 0,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <RelationshipPageHeader
                variant="card"
                ownerName={requester.displayName}
                petNames={requester.pets}
                avatarUrl={requester.photo}
                onRebookPress={requester.isActive ? handleRebook : undefined}
                onProfilePress={requester.isActive ? handleProfile : undefined}
              />

              {tracker}

              <SectionNav
                sections={sections}
                selected={activeSection}
                onSelect={selectSection}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeSection === SECTION_RATES ? (
                <div style={{
                  background: colors.white,
                  borderRadius: radius.primary,
                  boxShadow: shadows.low,
                  padding: '16px 16px 8px',
                }}>
                  {ratesPanel(true)}
                </div>
              ) : bookingLists(false)}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 16,
            padding: '16px 16px 24px',
          }}>
            {tracker}

            <SectionChipRow sections={sections} onSelect={jumpToSection} />

            {sections.map(s => (
              <SectionAccordion
                key={s.key}
                ref={(el) => { sectionRefs.current[s.key] = el }}
                section={s}
                open={openSections.has(s.key)}
                onToggle={() => toggleSection(s.key)}
              >
                {s.key === SECTION_RATES
                  ? ratesPanel(false)
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {bookingLists(true)}
                    </div>
                  )}
              </SectionAccordion>
            ))}
          </div>
        )}
      </div>

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

      {/* The granular sheet a ServiceRateRow opened. No `slugs` equivalent is
          passed: a row stands for the whole service, so the sheet manages every
          rate the relationship reports as lockable for it (§3.2). */}
      {gr.sheet && sheetState && (
        <ManageRatesSheet
          serviceName={sheetState.serviceName}
          clientName={gr.clientName}
          rates={sheetState.rates}
          savedLocked={sheetState.locked}
          savedAmounts={sheetState.amounts}
          lockedAt={sheetState.lockedAt}
          onSave={(next) => gr.save(gr.sheet.serviceKey, next)}
          onClose={gr.closeSheet}
        />
      )}

      <Snackbar message={lr.snackbar} onDone={lr.dismissSnackbar} />
    </div>
  )
}
