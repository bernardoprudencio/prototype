/**
 * Registry of placeholder destinations reachable at `/placeholder/:slug`.
 * Used by PlaceholderScreen so every clickable row on the Service settings
 * screen lands somewhere meaningful for unmoderated user testing.
 *
 * Slugs use a `{family}.{rowId}` pattern where row ids repeat across families
 * (e.g. "About" exists under both Pet sitting and Training).
 */
export const PLACEHOLDER_ROUTES = {
  // Active-service detail screens (Boarding has a real one at /service-settings/boarding)
  'doggy-daycare':            { title: 'Doggy Day Care', description: "You'd configure your day care rates, availability, pet preferences, and home setup here." },
  'dog-walking':              { title: 'Dog Walking',    description: "You'd configure your walk rates, service area, and availability here." },
  // Inactive services revealed under "Add a new service"
  'house-sitting':            { title: 'House Sitting',  description: "You'd set up House Sitting — rates, availability, and pet preferences — here." },
  'drop-in':                  { title: 'Drop-In Visits', description: "You'd set up Drop-In Visits here." },
  // Sign-up flows for inactive families
  'training-signup':          { title: 'Get started with dog training', description: "You'd start your trainer application here. Credentials required." },
  'grooming-signup':          { title: 'Get started with grooming',     description: "You'd start setting up grooming services here." },
  // Pet sitting profile rows
  'pet-sitting.about':        { title: 'About — Pet sitting',           description: "You'd share your pet care experience and approach here." },
  'pet-sitting.photos':       { title: 'Photos — Pet sitting',          description: "You'd manage your profile gallery here." },
  'pet-sitting.testimonials': { title: 'Testimonials — Pet sitting',    description: "You'd ask people to write about your pet care experience here." },
  // Training profile rows
  'training.about':           { title: 'About — Training',              description: "You'd highlight your training experience and qualifications here." },
  'training.photos':          { title: 'Photos — Training',             description: "You'd manage your training profile gallery here." },
  'training.credentials':     { title: 'Credentials — Training',        description: "You'd add your training certifications here." },
  'training.testimonials':    { title: 'Testimonials — Training',       description: "You'd ask people to write about your trainer experience here." },
  // Grooming profile
  'grooming.edit-profile':    { title: 'Edit grooming profile',         description: "You'd edit bio, photos, credentials, and testimonials here." },
  // Business
  'availability':             { title: 'Availability',                  description: "You'd block off dates and manage your calendar here." },
  'insights':                 { title: 'Sitter insights',               description: "You'd see your views, conversion, and earnings insights here." },
  'promote':                  { title: 'Promote your profile',          description: "You'd find tools to promote your profile here." },
  'payments':                 { title: 'Payments',                      description: "You'd manage how you get paid — payouts, methods, history — here." },
  'background-check':         { title: 'Background check',              description: "You'd view or renew your background check here." },
  // About you
  'details':                  { title: 'Details',                       description: "You'd update your name, address, and basic info here." },
  'pets':                     { title: 'Your pets',                     description: "You'd manage your own pets here." },
  'phone-numbers':            { title: 'Phone numbers',                 description: "You'd add or update your phone numbers here." },
  'payment-methods':          { title: 'Payment methods',               description: "You'd manage your saved payment methods here." },
  // View profile
  'view-profile':             { title: 'Your public profile',           description: "This is what pet parents see when they look at your profile." },
  // Account actions
  'stop-providing-services':  { title: 'Stop providing services',       description: "You'd tell us why you're stopping and confirm here. Nothing is actually deactivated in the prototype." },
}

export function getPlaceholderContent(slug) {
  return PLACEHOLDER_ROUTES[slug] ?? {
    title: 'Coming soon',
    description: "This area isn't part of the current prototype.",
  }
}
