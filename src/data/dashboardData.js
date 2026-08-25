/**
 * Mock data for the web Dashboard.
 *
 * Only the figures production reads from services the prototype has no
 * equivalent of live here — the availability calendar's last-update stamp and
 * the Rover Wallet balances. Everything else on the dashboard is either static
 * copy (`dashboardCopy.js`) or derived from existing prototype data
 * (`threads.js`, `sitterProfile.js`).
 *
 * All dates derive from PROTO_TODAY; nothing is hardcoded.
 */

import { PROTO_TODAY } from './owners'

const MS_PER_DAY = 24 * 60 * 60 * 1000

// The sitter last touched availability just over a week ago — far enough back
// that the widget's "ready for the next two weeks?" prompt is the interesting
// state, which is the one worth prototyping.
const CALENDAR_LAST_UPDATED = new Date(PROTO_TODAY.getTime() - 9 * MS_PER_DAY)

export const DASHBOARD_DATA = {
  calendar: {
    lastUpdated: CALENDAR_LAST_UPDATED,
    get daysSinceUpdate() {
      const a = Date.UTC(PROTO_TODAY.getFullYear(), PROTO_TODAY.getMonth(), PROTO_TODAY.getDate())
      const b = Date.UTC(CALENDAR_LAST_UPDATED.getFullYear(), CALENDAR_LAST_UPDATED.getMonth(), CALENDAR_LAST_UPDATED.getDate())
      return Math.round((a - b) / MS_PER_DAY)
    },
  },

  wallet: {
    upcomingEarnings:   '$340.00',
    pendingEarnings:    '$68.00',
    processingPayments: '$0.00',
  },

  // The template renders whatever promo amount the campaign is running.
  promoAmount: '$20',
}

// Production caps the dashboard message list at two (`account_view.py:71`
// MAX_MESSAGES = 2).
export const MAX_DASHBOARD_MESSAGES = 2
