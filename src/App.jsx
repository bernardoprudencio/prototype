import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { colors, typography } from './tokens'
import { useLoadTime } from './hooks/useLoadTime'
import { formatActionTimestamp } from './hooks/useDate'
import { ActionSheet, ReviewSheet } from './components'
import HomeScreen from './screens/HomeScreen'
import InboxScreen from './screens/InboxScreen'
import ConversationScreen from './screens/ConversationScreen'
import ScheduleOverlay from './screens/ScheduleOverlay'
import { petImages } from './assets/images'
import { useAppContext } from './context/AppContext'

const TRANSITION_MS = 200

function SlideOverlay({ children, zIndex = 10 }) {
  const [active, setActive] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setActive(true)))
  }, [])
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex,
      background: colors.white,
      transition: `transform ${TRANSITION_MS}ms ease, opacity ${TRANSITION_MS}ms ease`,
      transform: active ? 'translateX(0)' : 'translateX(100%)',
      opacity: active ? 1 : 0,
    }}>
      {children}
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const { resolvedCards, setResolvedCards, addLiveEvent } = useAppContext()

  const [sheetItem, setSheetItem]             = useState(null)
  const [reviewSheetCard, setReviewSheetCard] = useState(null)

  const loadTime = useLoadTime()

  const handleResolveCard = (card, resolution) => {
    const ts = formatActionTimestamp()
    setResolvedCards(prev => ({ ...prev, [card.id]: { resolution, timestamp: ts } }))
    setReviewSheetCard(null)
    addLiveEvent(card.clientKey, { id: Date.now(), type: 'resolution', resolution, timestamp: ts, card })
    navigate(`/conversation/${card.clientKey}`, { state: { type: 'incomplete', card } })
  }

  const openIncompleteSheet = (card) => setSheetItem({
    type: 'incomplete',
    label: card.label,
    sublabel: card.sublabel,
    petImages: [petImages[card.petKey]],
    firstName: card.client.split(' ')[0],
    card,
  })

  const openTodaySheet = (walk) => setSheetItem({
    type: 'today',
    label: `Dog Walking: ${walk.owner.petNames}`,
    sublabel: `Today · ${walk.timeRange}`,
    petImages: walk.owner.petImages,
    firstName: walk.owner.name.split(' ')[0],
    ownerKey: walk.owner.id,
  })

  return (
    <div className="phone-shell" style={{ fontFamily: typography.fontFamily, position: 'relative', overflow: 'hidden' }}>

      {/* ── Tab routes ── */}
      <Routes>
        <Route path="/" element={
          <HomeScreen
            loadTime={loadTime}
            onOpenActionSheet={openIncompleteSheet}
            onOpenReviewSheet={(card) => setReviewSheetCard(card)}
            onOpenTodaySheet={openTodaySheet}
          />
        } />
        <Route path="/inbox" element={<InboxScreen />} />
      </Routes>

      {/* ── Conversation overlay ── */}
      <Routes>
        <Route path="/conversation/:ownerId/*" element={
          <SlideOverlay zIndex={10}>
            <ConversationScreen />
          </SlideOverlay>
        } />
      </Routes>

      {/* ── Schedule overlay ── */}
      <Routes>
        <Route path="/conversation/:ownerId/schedule" element={
          <SlideOverlay zIndex={20}>
            <ScheduleOverlay />
          </SlideOverlay>
        } />
      </Routes>

      {/* ── Global modals ── */}
      <ActionSheet
        visible={!!sheetItem}
        type={sheetItem?.type}
        label={sheetItem?.label}
        sublabel={sheetItem?.sublabel}
        petImages={sheetItem?.petImages}
        firstName={sheetItem?.firstName}
        onClose={() => setSheetItem(null)}
        onGoToConversation={() => {
          const item = sheetItem
          setSheetItem(null)
          if (item.type === 'incomplete') {
            navigate(`/conversation/${item.card.clientKey}`, { state: { type: 'incomplete', card: item.card } })
          } else {
            navigate(`/conversation/${item.ownerKey}`, { state: { type: 'today' } })
          }
        }}
        onReviewAndComplete={() => {
          const card = sheetItem.card
          setSheetItem(null)
          setTimeout(() => setReviewSheetCard(card), TRANSITION_MS)
        }}
      />

      <ReviewSheet
        visible={!!reviewSheetCard}
        card={reviewSheetCard}
        onClose={() => setReviewSheetCard(null)}
        onComplete={() => handleResolveCard(reviewSheetCard, 'completed')}
        onCancelRefund={() => handleResolveCard(reviewSheetCard, 'cancelled')}
      />
    </div>
  )
}
