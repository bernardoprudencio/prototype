import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors, typography } from '../../tokens'
import { getRelationshipData } from '../../data/relationshipData'
import RelationshipPageHeader from './RelationshipPageHeader'
import RelationshipProgressTracker from './RelationshipProgressTracker'
import BookingItems from './BookingItems'

export default function RelationshipPage() {
  const navigate = useNavigate()
  const { ownerId } = useParams()
  const data = getRelationshipData(ownerId)

  if (!data) {
    return (
      <div style={{ padding: 24, fontFamily: typography.fontFamily }}>
        Client not found.
      </div>
    )
  }

  const { requester, progress, bookings } = data

  const handleCardClick = (conversationOpk) => {
    // eslint-disable-next-line no-console
    console.log('booking card click', conversationOpk)
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
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 16,
          padding: '16px 16px 24px',
        }}>
          <RelationshipProgressTracker
            heading={progress.heading}
            tiers={progress.tiers}
            callout={progress.callout}
            earnings={progress.earnings}
            ownerAvatarUrl={requester.photo}
          />

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
  )
}
