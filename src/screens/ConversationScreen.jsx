import React, { useState, useEffect, useRef } from 'react'
import { colors, typography, shadows } from '../tokens'
import { BackIcon, MoreIcon, ImageIcon, SendIcon } from '../assets/icons'
import { peopleImages, petImages } from '../assets/images'
import { Button, PetAvatar, BannerBlock, ChatBubble } from '../components'
import { useApp } from '../context/AppContext'
import { CHAT_HISTORY } from '../data/threads'
import { getOwnerRelUnit } from '../data/scheduleData'
import RelationshipManagement from './relationship/RelationshipManagement'

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

// Pets per owner — used by the inline Schedule tab's RelationshipManagement.
const ownerPets = (ownerId) => {
  if (ownerId === 'james') return [{ id: 1, name: 'Archie', emoji: '🐕', img: petImages.archie }]
  if (ownerId === 'sarah') return [{ id: 1, name: 'Milo',   emoji: '🐕', img: petImages.milo }]
  return [
    { id: 1, name: 'Koni',   emoji: '🐕', img: petImages.koni },
    { id: 2, name: 'Burley', emoji: '🐕', img: petImages.burley },
  ]
}

export default function ConversationScreen({ onBack, onOpenSchedule, conversation, owner, liveEvents = [], onLiveEvent }) {
  const { type, card } = conversation || {}
  const ownerId = owner?.id

  const {
    resolvedCards,
    scheduleChanges: scheduleChangesMap,
    templateChanges: templateChangesMap,
    currentWeekChanges: currentWeekChangesMap,
    scheduleMode,
  } = useApp()

  const cardId = card?.id
  const resolutionEntry = cardId ? resolvedCards[cardId] : null
  const resolution = resolutionEntry?.resolution
  const timestamp  = resolutionEntry?.timestamp

  const scheduleChanges    = scheduleChangesMap[ownerId]    ?? []
  const templateChanges    = templateChangesMap[ownerId]    ?? []
  const currentWeekChanges = currentWeekChangesMap[ownerId] ?? []

  const messagesEndRef = useRef(null)
  const [tab, setTab] = useState('messages')
  const [text, setText] = useState('')

  // Schedule tab is the agenda flow (Mode B). In modification mode (Mode A),
  // hide the tabs and surface the legacy header button → ScheduleScreen overlay.
  const showTabs   = scheduleMode === 'agenda'
  const activeTab  = showTabs ? tab : 'messages'

  const sendMessage = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const now = new Date()
    const h = now.getHours(), m = now.getMinutes()
    const time = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
    onLiveEvent({ id: Date.now(), type: 'message', text: trimmed, time })
    setText('')
  }

  const isToday    = type === 'today'
  const clientName = isToday ? owner?.name  : card?.client
  const clientImg  = isToday ? owner?.image : peopleImages[card?.clientKey] ?? peopleImages.owen

  const conversationPets = ownerPets(ownerId)
  const relUnits         = owner ? [getOwnerRelUnit(owner, conversationPets.map(p => p.id))] : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [conversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [liveEvents])

  const history = ownerId ? (CHAT_HISTORY[ownerId] ?? []) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {/* ─── Header ─── */}
      <div style={{
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: shadows.headerShadow,
        padding: showTabs ? '12px 16px 0' : '12px 16px',
        flexShrink: 0, zIndex: 3,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 62, padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }} onClick={onBack}>
            <BackIcon />
            <PetAvatar size={48} images={[clientImg]} />
          </div>
          <div style={{ flex: 1, marginLeft: 8, minWidth: 0 }}>
            <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, lineHeight: 1.5, color: colors.primary, margin: 0 }}>{clientName}</p>
            <p style={{ fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.25, color: colors.success, margin: 0 }}>Ongoing</p>
          </div>
          <div style={{ cursor: 'pointer', flexShrink: 0 }}><MoreIcon /></div>
        </div>

        <div className="hide-scrollbar" style={{ display: 'flex', gap: 8, paddingTop: 12, overflowX: 'auto', paddingBottom: 14, marginBottom: -14 }}>
          <Button variant="primary" style={{ boxShadow: shadows.medium, flexShrink: 0 }}>Leave feedback</Button>
          {!showTabs && (
            <Button variant="default" style={{ flexShrink: 0 }} onClick={onOpenSchedule}>Modify schedule</Button>
          )}
          <Button variant="default" style={{ flexShrink: 0 }}>Details</Button>
        </div>

        {showTabs && (
          <div style={{ display: 'flex', marginTop: 14 }}>
            {[['messages', 'Messages'], ['schedule', 'Schedule']].map(([id, label]) => (
              <Button key={id} variant="flat" onClick={() => setTab(id)} style={{
                flex: 1, borderRadius: 0, padding: '11px 0', flexShrink: 1,
                color: tab === id ? colors.link : colors.tertiary,
                border: 'none', borderBottom: `2.5px solid ${tab === id ? colors.link : 'transparent'}`,
              }}>{label}</Button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Schedule tab (agenda mode) ─── */}
      {activeTab === 'schedule' && (
        <RelationshipManagement
          showFullHistory
          inlineFooter
          initialPets={conversationPets}
          initialUnits={relUnits}
          onScheduleChange={(t) => onLiveEvent({ id: Date.now(), type: 'scheduleChange', text: t })}
        />
      )}

      {/* ─── Messages ─── */}
      {activeTab === 'messages' && (
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column' }}>
          {history.map((item, i) => {
            if (item.type === 'divider') return <DayDivider key={`h-${i}`} label={item.label} />
            if (item.type === 'bubble')  return <ChatBubble key={`h-${i}`} message={item.text} time={item.time} isOwner={item.isOwner} showCheck={item.showCheck} />
            if (item.type === 'banner')  return <BannerBlock key={`h-${i}`} text={item.text} link={item.link} />
            if (item.type === 'gap')     return <Gap key={`h-${i}`} h={item.h} />
            return null
          })}

          {/* ── Mode A: change summaries (modification flow) ── */}
          {!isToday && (resolution || scheduleChanges.length > 0 || templateChanges.length > 0 || currentWeekChanges.length > 0) && <DayDivider label="Today" />}
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

          {/* ── Mode B: agenda live events (messages, resolutions, scheduleChange bubbles) ── */}
          {liveEvents.length > 0
            && scheduleChanges.length === 0
            && templateChanges.length === 0
            && currentWeekChanges.length === 0
            && !resolution && <DayDivider label="Today" />}

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
              if (event.text) {
                return <ChatBubble key={event.id} message={event.text} time="Just now" isOwner showCheck />
              }
              if (event.changes) {
                return (
                  <ChatBubble
                    key={event.id}
                    message={[
                      'I made changes to the upcoming schedule. Here\'s a summary:',
                      ...event.changes.map(c => {
                        const parts = []
                        c.removed.forEach(t => parts.push(`${c.day}, ${c.date}: removed ${t}`))
                        c.added.forEach(t => parts.push(`${c.day}, ${c.date}: added ${t}`))
                        if (!c.removed.length && !c.added.length) parts.push(`${c.day}, ${c.date}: removed`)
                        return parts.join('\n')
                      }),
                    ].join('\n')}
                    time="Just now"
                    isOwner
                    showCheck
                  />
                )
              }
              return null
            }
            return null
          })}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ─── Composer ─── */}
      {activeTab === 'messages' && (
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
      )}
    </div>
  )
}
