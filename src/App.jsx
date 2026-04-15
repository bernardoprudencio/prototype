import React, { useState } from 'react'
import { colors, typography } from './tokens'
import { useLoadTime } from './hooks/useLoadTime'
import { formatActionTimestamp } from './hooks/useDate'
import { ActionSheet, ReviewSheet } from './components'
import { HomeScreen, ConversationScreen, ScheduleScreen, EditTemplateScreen, CurrentWeekScreen, CalendarScreen, AvailabilityScreen } from './screens'
import GoogleCalendarFlow from './screens/GoogleCalendarFlow'
import { OWNERS, PROTO_TODAY, getOwnerUpcomingWeeks, getOwnerCurrentWeekSlots, getFullCurrentWeekSlots } from './data/owners'
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
  const [transition, setTransition]     = useState(false)
  const [direction, setDirection]       = useState('forward')
  const [screenHistory, setScreenHistory] = useState([])
  const loadTime = useLoadTime()

  // Per-owner template overrides and persisted upcoming weeks
  const [ownerTemplates, setOwnerTemplates]       = useState({})  // { ownerId: [{day, time}] }
  const [ownerWeeks, setOwnerWeeks]               = useState({})  // { ownerId: weeks[] }
  const [ownerSameSchedule, setOwnerSameSchedule] = useState({})  // { ownerId: bool }
  const [ownerCurrentWeeks, setOwnerCurrentWeeks] = useState({})  // { ownerId: days[] }

  const [gcalFlow, setGcalFlow]         = useState(null)   // null | 'sheet' | 'oauth' | 'picker' | 'success'
  const [gcalConnected, setGcalConnected] = useState(false)
  const [gcalCalendar, setGcalCalendar]   = useState('Personal')
  const [calendarAlert, setCalendarAlert] = useState(false)

  const getEffectiveOwner = (owner) => {
    const tpl = ownerTemplates[owner.id]
    return tpl ? { ...owner, template: tpl } : owner
  }

  const getOwner = (conv) => {
    const base = !conv
      ? OWNERS.owen
      : conv.type === 'today'
        ? (conv.owner ?? OWNERS.owen)
        : (OWNERS[conv.card?.clientKey] ?? OWNERS.owen)
    return getEffectiveOwner(base)
  }

  const navigateTo = (target, dir = 'forward') => {
    if (dir === 'forward') {
      setScreenHistory(prev => [...prev, screen])
    }
    setDirection(dir)
    setTransition(true)
    setTimeout(() => {
      setScreen(target)
      setTransition(false)
    }, 200)
  }

  const goBack = () => {
    const prev = screenHistory[screenHistory.length - 1] ?? 'home'
    setScreenHistory(h => h.slice(0, -1))
    setDirection('back')
    setTransition(true)
    setTimeout(() => {
      setScreen(prev)
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

  const handleCurrentWeekSave = (ownerId, diff, updatedDays) => {
    setOwnerCurrentWeeks(prev => ({ ...prev, [ownerId]: updatedDays }))
    setConversation(prev => prev ? {
      ...prev,
      currentWeekChanges: [...(prev.currentWeekChanges || []), diff],
    } : prev)
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
            ownerCurrentWeeks={ownerCurrentWeeks}
            onOpenActionSheet={openIncompleteSheet}
            onOpenReviewSheet={(card) => setReviewSheetCard(card)}
            onOpenTodaySheet={openTodaySheet}
            onNavigateConversation={(walk) => {
              setConversation({ type: 'today', owner: walk.owner })
              navigateTo('conversation', 'forward')
            }}
            onNavigateToCard={(card) => {
              setConversation({ type: 'incomplete', card })
              navigateTo('conversation', 'forward')
            }}
            onTabChange={(tab) => { if (tab === 'calendar') navigateTo('calendar', 'forward') }}
          />
        )}
        {screen === 'calendar' && (
          <CalendarScreen
            onTabChange={(tab) => { if (tab === 'home') navigateTo('home', 'back') }}
            onOpenAvailability={() => navigateTo('availability', 'forward')}
            showAlert={calendarAlert}
            onAlertDismiss={() => setCalendarAlert(false)}
          />
        )}
        {screen === 'availability' && (
          <AvailabilityScreen
            onBack={() => { setCalendarAlert(true); goBack() }}
            onGoogleCalendar={() => setGcalFlow('sheet')}
            gcalConnected={gcalConnected}
            gcalCalendar={gcalCalendar}
            onDisconnect={() => { setGcalConnected(false); setGcalCalendar('Personal') }}
          />
        )}
        {screen === 'conversation' && (
          <ConversationScreen
            conversation={conversation}
            onBack={() => goBack()}
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
              goBack()
            }}
            currentWeekDays={ownerCurrentWeeks[getOwner(conversation).id] ?? null}
            onEditTemplate={() => navigateTo('edit-template', 'forward')}
            onManageCurrentWeek={() => navigateTo('current-week', 'forward')}
          />
        )}
        {screen === 'current-week' && (
          <CurrentWeekScreen
            owner={getOwner(conversation)}
            initialDays={
              ownerCurrentWeeks[getOwner(conversation).id] ??
              getFullCurrentWeekSlots(OWNERS[getOwner(conversation).id])
            }
            onSave={(diff, updatedDays) => {
              handleCurrentWeekSave(getOwner(conversation).id, diff, updatedDays)
            }}
            onBack={() => goBack()}
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
            onBack={() => goBack()}
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
        onReschedule={() => {
          const owner = sheetItem.owner
          setSheetItem(null)
          setConversation({ type: 'today', owner })
          setTimeout(() => navigateTo('current-week', 'forward'), 200)
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

      <GoogleCalendarFlow
        step={gcalFlow}
        selectedCalendar={gcalCalendar}
        onSelectCalendar={setGcalCalendar}
        onDismiss={(nextStep) => setGcalFlow(nextStep)}
        onComplete={() => { setGcalConnected(true); setGcalFlow(null) }}
      />
    </div>
  )
}
