import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { colors, typography, shadows } from '../tokens'
import { BackIcon, MoreIcon, ImageIcon, SendIcon } from '../assets/icons'
import { OWNERS } from '../data/owners'
import { getOwnerRelUnit } from '../data/scheduleData'
import { peopleImages, petImages } from '../assets/images'
import { Button, PetAvatar, BannerBlock, ChatBubble } from '../components'
import { CHAT_HISTORY } from '../data/threads'
import { useAppContext } from '../context/AppContext'

const DayDivider = ({ label }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
    <span style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 14, color: colors.tertiary }}>{label}</span>
  </div>
)

const Gap = ({ h = 12 }) => <div style={{ height: h }} />

export default function ConversationScreen() {
  const { ownerId } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()
  const { liveEvents: allLiveEvents, addLiveEvent, ownerUnits } = useAppContext()

  const owner = OWNERS[ownerId]
  const { card } = state || {}
  const messagesEndRef = useRef(null)
  const [text, setText] = useState('')

  const liveEvents = allLiveEvents[ownerId] ?? []

  const sendMessage = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const now = new Date()
    const h = now.getHours(), m = now.getMinutes()
    const time = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
    addLiveEvent(ownerId, { id: Date.now(), type: 'message', text: trimmed, time })
    setText('')
  }

  const clientName = owner?.name ?? card?.client
  const clientImg  = peopleImages[ownerId] ?? peopleImages.owen

  const conversationPets = ownerId === 'james'
    ? [{ id: 1, name: 'Archie', emoji: '🐕', img: petImages.archie }]
    : ownerId === 'sarah'
      ? [{ id: 1, name: 'Milo', emoji: '🐕', img: petImages.milo }]
      : [{ id: 1, name: 'Koni', emoji: '🐕', img: petImages.koni }, { id: 2, name: 'Burley', emoji: '🐕', img: petImages.burley }]

  const relUnits = owner ? [getOwnerRelUnit(owner, conversationPets.map(p => p.id))] : []

  const handleOpenSchedule = (ctx) => {
    const units = ownerUnits[ownerId] ?? ctx.units
    navigate(`/conversation/${ownerId}/schedule`, {
      state: { ...ctx, units, ownerName: owner?.name ?? '' },
    })
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [ownerId])

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate(-1)}>
            <BackIcon />
            <PetAvatar size={48} images={[clientImg]} />
          </div>
          <div style={{ flex: 1, marginLeft: 8, minWidth: 0 }}>
            <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, lineHeight: 1.5, color: colors.primary, margin: 0 }}>{clientName}</p>
            <p style={{ fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.25, color: colors.success, margin: 0 }}>Ongoing</p>
          </div>
          <div style={{ cursor: 'pointer', flexShrink: 0 }}><MoreIcon /></div>
        </div>
        <div className="hide-scrollbar" style={{ display: 'flex', gap: 8, paddingTop: 12, overflowX: 'auto', paddingBottom: 14 }}>
          <Button variant="primary" style={{ boxShadow: shadows.medium, flexShrink: 0 }}>Leave feedback</Button>
          <Button variant="default" style={{ flexShrink: 0 }} onClick={() => handleOpenSchedule({ pets: conversationPets, units: relUnits, ownerFirstName: owner?.name?.split(' ')[0] ?? '' })}>Manage schedule</Button>
          <Button variant="default" style={{ flexShrink: 0 }}>Details</Button>
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column' }}>

        {(CHAT_HISTORY[ownerId ?? 'owen'] ?? []).map((item, i) => {
          if (item.type === 'divider') return <DayDivider key={i} label={item.label} />
          if (item.type === 'bubble') return <ChatBubble key={i} message={item.text} time={item.time} isOwner={item.isOwner} showCheck={item.showCheck} />
          if (item.type === 'banner') return <BannerBlock key={i} text={item.text} link={item.link} />
          if (item.type === 'gap') return <Gap key={i} h={item.h} />
          return null
        })}

        {/* ── Live events ── */}
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
            return <BannerBlock key={event.id} text={event.text} />
          }
          return null
        })}

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
