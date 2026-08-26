/**
 * Web (desktop) navigation model — the logged-in *sitter* view of rover.com.
 *
 * Ported from the SSR React/kibble NavBar in `roverdotcom/web`:
 *   src/frontend/shared/js/ssr/BaseTemplate/NavBar/NavBarLeft.tsx
 *   src/frontend/shared/js/ssr/BaseTemplate/NavBar/NavBarRight.tsx
 *   src/frontend/shared/js/ssr/BaseTemplate/NavBar/menus/DesktopMenu/DesktopMenu.tsx
 *
 * Two things about production's nav are load-bearing and easy to get wrong:
 *
 * 1. **There is no primary nav row.** The bar carries the logo, search, and a
 *    promo link on the left, and utility affordances on the right. Every actual
 *    destination — Dashboard, Inbox, Calendar, Contacts, Service settings — is
 *    inside the avatar dropdown.
 * 2. **There is no active-item treatment anywhere.** No `aria-current`, no
 *    selected styling; only `:hover`. So this model carries no `activeKey`
 *    concept and the components derive nothing from the route.
 *
 * Sitter-vs-owner: production filters every item through `MenuItemVisibility`
 * (`menus/utilities.ts:6-11,40-72`), where `SITTER` means
 * `isActiveServiceProvider`. The prototype has exactly one user and she is an
 * active provider, so the owner-only branches are resolved away rather than
 * modelled — noted per item below.
 *
 * Labels are verbatim. `PROTOTYPE-ONLY` marks anything with no production
 * equivalent.
 */

import {
  SearchIcon, MegaphoneIcon, CartIcon, BellIcon, ChatInboxIcon, HelpBubbleIcon,
} from '../assets/icons'

// ─── Left group ──────────────────────────────────────────────────────────────
// `NavBarLeft.tsx:34-109`. Two omissions, both deliberate:
//   · "Become a Sitter" is gated on `!isActiveServiceProvider` (`:81`), so a
//     sitter never sees it.
//   · "Our Services" is `!isAuthenticated && !isCatInAFlat` (`:97`).
// "Promote your profile" is the sitter branch of ReferLink (`ReferLink.tsx:84-98`,
// gated on `supportsEmpm && isActiveServiceProvider && isAnApprovedProvider`);
// owners get "Invite a Friend" / "Give $20, Get $20" instead.
export const WEB_NAV_LEFT = [
  { key: 'search',  label: 'Search Sitters',      Icon: SearchIcon,    href: '/search/' },
  { key: 'promote', label: 'Promote your profile', Icon: MegaphoneIcon, href: '/provider-profile/promote/' },
]

// ─── Right group ─────────────────────────────────────────────────────────────
// `NavBarRight.tsx:30-105`, in render order. The avatar dropdown sits between
// `contactList` and `notifications` and is a component, not a row, so it is not
// listed here. Omitted: the language selector (single-locale prototype) and the
// mobile hamburger (below 769px the app's TabBar is the nav).
//
// Note the Inbox item's *visible* label is literally the count in parens —
// production renders `({unreadMessageCount})` next to the icon, with the word
// "Inbox" living only in the aria-label (`NavBarRight.tsx:41-48`).
export const WEB_NAV_RIGHT = [
  { key: 'contactList',   kind: 'button', Icon: CartIcon,       ariaLabel: (n) => `Contact list (${n} contacts)` },
  { key: 'notifications', kind: 'button', Icon: BellIcon,       ariaLabel: () => 'Notifications' },
  { key: 'inbox',         kind: 'count',  Icon: ChatInboxIcon,  ariaLabel: (n) => `Inbox (${n})`, to: '/inbox' },
  { key: 'help',          kind: 'link',   Icon: HelpBubbleIcon, label: 'Help', href: '/help/' },
]

// ─── Avatar dropdown ─────────────────────────────────────────────────────────
// `DesktopMenu.tsx:26-116`, in array order, filtered to what a sitter sees.
//
// `to` is the prototype route; `href` records the production URL it stands in
// for. `stub: true` means the prototype has no screen for it yet and the route
// renders `StubScreen`. Omitted sitter-invisible rows: "Profile" (OWNER-only
// unless `showAsApplicant`) and the Bright Horizons / Cat-in-a-Flat branches.
//
// "Contacts" is additionally gated on `user.shouldShowContactsTab` (`:78`) and
// "Insights" on the `sitter_analytics_dashboard` Statsig gate plus
// `wasEverServiceProvider` (`:134,139-140`); both are resolved to shown here.
export const SITTER_MENU_ITEMS = [
  { key: 'dashboard',       label: 'Dashboard',        to: '/',                 href: '/account/' },
  { key: 'serviceSettings', label: 'Service settings', to: '/service-settings', href: '/provider-profile/' },
  { key: 'inbox',           label: 'Inbox',            to: '/inbox',            href: '/account/inbox/' },
  { key: 'contacts',        label: 'Contacts',         to: '/contacts',         href: '/account/contacts/' },
  // `/account/calendar` has no trailing slash in production (`DesktopMenu.tsx`).
  { key: 'calendar',        label: 'Calendar',         to: '/calendar',         href: '/account/calendar' },
  { key: 'insights',        label: 'Insights',         to: '/insights',         href: '/account/insights/',         stub: true, badge: 'New' },
  { key: 'payments',        label: 'Payments',         to: '/payments',         href: '/account/payments/',         stub: true },
  { key: 'settings',        label: 'Settings',         to: '/settings',         href: '/account/profile/settings/', stub: true },
  { key: 'yourPets',        label: 'Your Pets',        to: '/your-pets',        href: '/members/{slug}/dogs/',      stub: true },
  { key: 'photos',          label: 'Photos',           to: '/photos',           href: '/provider-profile/photos/',  stub: true },
]

// PROTOTYPE-ONLY. These two live on `MoreScreen` today, and "More" has no web
// equivalent — production's nav has nothing like it. Without this section they
// would be unreachable above the web-nav breakpoint. Mirrors how
// `MoreScreen.jsx` appends the same two rows outside `moreMenu.js`.
export const PROTOTYPE_MENU_ITEMS = [
  { key: 'testingMode',   label: 'Testing mode',  to: '/testing-mode' },
  { key: 'presentations', label: 'Presentations', to: '/presentations' },
]

// `DesktopMenu.tsx:300-310` — a 1px divider, then Log Out, which calls
// `logout({...})`. Nothing to log out of here, so the row is inert.
export const LOG_OUT_LABEL = 'Log Out'

// ─── Stub destinations ───────────────────────────────────────────────────────
// One entry per `stub: true` item above, keyed by route. `title` is the
// production page's own heading rather than the nav label where they differ.
export const WEB_STUB_PAGES = [
  { path: '/insights',  title: 'Insights' },
  { path: '/payments',  title: 'Payments' },
  { path: '/settings',  title: 'Settings' },
  { path: '/your-pets', title: 'Your Pets' },
  { path: '/photos',    title: 'Photos' },
]
