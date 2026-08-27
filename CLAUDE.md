# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Rover – Sitter Tooling Prototype** — An interactive React prototype for user-testing Rover sitter workflows, including incomplete card resolution, conversation management, and recurring schedule management. Deployed via GitHub Pages from `bernardoprudencio/prototype`.

## Repo & Branches

| Branch | Purpose | Live URL |
|---|---|---|
| `main` | Baseline prototype | https://bernardoprudencio.github.io/prototype/ |
| `new-modification` | Active iteration — schedule modification flow + EditTemplateScreen | https://bernardoprudencio.github.io/prototype/new-modification/ |
| `ongoing-relationships` | Separate UX exploration — ongoing sitter–owner relationships | https://bernardoprudencio.github.io/prototype/ongoing-relationships/ |
| `user-testing-locked-rates-management` | Locked-rates client management — the granular POC proposal, for user testing | https://bernardoprudencio.github.io/prototype/user-testing-locked-rates-management/ |

Deployments trigger automatically on push via GitHub Actions (`.github/workflows/deploy.yml`). Each branch builds to its own subdirectory on the `gh-pages` branch.

## Figma Source

Original: [UX2-7159 – Decrease Missed Rover Cards](https://www.figma.com/design/xqBd8IpIkViuhZ9BcPvnid/-UX2-7159--Decrease-missed-Rover-Cards?node-id=16783-5188)

## Commands

```bash
npm install     # Install dependencies
npm run dev     # Start dev server at http://localhost:5173
npm run build   # Production build
npm run preview # Preview production build
```

No linting or test setup exists in this project.

## Architecture

**Routing:** React Router v6 with `HashRouter` (in `src/main.jsx`). Every screen is a
real route declared in `src/App.jsx`. Tab-level routes (`/`, `/inbox`, `/contacts`,
`/more`, `/service-settings` and its `services/:family` / `profile/:family` /
`boarding` sub-pages) render in the base layer; conversation, relationship,
schedule, booking-details, testing-mode, and presentation screens are **overlay routes** rendered in
sibling `<Routes>` blocks wrapped in `SlideOverlay` (`position: absolute, inset: 0`)
at ascending `zIndex`. `SlideOverlay` owns the slide-in/out animation, so overlays
stack over the active tab without unmounting it.

**Design Tokens:** All colors, spacing, radius, shadows, and typography are centralized in `src/tokens/tokens.js`. Use these values instead of hardcoding CSS — spacing is an 8-based scale (4, 8, 12, 16, 24, 32px), and the palette uses semantic names (primary, secondary, success, link, etc.).

**Component Variants:** `Button.jsx` supports `default`, `primary`, `flat`, and `disabled` variants via a `variant` prop. Icons live in `src/assets/icons.jsx` as named React components (50 exports), most wrapping the Rover icon font (`src/assets/rover-icons.css`) via a private `Icon` component.

**Responsive Behavior:** There is no phone frame. `.app-shell` (`global.css`) fills the viewport at every width, and each screen's root is a `height: 100%` flex column with its own inner scroll region. Screens that have a wide layout gate it on the single shared breakpoint in `src/lib/useMediaQuery.js` — `useIsWide()` (≥769px), used by both the schedule screens and Service settings. Every other screen currently has a single column that stretches to fill the viewport; adding a wide layout means adding a breakpoint branch, not a frame.

**No Backend:** All data (pet names, images, service info) is hardcoded in components or imported from `src/assets/images.js`. No API calls or state management libraries.

**Styling:** All styles are inline via `style` props — no CSS modules. Tokens are imported and referenced directly. The only CSS files are `global.css` (`@font-face` blocks, `.app-shell`, `.hide-scrollbar`, `@keyframes slideUp`) and `src/assets/rover-icons.css` (the icon font).

## App State & Navigation Flow

`src/context/AppContext.jsx` is the single source of truth — consume it with
`useApp()`. `App.jsx` holds only the two transient sheets (`sheetItem`,
`reviewSheetCard`) and `loadTime`. Selected context state:

| State | Type | Purpose |
|-------|------|---------|
| `resolvedCards` | `{ [cardId]: { resolution, timestamp } }` | Completed/cancelled cards; hidden from HomeScreen |
| `liveEvents` | `{ [ownerId]: event[] }` | Per-owner events (messages, schedule changes) shown in ConversationScreen and InboxScreen |
| `ownerUnits` | `{ [ownerId]: unit[] }` | Schedule edits committed during session |
| `ownerTemplates` / `ownerWeeks` / `ownerCurrentWeeks` | `{ [ownerId]: ... }` | Per-owner schedule edits by surface |
| `scheduleChanges` / `templateChanges` / `currentWeekChanges` | `{ [ownerId]: ... }` | Change logs feeding the conversation event stream |
| `lockedRatesByOwner` | map keyed `clientId:serviceKey` → bool | Locked-rates overrides. Starts `{}`; read through `isRatesLocked(client, serviceKey)`, which falls back to `client.lockedServices.includes(serviceKey)` (`AppContext.jsx:220-224`) |
| `lockedAmountsByOwner` | map keyed `clientId:serviceKey` → `{ locked, amounts, lockedAt }` | The granular proposal's state. Starts `{}`; read through `getRatesState(client, serviceKey)`, which layers it over `lockedSeedFor` in `lockableRates.js`; written by `commitRatesState` |
| `ratesMode` | `'granular'` \| `'current'` | Which locked-rates experience renders. Defaults to `'granular'` (the proposal under test); flip in Testing mode |
| dev variant flags | bool / enum | `scheduleMode`, `altMonetizationRollout`, `serviceStates`, `showShortNoticeRateBanner`, `showLockedRates`, … — persisted to `localStorage` via `persistJson`, edited in `ServiceVariantConfigSheet` (service-settings-scoped flags) or `TestingModeScreen` (app-wide ones) |

**Overlay zIndex ladder** (`App.jsx`): 10 — `/conversation/:ownerId/*`,
`/conversation/:ownerId/thread/:conversationOpk/*`, `/contacts/:ownerId`; 15 —
`/testing-mode`, `/presentations`; 20 —
`/conversation/:ownerId/thread/:conversationOpk/details`,
`/conversation/:ownerId/schedule`, `/conversation/:ownerId/current-week`,
`/conversation/:ownerId/thread/:conversationOpk/modify` and its opk-less fallback
`/conversation/:ownerId/modify`; 30 —
`/conversation/:ownerId/schedule/edit-template`.

**Navigation path:**
1. HomeScreen or InboxScreen → tap card/thread → `navigate('/conversation/:ownerId')` (or `.../thread/:conversationOpk`) → conversation overlay slides in
2. Conversation's schedule CTA **forks per conversation, not per client**, mirroring
   `booking_ctas.py:265-267` (`ModifyScheduleProviderButton` vs
   `ModifyBookingProviderButton`). Production's subject there is `self.conv.is_recurring` —
   FK presence on *that conversation* (`conversations/models/conversation.py:632-633`) — so
   the prototype reads `booking.isRecurring` off the booking resolved for the conversation's
   opk. **Do not use `isRecurringClient(client)` here**: a recurring client also books one-off
   stays, and each of those is a plain non-recurring conversation, so a client-level fork
   hands owen / james / sarah the schedule surfaces on every thread they have:
   - **recurring conversation** (the `${id}-conv-recurring` week) → "Manage schedule" /
     "Modify schedule" → `/schedule` or `/current-week` (`ScheduleOverlay` /
     `CurrentWeekScreen`), still selected by the `scheduleMode` dev flag
   - **one-time conversation** → "Modify booking" →
     `/conversation/:ownerId/thread/:conversationOpk/modify` → `ModifyBookingScreen`, in
     *both* `scheduleMode` values. Production does the same: the recurring-agenda redirect
     requires a recurring relationship (`useConversationActionHandler.ts:428-439`) and
     otherwise falls through to ModifyBookingPage. The opk travels in the URL because the
     modify page is per-conversation; `ModifyBookingScreen` filters `isRecurring` bookings out
     of every fallback so the opk-less route can never land on the recurring week
3. Conversation "Details" → `.../thread/:conversationOpk/details` → `BookingDetailsScreen`.
   Enabled for every conversation, recurring included — see "Recurring conversations" below
4. Overlay back → `navigate(-1)` → overlay slides out, the tab underneath is still mounted
5. Editing schedule → change appended to `liveEvents[ownerId]` via the context setters
6. Contacts → tap a client → `/contacts/:ownerId` → `RelationshipPage` overlay

## Screen & Component Inventory

### Screens (`src/screens/`)
| File | Description |
|------|-------------|
| `HomeScreen.jsx` | Dashboard: incomplete cards from last week, today's scheduled walks, promo cards |
| `InboxScreen.jsx` | Inbox tab: filter chips, sorted thread list, live snippet updates from liveEvents |
| `ConversationScreen.jsx` | Chat interface; its "Details" CTA opens `BookingDetailsScreen` |
| `BookingDetailsScreen.jsx` | Booking details page (mirrors production's `/account/conversations/<opk>/details`): status, service summary, price ledger + locked-rates switch, CTAs, pets, location, additional info, connect. **Every** booking carries a ledger, as in production (`PriceLedgerMapper.map()` runs on every conversation) — what varies by state is the collapse and the one-line summary, not whether the block exists. The five-way summary fork and the collapsed-only "Your earnings" subtitle mirror `_get_provider_title()` / `_get_provider_earnings_subtitle()`; `booking.ledgerCollapsed` folds in `should_collapse_financial_sections()`, which collapses an *unpaid* mobile provider conversation too. Recurring conversations get a week-scoped variant plus the `_get_info_text()` Rover Card line; an unmatched opk is a genuine "Booking not found" (there is deliberately no first-booking fallback) |
| `ModifyBookingScreen.jsx` | Modify booking — the one-time (`hasStay && !isRecurring`) sitter branch of production's `ModifyBookingPage`: reason, dates, pets, rates + nested locked-rates switch, extras/adjustments, summary ledger, message, submit. Rate rows and the summary ledger are seeded from `booking.modify.rateRows`, so the per-unit figures match the details ledger exactly; the "+1 unit" price increase is an authored scenario and the production pricer round-trip is out of scope |
| `CurrentWeekScreen.jsx` | Current-week modification screen; contains `PricingLedger` |
| `EditTemplateScreen.jsx` | Recurring template editor |
| `RebookScreen.jsx` / `RebookUserCard.jsx` | Contacts tab: client list and its per-client card |
| `RelationshipPage/` | Relationship page: header, tier progress tracker, Rates row, booking lists, alt-monetization interstitial. The tracker (and with it the interstitial) renders only while `progress.tiers` is non-null — see "Graduated take rate" below |
| `relationship/RelationshipManagement.jsx` | Full recurring schedule UI: agenda view, add/manage/edit sheets, billing confirmations |
| `ScheduleScreen.jsx` / `ScheduleOverlay.jsx` | Schedule route wrappers over `RelationshipManagement` |
| `ServiceSettingsLayout.jsx` | The `/service-settings` layout route: every dev-flag read, all the sheets/modals, `bannersFor`, the nav model, and the ≥769px sidebar shell. Panes get the shared state via `<Outlet context>` |
| `ServiceSettingsScreen.jsx` | The **mobile** hub index: two rows per active family (Services / Profile) drilling into sub-pages, "Other services" sign-up rows, Business / About you / Account actions. Family-scoped banners render inside their family's section, not in a top-of-page stack. Redirects to the first sidebar item at ≥769px |
| `hubSections.jsx` | Row lists shared by both widths (`BusinessRows`, `AboutYouRows`, `OtherServicesRows`, `AccountActionsRows`, `AccountWideBanners`) plus the three wide-only panes `BusinessPane` / `AboutYouPane` / `OtherServicesPane` |
| `FamilyPaneHeader.jsx` | Wide-width family-pane chrome: `PaneTitle` + both slots' banners + the Services \| Profile `PaneTabs` |
| `FamilyServicesScreen.jsx` / `FamilyProfileScreen.jsx` | The per-family views — every service in the family with its state-tinted icon badge, and the family's profile rows plus a pinned "View … profile" action. `SubPageHeader` below 769px, `FamilyPaneHeader` above |
| `BoardingSettingsScreen.jsx` | Boarding rates & settings; reached from the pet sitting services sub-page |
| `MoreScreen.jsx` / `TestingModeScreen.jsx` | More tab and dev variant entry point |
| `PresentationsScreen.jsx` / `DeckScreen.jsx` / `MgmtHubDeckScreen.jsx` | Internal review decks |

### Relationship sub-components (`src/screens/relationship/`)
| File | Description |
|------|-------------|
| `AgendaView.jsx` | Renders month→week→day→occurrences; payment status; incomplete badge |
| `AddSheet.jsx` | Bottom sheet to add a new recurring service |
| `OccActionSheet.jsx` | Edit/skip/override a single occurrence (or from-date-forward) |
| `ManageSheet.jsx` | List and cancel/modify multiple units |
| `SummarySheet.jsx` | Cancellation/modification summary with refund/keep-paid options |
| `UnitEditor.jsx` | Form for service details: type, duration, pets, time, frequency, weekdays |
| `theme.js` | Local token aliases + shared `labelSt` style object |

### Reusable components (`src/components/`)
| File | Description |
|------|-------------|
| `Button.jsx` | 4 variants (default/primary/flat/disabled), 3 sizes, icon support |
| `ActionSheet.jsx` | Bottom modal for incomplete/today card actions |
| `ReviewSheet.jsx` | Completion confirmation (Yes/No chips) |
| `Row.jsx` | List item with label, sublabel, left/right slots — used throughout |
| `HomeCard.jsx` / `ThreadRow.jsx` | Home "today's walks" card; Inbox thread row |
| `ChatBubble.jsx` | Message bubble; owner vs. client sides |
| `BannerBlock.jsx` | Yellow info banner with clock icon |
| `PetAvatar.jsx` | Circular image; multiple pets overlap |
| `BottomSheet.jsx` | Generic slide-up modal wrapper |
| `Chip.jsx` / `Pill.jsx` | Toggle chip with optional checkmark/remove; static Kibble-badge pill (tier labels) |
| `RadioRow.jsx` | Radio + label row |
| `TimeInput.jsx` / `CalInput.jsx` / `DisabledInput.jsx` | Form inputs |
| `Select.jsx` / `Textarea.jsx` | Labelled native `<select>` (`appearance: none` + shared `DropdownIcon`) and labelled textarea with inline validation error — the two Kibble primitives `ModifyBookingScreen` needed and the codebase lacked |
| `SlideOverlay.jsx` | Route-level slide-in overlay wrapper |
| `HubBanner.jsx` / `MigrationOnboardingBanner.jsx` | Service-hub banners. `HubBanner` has a `paragraph` layout (bold lead + body + inline link + optional `bodyTail`) alongside the default stack |
| `hubUI.jsx` | Shared service-settings primitives: `SectionHeader` (optional leading icon), `SettingsRow` (optional `needsReview` badge), `SectionGroup`, `Chevron`, `SubPageHeader` (mobile-only), `COLOR_BY_TOKEN`, plus the wide-width `HubSideNav` / `PaneTitle` / `PaneTabs` |
| `ReviewBadge.jsx` / `ServiceIconBadge.jsx` | Yellow "Review" attention badge; 40px state-tinted circular service icon |
| `HelpLinkTip.jsx` | Inline link that opens a tip sheet |
| `ServiceVariantConfigSheet.jsx` | Dev sheet toggling every variant flag |
| `Switch.jsx` / `SwitchField.jsx` | Kibble switch primitive and its labelled form-field wrapper |
| `Snackbar.jsx` | Transient bottom toast |
| `LockRatesToggleRow.jsx` / `LockRatesSheet.jsx` | Locked-rates toggle + lock/unlock confirmation sheet |
| `TabBar.jsx` / `UserAvatar.jsx` / `DragHandle.jsx` | Bottom tab bar, sitter avatar, sheet drag affordance |
| `BulletedParagraphs.jsx` | Numbered bullet list with vertical connector (Kibble pattern port) |
| `AvailabilityModal.jsx` / `AdditionalPreferencesModal.jsx` / `ConfirmDeactivationModal.jsx` / `ChooseProfileSheet.jsx` / `ResubmitButton.jsx` | Service-settings and profile-review flow pieces |

## Service settings IA

`/service-settings` follows the DEV-146752 Management-hub migration, and it has **two
layouts behind one route tree**: below 769px a mobile index that drills down, at 769px
and up a two-pane master–detail. `ServiceSettingsLayout` is a **nested layout route**
that owns the sidebar, every dev-flag read, and every sheet/modal, and shares state with
its panes through `<Outlet context={…} />` / `useOutletContext()` — there is no separate
React context for the hub.

| Route | Pane |
|---|---|
| `/service-settings` | `ServiceSettingsScreen` — the mobile index (two rows per active family, Other services, Business, About you, Account actions). At ≥769px it `<Navigate replace>`s to the first sidebar item |
| `/service-settings/services/:family` | `FamilyServicesScreen` — every service in the family, active and inactive |
| `/service-settings/profile/:family` | `FamilyProfileScreen` — `FAMILY_PROFILE_ROWS[family]` + pinned "View … profile" |
| `/service-settings/business` | `BusinessPane` (`hubSections.jsx`) — **wide-only** |
| `/service-settings/about` | `AboutYouPane` — **wide-only** |
| `/service-settings/other` | `OtherServicesPane` — **wide-only**, and only while a family is inactive-but-in-geo |
| `/service-settings/boarding` | `BoardingSettingsScreen` — sits *outside* the layout route (no desktop frame exists); back goes to `/service-settings/services/pet_sitting` |

All of them are **base-layer tab routes**, not `SlideOverlay` overlays. The three
wide-only addresses redirect to the index below 769px, so the mobile IA is unchanged;
`useIsWide()` (≥769px) is the single gate — the old `extraWide` / `useIsExtraWide`
breakpoint is gone.

**Wide layout.** `HubSideNav` | 1px full-height rule | `<Outlet />`, capped at
`maxWidth: 1140`. The sidebar is `33%` (min 280 / max 375), so it lands on Figma's 280 at
769px and 375 at 1280px. The right pane pads 48px left / 20px right. The three new
primitives — `HubSideNav`, `PaneTitle`, `PaneTabs` — live in `hubUI.jsx` alongside the
row primitives they reuse; `SubPageHeader` is **mobile-only** and never renders in the
two-pane layout. The family panes replace it with `FamilyPaneHeader`: `PaneTitle` (bare
family label + "View profile" + the Resubmit pill) → banners → `PaneTabs`
(Services | Profile). A pane whose family leaves the sidebar (its last service
deactivated) redirects to the first nav item, so the selected item and the visible pane
never disagree.

**Banner placement is data-driven, and differs by width.** Each family-scoped entry in
`hubCopy.js` carries `scope: { family, slot }` where slot is `'services'` or `'profile'`.
The layout's `bannersFor(family, slot)` reads the dev flags and matches on `scope`; the
mobile index renders each slot's banners between the section header and the Services row
(`services`) or below the Profile row (`profile`), while the wide family pane renders
**both** slots' banners together, between the pane title and the tab bar. The same
selector drives the yellow `ReviewBadge`: on mobile a row wears it when its slot has a
banner; on the sidebar the badge is **per family** (services ∪ profile) and shows even
while a different family is selected. **Tabs are never badged.** Only account-wide states
(resubmit, away manual/auto, CIAF onboarding) stack above everything — full viewport
width at wide; the verification error renders under Business → Verification at both
widths, gated on `backgroundCheckStatus === 'error'`.

**Width-dependent details.** "Insights" gains "(app only)" at wide
(`HUB_COPY.insightsRow.labelWide`). The Other-services sign-up icons are
`palette.orange[700]` at **both** widths. Business and About you get no "View profile"
link in the two-pane layout.

**Service state → badge tint.** `SERVICE_STATE` is ACTIVE / AWAY / PENDING / INACTIVE.
`serviceBadgeTone(state)` in `sitterServices.js` returns `[paletteFamily, shade]` pairs
that `ServiceIconBadge` resolves against `palette` — green / yellow / blue / neutral.
`getActiveServiceStatusLines` emits the matching status line, INACTIVE included, since
the services sub-page lists every service regardless of state.

## Key Business Logic

**Date anchor:** `PROTO_TODAY = new Date()` in `src/data/owners.js` — evaluated once on module load. All schedule math is relative to this value.

**Unit** — the recurring-service rule (what, when, how often, for whom, at what cost). Stored as a plain object. See `scheduleHelpers.js:defaultUnit` for the full shape.

**Occurrence** — a single instance derived from a unit. Generated on the fly by `expandUnit(unit)`.

**Key functions in `src/lib/scheduleHelpers.js`:**
- `expandUnit(unit)` — generates all occurrences up to ~6 months out (or 8 weeks from today, whichever is further); caps at 120 total
- `buildAgenda(units, relEndDate?)` — flattens all units into a sorted day-keyed list for AgendaView; filters skips; explodes overnight stays across multiple days
- `getRuleImpact(unit, allUnits)` — calculates refund/charge impact of cancellation; used by all confirmation dialogs
- `getPaidThruSunday(units)` — the billing cutoff: Sunday of the week containing the earliest `startDate`
- `shortRuleLabel(unit)` — human-readable recurrence label (e.g. "Mon, Wed and Fri")

**Recurring conversations are one week each.** Production has no separate recurring details
page: one route, one mapper set, one payload, with recurring-ness as a per-mapper branch.
`is_recurring` is FK presence (`conversations/models/conversation.py:632-633`), and the
recurring relationship cycles `initial_conversation` / `active_conversation` /
`next_conversation` (`recurring/models.py:238-250`) — so "the booking" for a recurring
conversation is **that conversation's own week**. The sentinel (`next_conversation.request`)
is read only for the weekly-rate figures.

The prototype mirrors this with `buildRecurringWeekBooking(client, …)` in
`relationshipData.js`: a real booking under the `` `${client.id}-conv-recurring` `` opk,
`isRecurring: true`, a Monday→Sunday window derived from `PROTO_TODAY`, a `Weekly` service
label, `statusKey` `ongoingRecurring` / `skippedWeek` (driven by a `skippedThisWeek` input,
mirroring `booking_status.py:400-404`), and a weekly ledger section. It is prepended to
`bookings.upcoming`, which is what enables the Details CTA for recurring clients — so
`threads.js` skips `isRecurring` bookings in its upcoming loop to avoid emitting a second
inbox thread for an opk it already emits directly.

**Graduated take rate** — the relationship-based-fees experiment, switchable end to end.

Production gates the whole surface on `is_rollout_alt_monetisation`
(`RelationshipProgressScreenView`, `views.py:1011-1013`), and outside the rollout
`tierName` and `cumulativeGrossValue` both come back null — they always travel together.
So the off-state is a **data** gate, not a UI-level hide.

The prototype's switch is the `altMonetizationRollout` dev flag (`AppContext.jsx`,
**default off**, toggled in `TestingModeScreen` next to `scheduleMode`). Every screen
reads relationship data through `src/lib/useRelationshipData.js`, which folds the flag
into `getRelationshipData(ownerId, { altMonetization })` — the same one-derived-value
convention as `useLockedRates`. All four call sites must go through it: the flag changes
the *money*, so a screen that skipped it would show 90% earnings while the relationship
page showed 80% for the same booking.

What the flag moves:
- `progress.heading` / `progress.tiers` / `progress.callout` become `null`, which is the
  render gate for `RelationshipProgressTracker` (ladder, progress bar, callout, "Learn
  More" → `AlternativeMonetizationInterstitial`). `progress.earnings` stays populated in
  both states — it is gross booking value, not a tier artifact, and the booking-list
  section headers read it.
- Earnings fall back to `BASELINE_SHARE = 0.80` (the standard Rover take rate) in place of
  the tier's `sitterShare` (0.70 / 0.85 / 0.90). Builders take a share number or a
  `shareFor(gbv)` resolver, never a tier object.
- The contacts list drops the tier `Pill` and the "· $X complete" clause
  (`withAltMonetization`) and loses the "Progress (high to low)" sort (`sortOptionsFor`).
- The dashboard drops `AltMonetizationWidget`.

The relationship page itself **stays reachable** with the flag off: header, booking lists
and the Rates row all remain, only the tracker goes.

**Locked rates** — a sitter freezes the rates one client pays for one service.
Mirrors production (`roverdotcom/web`): keyed per (owner × service), the lock is a
single boolean because production's write is full-set replacement.

*Data shape.* A `contacts.js` client carries `lockedServices: [serviceKey]` — the **seed**
state only, and there is no per-client capability flag (production has none either: a lock
is just the presence of `LockedServiceAddOn` rows). The sitter's per-service rate list and
each client's locked snapshot live in `src/data/lockableRates.js` (`lockableRatesFor`,
`lockedRatesFor`, `isLockableConversation`). Live state is
`AppContext.lockedRatesByOwner`, keyed `` `${clientId}:${serviceKey}` ``, which starts
empty and falls back to `client.lockedServices` (`AppContext.jsx:220-224`).

*Recurring.* Production's canonical `_get_lock_rates_toggle()`
(`price_ledger.py:1720-1742`) has **no** recurring check; the recurring exclusion
(`if self.stay.is_recurring: return None`) lives only on the retiring legacy stay page.
What production does do is price recurring sentinel requests `.without_locked_rates()` —
but only inside the `sevices_flags.rollout_new_pricer()` branch of
`change_conversation_dates_and_create_request` (`recurring/models.py:616-628`); the
sibling builder `create_one_time_request_from_recurring` (`:639-675`) does not strip at
all. So "a lock never *applies* to a recurring booking" holds under the new pricer, on
that one code path — not unconditionally.

Wiring lives in `src/lib/useLockedRates.js`; all copy in `src/data/lockedRatesCopy.js`.
Surfaces: `BookingDetailsScreen`'s price ledger, `CurrentWeekScreen`'s `PricingLedger`,
the relationship page's "Rates" row (prototype-only), and `ModifyBookingScreen`'s Rates
section. Known gating divergences from production are tracked in
`docs/ticket-locked-rates-gating.md`.

*Two commit interactions, both production.* `useLockedRates(client, booking, options)` takes
`options.mode`:
- `'sheet'` (default) — `requestChange` opens the confirmation sheet and `confirm` commits.
  Mirrors the ConversationPage surfaces, where the copy is server-driven
  (`ConversationLockRates.tsx` + `LockRatesModal.tsx`). Every caller that passes two
  arguments gets this.
- `'immediate'` — `requestChange` commits on the spot and no sheet renders. Mirrors
  modify-booking, which has no modal at all: the switch goes straight through
  `onLockedRateChange` (`ModifyBookingForm.tsx:836-844`) into `ModifyBooking.duck.ts:483-503`.
  `ModifyBookingScreen` passes this with `snackbar: false`, since that surface fires no toast.

Note the toggle has two production phrasings: the possessive form
(`Lock your rates for future stays with {name}`) on modify-booking, the plain form on the
ledger surfaces. Both live in `lockedRatesCopy.js`.

**Data sources in `src/data/`:**
- `owners.js` — `PROTO_TODAY`, plus the 3 recurring clients (Owen, James, Sarah) projected from `contacts.js` into the schedule shape (`OWNERS`), and the week/slot helpers `getTodayWalks()` / `getOwnerCurrentWeek()` / `getOwnerCurrentWeekSlots()` / `getFullCurrentWeekSlots()` / `getOwnerUpcomingWeeks()`
- `scheduleData.js` — `getOwnerRelUnit()` (owner → schedule `unit`), `getIncompleteCards()`, plus its own copies of `getTodayWalks()` / `getOwnerCurrentWeek()` / `getOwnerUpcomingWeeks()`. Note `getIncompleteCards` and `getOwnerRelUnit` live **here**, not in `owners.js`. `getOwnerRelUnit` dereferences `owner.template[0].time` unguarded (`:51`), so it throws for a client with no `recurringSchedule.template`
- `services.js` — 5 service types; `DURATION_SHORT` / `DURATION_DAYCARE` option arrays; `FREQ` / `WEEKDAYS` constants
- `threads.js` — Inbox thread metadata + `getChatHistory(conversationOpk)`: last message, service label, status, alert, unread flag
- `contacts.js` — The full client roster (10 clients, recurring and non-recurring). Per-client fields include `recurringSchedule` (with its own nested `pricing`), `lockedServices`, `pets`, `gbv` / `tierName`, `cancelledBookings`. There is **no** top-level `pricing` and no `lockedRates` block. Also exports the alt-monetization selectors `withAltMonetization(client, on)` and `sortOptionsFor(on)`
- `lockableRates.js` — The sitter's lockable rate rows per browsable service, `isLockableConversation()`, and each client's locked-price snapshot
- `relationshipData.js` — Builds each client's relationship page via `getRelationshipData(ownerId, { altMonetization })`: tier progress + upcoming/past/archived bookings; also the `SERVICES` catalog that supplies every booking's `serviceKey`, the client-level `isRecurringClient` derivation (which gates *building* the recurring week — not the CTA fork, see Navigation path step 2), `buildRecurringWeekBooking()`, and the `booking.modify` block (rate rows, adjustments, previous total) that `ModifyBookingScreen` consumes. **Rates drive price**: `buildRateRows(client, serviceKey, { units, unitLabel, pets, perUnit, … })` is the single builder behind every ledger row and every generated total, so `booking.price` is the *sum of its own rate rows* rather than a figure authored beside them. It pairs pet 0 with `standard-rate` and pets 1..n with `additional-dog` **by slug, never by index** — position 1 is `additional-dog` for boarding only. The generated standard rate is persisted as `booking.perUnit` so `buildModifyFields` seeds the rate selector with the rate the booking was actually priced from. One mapper, `withDerivedFields(client, share)`, attaches `modify` / `ledger` / `ledgerCollapsed` / `ledgerInfo` / `paidOn` to every booking in all three lists
- `sitterProfile.js` / `sitterServices.js` — The sitter's own default rates and service configuration
- `moreMenu.js` — More-tab row definitions
- `lockedRatesCopy.js` / `bookingDetailsCopy.js` / `modifyBookingCopy.js` / `hubCopy.js` — Verbatim production copy, single source of truth per feature. Every string carries a provenance comment naming the production file and line it was read from; `PROTOTYPE-ONLY` marks the few that have no production equivalent

**Two service-key namespaces exist, and they do not fully overlap.** The booking/rates side
(`relationshipData.js` `SERVICES`, `lockableRates.js`, `contacts.js` `cancelledBookings`) uses
`drop_in_visits` / `dog_daycare`; the schedule/unit side (`services.js` `SERVICES`,
`scheduleHelpers.js`, `sitterServices.js`, `sitterProfile.js`) uses `drop_in` /
`doggy_daycare`. `dog_walking`, `boarding` and `house_sitting` are identical in both. Never
feed a `unit.serviceId` into a function expecting a `booking.serviceKey` — see
`docs/ticket-locked-rates-gating.md`.

## Workflow Rules

### Pre-Commit
- Always run `npm run build` before committing. Fix all build errors and type errors before reporting done. This project has no linting or test setup, so the build is the only automated check.

### Deployment
- This prototype deploys to GitHub Pages. Verify the `base` in `vite.config.js` matches the repo name before deploying.
- After deploying, confirm the URL loads without a white screen before calling it done.

### UI Changes
- Match Figma designs exactly. Do not reorganize layout structures (e.g., a single scrollable row must not split into fixed + scrollable sections) without confirming first.
- Use the Figma MCP tool to fetch design context from frame URLs rather than guessing from screenshots.

### File Targeting
- Before editing, identify the exact file path. When similar filenames exist (e.g., components in different directories), verify via imports before editing.
