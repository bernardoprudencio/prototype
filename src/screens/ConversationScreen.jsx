import React, { useState, useEffect, useRef } from 'react'
import { colors, typography, shadows } from '../tokens'
import { BackIcon, MoreIcon, ImageIcon, SendIcon } from '../assets/icons'
import { peopleImages } from '../assets/images'
import { Button, PetAvatar, BannerBlock, ChatBubble } from '../components'

const DayDivider = ({ label }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
    <span style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 14, color: colors.tertiary }}>{label}</span>
  </div>
)

const Gap = ({ h = 12 }) => <div style={{ height: h }} />

export default function ConversationScreen({ onBack, onModifySchedule, conversation }) {
  const { type, card, resolution, timestamp, scheduleChanges, templateChanges } = conversation || {}
  const messagesEndRef = useRef(null)
  const [text, setText] = useState('')
  const [sentMessages, setSentMessages] = useState([])

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
  const clientName = isToday ? 'Owen O.' : card?.client
  const clientImg  = isToday ? peopleImages.owen : peopleImages[card?.clientKey] ?? peopleImages.owen

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [conversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sentMessages])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {/* ─── Header ─── */}
      <div style={{
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: shadows.headerShadow,
        padding: '12px 16px', flexShrink: 0, zIndex: 3,
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
          <Button variant="default" style={{ flexShrink: 0 }} onClick={onModifySchedule}>Modify schedule</Button>
          <Button variant="default" style={{ flexShrink: 0 }}>Details</Button>
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column' }}>

        {/* ── Owen · Koni & Burley · Today's walk ── */}
        {isToday && (
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
        {!isToday && card?.id === 'archie' && (
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
            {(resolution || scheduleChanges?.length > 0) && <DayDivider label="Today" />}
            {resolution === 'completed' && <BannerBlock text={`Walk from ${card.dateLabel} was marked as complete on ${timestamp}.`} />}
            {resolution === 'cancelled' && <BannerBlock text={`Walk from ${card.dateLabel} was cancelled on ${timestamp}. A refund of ${card.cost} has been processed.`} />}
          </>
        )}

        {/* ── Sarah · Milo · Overdue walk from Mar 12 ── */}
        {!isToday && card?.id === 'koni-late' && (
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

            {(resolution || scheduleChanges?.length > 0) && <DayDivider label="Today" />}
            {resolution === 'completed' && <BannerBlock text={`Walk from ${card.dateLabel} was marked as complete on ${timestamp}.`} />}
            {resolution === 'cancelled' && <BannerBlock text={`Walk from ${card.dateLabel} was cancelled on ${timestamp}. A refund of ${card.cost} has been processed.`} />}
          </>
        )}

        {/* ── Schedule update message — no divider, already placed above ── */}
        {scheduleChanges?.length > 0 && (
          <ChatBubble
            message={[
              'I made changes to the upcoming schedule. Here\'s a summary:',
              ...scheduleChanges.map(c => {
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
        )}

        {templateChanges?.length > 0 && !scheduleChanges?.length && !resolution && <DayDivider label="Today" />}
        {templateChanges?.map((changes, i) => (
          <ChatBubble
            key={i}
            message={[
              'I updated the weekly schedule template. Here\'s a summary:',
              ...changes.map(c => {
                const parts = []
                c.removed.forEach(t => parts.push(`${c.day}: removed ${t}`))
                c.added.forEach(t => parts.push(`${c.day}: added ${t}`))
                if (!c.removed.length && !c.added.length) parts.push(`${c.day}: removed`)
                return parts.join('\n')
              }),
            ].join('\n')}
            time="Just now"
            isOwner
            showCheck
          />
        ))}

        {sentMessages.map(msg => (
          <ChatBubble key={msg.id} message={msg.text} time={msg.time} isOwner showCheck />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Composer ─── */}
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
    </div>
  )
}
