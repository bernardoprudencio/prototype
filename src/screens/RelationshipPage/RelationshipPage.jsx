import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors, typography, radius, shadows, textStyles } from '../../tokens'
import { getRelationshipData } from '../../data/relationshipData'
import { getClient } from '../../data/contacts'
import { Row, LockRatesSheet, Snackbar, ServiceRateRow, ManageRatesSheet } from '../../components'
import { LockIcon, ChevronRightIcon } from '../../assets/icons'
import { useLockedRates } from '../../lib/useLockedRates'
import { useGranularRates } from '../../lib/useGranularRates'
import {
  isLockableConversation, BROWSABLE_SERVICE_KEYS, SERVICE_DISPLAY_NAME,
} from '../../data/lockableRates'
import { useApp } from '../../context/AppContext'
import { useIsWide } from '../../lib/useMediaQuery'
import { RATES_SECTION_TITLE, ratesLockedSubtitle, NO_LOCKED_RATES } from '../../data/lockedRatesCopy'
import {
  RATES_SECTION_HEADING, GROUP_BOOKED, GROUP_NOT_BOOKED, NO_SERVICES,
} from '../../data/granularRatesCopy'
import RelationshipPageHeader from './RelationshipPageHeader'
import RelationshipProgressTracker from './RelationshipProgressTracker'
import BookingItems from './BookingItems'

export default function RelationshipPage() {
  const navigate = useNavigate()
  const { ownerId } = useParams()
  const isWide = useIsWide()
  const data = getRelationshipData(ownerId)
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

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      position: 'relative',
      background: colors.bgSecondary,
      fontFamily: typography.fontFamily,
    }}>
      <RelationshipPageHeader
        ownerName={requester.displayName}
        petNames={requester.pets}
        avatarUrl={requester.photo}
        onBack={() => navigate(-1)}
        onRebookPress={requester.isActive ? handleRebook : undefined}
        onProfilePress={requester.isActive ? handleProfile : undefined}
      />

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={isWide ? {
          // Production's relationship page is internally two-column at desktop:
          // the tracker on the left, the booking lists filling the rest
          // (RelationshipPage.tsx:227-233), capped there at 1200 and here at
          // the prototype's 1140.
          maxWidth: 1140, margin: '0 auto',
          display: 'flex', alignItems: 'flex-start', gap: 16,
          padding: '16px 16px 24px',
        } : {
          display: 'flex', flexDirection: 'column', gap: 16,
          padding: '16px 16px 24px',
        }}>
        <div style={isWide
          ? { width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }
          : { display: 'contents' }}>
          <RelationshipProgressTracker
            heading={progress.heading}
            tiers={progress.tiers}
            callout={progress.callout}
            earnings={progress.earnings}
            ownerAvatarUrl={requester.photo}
          />

          {/* Rates — production's own entry point into the lock sheet
              (relationship_progress sections_mapper `_rates_section`).
              `current` mode only; the granular sheet below replaces it. */}
          {ratesMode !== 'granular' && lr.available && (
            <div style={{
              background: colors.white,
              borderRadius: radius.primary,
              boxShadow: shadows.low,
              padding: '0 16px',
            }}>
              <Row
                firstRow
                leftItem={<LockIcon size={24} color={colors.primary} />}
                label={RATES_SECTION_TITLE}
                sublabel={lr.lockedServiceCount > 0
                  ? ratesLockedSubtitle(lr.lockedServiceCount)
                  : NO_LOCKED_RATES}
                rightItem={<ChevronRightIcon />}
                onClick={() => lr.requestChange(!lr.locked)}
              />
            </div>
          )}

          {/* Rates, granular — the POC's RelationshipRatesContent +
              GroupedServiceRates as one read-only sheet: a heading, then the
              catalogue split into booked and not-booked, each row opening the
              shared modal. An empty group renders nothing at all rather than a
              heading over nothing, so a client with no bookings reads as one
              list instead of two. */}
          {ratesMode === 'granular' && gr.enabled && (
            <div style={{
              background: colors.white,
              borderRadius: radius.primary,
              boxShadow: shadows.low,
              padding: '16px 16px 8px',
            }}>
              <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: '0 0 8px' }}>
                {RATES_SECTION_HEADING}
              </h2>

              {rateServices.length === 0 ? (
                <p style={{ ...textStyles.paragraph100, color: colors.secondary, margin: '0 0 8px' }}>
                  {NO_SERVICES}
                </p>
              ) : (
                [
                  { heading: GROUP_BOOKED,     services: bookedServices },
                  { heading: GROUP_NOT_BOOKED, services: notBookedServices },
                ].map(group => group.services.length > 0 && (
                  <div key={group.heading} style={{ paddingBottom: 8 }}>
                    <h3 style={{ ...textStyles.heading100, color: colors.secondary, margin: '8px 0 0' }}>
                      {group.heading}
                    </h3>
                    <div role="list">
                      {group.services.map(service => (
                        <div key={service.key} role="listitem">
                          <ServiceRateRow
                            serviceName={service.name}
                            isLocked={service.locked}
                            lockedAt={service.lockedAt}
                            onPress={() => gr.openSheet(service.key, {})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Rates stays in the left column with the tracker — it is
            prototype-only, and production has no rates module here to place. */}
        <div style={isWide
          ? { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }
          : { display: 'contents' }}>
          {bookings.upcoming.length > 0 && (
            <BookingItems
              type="upcoming"
              bookings={bookings.upcoming}
              earningsAmount={progress.earnings.pending.amount}
              currencyIso={progress.earnings.pending.currencyIso}
              onCardClick={handleCardClick}
            />
          )}

          {bookings.past.length > 0 && (
            <BookingItems
              type="past"
              bookings={bookings.past}
              earningsAmount={progress.earnings.completed.amount}
              currencyIso={progress.earnings.completed.currencyIso}
              onCardClick={handleCardClick}
            />
          )}

          {bookings.archived.length > 0 && (
            <BookingItems
              type="archived"
              bookings={bookings.archived}
              onCardClick={handleCardClick}
            />
          )}
        </div>
        </div>
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
