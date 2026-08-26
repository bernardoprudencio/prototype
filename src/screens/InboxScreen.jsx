import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors, spacing, textStyles, typography, layout } from '../tokens'
import TabBar from '../components/TabBar'
import Chip from '../components/Chip'
import ThreadRow from '../components/ThreadRow'
import { DropdownIcon } from '../assets/icons'
import { getClient } from '../data/contacts'
import { getInboxThreads } from '../data/threads'
import { useAppContext } from '../context/AppContext'
import { useIsWide } from '../lib/useMediaQuery'
import { TAB_PATHS } from '../lib/tabPaths'

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

const FILTERS = [...FILTER_LEFT, ...FILTER_RIGHT]

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
  const isDesktop = useIsWide()

  // The filter lives in the URL, as it does in production
  // (useWebState.ts:10-20), so /inbox/past deep-links to the Past folder. A
  // bare /inbox resolves to Primary without redirecting, which keeps every
  // existing link to /inbox working.
  const { slug } = useParams()
  const activeFilter = FILTERS.some(f => f.id === slug) ? slug : 'primary'
  const setActiveFilter = (id) => navigate(`/inbox/${id}`)

  const allThreads = useMemo(() => getInboxThreads(), [])
  const filtered = applyFilter(allThreads, activeFilter)

  const chip = (f) => (
    <Chip key={f.id} size="small" label={f.label} selected={activeFilter === f.id} checkmark onClick={() => setActiveFilter(f.id)} />
  )

  const header = (
      <div style={{
        borderBottom: `1px solid ${colors.border}`, flexShrink: 0,
        padding: isDesktop ? '24px 0 16px' : '24px 16px 16px',
      }}>
        {/* The rule stays full-bleed; only the title moves in to sit on the same
            left edge as the rail below it. */}
        <div style={isDesktop ? { maxWidth: layout.contentWidth, margin: '0 auto', padding: `0 ${spacing.xl}px` } : undefined}>
          <h1 style={{
            fontFamily: typography.displayFamily, fontWeight: 600, fontSize: 26,
            lineHeight: 1.25, color: colors.primary, margin: 0,
          }}>
            Inbox
          </h1>
        </div>
      </div>
  )

  // Mobile: one horizontally-scrolling strip, the two groups split by a rule.
  const chipStrip = (
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
            {FILTER_LEFT.map(chip)}
          </div>

          {/* Right group: status chips */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `0 ${spacing.lg}px`,
            flexShrink: 0,
          }}>
            {FILTER_RIGHT.map(chip)}
          </div>
        </div>
  )

  // PROTOTYPE-ONLY placement. Production's desktop rail is six folder rows
  // ("All conversations", "Pending requests", …) — a second taxonomy this
  // prototype doesn't have, and one that drops Unread. The chips themselves are
  // production's (inbox/api/domain/inbox.py:47-57) and Kibble's own
  // FilterChipGroup already wraps (InboxStatusList.tsx:49-70); only putting
  // them in the rail is ours. Rail width and gutter are production's
  // (InboxPageBase.tsx:150,207).
  const chipRail = (
        <div style={{
          width: 280, flexShrink: 0, position: 'sticky', top: 0, alignSelf: 'flex-start',
          display: 'flex', flexWrap: 'wrap', gap: spacing.sm,
        }}>
          {FILTERS.map(chip)}
        </div>
  )

  const sortedRow = (
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
  )

  const list = filtered.length === 0 ? (
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
              size={isDesktop ? 'default' : 'small'}
              onClick={() => {
                if (thread.bookingId) {
                  navigate(`/conversation/${thread.ownerId}/thread/${thread.conversationOpk}`, { state: { type: 'today' } })
                } else {
                  navigate(`/conversation/${thread.ownerId}`, { state: { type: 'today' } })
                }
              }}
            />
          )
        })

  // ── Desktop: filter rail left, conversations in the main container ──
  // Tapping a thread is still a full-page push to the conversation; production
  // has no inline detail pane here either.
  if (isDesktop) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
        {header}
        <div className="hide-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div style={{
            maxWidth: layout.contentWidth, margin: '0 auto', padding: `${spacing.xl}px ${spacing.xl}px`,
            display: 'flex', alignItems: 'flex-start', gap: 56,
          }}>
            {chipRail}
            <div style={{ flex: 1, minWidth: 0 }}>
              {sortedRow}
              {list}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {header}

      {/* ── Scrollable region: chips + sorted row + thread list ── */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {chipStrip}
        {sortedRow}
        {list}
      </div>

      {/* ── Tab bar ── */}
      <TabBar activeTab="inbox" onTabSelect={(id) => {
        const path = TAB_PATHS[id]
        if (path) navigate(path)
      }} />
    </div>
  )
}
