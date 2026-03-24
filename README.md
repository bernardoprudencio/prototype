# Rover – Incomplete Cards Prototype

Interactive prototype for user testing the "Decrease Missed Rover Cards" flow.

**Figma source:** [UX2-7159 – Decrease Missed Rover Cards](https://www.figma.com/design/xqBd8IpIkViuhZ9BcPvnid/-UX2-7159--Decrease-missed-Rover-Cards?node-id=16783-5188)

## Branches

| Branch | Purpose | Live URL |
|---|---|---|
| `main` | Baseline prototype | https://bernardoprudencio.github.io/prototype/ |
| `new-modification` | Active iteration (current) | https://bernardoprudencio.github.io/prototype/new-modification/ |
| `ongoing-relationships` | Separate UX exploration | https://bernardoprudencio.github.io/prototype/ongoing-relationships/ |

## Setup

```bash
npm install
npm run dev   # → http://localhost:5173/prototype/ (port may vary)
```

## What this prototype covers

The flow a sitter sees when they have incomplete Rover Cards — services that were completed but not officially logged. The prototype tests whether surfacing these cards more prominently (and streamlining resolution) reduces missed cards.

**Three screens:**
1. **HomeScreen** — Lists incomplete cards and today's scheduled walks. Cards are directly tappable to jump to the conversation.
2. **ConversationScreen** — The message thread with the pet parent. Shows walk banners, lets the sitter mark the service complete or cancel with refund, and modify the recurring schedule.
3. **ScheduleScreen** — Modify the weekly recurring schedule for an owner. Changes surface back in the conversation as a summary message.

## Navigation

State-driven (no React Router). `App.jsx` owns all state:

```
Home → Conversation       tap a card row, or "Start Rover Card" / "Go to conversation" in action sheet
Home → Conversation       after completing/cancelling via ReviewSheet
Conversation → Schedule   "Modify schedule" button in conversation header
Schedule → Conversation   back button (with optional schedule change summary injected into chat)
Conversation → Home       back button
```

## Key files

| File | What it does |
|---|---|
| `src/App.jsx` | Shell, all state, navigation logic, transition animations |
| `src/screens/HomeScreen.jsx` | Home tab — incomplete cards + today's walks |
| `src/screens/ConversationScreen.jsx` | Message thread — hardcoded per card, supports resolution banners + schedule change messages |
| `src/screens/ScheduleScreen.jsx` | Weekly schedule modifier |
| `src/components/ActionSheet.jsx` | Bottom sheet — options for incomplete cards and today walks |
| `src/components/ReviewSheet.jsx` | Complete / cancel+refund flow |
| `src/data/bookings.js` | `INCOMPLETE_CARDS` — the two mock incomplete cards (Archie, Milo) |
| `src/data/owners.js` | `OWNERS` + `getTodayWalks()` — today's scheduled walks derived from owner templates |
| `src/tokens/tokens.js` | All design tokens: colors, spacing, radius, shadows, typography |
| `src/assets/icons.jsx` | 17 SVG icons as named React components |

## Mock data

- **Incomplete cards:** Archie (James T., Mar 18 dog walk) and Milo/koni-late (Sarah S., Mar 12 delayed check-in)
- **Today's walks:** Derived from owner weekly templates filtered to `PROTO_TODAY` (Friday, Mar 20 2026). Owen O. walks Koni + Burley at 9 AM.
- **Conversations:** Fully hardcoded per card in `ConversationScreen.jsx` — no API calls.

## Deploy

Deployments are triggered automatically on push via GitHub Actions (`.github/workflows/deploy.yml`). Each branch builds to its own subdirectory on the `gh-pages` branch of `bernardoprudencio/prototype`.

```bash
# Manual deploy is not needed — just push to the branch.
git push origin new-modification
```

## Responsive

- **Desktop:** renders inside a 375×812px phone frame with CSS shadow shell
- **Mobile (≤420px):** goes full-screen for native-feeling user tests
