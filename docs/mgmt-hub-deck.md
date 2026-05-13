# Management hub migration — Leadership review deck

Spec for the deck rendered by [src/screens/MgmtHubDeckScreen.jsx](../src/screens/MgmtHubDeckScreen.jsx). Lives in-repo so future iterations can use it as context.

## Context

Leadership review on **May 14, 2026** about the **Management hub migration** (aka `/provider-profile`). Format: ~15 min present + 15 min Q&A. Audience matches the April 30 deck.

The migration moves `/provider-profile` from a legacy **Django web page** to **SSR + RxN**, in phases — shell first, modules later, SSU last.

### Source material

- [Bernardo's advocacy doc — Management hub migration](https://roverdotcom.atlassian.net/wiki/spaces/~629f7de99f5d480069c908ce/pages/4938729412/Management+hub+migration)
- [Mégane's 1P (authoritative) — 1P: /provider-profile Migration](https://roverdotcom.atlassian.net/wiki/spaces/PSD/pages/6060217097/1P+provider-profile+Migration)
- Milestone 1 Figma — `figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=6-17693`
- Live prototype embedded in the demo slide — `https://bernardoprudencio.github.io/prototype/#/service-settings`

### Agreed structure (Slack with Mégane, May 12)

Current state → Migration Milestones → Focus on Mgmt hub design → GTM.

**Headline GTM ask:** Looking for feedback on the progressive rollout approach — Web first, Apps second, no A/B test.

## Slide outline (12 slides)

### Title
1. **Title** — "Management hub migration to SSR and RxN · May 14, 2026"

### Current state
2. **What `/provider-profile` is today** — Django web page serving SSU + Management hub; embedded in apps; legacy stack. Side-by-side screenshots of the desktop web and the in-app embedded experience. Some structure exists today but sitters can't find simple things (e.g. editing your address is buried under Basic info) and the order zigzags (pet sitting → training → pet sitting again).
3. **Module ownership map** — three columns mirroring the new IA. Confirmed ownerships:
   - **Service settings & profile** — Service settings, Profile · Details, Profile · Photos, Profile · Testimonials → **Sitter Experience**; Profile · Your pets → **TSO**.
   - **User & Account info** — Basic info (**TSO**), Phone numbers (**TSO**), Background check (**TSO**), Survey / quiz (**TSO**).
   - **Business** — Sitter insights (**Sitter Experience**), Calendar (**Sitter Experience**), Payments (**Payments**), Payouts (**Payments**), Promote (**Growth**), Stop providing services (**Sitter Experience**).
4. **By the numbers** — 125k weekly unique visits; Service settings is #1, Account info and Profile details follow; 60% of unmigrated eyeballs under Sitter Experience surfaces.

### Migration milestones
5. **Phased plan** — explicit: migration is from **legacy Django web** to **SSR + RxN**. M1: migrate the Mgmt hub shell. M2+: migrate individual modules with owning teams. Later: rethink SSU. Why SSR + RxN: better IA, newer UI, native in-app nav (no more back-closes-webview).

### Focus on Mgmt hub design
6. **New IA** — three groups: Service settings & profile / User & Account info / Business.
7. **Key changes vs. today** —
   - **More relevant grouping** — the new groups match how sitters actually think about their account.
   - **Stronger "needs attention" affordance** — incomplete fields surface at the module level.
   - **Built on Kibble components** — design-system consistency with the rest of the migrated surfaces.
   - **What's moving** — Expansion services move below Pet sitting; Craigslist module is removed; "View profile" access points split contextually rather than one global entry.
8. **Live demo** — prototype iframe (`/service-settings`) + Figma embed of Milestone 1 frame, both with "Open full" buttons.

### GTM
9. **Rollout** — Roll it out progressively (Web first, then Apps), no A/B test. Two-line rationale (web-first sequencing + de-risked before launch via UserTesting).
10. **Plan & alternatives** (2x2):
    - **Pre-launch** — unmoderated UserTesting; decision criteria.
    - **Post-launch monitoring** — per-module traffic + key task completion.
    - **Web first, Apps second** — 20% of traffic is web, 80% is apps. Web rollout de-risks the apps rollout.
    - **Considered & discarded** — splitting the tech migration from the UI improvement into two sequential rollouts. Rejected: doubles the work for no real risk reduction.
11. **What we need from you** — feedback on the progressive rollout approach. Plus: greenlight the UserTesting plan, alignment on rollback metrics. (No M2+ sequencing in the ask.)

## Visual treatment

- Stage: 1600×900, dark navy `#0B1220`, white cards, scaled via ResizeObserver.
- Fonts: Bogart-Semibold display, Averta body. Tokens from `src/tokens/tokens.js`.
- Font sizes bumped vs. the April 30 deck (body 28, eyebrow 18, slide titles 52, main title 84).

## Asset slots

Screenshots for slide 2 live in `public/mgmt-hub-deck/`:
- `mgmt-hub.png` — desktop web Management hub (existing sitters, signed in)
- `ssu.png` — desktop web SSU (prospective sitters completing approval steps)

The slide gracefully shows a labeled placeholder when an image is missing, so the deck is presentable even before the final screenshots land.

## Verification

- `npm run build` must pass.
- `npm run dev` and walk More → Presentations → "Management hub migration", or open `/#/presentations/mgmt-hub-migration` directly.
