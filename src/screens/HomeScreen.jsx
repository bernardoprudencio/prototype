import React, { useState } from 'react'
import { colors, typography, shadows } from '../tokens'
import { BellIcon, ChevronUpIcon, ChevronDownIcon, EditIcon } from '../assets/icons'
import { petImages } from '../assets/images'
import { formatHeaderDate } from '../hooks/useDate'
import { Button, PetAvatar, UserAvatar, TabBar, HomeCard, Row } from '../components'
import { INCOMPLETE_CARDS } from '../data/bookings'

const PROMO_CARDS = [
  { bg: colors.yellow100, title: 'Promote your profile', desc: 'Invite new pet parents and grow your business.', cta: 'Learn how', img: petImages.promo1 },
  { bg: colors.cyan100, title: 'Share more, earn more', desc: 'Earn a $100 reward for every two customers you invite who book.', cta: 'Start Sharing', img: petImages.promo2 },
]

export default function HomeScreen({ resolvedCards, onOpenActionSheet, onOpenReviewSheet, onNavigateConversation, onOpenDeck, loadTime }) {
  const [incompleteOpen, setIncompleteOpen] = useState(true)

  const visibleCards = INCOMPLETE_CARDS.filter(c => !resolvedCards[c.id])
  const hasIncomplete = visibleCards.length > 0

  // Hide the deck entry point when the prototype is rendered inside an
  // iframe (e.g. the demo slide of the deck itself) to avoid recursion.
  const inEmbed = typeof window !== 'undefined' && window.self !== window.top

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {/* ─── Header ─── */}
      <div style={{ borderBottom: `1px solid ${colors.border}`, padding: '24px 16px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: typography.displayFamily, fontWeight: 600, fontSize: 26, lineHeight: 1.25, color: colors.primary, margin: 0 }}>Your name</h1>
            <p style={{ fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.5, color: colors.primary, margin: '2px 0 0' }}>{formatHeaderDate()}</p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
            <UserAvatar size={48} />
            <BellIcon />
          </div>
        </div>
      </div>

      {/* ─── Scroll Content ─── */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        <p style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.tertiary, margin: '0 0 8px' }}>Updated at {loadTime}</p>

        {/* ─── Deck entry row (hidden when embedded inside the deck) ─── */}
        {!inEmbed && (
          <button
            onClick={onOpenDeck}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', marginBottom: 8,
              background: colors.yellow100, border: `1px solid ${colors.yellow200}`,
              borderRadius: 8, cursor: 'pointer', textAlign: 'left',
              fontFamily: typography.fontFamily,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: colors.primary, margin: 0 }}>
                Project review
              </p>
              <p style={{ fontSize: 12, color: colors.tertiary, margin: '2px 0 0' }}>
                Open the Product &amp; Design leadership deck
              </p>
            </div>
            <span style={{ fontSize: 18, color: colors.primary, flexShrink: 0 }}>→</span>
          </button>
        )}

        {/* ─── Incomplete section ─── */}
        {hasIncomplete && (
          <>
            <div onClick={() => setIncompleteOpen(o => !o)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '24px 0 8px', cursor: 'pointer' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 20, lineHeight: 1.25, color: colors.primary, margin: 0 }}>
                  Incomplete ({visibleCards.length})
                </p>
                <p style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.tertiary, margin: '4px 0 0' }}>
                  Review all services to get paid on time.
                </p>
              </div>
              <div style={{ flexShrink: 0 }}>{incompleteOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}</div>
            </div>

            {incompleteOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleCards.map((card) => (
                  <div key={card.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: '0 16px 16px', background: colors.white }}>
                    <Row
                      label={card.label}
                      sublabel={card.sublabel}
                      rightItem={<PetAvatar size={48} images={[petImages[card.petKey]]} />}
                      firstRow
                    />
                    <Button variant="default" fullWidth onClick={() => onOpenReviewSheet(card)}>Review and submit</Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Today section ─── */}
        <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 20, lineHeight: 1.25, color: colors.primary, margin: '24px 0 8px' }}>Today</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <HomeCard
            time="9:00 – 10:00 AM" service="Dog walking"
            address="123 Fourth Ave, Seattle, WA" petNames="Koni, Burley"
            petImages={[petImages.koni, petImages.burley]}
            buttonLabel="Open Rover Card"
            onClick={onNavigateConversation}
          />
          <HomeCard
            time="5:00 PM – 5:30 PM" service="Dog walking"
            address="123 Fourth Ave, Seattle, WA" petNames="Koni, Burley"
            petImages={[petImages.koni, petImages.burley]}
            buttonLabel="Start Rover Card" disabled
          />
          <div style={{ background: colors.white, borderRadius: 8, boxShadow: shadows.low, padding: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flexShrink: 0 }}><EditIcon /></div>
            <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 14, color: colors.primary, margin: 0, flex: 1 }}>Manage weekly care for this week</p>
          </div>
        </div>

        {/* ─── Rover recommends ─── */}
        <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 20, lineHeight: 1.25, color: colors.primary, margin: '24px 0 8px' }}>Rover recommends</p>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 12, paddingBottom: 24 }}>
          {PROMO_CARDS.map((c, i) => (
            <div key={i} style={{ borderRadius: 8, overflow: 'hidden', boxShadow: shadows.low, background: c.bg, display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <div style={{ height: 120, flexShrink: 0 }}>
                <img src={c.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, lineHeight: 1.25, color: colors.primary, margin: 0 }}>{c.title}</p>
                <p style={{ fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.25, color: colors.tertiary, margin: 0 }}>{c.desc}</p>
                <Button variant="flat" style={{ padding: '6px 0', justifyContent: 'flex-start' }}>{c.cta}</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TabBar activeTab="home" />
    </div>
  )
}
