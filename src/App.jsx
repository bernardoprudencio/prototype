import React, { useState } from 'react'
import { colors, typography } from './tokens'
import { useLoadTime } from './hooks/useLoadTime'
import { formatActionTimestamp } from './hooks/useDate'
import { ActionSheet, ReviewSheet } from './components'
import { HomeScreen, ConversationScreen, ScheduleScreen, EditTemplateScreen } from './screens'
import { OWNERS, PROTO_TODAY, getOwnerUpcomingWeeks } from './data/owners'
import { petImages } from './assets/images'

const DAYS_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const nextMonday = () => {
  const d = new Date(PROTO_TODAY)
  const daysUntil = (1 - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + daysUntil + 7)
  return d
}

// Template changes fully override upcoming weeks — regenerate from scratch
const applyTemplateToWeeks = (newTemplate, owner) =>
  getOwnerUpcomingWeeks({ ...owner, template: newTemplate })

export default function App() {
  const [screen, setScreen]         = useState('home')
  const [sheetItem, setSheetItem]   = useState(null)
  const [reviewSheetCard, setReviewSheetCard] = useState(null)
  const [resolvedCards, setResolvedCards] = useState({})
  const [conversation, setConversation]   = useState(null)
  const [transition, setTransition] = useState(false)
  const [direction, setDirection]   = useState('forward')
  const loadTime = useLoadTime()

  // Per-owner template overrides and persisted upcoming weeks
  const [ownerTemplates, setOwnerTemplates]       = useState({})  // { ownerId: [{day, time}] }
  const [ownerWeeks, setOwnerWeeks]               = useState({})  // { ownerId: weeks[] }
  const [ownerSameSchedule, setOwnerSameSchedule] = useState({})  // { ownerId: bool }

  const getEffectiveOwner = (owner) => {
    const tpl = ownerTemplates[owner.id]
    return tpl ? { ...owner, template: tpl } : owner
  }

  const getOwner = (conv) => {
    const base = (!conv || conv.type === 'today')
      ? OWNERS.owen
      : (OWNERS[conv.card?.clientKey] ?? OWNERS.owen)
    return getEffectiveOwner(base)
  }

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

  const handleTemplateSave = (ownerId, { selectedDays, daySchedules, sameSchedule }) => {
    const sortedDays = [...selectedDays].sort((a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b))
    const newTemplate = sortedDays.flatMap(day =>
      (daySchedules[day] || []).map(time => ({ day, time }))
    )

    const owner = OWNERS[ownerId]
    const oldTemplate = ownerTemplates[ownerId] || owner.template

    // Compute diff for conversation message
    const allDays = [...new Set([...oldTemplate.map(t => t.day), ...sortedDays])]
    const templateChanges = allDays.flatMap(day => {
      const oldTimes = oldTemplate.filter(t => t.day === day).map(t => t.time)
      const newTimes = selectedDays.includes(day) ? (daySchedules[day] || []) : []
      const removed = oldTimes.filter(t => !newTimes.includes(t))
      const added   = newTimes.filter(t => !oldTimes.includes(t))
      return (removed.length || added.length) ? [{ day, removed, added }] : []
    })

    const mergedWeeks = applyTemplateToWeeks(newTemplate, owner)

    setOwnerTemplates(prev => ({ ...prev, [ownerId]: newTemplate }))
    setOwnerWeeks(prev => ({ ...prev, [ownerId]: mergedWeeks }))
    setOwnerSameSchedule(prev => ({ ...prev, [ownerId]: sameSchedule }))
    setConversation(prev => prev ? { ...prev, templateChanges: [...(prev.templateChanges || []), templateChanges] } : prev)
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
            initialWeeks={ownerWeeks[getOwner(conversation).id]}
            onWeeksChange={(currentWeeks) => {
              const ownerId = getOwner(conversation).id
              setOwnerWeeks(prev => ({ ...prev, [ownerId]: currentWeeks }))
            }}
            onBack={(savedChanges) => {
              if (savedChanges?.length) {
                setConversation(prev => ({ ...prev, scheduleChanges: savedChanges }))
              }
              navigateTo('conversation', 'back')
            }}
            onEditTemplate={() => navigateTo('edit-template', 'forward')}
          />
        )}
        {screen === 'edit-template' && (
          <EditTemplateScreen
            owner={getOwner(conversation)}
            initialSameSchedule={ownerSameSchedule[getOwner(conversation).id] ?? false}
            startDate={nextMonday()}
            sublabel="Changes here affect all future weeks."
            onSave={(templateData) => {
              handleTemplateSave(getOwner(conversation).id, templateData)
            }}
            onBack={() => navigateTo('schedule', 'back')}
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
