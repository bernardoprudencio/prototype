import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { typography } from './tokens'
import { useLoadTime } from './hooks/useLoadTime'
import { formatActionTimestamp } from './hooks/useDate'
import { ActionSheet, ReviewSheet } from './components'
import {
  HomeScreen, ConversationScreen, ScheduleScreen,
  InboxScreen, MoreScreen, RebookScreen, TestingModeScreen,
} from './screens'
import { OWNERS } from './data/owners'
import { petImages } from './assets/images'
import { useApp } from './context/AppContext'

const TRANSITION_MS = 200

const TAB_ROUTES = {
  home:     '/',
  inbox:    '/inbox',
  calendar: '/',       // no calendar screen yet — Phase 4+
  rebook:   '/contacts',
  more:     '/more',
}

// Paths whose pathname is a stable tab destination — used by the
// /conversation/:id bridge to redirect back to the originating tab.
const TAB_PATHS = new Set(['/', '/inbox', '/contacts', '/more'])

const getOwner = (conv) => {
  if (!conv) return OWNERS.owen
  if (conv.clientKey)      return OWNERS[conv.clientKey]      ?? OWNERS.owen
  if (conv.card?.clientKey) return OWNERS[conv.card.clientKey] ?? OWNERS.owen
  return OWNERS.owen
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    resolvedCards, setResolvedCards,
    liveEvents, addLiveEvent,
  } = useApp()

  const [overlay, setOverlay]                 = useState(null)         // null | 'conversation' | 'schedule'
  const [sheetItem, setSheetItem]             = useState(null)
  const [reviewSheetCard, setReviewSheetCard] = useState(null)
  const [conversation, setConversation]       = useState(null)
  const [transition, setTransition]           = useState(false)
  const [direction, setDirection]             = useState('forward')

  const loadTime = useLoadTime()

  // Track the most recently visited tab path so the /conversation/:id bridge
  // can return the URL to the originating tab when the overlay closes.
  const lastTabPathRef = useRef('/')
  useEffect(() => {
    if (TAB_PATHS.has(location.pathname)) lastTabPathRef.current = location.pathname
  }, [location.pathname])

  const animateTo = (target, dir = 'forward') => {
    setDirection(dir)
    setTransition(true)
    setTimeout(() => {
      setOverlay(target)
      setTransition(false)
    }, TRANSITION_MS)
  }

  // Bridge: child screens (e.g. InboxScreen) call navigate('/conversation/:id')
  // expecting main's route-based overlay model. On this branch the conversation
  // is a state-based overlay, so we intercept that path here, open the overlay,
  // and replace the URL back to the originating tab so navigation stays sane.
  useEffect(() => {
    const m = location.pathname.match(/^\/conversation\/([^/]+)$/)
    if (!m) return
    const ownerId = m[1]
    if (!OWNERS[ownerId]) {
      navigate(lastTabPathRef.current, { replace: true })
      return
    }
    const navState = location.state ?? {}
    setConversation({
      type: navState.type ?? 'today',
      card: navState.card,
      clientKey: ownerId,
    })
    navigate(lastTabPathRef.current, { replace: true })
    animateTo('conversation', 'forward')
  }, [location.pathname])

  const onTabSelect = (id) => {
    const path = TAB_ROUTES[id]
    if (path) navigate(path)
  }

  const handleResolveCard = (card, resolution) => {
    const ts = formatActionTimestamp()
    setResolvedCards(prev => ({ ...prev, [card.id]: { resolution, timestamp: ts } }))
    setReviewSheetCard(null)
    addLiveEvent(card.clientKey, { id: Date.now(), type: 'resolution', resolution, timestamp: ts, card })
    setConversation({ type: 'incomplete', card })
    setTimeout(() => animateTo('conversation', 'forward'), TRANSITION_MS)
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

  const owner = getOwner(conversation)
  const ownerEvents = liveEvents[owner?.id] ?? []

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
        {overlay === null && (
          <Routes>
            <Route path="/" element={
              <HomeScreen
                resolvedCards={resolvedCards}
                loadTime={loadTime}
                onOpenActionSheet={openIncompleteSheet}
                onOpenReviewSheet={(card) => setReviewSheetCard(card)}
                onOpenTodaySheet={openTodaySheet}
                onTabSelect={onTabSelect}
                onNavigateConversation={() => {
                  setConversation({ type: 'today' })
                  animateTo('conversation', 'forward')
                }}
                onNavigateToCard={(card) => {
                  setConversation({ type: 'incomplete', card })
                  animateTo('conversation', 'forward')
                }}
              />
            } />
            <Route path="/inbox"        element={<InboxScreen />} />
            <Route path="/contacts"     element={<RebookScreen />} />
            <Route path="/more"         element={<MoreScreen />} />
            <Route path="/testing-mode" element={<TestingModeScreen />} />
          </Routes>
        )}
        {overlay === 'conversation' && (
          <ConversationScreen
            conversation={conversation}
            owner={owner}
            liveEvents={ownerEvents}
            onLiveEvent={(event) => addLiveEvent(owner?.id, event)}
            onOpenSchedule={() => animateTo('schedule', 'forward')}
            onBack={() => animateTo(null, 'back')}
          />
        )}
        {overlay === 'schedule' && (
          <ScheduleScreen
            owner={owner}
            onBack={(savedChanges) => {
              if (savedChanges?.length) {
                addLiveEvent(owner?.id, { id: Date.now(), type: 'scheduleChange', changes: savedChanges })
              }
              animateTo('conversation', 'back')
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
          setTimeout(() => animateTo('conversation', 'forward'), TRANSITION_MS)
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
