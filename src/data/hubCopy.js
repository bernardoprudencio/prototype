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

  californiaProviderGroup: {
    severity: 'info',
    title: null,
    body: 'There is a new experience for entering rates that better reflects the amount you will earn for each service.',
    ctaLabel: 'Learn more',
  },

  shortNoticeRateBanner: {
    severity: 'info',
    title: 'Review your short notice rates',
    body: 'Set a short notice rate for each service to charge for last-minute bookings.',
    ctaLabel: 'Review rates',
  },

  shortNoticeRateCallout: {
    title: 'Short notice rate',
    body: 'You can charge more for last-minute requests by setting a short notice rate.',
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
  trainingCredentialsUpload: {
    severity: 'warning',
    title: 'Add your dog training credentials',
    body: 'These documents help us review and approve your profile.',
    ctaLabel: 'Upload credentials',
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
  },

  // Service-row status copy — used by getActiveServiceStatusLines in sitterServices.js,
  // duplicated here for reference. Edit sitterServices.js, not this file, if changing.
  serviceStatus: {
    active: 'Active',
    away: 'Away',
    inactive: 'Inactive',
    restrictionRepeatOnly: 'Not accepting new customers',
    restrictionRecurringOnly: 'Not accepting new customers for weekly care',
    restrictionOneTimeOnly: 'Not accepting new customers for one-time care',
  },
}
