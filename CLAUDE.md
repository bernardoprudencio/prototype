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
`/more`, `/service-settings`) render in the base layer; conversation, relationship,
schedule, booking-details, testing-mode, and presentation screens are **overlay routes** rendered in
sibling `<Routes>` blocks wrapped in `SlideOverlay` (`position: absolute, inset: 0`)
at ascending `zIndex`. `SlideOverlay` owns the slide-in/out animation, so overlays
stack over the active tab without unmounting it.

**Design Tokens:** All colors, spacing, radius, shadows, and typography are centralized in `src/tokens/tokens.js`. Use these values instead of hardcoding CSS — spacing is an 8-based scale (4, 8, 12, 16, 24, 32px), and the palette uses semantic names (primary, secondary, success, link, etc.).

**Component Variants:** `Button.jsx` supports `default`, `primary`, `flat`, and `disabled` variants via a `variant` prop. Icons live in `src/assets/icons.jsx` as named React components (50 exports), most wrapping the Rover icon font (`src/assets/rover-icons.css`) via a private `Icon` component.

**Responsive Behavior:** There is no phone frame. `.app-shell` (`global.css`) fills the viewport at every width, and each screen's root is a `height: 100%` flex column with its own inner scroll region. Screens that have a wide layout gate it on the shared breakpoints in `src/lib/useMediaQuery.js` — `useIsWide()` (≥769px) for the schedule screens, `useIsExtraWide()` (≥880px) for Service settings. Every other screen currently has a single column that stretches to fill the viewport; adding a wide layout means adding a breakpoint branch, not a frame.

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
| dev variant flags | bool / enum | `scheduleMode`, `serviceStates`, `showShortNoticeRateBanner`, `showLockedRates`, … — persisted to `localStorage` via `persistJson`, edited in `ServiceVariantConfigSheet` |

**Overlay zIndex ladder** (`App.jsx`): 10 — `/conversation/:ownerId/*`,
`/conversation/:ownerId/thread/:conversationOpk/*`, `/contacts/:ownerId`; 15 —
`/testing-mode`, `/presentations`; 20 —
`/conversation/:ownerId/thread/:conversationOpk/details`,
`/conversation/:ownerId/schedule`, `/conversation/:ownerId/current-week`,
`/conversation/:ownerId/modify`; 30 —
`/conversation/:ownerId/schedule/edit-template`.

**Navigation path:**
1. HomeScreen or InboxScreen → tap card/thread → `navigate('/conversation/:ownerId')` (or `.../thread/:conversationOpk`) → conversation overlay slides in
2. Conversation's schedule CTA **forks on recurring-ness**, mirroring `booking_ctas.py:265-267`
   (`ModifyScheduleProviderButton` vs `ModifyBookingProviderButton`). The derivation is
   `isRecurringClient(client)` = `Boolean(client.recurringSchedule)`, exported from
   `relationshipData.js` and true for exactly owen / james / sarah:
   - **recurring** → "Manage schedule" / "Modify schedule" → `/schedule` or `/current-week`
     (`ScheduleOverlay` / `CurrentWeekScreen`), still selected by the `scheduleMode` dev flag
   - **one-time** → "Modify booking" → `/conversation/:ownerId/modify` → `ModifyBookingScreen`,
     in *both* `scheduleMode` values. Production does the same: the recurring-agenda redirect
     requires a recurring relationship (`useConversationActionHandler.ts:428-439`) and
     otherwise falls through to ModifyBookingPage
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
| `BookingDetailsScreen.jsx` | Booking details page (mirrors production's `/account/conversations/<opk>/details`): status, service summary, price ledger + locked-rates switch, CTAs, pets, location, additional info, connect. Recurring conversations get a week-scoped variant; an unmatched opk is a genuine "Booking not found" (there is deliberately no first-booking fallback) |
| `ModifyBookingScreen.jsx` | Modify booking — the one-time (`hasStay && !isRecurring`) sitter branch of production's `ModifyBookingPage`: reason, dates, pets, rates + nested locked-rates switch, extras/adjustments, summary ledger, message, submit. Ledger figures are static mock data; the production pricer round-trip is out of scope |
| `CurrentWeekScreen.jsx` | Current-week modification screen; contains `PricingLedger` |
| `EditTemplateScreen.jsx` | Recurring template editor |
| `RebookScreen.jsx` / `RebookUserCard.jsx` | Contacts tab: client list and its per-client card |
| `RelationshipPage/` | Relationship page: header, tier progress tracker, Rates row, booking lists, alt-monetization interstitial |
| `relationship/RelationshipManagement.jsx` | Full recurring schedule UI: agenda view, add/manage/edit sheets, billing confirmations |
| `ScheduleScreen.jsx` / `ScheduleOverlay.jsx` | Schedule route wrappers over `RelationshipManagement` |
| `ServiceSettingsScreen.jsx` / `BoardingSettingsScreen.jsx` | Service hub + boarding rates & settings |
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
| `HubBanner.jsx` / `MigrationOnboardingBanner.jsx` | Service-hub banners |
| `HelpLinkTip.jsx` | Inline link that opens a tip sheet |
| `ServiceVariantConfigSheet.jsx` | Dev sheet toggling every variant flag |
| `Switch.jsx` / `SwitchField.jsx` | Kibble switch primitive and its labelled form-field wrapper |
| `Snackbar.jsx` | Transient bottom toast |
| `LockRatesToggleRow.jsx` / `LockRatesSheet.jsx` | Locked-rates toggle + lock/unlock confirmation sheet |
| `TabBar.jsx` / `UserAvatar.jsx` / `DragHandle.jsx` | Bottom tab bar, sitter avatar, sheet drag affordance |
| `BulletedParagraphs.jsx` | Numbered bullet list with vertical connector (Kibble pattern port) |
| `AvailabilityModal.jsx` / `AdditionalPreferencesModal.jsx` / `ConfirmDeactivationModal.jsx` / `ChooseProfileSheet.jsx` / `ResubmitButton.jsx` | Service-settings and profile-review flow pieces |

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
- `contacts.js` — The full client roster (10 clients, recurring and non-recurring). Per-client fields include `recurringSchedule` (with its own nested `pricing`), `lockedServices`, `pets`, `gbv` / `tierName`, `cancelledBookings`. There is **no** top-level `pricing` and no `lockedRates` block
- `lockableRates.js` — The sitter's lockable rate rows per browsable service, `isLockableConversation()`, and each client's locked-price snapshot
- `relationshipData.js` — Builds each client's relationship page: tier progress + upcoming/past/archived bookings; also the `SERVICES` catalog that supplies every booking's `serviceKey`, the `isRecurringClient` derivation, `buildRecurringWeekBooking()`, and the `booking.modify` block (rate rows, adjustments, previous total) that `ModifyBookingScreen` consumes
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
