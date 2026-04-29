import React, { useState } from 'react'
import { colors, typography } from './tokens'
import { useLoadTime } from './hooks/useLoadTime'
import { formatActionTimestamp } from './hooks/useDate'
import { ActionSheet, ReviewSheet } from './components'
import { HomeScreen, ConversationScreen, DeckScreen } from './screens'

export default function App() {
  const [screen, setScreen]             = useState('home')
  const [actionSheetCard, setActionSheetCard] = useState(null)
  const [reviewSheetCard, setReviewSheetCard] = useState(null)
  const [resolvedCards, setResolvedCards]     = useState({})
  const [conversation, setConversation]       = useState(null)
  const [transition, setTransition]     = useState(false)
  const [direction, setDirection]       = useState('forward')
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

  return (
    <>
      <div className="phone-shell" style={{ fontFamily: typography.fontFamily }}>
        {/* Screen layer */}
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
            onOpenActionSheet={(card) => setActionSheetCard(card)}
            onOpenReviewSheet={(card) => setReviewSheetCard(card)}
            onOpenDeck={() => setScreen('deck')}
            onNavigateConversation={() => {
              setConversation({ type: 'today' })
              navigateTo('conversation', 'forward')
            }}
          />
        )}
        {screen === 'conversation' && (
          <ConversationScreen
            conversation={conversation}
            onBack={() => navigateTo('home', 'back')}
          />
        )}
      </div>

      <ActionSheet
        visible={!!actionSheetCard}
        card={actionSheetCard}
        onClose={() => setActionSheetCard(null)}
        onGoToConversation={() => {
          setConversation({ type: 'incomplete', card: actionSheetCard })
          setActionSheetCard(null)
          setTimeout(() => navigateTo('conversation', 'forward'), 200)
        }}
        onReviewAndComplete={() => {
          const card = actionSheetCard
          setActionSheetCard(null)
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

    {screen === 'deck' && <DeckScreen onClose={() => setScreen('home')} />}
    </>
  )
}
