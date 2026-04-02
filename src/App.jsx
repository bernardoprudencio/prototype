import React, { useState } from 'react'
import { colors, typography } from './tokens'
import { useLoadTime } from './hooks/useLoadTime'
import { formatActionTimestamp } from './hooks/useDate'
import { ActionSheet, ReviewSheet } from './components'
import { HomeScreen, ConversationScreen, ScheduleScreen } from './screens'
import { OWNERS } from './data/owners'
import { petImages } from './assets/images'

const TRANSITION_MS = 200

const getOwner = (conv) => {
  if (!conv) return OWNERS.owen
  if (conv.type === 'today') return OWNERS[conv.clientKey] ?? OWNERS.owen
  return OWNERS[conv.card?.clientKey] ?? OWNERS.owen
}

export default function App() {
  const [screen, setScreen]         = useState('home')
  const [sheetItem, setSheetItem]   = useState(null)
  const [reviewSheetCard, setReviewSheetCard] = useState(null)
  const [resolvedCards, setResolvedCards] = useState({})
  const [conversation, setConversation]   = useState(null)
  const [liveEvents, setLiveEvents]       = useState({})
  const [transition, setTransition] = useState(false)
  const [direction, setDirection]   = useState('forward')
  const loadTime = useLoadTime()

  const navigateTo = (target, dir = 'forward') => {
    setDirection(dir)
    setTransition(true)
    setTimeout(() => {
      setScreen(target)
      setTransition(false)
    }, TRANSITION_MS)
  }

  const addLiveEvent = (ownerKey, event) =>
    setLiveEvents(prev => ({ ...prev, [ownerKey]: [...(prev[ownerKey] ?? []), event] }))

  const handleResolveCard = (card, resolution) => {
    const ts = formatActionTimestamp()
    setResolvedCards(prev => ({ ...prev, [card.id]: { resolution, timestamp: ts } }))
    setReviewSheetCard(null)
    addLiveEvent(card.clientKey, { id: Date.now(), type: 'resolution', resolution, timestamp: ts, card })
    setConversation({ type: 'incomplete', card })
    setTimeout(() => navigateTo('conversation', 'forward'), TRANSITION_MS)
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
    <div className="phone-shell" style={{ fontFamily: typography.fontFamily }}>
      <div style={{
        position: 'absolute', inset: 0,
        transition: 'transform 0.25s ease, opacity 0.2s ease',
        transform: transition
          ? (direction === 'forward' ? 'translateX(-30%)' : 'translateX(30%)')
          : 'translateX(0)',
        opacity: transition ? 0 : 1,
      }}>
        {screen === 'home' && (
          <HomeScreen
            resolvedCards={resolvedCards}
            loadTime={loadTime}
            onOpenActionSheet={openIncompleteSheet}
            onOpenReviewSheet={(card) => setReviewSheetCard(card)}
            onOpenTodaySheet={openTodaySheet}
            onNavigateConversation={(walk) => {
              setConversation({ type: 'today', clientKey: walk?.owner?.id })
              navigateTo('conversation', 'forward')
            }}
            onNavigateToCard={(card) => {
              setConversation({ type: 'incomplete', card })
              navigateTo('conversation', 'forward')
            }}
          />
        )}
        {screen === 'conversation' && (
          <ConversationScreen
            conversation={conversation}
            owner={getOwner(conversation)}
            liveEvents={liveEvents[getOwner(conversation).id] ?? []}
            onLiveEvent={(event) => addLiveEvent(getOwner(conversation).id, event)}
            onResolveIncomplete={(resolution, cardInfo) => {
              const owner = getOwner(conversation)
              const ts = formatActionTimestamp()
              const card = { id: `${owner.id}-incomplete`, clientKey: owner.id, ...cardInfo }
              setResolvedCards(prev => ({ ...prev, [card.id]: { resolution, timestamp: ts } }))
              addLiveEvent(owner.id, { id: Date.now(), type: 'resolution', resolution, timestamp: ts, card })
            }}
            onBack={() => navigateTo('home', 'back')}
          />
        )}
        {screen === 'schedule' && (
          <ScheduleScreen
            owner={getOwner(conversation)}
            onBack={(savedChanges) => {
              if (savedChanges?.length) {
                addLiveEvent(getOwner(conversation).id, { id: Date.now(), type: 'scheduleChange', changes: savedChanges })
              }
              navigateTo('conversation', 'back')
            }}
          />
        )}
      </div>

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
            setConversation({ type: 'incomplete', card: item.card })
          } else {
            setConversation({ type: 'today', clientKey: item.ownerKey })
          }
          setTimeout(() => navigateTo('conversation', 'forward'), TRANSITION_MS)
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
