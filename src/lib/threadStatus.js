/**
 * Status display mapping for inbox threads + conversation header.
 *
 * Mirrors how roverdotcom/web presents booking status in the sitter inbox
 * and conversation header:
 *   - inbox row uses short labels (e.g. "Confirmed", "Happening now")
 *   - conversation header uses verbose labels (e.g. "Booking confirmed",
 *     "Booking ongoing")
 *
 * Reference: /src/aplaceforrover/conversations/api/domain/items/statuses.py
 * and /src/aplaceforrover/conversations/inbox.py in roverdotcom/web.
 */
import { colors } from '../tokens'

// Source of truth for status → display copy + color.
export const THREAD_STATUS_LABELS = {
  current: {
    rowLabel:    'Ongoing',
    headerLabel: 'Ongoing',
    color:       colors.success,
  },
  pending: {
    rowLabel:    'Pending request',
    headerLabel: 'Request pending',
    color:       colors.tertiary,
  },
  upcoming: {
    rowLabel:    'Confirmed',
    headerLabel: 'Booking confirmed',
    color:       colors.success,
  },
  active: {
    rowLabel:    'Happening now',
    headerLabel: 'Booking ongoing',
    color:       colors.success,
  },
  past: {
    rowLabel:    'Completed',
    headerLabel: 'Booking complete',
    color:       colors.tertiary,
  },
  archived: {
    rowLabel:    'Archived',
    headerLabel: 'Booking cancelled',
    color:       colors.tertiary,
  },
}

const FALLBACK = THREAD_STATUS_LABELS.current

export const getThreadStatusDisplay = (thread) => {
  const entry = THREAD_STATUS_LABELS[thread?.status] ?? FALLBACK
  return { label: entry.rowLabel, color: entry.color }
}

export const getConversationStatusDisplay = (thread) => {
  const entry = THREAD_STATUS_LABELS[thread?.status] ?? FALLBACK
  return { label: entry.headerLabel, color: entry.color }
}
