import React, { useState, useEffect, useRef } from 'react'
import { colors, typography, shadows } from '../tokens'
import { BackIcon, MoreIcon, ImageIcon, SendIcon } from '../assets/icons'
import { getOwnerRelUnit } from '../data/owners'
import { peopleImages, petImages } from '../assets/images'
import { Button, PetAvatar, BannerBlock, ChatBubble } from '../components'
import RelationshipScreen from './RelationshipScreen'

const DayDivider = ({ label }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
    <span style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 14, color: colors.tertiary }}>{label}</span>
  </div>
)

const Gap = ({ h = 12 }) => <div style={{ height: h }} />

export default function ConversationScreen({ onBack, conversation, owner, liveEvents = [], onLiveEvent }) {
  const { type, card } = conversation || {}
  const messagesEndRef = useRef(null)
  const [tab, setTab] = useState('messages')
  const [text, setText] = useState('')

  const sendMessage = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const now = new Date()
    const h = now.getHours(), m = now.getMinutes()
    const time = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
    onLiveEvent({ id: Date.now(), type: 'message', text: trimmed, time })
    setText('')
  }

  const isToday = type === 'today'
  const clientName = isToday ? 'Owen O.' : card?.client
  const clientImg  = isToday ? peopleImages.owen : peopleImages[card?.clientKey] ?? peopleImages.owen

  const conversationPets = isToday || card?.clientKey === 'owen'
    ? [{ id: 1, name: 'Koni', emoji: '🐕', img: petImages.koni }, { id: 2, name: 'Burley', emoji: '🐕', img: petImages.burley }]
    : card?.clientKey === 'james'
      ? [{ id: 1, name: 'Archie', emoji: '🐕', img: petImages.archie }]
      : [{ id: 1, name: 'Milo', emoji: '🐕', img: petImages.milo }]

  const relUnits = owner ? [getOwnerRelUnit(owner, conversationPets.map(p => p.id))] : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [conversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [liveEvents])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {/* ─── Header ─── */}
      <div style={{
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: shadows.headerShadow,
        padding: '12px 16px 0', flexShrink: 0, zIndex: 3,
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
<Button variant="default" style={{ flexShrink: 0 }}>Details</Button>
        </div>

        {/* ─── Tab bar ─── */}
        <div style={{ display: 'flex', marginTop: 14 }}>
          {[['messages', 'Messages'], ['schedule', 'Schedule']].map(([id, label]) => (
            <Button key={id} variant="flat" onClick={() => setTab(id)} style={{
              flex: 1, borderRadius: 0, padding: '11px 0', flexShrink: 1,
              color: tab === id ? colors.link : colors.tertiary,
              border: 'none', borderBottom: `2.5px solid ${tab === id ? colors.link : 'transparent'}`,
            }}>{label}</Button>
          ))}
        </div>
      </div>

      {/* ─── Schedule tab ─── */}
      {tab === 'schedule' && <RelationshipScreen initialPets={conversationPets} initialUnits={relUnits} />}

      {/* ─── Messages ─── */}
      {tab === 'messages' && <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column' }}>

        {/* ── Owen · Koni & Burley · Today's walk ── */}
        {(isToday || card?.clientKey === 'owen') && (
          <>
            <DayDivider label="Yesterday" />
            <ChatBubble message="Hey! Are we still on for tomorrow at 9?" time="4:32 PM" />
            <ChatBubble message="Absolutely! See you then 🐾" time="4:35 PM" isOwner showCheck />

            <DayDivider label="Today" />
            <ChatBubble message="Morning! Leashes are on the hook by the door. Burley's been a bit hyper today 😄" time="8:52 AM" />
            <ChatBubble message="On my way! Be there in a few." time="8:55 AM" isOwner showCheck />
            <Gap />
            <BannerBlock text="Walk started at 9:04 AM, Mar 19" link="See Rover Card" />
            <Gap />
            <ChatBubble message="Both doing great! Koni's leading the way and Burley found a stick he absolutely won't let go of 😂" time="9:28 AM" isOwner showCheck />
            <ChatBubble message="Haha that's so Burley. Thank you for the update!" time="9:31 AM" />
            <Gap h={4} />
            <BannerBlock text="Walk ended at 10:01 AM, Mar 19" link="See Rover Card" />
            <Gap />
            <ChatBubble message="They look completely worn out, thank you! 🐾" time="10:05 AM" />
            <ChatBubble message="Ha! They definitely earned it. See you next week!" time="10:07 AM" isOwner showCheck />
          </>
        )}

        {/* ── James · Archie · Yesterday's missed walk ── */}
        {!isToday && card?.clientKey === 'james' && (
          <>
            <DayDivider label="Yesterday" />
            <ChatBubble message="Hey! Are you still on for noon today?" time="11:30 AM" />
            <ChatBubble message="Yes! Heading over around 11:55." time="11:32 AM" isOwner showCheck />
            <ChatBubble message="Just a heads up — Archie gets a bit shy with strangers at first" time="11:45 AM" />
            <ChatBubble message="Good to know, I'll take it slow with him 🐾" time="11:48 AM" isOwner showCheck />
            <ChatBubble message="He warms up fast once he's outside. The trail behind the building is his favorite" time="11:51 AM" />
            <Gap h={16} />
            <BannerBlock text="Walk started at 12:02 PM, Mar 18" link="See Rover Card" />
            <Gap h={24} />
            <BannerBlock text="Walk ended at 12:31 PM, Mar 18" link="See Rover Card" />
            <Gap h={16} />
            <ChatBubble message="Thanks! How did he do?" time="1:15 PM" />
            <ChatBubble message="He was great once he warmed up! Really loved sniffing around the trail" time="1:18 PM" isOwner showCheck />
            <ChatBubble message="Ha, that sounds exactly like him. Thanks again!" time="1:20 PM" />
          </>
        )}

        {/* ── Sarah · Milo · Overdue walk from Mar 12 ── */}
        {!isToday && card?.clientKey === 'sarah' && (
          <>
            <DayDivider label="Mar 12" />
            <ChatBubble message="Hi! Quick note — Milo's leash is in the basket by the front door" time="3:42 PM" />
            <ChatBubble message="Perfect, heading over now!" time="3:45 PM" isOwner showCheck />
            <ChatBubble message="He loves the park on Cedar St if you have time 🐾" time="3:47 PM" />
            <ChatBubble message="We'll definitely head there!" time="3:48 PM" isOwner showCheck />
            <Gap h={16} />
            <BannerBlock text="Walk started at 4:03 PM, Mar 12" link="See Rover Card" />
            <Gap h={24} />
            <BannerBlock text="Walk ended at 4:33 PM, Mar 12" link="See Rover Card" />
            <Gap h={16} />
            <ChatBubble message="Thank you! Was he a good boy?" time="5:01 PM" />
            <ChatBubble message="He was amazing! Made a few friends at the park 🐾" time="5:04 PM" isOwner showCheck />
            <ChatBubble message="Oh that makes me so happy, thank you!" time="5:06 PM" />

            <DayDivider label="Mar 13" />
            <ChatBubble message="Hi! Just checking in — I didn't get a Rover Card notification. Was one started?" time="10:12 AM" />

          </>
        )}

        {/* ── Live events: resolutions, schedule changes, sent messages — in order ── */}
        {liveEvents.length > 0 && <DayDivider label="Today" />}
        {liveEvents.map(event => {
          if (event.type === 'message') {
            return <ChatBubble key={event.id} message={event.text} time={event.time} isOwner showCheck />
          }
          if (event.type === 'resolution') {
            return event.resolution === 'completed'
              ? <BannerBlock key={event.id} text={`Walk from ${event.card.dateLabel} was marked as complete on ${event.timestamp}.`} />
              : <BannerBlock key={event.id} text={`Walk from ${event.card.dateLabel} was cancelled on ${event.timestamp}. A refund of ${event.card.cost} has been processed.`} />
          }
          if (event.type === 'scheduleChange') {
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
        })}

        <div ref={messagesEndRef} />
      </div>}

      {/* ─── Composer ─── */}
      {tab === 'messages' && <div style={{
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
      </div>}
    </div>
  )
}
