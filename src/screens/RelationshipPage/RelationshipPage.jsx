import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors, typography, radius, shadows } from '../../tokens'
import { getClient } from '../../data/contacts'
import { Row, LockRatesSheet, Snackbar } from '../../components'
import { LockIcon, ChevronRightIcon } from '../../assets/icons'
import { useLockedRates } from '../../lib/useLockedRates'
import { useRelationshipData } from '../../lib/useRelationshipData'
import { isLockableConversation } from '../../data/lockableRates'
import { useIsWide } from '../../lib/useMediaQuery'
import { RATES_SECTION_TITLE, ratesLockedSubtitle, NO_LOCKED_RATES } from '../../data/lockedRatesCopy'
import RelationshipPageHeader from './RelationshipPageHeader'
import RelationshipProgressTracker from './RelationshipProgressTracker'
import BookingItems from './BookingItems'

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
        {/* The wide layout's fixed 400px left column holds the tracker and the
            Rates row. Either can be absent (tracker: rollout off; Rates:
            `lr.available` false), so skip the column entirely when both are —
            otherwise it reserves 400px of empty width beside the booking
            lists. */}
        {(progress.tiers || lr.available) && (
          <div style={isWide
            ? { width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }
            : { display: 'contents' }}>
            {/* The data gate is the single source of truth: `progress.tiers` is
                null unless the alt-monetization rollout is on, so no component
                here reads the flag. Production gates the same screen on
                `is_rollout_alt_monetisation` (views.py:1011-1013). The
                alt-monetization interstitial and the tiers doodle live inside the
                tracker, so they go with it. */}
            {progress.tiers && (
              <RelationshipProgressTracker
                heading={progress.heading}
                tiers={progress.tiers}
                callout={progress.callout}
                earnings={progress.earnings}
                ownerAvatarUrl={requester.photo}
              />
            )}

            {/* Rates — production's own entry point into the lock sheet
                (relationship_progress sections_mapper `_rates_section`). */}
            {lr.available && (
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
          </div>
        )}

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

      <Snackbar message={lr.snackbar} onDone={lr.dismissSnackbar} />
    </div>
  )
}
