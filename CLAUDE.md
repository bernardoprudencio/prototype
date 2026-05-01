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

**Routing:** React Router v6 with `HashRouter` (in `src/main.jsx`). Tab-level routes (`/` and `/inbox`) render via `<Routes>` inside the phone shell. Conversation and Schedule screens are **state-based overlays** (`position: absolute, inset: 0`) that slide in/out over the active tab — they are not routes. This lets back navigation return to the correct tab without losing scroll state.

**Design Tokens:** All colors, spacing, radius, shadows, and typography are centralized in `src/tokens/tokens.js`. Use these values instead of hardcoding CSS — spacing is an 8-based scale (4, 8, 12, 16, 24, 32px), and the palette uses semantic names (primary, secondary, success, link, etc.).

**Component Variants:** `Button.jsx` supports `default`, `primary`, `flat`, and `disabled` variants via a `variant` prop. SVG icons live in `src/assets/icons.jsx` as named React components (17 total).

**Responsive Behavior:** On desktop, the app renders inside a 375×812px phone frame with a CSS shadow shell (`global.css`). On mobile (≤420px viewport), it goes full-screen for native-feeling user tests.

**No Backend:** All data (pet names, images, service info) is hardcoded in components or imported from `src/assets/images.js`. No API calls or state management libraries.

**Styling:** All styles are inline via `style` props — no CSS modules. Tokens are imported and referenced directly. The only CSS file is `global.css` (phone frame, scroll helpers, `@keyframes slideUp`/`spin`).

## App State & Navigation Flow

`App.jsx` is the single source of truth. Key state:

| State | Type | Purpose |
|-------|------|---------|
| `conversation` | `{ type, card?, clientKey? }` \| null | Active conversation passed to ConversationScreen overlay |
| `convVisible` / `convTransition` | bool | Controls slide-in/out animation for conversation overlay |
| `scheduleContext` | object \| null | Context for the Schedule overlay (owner, units, pets) |
| `schedVisible` / `schedTransition` | bool | Controls slide-in/out animation for schedule overlay |
| `sheetItem` | object \| null | Controls ActionSheet content |
| `reviewSheetCard` | card \| null | Controls ReviewSheet (completion confirm) |
| `resolvedCards` | `{ [cardId]: { resolution, timestamp } }` | Completed/cancelled cards; hidden from HomeScreen |
| `liveEvents` | `{ [ownerId]: event[] }` | Per-owner events (messages, schedule changes) shown in ConversationScreen and InboxScreen |
| `ownerUnits` | `{ [ownerId]: units[] }` | Schedule edits committed during session |
| `loadTime` | string | Cached on mount via `useLoadTime()` |

**Navigation path:**
1. HomeScreen or InboxScreen → tap card/thread → `openConversation(conv)` → conversation overlay slides in
2. ConversationScreen "Schedule" button → `openSchedule(ctx)` → schedule overlay slides in on top (z-index 20)
3. Schedule overlay back → `closeSchedule()` → slides out, conversation visible again
4. Conversation overlay back → `closeConversation()` → slides out, active tab (Home or Inbox) visible
5. Editing schedule → `onScheduleChange` callback → appended to `liveEvents[ownerId]`

**Overlay animation pattern:** `openConversation` sets `convVisible=true` then uses a double `requestAnimationFrame` to set `convTransition=true`, triggering the CSS transform from `translateX(100%)` to `translateX(0)`. `closeConversation` reverses: sets `convTransition=false`, waits 200ms, then clears `convVisible` and `conversation`.

## Screen & Component Inventory

### Screens (`src/screens/`)
| File | Description |
|------|-------------|
| `HomeScreen.jsx` | Dashboard: incomplete cards from last week, today's scheduled walks, promo cards |
| `InboxScreen.jsx` | Inbox tab: filter chips, sorted thread list, live snippet updates from liveEvents |
| `ConversationScreen.jsx` | Chat interface + Schedule tab; embeds RelationshipScreen |
| `RelationshipScreen.jsx` | Full schedule UI: agenda view, add/manage/edit dialogs, billing confirmations |
| `ScheduleScreen.jsx` | Unused wrapper — real schedule logic lives in RelationshipScreen |

### Relationship sub-components (`src/screens/relationship/`)
| File | Description |
|------|-------------|
| `AgendaView.jsx` | Renders month→week→day→occurrences; payment status; incomplete badge |
| `AddSheet.jsx` | Bottom sheet to add a new recurring service |
| `OccActionSheet.jsx` | Edit/skip/override a single occurrence (or from-date-forward) |
| `ManageSheet.jsx` | List and cancel/modify multiple units |
| `DeleteConfirmDialog.jsx` | Cancellation confirmation with refund/keep-paid options |
| `UnitEditor.jsx` | Form for service details: type, duration, pets, time, frequency, weekdays |
| `theme.js` | Local token aliases + shared `labelSt` style object |

### Reusable components (`src/components/`)
| File | Description |
|------|-------------|
| `Button.jsx` | 4 variants (default/primary/flat/disabled), 3 sizes, icon support |
| `ActionSheet.jsx` | Bottom modal for incomplete/today card actions |
| `ReviewSheet.jsx` | Completion confirmation (Yes/No chips) |
| `Row.jsx` | List item with label, sublabel, left/right slots — used throughout |
| `ChatBubble.jsx` | Message bubble; owner vs. client sides |
| `BannerBlock.jsx` | Yellow info banner with clock icon |
| `PetAvatar.jsx` | Circular image; multiple pets overlap |
| `BottomSheet.jsx` | Generic slide-up modal wrapper |
| `Chip.jsx` | Toggle chip with optional checkmark/remove |
| `RadioRow.jsx` | Radio + label row |
| `TimeInput.jsx` / `CalInput.jsx` / `DisabledInput.jsx` | Form inputs |

## Key Business Logic

See [`docs/schedule-logic.md`](docs/schedule-logic.md) for the full reference. Summary:

**Date anchor:** `PROTO_TODAY = new Date()` in `src/data/owners.js` — evaluated once on module load. All schedule math is relative to this value.

**Unit** — the recurring-service rule (what, when, how often, for whom, at what cost). Stored as a plain object. See `scheduleHelpers.js:defaultUnit` for the full shape.

**Occurrence** — a single instance derived from a unit. Generated on the fly by `expandUnit(unit)`.

**Key functions in `src/lib/scheduleHelpers.js`:**
- `expandUnit(unit)` — generates all occurrences up to ~6 months out (or 8 weeks from today, whichever is further); caps at 120 total
- `buildAgenda(units, relEndDate?)` — flattens all units into a sorted day-keyed list for AgendaView; filters skips; explodes overnight stays across multiple days
- `getRuleImpact(unit, allUnits)` — calculates refund/charge impact of cancellation; used by all confirmation dialogs
- `getPaidThruSunday(units)` — the billing cutoff: Sunday of the week containing the earliest `startDate`
- `shortRuleLabel(unit)` — human-readable recurrence label (e.g. "Mon, Wed and Fri")

**Data sources in `src/data/`:**
- `owners.js` — 3 hardcoded clients (Owen, James, Sarah) with pet info, schedule templates, and `getIncompleteCards()` / `getTodayWalks()` / `getOwnerRelUnit()`
- `services.js` — 5 service types; `DURATION_SHORT` / `DURATION_DAYCARE` option arrays; `FREQ` / `WEEKDAYS` constants
- `conversations.js` — Per-owner inbox thread metadata (`INBOX_THREADS`): last message, service label, status, alert, unread flag

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
