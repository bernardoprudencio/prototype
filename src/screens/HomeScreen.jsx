import React from 'react'
import { colors, typography, shadows } from '../tokens'
import { BellIcon, ChevronUpIcon, EditIcon, MoreIcon } from '../assets/icons'
import { petImages } from '../assets/images'
import { formatHeaderDate } from '../hooks/useDate'
import { Button, PetAvatar, UserAvatar, TabBar, HomeCard } from '../components'

const PROMO_CARDS = [
  { bg: colors.yellow200, cardBg: colors.yellow100, title: 'Promote your profile', desc: 'Invite new pet parents and grow your business.', cta: 'Learn how', emoji: '🐕' },
  { bg: colors.cyan200, cardBg: colors.cyan100, title: 'Share more, earn more', desc: 'Earn a $100 reward for every two customers you invite who book.', cta: 'Start Sharing', emoji: '💰' },
]

export default function HomeScreen({ onOpenActionSheet, onNavigateConversation, loadTime }) {
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

        {/* Incomplete section header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '24px 0 8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 20, lineHeight: 1.25, color: colors.primary, margin: 0 }}>Incomplete (1)</p>
            <p style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.tertiary, margin: '4px 0 0' }}>Complete all services to get paid on time.</p>
          </div>
          <div style={{ flexShrink: 0 }}><ChevronUpIcon /></div>
        </div>

        {/* Incomplete card */}
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: '0 16px 16px', background: colors.white }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '16px 0' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, lineHeight: 1.5, color: colors.primary, margin: 0 }}>Dog Walking: Archie</p>
              <p style={{ fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.25, color: colors.tertiary, margin: 0 }}>Yesterday · 12:00 PM to 12:30 PM</p>
            </div>
            <PetAvatar size={48} images={[petImages.archie]} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="default" fullWidth>Review and complete</Button>
            <Button variant="default" icon={<MoreIcon />} onClick={onOpenActionSheet} />
          </div>
        </div>

        {/* Today section */}
        <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 20, lineHeight: 1.25, color: colors.primary, margin: '24px 0 8px' }}>Today</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <HomeCard
            time="9:00 – 10:00 AM" service="Dog walking"
            address="123 Fourth Ave, Seattle, WA" petNames="Koni, Burley"
            petImages={[petImages.koni, petImages.burley]}
            buttonLabel="Start Rover Card"
            onClick={onNavigateConversation}
          />
          <HomeCard
            time="5:00 PM – 5:30 PM" service="Dog walking"
            address="123 Fourth Ave, Seattle, WA" petNames="Koni, Burley"
            petImages={[petImages.koni, petImages.burley]}
            buttonLabel="Start Rover Card" disabled
          />
          {/* Manage card */}
          <div style={{ background: colors.white, borderRadius: 8, boxShadow: shadows.low, padding: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flexShrink: 0 }}><EditIcon /></div>
            <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 14, color: colors.primary, margin: 0, flex: 1 }}>Manage weekly care for this week</p>
          </div>
        </div>

        {/* Rover recommends */}
        <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 20, lineHeight: 1.25, color: colors.primary, margin: '24px 0 8px' }}>Rover recommends</p>
        <div className="hide-scrollbar" style={{ display: 'flex', gap: 12, paddingBottom: 24, overflowX: 'auto' }}>
          {PROMO_CARDS.map((c, i) => (
            <div key={i} style={{ width: 165, minWidth: 165, height: 269, borderRadius: 8, overflow: 'hidden', boxShadow: shadows.low, background: c.bg, position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 155, background: c.cardBg, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, lineHeight: 1.25, color: colors.primary, margin: 0 }}>{c.title}</p>
                <p style={{ fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.25, color: colors.tertiary, margin: 0 }}>{c.desc}</p>
                <Button variant="flat" style={{ padding: '8px 0', justifyContent: 'flex-start' }}>{c.cta}</Button>
              </div>
              <div style={{ position: 'absolute', top: 20, left: 20, fontSize: 48, opacity: 0.25 }}>{c.emoji}</div>
            </div>
          ))}
        </div>
      </div>

      <TabBar activeTab="home" />
    </div>
  )
}
