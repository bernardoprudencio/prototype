import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, spacing, textStyles, typography } from '../tokens'
import TabBar from '../components/TabBar'
import Chip from '../components/Chip'
import ThreadRow from '../components/ThreadRow'
import { DropdownIcon } from '../assets/icons'
import { getClient } from '../data/contacts'
import { getInboxThreads } from '../data/threads'
import { useAppContext } from '../context/AppContext'

// Filter definitions
// Primary = all except archived; others filter by status or special fields
const FILTER_LEFT = [
  { id: 'primary', label: 'Primary' },
  { id: 'unread',  label: 'Unread' },
]
const FILTER_RIGHT = [
  { id: 'pending',  label: 'Pending' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'current',  label: 'Current' },
  { id: 'past',     label: 'Past' },
  { id: 'archived', label: 'Archived' },
]

function applyFilter(threads, filterId) {
  switch (filterId) {
    case 'primary':  return threads.filter(t => t.status !== 'archived')
    case 'unread':   return threads.filter(t => t.unread)
    case 'current':  return threads.filter(t => t.status === 'current' || t.status === 'active')
    case 'archived': return threads.filter(t => t.status === 'archived')
    default:         return threads.filter(t => t.status === filterId)
  }
}


export default function InboxScreen() {
  const navigate = useNavigate()
  const { liveEvents } = useAppContext()
  const [activeFilter, setActiveFilter] = useState('primary')
  const allThreads = useMemo(() => getInboxThreads(), [])
  const filtered = applyFilter(allThreads, activeFilter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>

      {/* ── Header (matches Contacts header) ── */}
      <div style={{ borderBottom: `1px solid ${colors.border}`, padding: '24px 16px 16px', flexShrink: 0 }}>
        <h1 style={{
          fontFamily: typography.displayFamily, fontWeight: 600, fontSize: 26,
          lineHeight: 1.25, color: colors.primary, margin: 0,
        }}>
          Inbox
        </h1>
      </div>

      {/* ── Scrollable region: chips + sorted row + thread list ── */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Filter chips — full row horizontally scrollable */}
        <div className="hide-scrollbar" style={{
          display: 'flex',
          alignItems: 'center',
          background: colors.white,
          overflowX: 'auto',
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
        }}>
          {/* Left group: Primary + Unread — right border scrolls with content */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `0 ${spacing.lg}px`,
            borderRight: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}>
            {FILTER_LEFT.map(f => (
              <Chip key={f.id} size="small" label={f.label} selected={activeFilter === f.id} checkmark onClick={() => setActiveFilter(f.id)} />
            ))}
          </div>

          {/* Right group: status chips */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `0 ${spacing.lg}px`,
            flexShrink: 0,
          }}>
            {FILTER_RIGHT.map(f => (
              <Chip key={f.id} size="small" label={f.label} selected={activeFilter === f.id} checkmark onClick={() => setActiveFilter(f.id)} />
            ))}
          </div>
        </div>

        {/* Sorted by row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          padding: `${spacing.md}px ${spacing.lg}px`,
          borderBottom: `1px solid ${colors.border}`,
          background: colors.white,
        }}>
          <DropdownIcon />
          <span style={{
            ...textStyles.heading100,
            color: colors.secondary,
          }}>Sorted by recent activity</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: spacing.xl,
          }}>
            <p style={{
              ...textStyles.text100,
              color: colors.tertiary,
              textAlign: 'center',
              margin: 0,
            }}>No conversations</p>
          </div>
        ) : filtered.map((thread) => {
          const client = getClient(thread.ownerId)
          if (!client) return null

          const owner = {
            id: client.id,
            name: client.displayName,
            image: client.imageUrl,
            petNames: client.pets.map(p => p.name).join(', '),
            petImages: client.pets.map(p => p.image),
          }

          const ownerLiveEvents = !thread.bookingId ? (liveEvents[thread.ownerId] ?? []) : []
          const lastLive = [...ownerLiveEvents].reverse().find(e => e.type === 'message')
          const displayMessage = lastLive
            ? { text: lastLive.text, sender: 'you', timestamp: 'Today' }
            : thread.lastMessage

          return (
            <ThreadRow
              key={thread.conversationOpk}
              thread={thread}
              owner={owner}
              displayMessage={displayMessage}
              onClick={() => {
                if (thread.bookingId) {
                  navigate(`/conversation/${thread.ownerId}/booking/${thread.conversationOpk}`, { state: { type: 'today' } })
                } else {
                  navigate(`/conversation/${thread.ownerId}`, { state: { type: 'today' } })
                }
              }}
            />
          )
        })}
      </div>

      {/* ── Tab bar ── */}
      <TabBar activeTab="inbox" onTabSelect={(id) => {
        const path = { home: '/', inbox: '/inbox', rebook: '/contacts', more: '/more' }[id]
        if (path) navigate(path)
      }} />
    </div>
  )
}
