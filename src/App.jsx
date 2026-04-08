import React, { useState, useRef } from 'react'
import { colors, typography, shadows } from './tokens'
import { useLoadTime } from './hooks/useLoadTime'
import { formatActionTimestamp } from './hooks/useDate'
import { ActionSheet, ReviewSheet, Button } from './components'
import { HomeScreen, ConversationScreen } from './screens'
import RelationshipScreen from './screens/relationship/RelationshipScreen'
import { BackIcon } from './assets/icons'
import { OWNERS } from './data/owners'
import { petImages } from './assets/images'

const UNIT_LABELS = {
  dog_walking:   'walk',
  drop_in:       'visit',
  doggy_daycare: 'day',
  boarding:      'night',
  house_sitting: 'night',
}

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
  const [scheduleContext, setScheduleContext] = useState(null)
  const [ownerUnits, setOwnerUnits] = useState({})
  const scheduleRef = useRef(null)
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
            onOpenSchedule={(ctx) => {
              const ownerId = getOwner(conversation).id
              setScheduleContext({ ...ctx, units: ownerUnits[ownerId] ?? ctx.units, ownerId })
              navigateTo('schedule', 'forward')
            }}
            onBack={() => navigateTo('home', 'back')}
          />
        )}
        {screen === 'schedule' && scheduleContext && (() => {
          const unitLabel = UNIT_LABELS[scheduleContext.units?.[0]?.serviceId] ?? 'service'
          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
              {/* Header — mirrors conversation header layout */}
              <div style={{ borderBottom: `1px solid ${colors.border}`, boxShadow: shadows.headerShadow, padding: '12px 16px 0', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', minHeight: 62, padding: '8px 0' }}>
                  <div
                    onClick={() => navigateTo('conversation', 'back')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}
                  >
                    <BackIcon />
                  </div>
                  <div style={{ flex: 1, marginLeft: 8, minWidth: 0 }}>
                    <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, lineHeight: 1.5, color: colors.primary, margin: 0 }}>Manage schedule</p>
                    <p style={{ fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.25, color: colors.primary, margin: 0 }}>{scheduleContext.ownerName}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, paddingTop: 12, paddingBottom: 14 }}>
                  <Button variant="primary" style={{ flexShrink: 0 }} onClick={() => scheduleRef.current?.openAdd()}>Add a {unitLabel}</Button>
                  <Button variant="default" style={{ flexShrink: 0 }} onClick={() => scheduleRef.current?.openManage()}>Manage templates</Button>
                </div>
              </div>
              <RelationshipScreen
                ref={scheduleRef}
                initialPets={scheduleContext.pets}
                initialUnits={scheduleContext.units}
                ownerFirstName={scheduleContext.ownerFirstName}
                isIncompleteResolved={!!resolvedCards[`${scheduleContext.ownerId}-incomplete`]}
                onScheduleChange={(text, committedUnits) => {
                  if (committedUnits) setOwnerUnits(prev => ({ ...prev, [scheduleContext.ownerId]: committedUnits }))
                  addLiveEvent(scheduleContext.ownerId, {
                    id: Date.now(),
                    type: 'scheduleChange',
                    text: text.replace('{ts}', formatActionTimestamp()),
                  })
                }}
                onReviewComplete={(resolution, card) => {
                  const ts = formatActionTimestamp()
                  const cardId = `${scheduleContext.ownerId}-incomplete`
                  setResolvedCards(prev => ({ ...prev, [cardId]: { resolution, timestamp: ts } }))
                  addLiveEvent(scheduleContext.ownerId, {
                    id: Date.now(),
                    type: 'resolution',
                    resolution,
                    timestamp: ts,
                    card,
                  })
                }}
              />
            </div>
          )
        })()}
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
