# Rover – Incomplete Cards Prototype

Interactive prototype for user testing the "Decrease Missed Rover Cards" flow.

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Project Structure

```
src/
├── tokens/          # Kibble design tokens (colors, spacing, shadows, typography)
├── assets/
│   ├── icons.jsx    # All SVG icons as React components
│   └── images.js    # Pet & people photo URLs
├── hooks/
│   ├── useLoadTime.js   # Captures page load time
│   └── useDate.js       # Formats current date for header
├── components/      # Reusable UI components
│   ├── Button.jsx
│   ├── PetAvatar.jsx
│   ├── UserAvatar.jsx
│   ├── BannerBlock.jsx
│   ├── ChatBubble.jsx
│   ├── TabBar.jsx
│   ├── HomeCard.jsx
│   └── ActionSheet.jsx
├── screens/         # Full-page screens
│   ├── HomeScreen.jsx
│   └── ConversationScreen.jsx
├── App.jsx          # Shell, routing, transitions
├── main.jsx         # Entry point
└── global.css       # Resets, responsive shell, animations
```

## Responsive

- Desktop: renders inside a 375×812 phone frame
- Mobile (≤420px): goes full-screen for native-feeling user tests

## Design Source

[Figma – UX2-7159 Decrease Missed Rover Cards](https://www.figma.com/design/xqBd8IpIkViuhZ9BcPvnid/-UX2-7159--Decrease-missed-Rover-Cards?node-id=16783-5188)

## Documentation

[Confluence – Design explorations Q2 2026 initiatives (Help sitters get paid on time – M1)](https://roverdotcom.atlassian.net/wiki/spaces/PSD/pages/5686886688/Design+explorations+Q2+2026+initiatives#Recurring-%C2%B7-Help-sitters-get-paid-on-time-m1-ready-for-user-testing)

## User Testing

[Confluence – User Testing Results: M1 Incomplete Cards](https://roverdotcom.atlassian.net/wiki/spaces/PSD/pages/5896012309/User+testing+Results+-+M1+incomplete+cards)
