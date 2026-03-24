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

**Routing:** State-driven (no React Router). `App.jsx` owns `screen` state (`'home'` | `'conversation'`), `actionSheet` visibility, and CSS transition direction. Screen switches trigger animated slide transitions via CSS transforms.

**Design Tokens:** All colors, spacing, radius, shadows, and typography are centralized in `src/tokens/tokens.js`. Use these values instead of hardcoding CSS — spacing is an 8-based scale (4, 8, 12, 16, 24, 32px), and the palette uses semantic names (primary, secondary, success, link, etc.).

**Component Variants:** `Button.jsx` supports `default`, `primary`, `flat`, and `disabled` variants via a `variant` prop. SVG icons live in `src/assets/icons.jsx` as named React components (17 total).

**Responsive Behavior:** On desktop, the app renders inside a 375×812px phone frame with a CSS shadow shell (`global.css`). On mobile (≤420px viewport), it goes full-screen for native-feeling user tests.

**No Backend:** All data (pet names, images, service info) is hardcoded in components or imported from `src/assets/images.js`. No API calls or state management libraries.
