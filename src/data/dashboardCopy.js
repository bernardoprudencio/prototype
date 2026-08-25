/**
 * Centralized visible copy for the web Dashboard (`/account/` in production).
 *
 * Production's sitter dashboard is a Django TemplateView (`account/urls.py:28`
 * -> `AccountDashboardView`, `account/views/account_view.py:267`), rendered as a
 * Bootstrap-3 two-column page: secondary column first in the DOM (left), primary
 * column second (right) — `new_design/account/two_col_priority_row.html:10-60`.
 *
 * Every string below carries a provenance comment naming the production file and
 * line it was read from. `PROTOTYPE-ONLY` marks strings with no production
 * equivalent.
 */

export const DASHBOARD_COPY = {
  // profile_image_widget.html:26-40
  profile: {
    serviceSettings: 'Service settings',
    editProfile:     'Edit Profile',
    viewProfile:     'View profile',
  },

  // AvailabilityCalendarWidget/constants.ts:9-19
  calendar: {
    title:            'Calendar',
    daysSinceLabel:   'Days since last update:',
    prompt:           'Is your calendar ready for the next two weeks?',
    ctaLabel:         'Review availability',
  },

  // message_list.html:5-22
  messages: {
    title:      'New Messages',
    viewAll:    'View all messages',
    // PROTOTYPE-ONLY — production's template simply renders nothing when the
    // sitter has no recent messages; the prototype always has threads, so this
    // exists only as a defensive fallback.
    empty:      'No new messages',
  },

  // rover_balance_widget.html:9-54
  wallet: {
    title:              'Wallet',
    upcomingEarnings:   'Upcoming Earnings',
    pendingEarnings:    'Pending Earnings',
    processingPayments: 'Processing Payments',
    receivePayments:    'Receive payments',
    viewPayments:       'View Payments',
  },

  // sitter_resources.html:9-21
  resources: {
    title:   'Sitter Resources',
    rover101: 'Rover 101',
    centerCallout: 'New! Visit our Sitter Resources Center',
  },

  // promote.html:11-28 — `{amount}` is interpolated by the template; the
  // prototype substitutes DASHBOARD_DATA.promoAmount.
  promote: {
    headline: (amount) => `Give new Rover customers ${amount} off their first booking`,
    ctaLabel: 'Promote your profile',
  },

  // AlternativeMonetizationWidget.tsx:61-97
  altMonetization: {
    title:        'Stronger relationships, lower fees',
    learnMore:    'Learn more',
    seeClients:   'See clients',
  },
}
