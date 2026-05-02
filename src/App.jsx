import React, { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { typography } from './tokens'
import { useLoadTime } from './hooks/useLoadTime'
import { formatActionTimestamp } from './hooks/useDate'
import { ActionSheet, ReviewSheet, SlideOverlay } from './components'
import { HomeScreen, ConversationScreen, ScheduleScreen, EditTemplateScreen, CurrentWeekScreen, RebookScreen, MoreScreen, RelationshipPage, InboxScreen, ScheduleOverlay, TestingModeScreen } from './screens'
import { petImages } from './assets/images'
import { useApp } from './context/AppContext'

export default function App() {
  const navigate = useNavigate()
  const { setResolvedCards, scheduleMode } = useApp()

  const [sheetItem, setSheetItem]             = useState(null)
  const [reviewSheetCard, setReviewSheetCard] = useState(null)

  const loadTime = useLoadTime()

  const handleComplete = (card) => {
    const ts = formatActionTimestamp()
    setResolvedCards(prev => ({ ...prev, [card.id]: { resolution: 'completed', timestamp: ts } }))
    setReviewSheetCard(null)
    navigate(`/conversation/${card.clientKey}`, {
      state: { type: 'incomplete', cardId: card.id, card },
    })
  }

  const handleCancelRefund = (card) => {
    const ts = formatActionTimestamp()
    setResolvedCards(prev => ({ ...prev, [card.id]: { resolution: 'cancelled', timestamp: ts } }))
    setReviewSheetCard(null)
    navigate(`/conversation/${card.clientKey}`, {
      state: { type: 'incomplete', cardId: card.id, card },
    })
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
    owner: walk.owner,
  })

  return (
    <div className="phone-shell" style={{ fontFamily: typography.fontFamily, position: 'relative', overflow: 'hidden' }}>
      {/* ── Tab routes (base layer) ── */}
      <Routes>
        <Route path="/" element={
          <HomeScreen
            loadTime={loadTime}
            onOpenActionSheet={openIncompleteSheet}
            onOpenReviewSheet={(card) => setReviewSheetCard(card)}
            onOpenTodaySheet={openTodaySheet}
          />
        } />
        <Route path="/contacts" element={<RebookScreen />} />
        <Route path="/more" element={<MoreScreen />} />
        <Route path="/inbox" element={<InboxScreen />} />
      </Routes>

      {/* ── Conversation overlay (z-10) ── */}
      <Routes>
        <Route path="/conversation/:ownerId/booking/:conversationOpk" element={
          <SlideOverlay zIndex={10}>
            <ConversationScreen />
          </SlideOverlay>
        } />
        <Route path="/conversation/:ownerId/*" element={
          <SlideOverlay zIndex={10}>
            <ConversationScreen />
          </SlideOverlay>
        } />
      </Routes>

      {/* ── Relationship page overlay (z-10, sibling of conversation) ── */}
      <Routes>
        <Route path="/contacts/:ownerId" element={
          <SlideOverlay zIndex={10}>
            <RelationshipPage />
          </SlideOverlay>
        } />
        <Route path="*" element={null} />
      </Routes>

      {/* ── Testing mode overlay (z-15) ── */}
      <Routes>
        <Route path="/testing-mode" element={
          <SlideOverlay zIndex={15}>
            <TestingModeScreen />
          </SlideOverlay>
        } />
      </Routes>

      {/* ── Schedule + CurrentWeek (z-20 siblings).
           In Modification mode, /schedule renders ScheduleScreen (5-week calendar).
           In Agenda mode, /schedule renders ScheduleOverlay (RelationshipManagement + sheets). ── */}
      <Routes>
        <Route path="/conversation/:ownerId/schedule" element={
          <SlideOverlay zIndex={20}>
            {scheduleMode === 'agenda' ? <ScheduleOverlay /> : <ScheduleScreen />}
          </SlideOverlay>
        } />
        <Route path="/conversation/:ownerId/current-week" element={
          <SlideOverlay zIndex={20}>
            <CurrentWeekScreen />
          </SlideOverlay>
        } />
      </Routes>

      {/* ── EditTemplate (z-30, on top of Schedule) ── */}
      <Routes>
        <Route path="/conversation/:ownerId/schedule/edit-template" element={
          <SlideOverlay zIndex={30}>
            <EditTemplateScreen />
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
            navigate(`/conversation/${item.card.clientKey}`, {
              state: { type: 'incomplete', cardId: item.card.id, card: item.card },
            })
          } else {
            const ownerId = item.owner?.id ?? 'owen'
            navigate(`/conversation/${ownerId}`, { state: { type: 'today' } })
          }
        }}
        onReschedule={() => {
          const ownerId = sheetItem.owner?.id ?? 'owen'
          setSheetItem(null)
          navigate(`/conversation/${ownerId}/current-week`, { state: { type: 'today' } })
        }}
        onReviewAndComplete={() => {
          const card = sheetItem.card
          setSheetItem(null)
          setTimeout(() => setReviewSheetCard(card), 200)
        }}
      />

      <ReviewSheet
        visible={!!reviewSheetCard}
        card={reviewSheetCard}
        onClose={() => setReviewSheetCard(null)}
        onComplete={() => handleComplete(reviewSheetCard)}
        onCancelRefund={() => handleCancelRefund(reviewSheetCard)}
      />
    </div>
  )
}
