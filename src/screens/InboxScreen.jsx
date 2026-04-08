import React, { useState } from 'react'
import { colors, typography, spacing } from '../tokens'
import TabBar from '../components/TabBar'
import Chip from '../components/Chip'
import { DropdownIcon } from '../assets/icons'
import { OWNERS } from '../data/owners'
import { INBOX_THREADS } from '../data/conversations'
import { peopleImages } from '../assets/images'

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

// Strip the time portion: "Today 10:07 AM" → "Today", "Mar 13 10:12 AM" → "Mar 13"
const dateOnly = (ts) => ts.replace(/\s+\d{1,2}:\d{2}\s*(AM|PM)/i, '').trim()

// Build snippet: "You: [text]" for sitter messages, plain text for pet parent messages
const buildSnippet = (text, sender) =>
  sender === 'you' ? `You: ${text}` : text

export default function InboxScreen({ onNavigateConversation, liveEvents = {} }) {
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
          const { serviceLabel, alert } = thread

          // Use the latest live message if one exists for this owner
          const ownerLiveEvents = liveEvents[thread.ownerId] ?? []
          const lastLive = [...ownerLiveEvents].reverse().find(e => e.type === 'message')
          const displayMessage = lastLive
            ? { text: lastLive.text, sender: 'you', timestamp: 'Today' }
            : thread.lastMessage

          const snippet = buildSnippet(displayMessage.text, displayMessage.sender)

          return (
            <div
              key={thread.ownerId}
              onClick={() => onNavigateConversation?.(owner)}
              style={{ cursor: 'pointer' }}
            >
              {/* margin wrapper */}
              <div style={{ paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
                {/* padding wrapper */}
                <div style={{
                  paddingLeft: spacing.lg,
                  paddingRight: spacing.lg,
                  paddingTop: spacing.xl,
                  paddingBottom: spacing.xl,
                  background: colors.white,
                }}>

                  {/* firstRow: avatar + name/pet + date (no time) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.lg }}>
                    <div style={{ flexShrink: 0 }}>
                      <img
                        src={peopleImages[thread.ownerId]}
                        alt={owner.name}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          display: 'block',
                          border: `1px solid ${colors.white}`,
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: typography.fontFamily,
                        fontWeight: 600,
                        fontSize: 14,
                        lineHeight: 1.25,
                        color: colors.primary,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{owner.name}</p>
                      <p style={{
                        fontFamily: typography.fontFamily,
                        fontWeight: 400,
                        fontSize: 14,
                        lineHeight: 1.25,
                        color: colors.tertiary,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{owner.petNames}</p>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <p style={{
                        fontFamily: typography.fontFamily,
                        fontWeight: 400,
                        fontSize: 14,
                        lineHeight: 1.25,
                        color: colors.tertiary,
                        margin: 0,
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}>{dateOnly(displayMessage.timestamp)}</p>
                    </div>
                  </div>

                  {/* messageSnippet */}
                  <p style={{
                    fontFamily: typography.fontFamily,
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: 1.25,
                    color: colors.primary,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{snippet}</p>

                  {/* serviceDetail */}
                  <p style={{
                    fontFamily: typography.fontFamily,
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: 1.25,
                    color: colors.tertiary,
                    margin: 0,
                    paddingTop: spacing.lg,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{serviceLabel}</p>

                  {/* lastRow: status */}
                  <div style={{ paddingTop: spacing.sm }}>
                    <p style={{
                      fontFamily: typography.fontFamily,
                      fontWeight: 400,
                      fontSize: 14,
                      lineHeight: 1.25,
                      color: colors.success,
                      margin: 0,
                    }}>Ongoing</p>
                  </div>

                  {/* subActionFrame: nudge — shown when alert is set */}
                  {alert && (
                    <div style={{ paddingTop: spacing.lg }}>
                      <div style={{
                        background: colors.blueLight,
                        borderRadius: 8,
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                      }}>
                        <p style={{
                          fontFamily: typography.fontFamily,
                          fontWeight: 600,
                          fontSize: 14,
                          lineHeight: 1.25,
                          color: colors.link,
                          textDecoration: 'underline',
                          margin: 0,
                          flex: 1,
                        }}>{alert}</p>
                        <span style={{ color: colors.link, fontSize: 16 }}>›</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* border separator */}
              <div style={{ height: 1, background: colors.border }} />
            </div>
          )
        })}
      </div>

      {/* ── Tab bar ── */}
      <TabBar />
    </div>
  )
}
