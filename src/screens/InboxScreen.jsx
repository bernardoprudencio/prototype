import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, typography, spacing } from '../tokens'
import TabBar from '../components/TabBar'
import Chip from '../components/Chip'
import ThreadRow from '../components/ThreadRow'
import { DropdownIcon } from '../assets/icons'
import { OWNERS } from '../data/owners'
import { INBOX_THREADS } from '../data/threads'
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
    case 'archived': return threads.filter(t => t.status === 'archived')
    default:         return threads.filter(t => t.status === filterId)
  }
}


export default function InboxScreen() {
  const navigate = useNavigate()
  const { liveEvents } = useAppContext()
  const [activeFilter, setActiveFilter] = useState('primary')
  const filtered = applyFilter(INBOX_THREADS, activeFilter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>

      {/* ── Header (no bottom border — border lives below chips) ── */}
      <div style={{
        padding: '24px 16px 12px',
        flexShrink: 0,
        background: colors.white,
      }}>
        <h1 style={{
          fontFamily: typography.displayFamily,
          fontSize: 26,
          fontWeight: 600,
          lineHeight: 1.25,
          color: colors.primary,
          margin: 0,
        }}>Inbox</h1>
      </div>

      {/* ── Filter chips — full row scrollable with internal divider ── */}
      <div className="hide-scrollbar" style={{
        display: 'flex',
        alignItems: 'center',
        background: colors.white,
        flexShrink: 0,
        overflowX: 'auto',
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
            <Chip key={f.id} label={f.label} selected={activeFilter === f.id} checkmark onClick={() => setActiveFilter(f.id)} />
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
            <Chip key={f.id} label={f.label} selected={activeFilter === f.id} checkmark onClick={() => setActiveFilter(f.id)} />
          ))}
        </div>
      </div>

      {/* ── Sorted by row — border below, no border above ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        padding: `${spacing.md}px ${spacing.lg}px`,
        borderBottom: `1px solid ${colors.border}`,
        background: colors.white,
        flexShrink: 0,
      }}>
        <DropdownIcon />
        <span style={{
          fontFamily: typography.fontFamily,
          fontWeight: 600,
          fontSize: 14,
          lineHeight: 1.25,
          color: colors.secondary,
        }}>Sorted by recent activity</span>
      </div>

      {/* ── Thread list ── */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: spacing.xl,
          }}>
            <p style={{
              fontFamily: typography.fontFamily,
              fontSize: 14,
              color: colors.tertiary,
              textAlign: 'center',
              margin: 0,
            }}>No conversations</p>
          </div>
        ) : filtered.map((thread) => {
          const owner = OWNERS[thread.ownerId]
          if (!owner) return null

          const ownerLiveEvents = liveEvents[thread.ownerId] ?? []
          const lastLive = [...ownerLiveEvents].reverse().find(e => e.type === 'message')
          const displayMessage = lastLive
            ? { text: lastLive.text, sender: 'you', timestamp: 'Today' }
            : thread.lastMessage

          return (
            <ThreadRow
              key={thread.ownerId}
              thread={thread}
              owner={owner}
              displayMessage={displayMessage}
              onClick={() => navigate(`/conversation/${owner.id}`, { state: { type: 'today' } })}
            />
          )
        })}
      </div>

      {/* ── Tab bar ── */}
      <TabBar />
    </div>
  )
}
