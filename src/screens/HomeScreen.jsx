import React, { useState } from 'react'
import { colors, typography, shadows } from '../tokens'
import { BellIcon, ChevronUpIcon, ChevronDownIcon, EditIcon, MoreIcon } from '../assets/icons'
import { petImages } from '../assets/images'
import { formatHeaderDate } from '../hooks/useDate'
import { Button, PetAvatar, UserAvatar, TabBar, Row } from '../components'
import { getTodayWalks, getIncompleteCards } from '../data/owners'

const TODAY_WALKS = getTodayWalks()
const INCOMPLETE_CARDS = getIncompleteCards()

const PROMO_CARDS = [
  { bg: colors.yellow100, title: 'Promote your profile', desc: 'Invite new pet parents and grow your business.', cta: 'Learn how', img: petImages.promo1 },
  { bg: colors.cyan100, title: 'Share more, earn more', desc: 'Earn a $100 reward for every two customers you invite who book.', cta: 'Start Sharing', img: petImages.promo2 },
]

export default function HomeScreen({ resolvedCards, onOpenActionSheet, onOpenReviewSheet, onNavigateConversation, onNavigateToCard, onOpenTodaySheet, loadTime }) {
  const [incompleteOpen, setIncompleteOpen] = useState(true)

  const visibleCards = INCOMPLETE_CARDS.filter(c => !resolvedCards[c.id])
  const hasIncomplete = visibleCards.length > 0

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

        {/* ─── Incomplete section ─── */}
        {hasIncomplete && (
          <>
            <div onClick={() => setIncompleteOpen(o => !o)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '24px 0 8px', cursor: 'pointer' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 20, lineHeight: 1.25, color: colors.primary, margin: 0 }}>
                  Incomplete ({visibleCards.length})
                </p>
                <p style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.tertiary, margin: '4px 0 0' }}>
                  Complete all services to get paid on time.
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
                      rightItem={<PetAvatar size={48} images={card.petImgs || [petImages[card.petKey]]} />}
                      firstRow
                      onClick={() => onNavigateToCard(card)}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="flat" style={{ flex: 1 }} onClick={() => onOpenReviewSheet(card)}>Review and complete</Button>
                      <Button variant="default" icon={<MoreIcon size={16} />} onClick={() => onOpenActionSheet(card)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Today section ─── */}
        <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 20, lineHeight: 1.25, color: colors.primary, margin: '24px 0 8px' }}>Today</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TODAY_WALKS.map((walk, i) => {
            const blocked = TODAY_WALKS.slice(0, i).some(w => w.owner.id === walk.owner.id)
            return (
              <div key={`${walk.owner.id}-${i}`} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: '0 16px 16px', background: colors.white }}>
                <Row
                  label={`Dog Walking: ${walk.owner.petNames}`}
                  sublabel={`Today · ${walk.timeRange}`}
                  rightItem={<PetAvatar size={48} images={walk.owner.petImages} />}
                  firstRow
                  onClick={!blocked ? () => onNavigateConversation(walk) : undefined}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant={i === 0 ? 'primary' : 'default'} style={{ flex: 1 }} disabled={blocked} onClick={!blocked ? () => onNavigateConversation(walk) : undefined}>
                    Start Rover Card
                  </Button>
                  <Button variant="default" icon={<MoreIcon size={16} />} onClick={() => onOpenTodaySheet(walk)} />
                </div>
              </div>
            )
          })}
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

      <TabBar />
    </div>
  )
}
