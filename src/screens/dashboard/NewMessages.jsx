import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, spacing, textStyles } from '../../tokens'
import { peopleImages } from '../../assets/images'
import { getClient } from '../../data/contacts'
import { getInboxThreads } from '../../data/threads'
import { DASHBOARD_COPY } from '../../data/dashboardCopy'
import { MAX_DASHBOARD_MESSAGES } from '../../data/dashboardData'
import Widget, { WidgetLink } from './Widget'

/**
 * message_list.html — the dashboard's recent-conversation list, capped at
 * MAX_DASHBOARD_MESSAGES.
 *
 * Production selects unread messages. `threads.js` marks the newest few
 * client-sent threads unread (`markUnread`), so that pool is preferred; the most
 * recent non-archived threads stand in otherwise, and since getInboxThreads()
 * returns them sorted by `lastActivityAt` newest-first, "most recent" here is
 * literal. The widget is never empty in the prototype's data.
 */
export default function NewMessages() {
  const navigate = useNavigate()
  const c = DASHBOARD_COPY.messages

  const threads = useMemo(() => {
    const all = getInboxThreads().filter(t => t.status !== 'archived')
    const unread = all.filter(t => t.unread)
    const pool = unread.length ? unread : all
    // One thread per owner: several clients hold multiple conversations, and a
    // two-row widget showing the same person twice reads as a bug.
    const seen = new Set()
    return pool
      .filter(t => (seen.has(t.ownerId) ? false : (seen.add(t.ownerId), true)))
      .slice(0, MAX_DASHBOARD_MESSAGES)
  }, [])

  const openThread = (thread) => {
    if (thread.bookingId) {
      navigate(`/conversation/${thread.ownerId}/thread/${thread.conversationOpk}`, { state: { type: 'today' } })
    } else {
      navigate(`/conversation/${thread.ownerId}`, { state: { type: 'today' } })
    }
  }

  return (
    <Widget title={c.title}>
      {threads.length === 0 ? (
        <p style={{ ...textStyles.text100, color: colors.tertiary, margin: 0 }}>{c.empty}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {threads.map((thread, i) => {
            const client = getClient(thread.ownerId)
            if (!client) return null
            const snippet = thread.lastMessage.sender === 'you'
              ? `You: ${thread.lastMessage.text}`
              : thread.lastMessage.text

            return (
              <div
                key={thread.conversationOpk}
                onClick={() => openThread(thread)}
                style={{
                  display: 'flex', alignItems: 'center', gap: spacing.md, cursor: 'pointer',
                  paddingTop: i === 0 ? 0 : spacing.md,
                  paddingBottom: spacing.md,
                  borderBottom: i === threads.length - 1 ? 'none' : `1px solid ${colors.border}`,
                }}
              >
                <img
                  src={peopleImages[thread.ownerId]}
                  alt={client.displayName}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...textStyles.heading100, color: colors.primary, margin: 0 }}>{client.displayName}</p>
                  <p style={{
                    ...textStyles.text100, color: colors.tertiary, margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{snippet}</p>
                </div>
                <span style={{ ...textStyles.text100, color: colors.tertiary, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {thread.lastMessage.timestamp}
                </span>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ marginTop: spacing.md }}>
        <WidgetLink onClick={() => navigate('/inbox')}>{c.viewAll}</WidgetLink>
      </div>
    </Widget>
  )
}
