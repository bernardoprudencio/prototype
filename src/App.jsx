import React, { useState } from 'react'
import { colors, typography } from './tokens'
import { useLoadTime } from './hooks/useLoadTime'
import { formatActionTimestamp } from './hooks/useDate'
import { ActionSheet, ReviewSheet } from './components'
import { HomeScreen, ConversationScreen, ScheduleScreen } from './screens'
import { OWNERS } from './data/owners'
import { petImages } from './assets/images'

const getOwner = (conv) => {
  if (!conv || conv.type === 'today') return OWNERS.owen
  return OWNERS[conv.card?.clientKey] ?? OWNERS.owen
}

export default function App() {
  const [screen, setScreen]         = useState('home')
  const [sheetItem, setSheetItem]   = useState(null)
  const [reviewSheetCard, setReviewSheetCard] = useState(null)
  const [resolvedCards, setResolvedCards] = useState({})
  const [conversation, setConversation]   = useState(null)
  const [transition, setTransition] = useState(false)
  const [direction, setDirection]   = useState('forward')
  const loadTime = useLoadTime()

  const navigateTo = (target, dir = 'forward') => {
    setDirection(dir)
    setTransition(true)
    setTimeout(() => {
      setScreen(target)
      setTransition(false)
    }, 200)
  }

  const handleComplete = (card) => {
    const ts = formatActionTimestamp()
    setResolvedCards(prev => ({ ...prev, [card.id]: { resolution: 'completed', timestamp: ts } }))
    setReviewSheetCard(null)
    setConversation({ type: 'incomplete', card, resolution: 'completed', timestamp: ts })
    setTimeout(() => navigateTo('conversation', 'forward'), 200)
  }

  const handleCancelRefund = (card) => {
    const ts = formatActionTimestamp()
    setResolvedCards(prev => ({ ...prev, [card.id]: { resolution: 'cancelled', timestamp: ts } }))
    setReviewSheetCard(null)
    setConversation({ type: 'incomplete', card, resolution: 'cancelled', timestamp: ts })
    setTimeout(() => navigateTo('conversation', 'forward'), 200)
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
            onNavigateConversation={() => {
              setConversation({ type: 'today' })
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
            onBack={() => navigateTo('home', 'back')}
            onModifySchedule={() => navigateTo('schedule', 'forward')}
          />
        )}
        {screen === 'schedule' && (
          <ScheduleScreen
            owner={getOwner(conversation)}
            onBack={(savedChanges) => {
              if (savedChanges?.length) {
                setConversation(prev => ({ ...prev, scheduleChanges: savedChanges }))
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
            setConversation({ type: 'today' })
          }
          setTimeout(() => navigateTo('conversation', 'forward'), 200)
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
