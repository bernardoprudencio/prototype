// Centralized visible copy for the Service settings hub (banners, modals,
// callouts, tips, etc.). Phase C imports from this module so copy lives in
// one place.
//
// Production strings are sourced from the roverdotcom/web codebase. Some
// strings here have been lightly paraphrased for the prototype where the
// exact production string wasn't readable in research. Treat this file as
// the canonical reference for the prototype's hub copy.

export const HUB_COPY = {
  backgroundCheckError: {
    severity: 'error',
    title: 'Background check error',
    body: "There's an issue with your background check. Tap to review the details and try again.",
    ctaLabel: 'Review background check',
  },

  awayManual: {
    severity: 'info',
    title: 'Your profile is set to away',
    body: 'You are not appearing in search results because you set your status to away.',
    ctaLabel: 'Update your status',
  },

  awayAuto: {
    severity: 'info',
    title: 'Your profile is set to away',
    body: 'Your profile was set to away when you did not respond to an owner business request.',
    ctaLabel: 'Update your status',
  },

  // California rates notice. In the migrated IA this renders inside the pet
  // sitting section, above the Services row. Figma 4233:17554.
  californiaProviderGroup: {
    severity: 'info',
    title: 'Review rates',
    body: 'There is a new experience for entering rates that better reflects the amount you will earn for each service.',
    ctaLabel: 'Learn more',
    scope: { family: 'pet_sitting', slot: 'services' },
  },

  resubmitButton: {
    label: 'Resubmit Profile',
  },

  confirmDeactivation: {
    title: null,
    bodyLines: [
      'Confirm that you no longer want to provide services on Rover.',
      "After you click 'Confirm':",
      '• Your account will revert to a pet parent account. To reactivate your sitter account, click on "Become a sitter" again.',
      '• Your future confirmed bookings remain scheduled. If you can no longer provide service for these bookings, cancel them through the app.',
    ],
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  },

  availabilityModal: {
    title: 'Thanks for completing your sitter profile!',
    body: 'New sitters and walkers may be approved and start receiving requests within 72 hours after profile submission.',
    pickerHint: 'Deselect any days you cannot provide service over the next two weeks.',
    confirmLabel: 'Confirm Availability',
  },

  additionalPreferencesModal: {
    title: 'Important Next Step',
    body: 'Set additional service preferences. Now that you have submitted your profile, you can access additional non-required settings for every service to get the best matches for you.',
    confirmLabel: 'Got it',
  },

  serviceSettingsHelpTip: {
    linkLabel: 'What are more settings?',
    tipTitle: 'More settings',
    tipBody: 'Sections marked with "MORE" have newly available optional fields that help us match you with better-fit clients. Fill them in when you have time — none are required.',
  },

  hubFetchError: {
    title: "We couldn't load your hub",
    body: 'Something went wrong loading your management hub. Pull to refresh or try again later.',
    ctaLabel: 'Retry',
  },

  // CIAF migration onboarding card. Shown to sitters who just migrated from
  // Cat in a Flat (UK cat-sitting service acquired by Rover, Oct 2024).
  // Production: src/frontend/react-lib/.../HubPage/components/MigrationOnboarding/MigrationOnboarding.tsx
  ciafMigrationOnboarding: {
    heading: 'Hello cat lovers!',
    subheading: 'Get to know your new Rover profile',
    bullets: [
      {
        title: 'Ensure you get paid',
        body: 'Required: Add a Stripe bank account for your payouts, even if you previously set up Stripe on Cat in a Flat.',
        href: '/account/profile/receive-payments',
      },
      {
        title: 'Review your settings and calendar',
        body: 'Explore improved control over your service preferences and rates. The calendar adds flexibility over your previous schedule. View it online or the improved version in the Rover app.',
        href: '/provider-profile/calendar',
      },
      {
        title: 'Download the app',
        body: 'The Rover app lets you manage bookings, message clients, and access other powerful app-only tools, all on the go.',
        href: 'https://rover.app.link/download',
      },
    ],
    dismissLabel: 'Dismiss',
  },

  // Training credentials upload prompt. Kibble Alert severity=WARNING.
  // Production: src/frontend/react-lib/.../HubPage/components/TrainingCredentialsUploadBanner.tsx
  // Migrated IA places this inside the Training section, below the Profile
  // row, and badges Profile "Review". Figma 4233:17746.
  trainingCredentialsUpload: {
    severity: 'warning',
    title: 'Add your dog training credentials',
    body: 'These documents help us review and approve your profile.',
    ctaLabel: 'Upload credentials',
    scope: { family: 'training', slot: 'profile' },
  },

  // Grooming profile review notice. Kibble Alert severity=WARNING, no icon,
  // single paragraph with bolded lead.
  // Production: src/frontend/react-lib/.../HubPage/components/GroomingProfileReviewBanner.tsx
  groomingProfileReview: {
    severity: 'warning',
    boldLead: 'Your groomer profile is under review.',
    body: "This can take up to 20 days. We'll let you know when it's done.",
    ctaLabel: 'Learn more',
    ctaHref: 'https://support.rover.com/hc/en-us/articles/45572014256788-How-do-I-become-a-groomer-on-Rover',
    scope: { family: 'grooming', slot: 'services' },
  },

  // Second grooming state: profile approved but the services are not yet
  // findable in search. Figma 4233:17659.
  groomingNotFindable: {
    severity: 'warning',
    boldLead: "Pet parents can't find your grooming services yet.",
    body: 'Check your email for required steps to start getting booked. Need help? groomingsupport@rover.com',
    scope: { family: 'grooming', slot: 'services' },
  },

  // Verification error. Renders under the Business → Verification row and
  // badges that row "Review". The CTA is an inline underlined link inside the
  // sentence in production; the prototype renders it as the banner CTA.
  // Figma 4233:17405.
  verificationError: {
    severity: 'error',
    title: 'Verification error',
    body: "We've encountered a problem. Please",
    ctaLabel: 're-enter and save',
    bodyTail: 'your information.',
  },

  // Yellow attention badge rendered on hub and sub-page rows that need the
  // provider's attention. Figma 4233:17354.
  reviewBadge: {
    label: 'Review',
  },

  // ── Wide-width (side-menu) layout ──────────────────────────────────────────
  // The two-pane master-detail layout adopted at >=769px. Figma 608:55002
  // (desktop), 1548:5507 (tablet).

  // Left sidebar. The display title replaces the mobile screen's sticky header,
  // and "Other services" is a nav item here rather than a hub section.
  // Figma 608:55002, 613:41571.
  sideNav: {
    title: 'Service settings',
    otherServices: 'Other services',
  },

  // Services | Profile tabs on the family panes. At wide widths these replace
  // the mobile drill-down: the sidebar picks the family, the tabs pick the slot.
  // Figma 608:55002.
  familyTabs: {
    services: 'Services',
    profile: 'Profile',
  },

  // Account actions. Shared by the mobile hub's "Account actions" section and
  // the wide layout's sidebar footer row, which is why it lives here rather
  // than inline in the screen. Figma 4233:17354 (mobile), 608:55002 (wide).
  accountActions: {
    heading: 'Account actions',
    stopProviding: {
      label: 'Stop providing services',
      sublabel: 'Confirm you no longer want to provide services on Rover',
    },
  },

  // Business -> Insights row. Production's label is width-dependent: the mobile
  // hub says "Insights" because the destination is in-app, the web layout spells
  // that out. Figma 643:10693 (wide), 4233:17746 (narrow).
  insightsRow: {
    label: 'Insights',
    labelWide: 'Insights (app only)',
    sublabel: 'Check your profile and business performance',
  },

  // Service-row status copy — used by getActiveServiceStatusLines in sitterServices.js,
  // duplicated here for reference. Edit sitterServices.js, not this file, if changing.
  serviceStatus: {
    active: 'Active',
    away: 'Away',
    inactive: 'Inactive',
    pending: 'Awaiting Approval',
    restrictionRepeatOnly: 'Not accepting new pet owners',
    restrictionRecurringOnly: 'Not accepting new pet owners for weekly care',
    restrictionOneTimeOnly: 'Not accepting new pet owners for one-time care',
  },
}
