import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { colors, typography, shadows, textStyles, radius, layout } from '../tokens'
import { BackIcon, MoreIcon, ImageIcon, SendIcon } from '../assets/icons'
import { peopleImages } from '../assets/images'
import { Button, PetAvatar, BannerBlock, ChatBubble, WEB_NAV_BAR_HEIGHT } from '../components'
import { BookingDetailsPane } from './BookingDetailsScreen'
import { useIsWide } from '../lib/useMediaQuery'
import { useRelationshipData } from '../lib/useRelationshipData'
import { useApp } from '../context/AppContext'
import { OWNERS } from '../data/owners'
import { getChatHistory, getInboxThreads } from '../data/threads'
import { getClient } from '../data/contacts'
import { getOwnerRelUnit } from '../data/scheduleData'
import { getConversationStatusDisplay } from '../lib/threadStatus'
import { MODIFY_BOOKING } from '../data/bookingDetailsCopy'

const fmtDayChange = (c, withDate) => {
  const label = withDate ? `${c.day}, ${c.date}` : c.day
  const addedStr = c.added.length ? `added ${c.added.join(', ')}` : ''
  const removedStr = c.removed.length ? `removed ${c.removed.join(', ')}` : ''
  let detail
  if (addedStr && removedStr) detail = `${addedStr} and ${removedStr}`
  else if (addedStr) detail = addedStr
  else if (removedStr) detail = removedStr
  else detail = 'removed'
  return `${label}: ${detail}`
}

const DayDivider = ({ label }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
    <span style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 14, color: colors.tertiary }}>{label}</span>
  </div>
)

const Gap = ({ h = 12 }) => <div style={{ height: h }} />

export default function ConversationScreen() {
  const navigate = useNavigate()
  const { ownerId, conversationOpk } = useParams()
  const { state } = useLocation()
  const {
    resolvedCards,
    scheduleChanges: scheduleChangesMap,
    templateChanges: templateChangesMap,
    currentWeekChanges: currentWeekChangesMap,
    liveEvents: liveEventsMap,
    ownerUnits,
    scheduleMode,
  } = useApp()

  const isDesktop = useIsWide()

  const type = state?.type ?? 'today'
  const card = state?.card ?? null
  const effectiveOpk = conversationOpk ?? `${ownerId}-conv-recurring`
  const owner = OWNERS[ownerId] ?? (() => {
    const c = getClient(ownerId)
    if (!c) return null
    return { id: c.id, name: c.displayName, image: c.imageUrl, petNames: c.pets.map(p => p.name).join(', '), petImages: c.pets.map(p => p.image), pets: c.pets }
  })()

  const cardId = state?.cardId ?? card?.id
  const resolutionEntry = cardId ? resolvedCards[cardId] : null
  const resolution = resolutionEntry?.resolution
  const timestamp = resolutionEntry?.timestamp

  const scheduleChanges    = scheduleChangesMap[ownerId]    ?? []
  const templateChanges    = templateChangesMap[ownerId]    ?? []
  const currentWeekChanges = currentWeekChangesMap[ownerId] ?? []
  const liveEvents         = liveEventsMap?.[ownerId]       ?? []

  const onBack = () => navigate(-1)

  const onOpenSchedule = () => {
    if (scheduleMode === 'agenda') {
      const pets = owner?.pets ?? []
      const units = ownerUnits[ownerId] ?? [getOwnerRelUnit(owner, pets.map(p => p.id))]
      navigate(`/conversation/${ownerId}/schedule`, {
        state: {
          pets,
          units,
          ownerName: owner?.name ?? '',
          ownerFirstName: owner?.name?.split(' ')[0] ?? '',
        },
      })
    } else {
      navigate(`/conversation/${ownerId}/schedule`)
    }
  }

  const messagesEndRef = useRef(null)
  const [text, setText] = useState('')
  const [sentMessages, setSentMessages] = useState([])
  const [headerHovered, setHeaderHovered] = useState(false)
  const [headerPressed, setHeaderPressed] = useState(false)
  const goToRelationship = () => navigate(`/contacts/${ownerId}`)

  const sendMessage = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const now = new Date()
    const h = now.getHours(), m = now.getMinutes()
    const time = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
    setSentMessages(prev => [...prev, { id: Date.now(), text: trimmed, time }])
    setText('')
  }

  const isToday = type === 'today'
  const clientName = isToday ? owner?.name : card?.client
  const clientImg  = isToday ? owner?.image : peopleImages[card?.clientKey] ?? peopleImages.owen

  // `block: 'nearest'` keeps this from walking up and scrolling the page too:
  // at desktop the thread is a scroller nested inside the page scroller, and the
  // default 'start' would drag the details rail up with every new message. The
  // end marker sits at the bottom of its scroller, so the inner result is
  // identical either way.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
  }, [ownerId, type, cardId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [sentMessages, liveEvents.length])

  const history = getChatHistory(effectiveOpk)

  // The booking behind this conversation. In production every conversation has
  // one, recurring included — each Conversation IS one week
  // (recurring/models.py:238-250) — so `${ownerId}-conv-recurring` now resolves
  // to the client's current-week booking (relationshipData.js
  // buildRecurringWeekBooking) and the Details CTA below stops being disabled.
  // Drives that CTA, which navigates to BookingDetailsScreen (production's
  // /conversations/<opk>/details page).
  const client = getClient(ownerId)
  // Hooks cannot run inside the IIFE below, so the relationship data is read at
  // the top level. `useRelationshipData` folds in the alt-monetization rollout
  // flag so this surface's ledger figures never disagree with the relationship
  // page's (production gates on `is_rollout_alt_monetisation`,
  // views.py:1011-1013).
  const rel = useRelationshipData(ownerId)

  const booking = (() => {
    if (!rel) return null
    const all = [...rel.bookings.upcoming, ...rel.bookings.past, ...rel.bookings.archived]
    return all.find(b => b.conversationOpk === effectiveOpk) ?? null
  })()

  // The schedule CTA forks on recurring-ness, not on a flag — production does
  // the same in one mapper: `modify_btn = ModifyBookingProviderButton if not
  // self.conv.is_recurring else ModifyScheduleProviderButton`
  // (booking_ctas.py:265-267). `ModifyScheduleProviderButton` subclasses
  // `ModifyBookingProviderButton` and only overrides the title
  // (cta_buttons.py:582-583), so both point at the same modify page; the
  // prototype's split is that a recurring conversation gets the schedule
  // surfaces (which `scheduleMode` chooses between, untouched here) and a
  // one-time conversation gets the Modify booking screen, exactly as production
  // falls through when the conversation has no recurring relationship
  // (useConversationActionHandler.ts:428-439).
  //
  // Note `self.conv.is_recurring` — the subject is the **conversation**, not the
  // requester (`recurring_billing_relationship_id is not None` on the
  // conversation itself, conversations/models/conversation.py:632-633). A
  // recurring client still books one-off stays outside the relationship, and
  // each of those is a plain non-recurring conversation that must get "Modify
  // booking". So this reads the resolved booking's own flag rather than
  // `isRecurringClient(client)`, which would wrongly hand owen / james / sarah
  // the schedule surfaces on every thread they have.
  const isRecurring = Boolean(booking?.isRecurring)

  // Resolve the thread for this conversation to derive the header status
  // ("Booking confirmed" / "Booking ongoing" / etc.). Falls back to a synthetic
  // "current" thread for owners with no matching inbox entry.
  const thread = getInboxThreads().find(t => t.conversationOpk === effectiveOpk) ?? { status: 'current' }
  const statusDisplay = getConversationStatusDisplay(thread)

  if (!owner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <p style={{ fontFamily: typography.fontFamily, fontSize: 16, color: colors.primary, margin: 0 }}>Conversation not found</p>
        <Button variant="default" style={{ marginTop: 16 }} onClick={onBack}>Back</Button>
      </div>
    )
  }

  // ── Booking CTAs ──
  // One list, two placements. Below the breakpoint they are the horizontal
  // scroller under the header (ConversationUnderHeaderButtons.tsx:39-48); at
  // desktop they stack full-width in the details rail, because
  // ConversationDetailsActions.tsx:27 returns null when `isSmDown`.
  const feedbackCta = (
    <Button variant="primary" fullWidth={isDesktop} style={{ boxShadow: shadows.medium, flexShrink: 0 }}>Leave feedback</Button>
  )
  const bookingCta = isRecurring ? (
    <Button variant="default" fullWidth={isDesktop} style={{ flexShrink: 0 }} onClick={onOpenSchedule}>
      {scheduleMode === 'agenda' ? 'Manage schedule' : 'Modify schedule'}
    </Button>
  ) : (
    <Button
      variant="default"
      fullWidth={isDesktop}
      style={{ flexShrink: 0 }}
      onClick={() => navigate(`/conversation/${ownerId}/thread/${effectiveOpk}/modify`)}
    >
      {MODIFY_BOOKING}
    </Button>
  )

  const ctaStrip = (
    <div className="hide-scrollbar" style={{ display: 'flex', gap: 8, paddingTop: 12, overflowX: 'auto', paddingBottom: 14, marginBottom: -14 }}>
      {feedbackCta}
      {bookingCta}
      {/* Details has no desktop counterpart — the rail it opens is already on
          screen (message_header.py:198-215). */}
      <Button
        variant="default"
        style={{ flexShrink: 0 }}
        disabled={!booking}
        onClick={() => navigate(`/conversation/${ownerId}/thread/${effectiveOpk}/details`)}
      >
        Details
      </Button>
    </div>
  )

  const railCtas = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {feedbackCta}
      {bookingCta}
    </div>
  )

  const header = (
      <div style={{
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: isDesktop ? 'none' : shadows.headerShadow,
        padding: '12px 16px', flexShrink: 0, zIndex: 3,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 62, padding: '8px 0' }}>
          {/* No back affordance at desktop — ConversationHeader.tsx:86-98 drops it. */}
          {!isDesktop && (
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, marginLeft: -12, cursor: 'pointer', flexShrink: 0 }}
              onClick={onBack}
            >
              <BackIcon />
            </div>
          )}
          <button
            type="button"
            aria-label={`View ${clientName}'s client page`}
            onClick={goToRelationship}
            onMouseEnter={() => setHeaderHovered(true)}
            onMouseLeave={() => { setHeaderHovered(false); setHeaderPressed(false) }}
            onMouseDown={() => setHeaderPressed(true)}
            onMouseUp={() => setHeaderPressed(false)}
            style={{
              background: headerPressed ? colors.bgTertiary : headerHovered ? colors.bgSecondary : 'none',
              border: 0, padding: 0, font: 'inherit', textAlign: 'left',
              flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              minWidth: 0, borderRadius: radius.primary,
            }}
          >
            <PetAvatar size={48} images={[clientImg]} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, lineHeight: 1.5, color: colors.primary, margin: 0, textDecoration: headerHovered ? 'underline' : 'none' }}>{clientName}</p>
              <p style={{ ...textStyles.text100, color: statusDisplay.color, margin: 0 }}>{statusDisplay.label}</p>
            </div>
          </button>
          <div style={{ cursor: 'pointer', flexShrink: 0 }}><MoreIcon /></div>
        </div>
        {!isDesktop && ctaStrip}
      </div>
  )

  const threadPane = (
      <div className="hide-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column' }}>
        {history.map((item, i) => {
          if (item.type === 'divider') return <DayDivider key={`h-${i}`} label={item.label} />
          if (item.type === 'bubble')  return <ChatBubble key={`h-${i}`} message={item.text} time={item.time} isOwner={item.isOwner} showCheck={item.showCheck} />
          if (item.type === 'banner')  return <BannerBlock key={`h-${i}`} text={item.text} link={item.link} />
          if (item.type === 'gap')     return <Gap key={`h-${i}`} h={item.h} />
          return null
        })}

        {/* ── Mode A: change summaries (only render when modification mode populated them) ── */}
        {!isToday && (resolution || scheduleChanges.length > 0 || currentWeekChanges.length > 0 || templateChanges.length > 0) && <DayDivider label="Today" />}
        {resolution === 'completed' && card && <BannerBlock text={`Walk from ${card.dateLabel} was marked as complete on ${timestamp}.`} />}
        {resolution === 'cancelled' && card && <BannerBlock text={`Walk from ${card.dateLabel} was cancelled on ${timestamp}. A refund of ${card.cost} has been processed.`} />}

        {scheduleChanges.length > 0 && (
          <ChatBubble
            message={[
              'I made changes to the upcoming schedule. Here\'s a summary:',
              ...scheduleChanges.map(c => fmtDayChange(c, true)),
            ].join('\n')}
            time="Just now"
            isOwner
            showCheck
          />
        )}

        {templateChanges.map((changes, i) => (
          <ChatBubble
            key={`tpl-${i}`}
            message={[
              'I updated the weekly schedule template. Here\'s a summary:',
              ...changes.map(c => fmtDayChange(c, false)),
            ].join('\n')}
            time="Just now"
            isOwner
            showCheck
          />
        ))}

        {currentWeekChanges.map((changes, i) => (
          <ChatBubble
            key={`cw-${i}`}
            message={[
              'I made changes to this week\'s schedule. Here\'s a summary:',
              ...changes.map(c => fmtDayChange(c, true)),
            ].join('\n')}
            time="Just now"
            isOwner
            showCheck
          />
        ))}

        {/* ── Mode B: agenda live events (messages + scheduleChange + resolution banners) ── */}
        {liveEvents.length > 0 && scheduleChanges.length === 0 && templateChanges.length === 0 && currentWeekChanges.length === 0 && !resolution && <DayDivider label="Today" />}
        {liveEvents.map(event => {
          if (event.type === 'message') {
            return <ChatBubble key={event.id} message={event.text} time={event.time} isOwner showCheck />
          }
          if (event.type === 'resolution') {
            return event.resolution === 'completed'
              ? <BannerBlock key={event.id} text={`Walk from ${event.card?.dateLabel ?? ''} was marked as complete on ${event.timestamp}.`} />
              : <BannerBlock key={event.id} text={`Walk from ${event.card?.dateLabel ?? ''} was cancelled on ${event.timestamp}. A refund of ${event.card?.cost ?? ''} has been processed.`} />
          }
          if (event.type === 'scheduleChange') {
            return <BannerBlock key={event.id} text={event.text} />
          }
          return null
        })}

        {sentMessages.map(msg => (
          <ChatBubble key={msg.id} message={msg.text} time={msg.time} isOwner showCheck />
        ))}

        <div ref={messagesEndRef} />
      </div>
  )

  const composer = (
      <div style={{
        borderTop: `1px solid ${colors.border}`, padding: '8px 12px',
        display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0,
      }}>
        <Button variant="default" icon={<ImageIcon />} />
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Message"
          style={{
            flex: 1,
            height: 44,
            border: `2px solid ${colors.borderInteractive}`,
            borderRadius: 8,
            padding: '0 16px',
            fontFamily: typography.fontFamily,
            fontSize: 16,
            color: colors.primary,
            background: colors.white,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {text.trim() && (
          <Button variant="primary" icon={<SendIcon />} onClick={sendMessage} />
        )}
      </div>
  )

  // ── Desktop: details rail left, thread right ──
  // The page owns the scroll and the rail scrolls with it
  // (ConversationDetailsPage.tsx:27-33); the thread column is the sticky one
  // (ConversationPageContent.tsx:182), so the composer stays on screen while
  // the rail runs past.
  if (isDesktop) {
    const GUTTER = 24
    return (
      <div className="hide-scrollbar" style={{ height: '100%', overflowY: 'auto', background: colors.white }}>
        <div style={{
          maxWidth: layout.contentWidth, margin: '0 auto', padding: GUTTER,
          display: 'flex', alignItems: 'flex-start', gap: GUTTER,
        }}>
          <div style={{
            width: 375, flexShrink: 0,
            border: `1px solid ${colors.border}`, borderRadius: 8,
            padding: `0 ${GUTTER - 8}px`, background: colors.white,
          }}>
            {/* The rail renders under `/conversation/:ownerId` too, where the URL
                carries no opk — hand it the one the thread already resolved. */}
            <BookingDetailsPane opk={effectiveOpk} ctas={railCtas} />
          </div>
          <div style={{
            flex: 1, minWidth: 0,
            position: 'sticky', top: GUTTER,
            height: `calc(100dvh - ${WEB_NAV_BAR_HEIGHT + GUTTER * 2}px)`,
            display: 'flex', flexDirection: 'column',
            border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden',
          }}>
            {header}
            {threadPane}
            {composer}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {header}
      {threadPane}
      {composer}
    </div>
  )
}
