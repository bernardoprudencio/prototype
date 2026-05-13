# Service Settings — Variant Iteration

## Context

The Service settings screen ([src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx)) currently renders a single "all pet-sitting services active" variant from `SITTER_PROFILE.services` in [src/data/sitterProfile.js](src/data/sitterProfile.js).

We want to user-test how the same screen behaves for providers in different configurations. Four target variants exist in [Figma — UX2-2136](https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=386-16335):

1. **Pet sitting (all active)** — today's baseline.
2. **Pet sitting (partial) + grooming/training geo** — partial pet-sitting set up; geo supports training and grooming sign-up. Figma node `386:16335`.
3. **Training only** — Figma node `386:16393`.
4. **Grooming only**.
5. **All services active**.

A dev-only **"Configure variants"** button at the bottom of the screen will open a sheet that lets us flip any service between four states (`active` / `inactive` / `available` / `unavailable`). The screen re-renders from that state — one source of truth produces every variant.

The "Add a new service" expandable row and the "Other services" rows are **non-interactive empty clicks** for this prototype — we are not building the sign-up flow.

## Workflow

- Implement one phase at a time, in parallel agents where dependencies allow.
- After each phase, **the user verifies in the browser**.
- This plan file is the handoff between sessions — update the "Status" line of each phase below as work progresses so the next session can pick up cleanly.

---

## Phase 1 — Data + render engine + variant 2 default

**Status:** implementation complete, awaiting user verification in browser. `npm run build` passes.

**What landed:**
- New file [src/data/sitterServices.js](src/data/sitterServices.js) — `SERVICE_STATE` (ACTIVE/INACTIVE), `SERVICE_FAMILY` (pet_sitting/training/grooming), `SERVICES` catalog with `acceptingNew` per service, `FAMILY_SIGNUP` (label + sublabel for "Other services" rows), `DEFAULT_SERVICE_STATES` (variant 2: Boarding/Daycare/DropIn active, House Sitting/Dog Walking inactive, Dog Training/Grooming inactive), `DEFAULT_FAMILY_IN_GEO` (all three true), plus helpers (`getActiveServices`, `getInactiveServices`, `hasActiveServices`, `getActiveServiceStatusLines`, `joinServiceLabels`).
- [src/assets/icons.jsx](src/assets/icons.jsx) — appended `TrainingIcon` and `GroomingIcon` (both `c.success` green, matching the sign-up icon styling in Figma). `ChevronDownIcon` and `ChevronUpIcon` already existed.
- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — refactored to render from `serviceStates` + `familyInGeo`. Iterates `FAMILY_ORDER` and renders any family with active services as a primary section (services list + Phase-1 placeholder Profile rows for pet_sitting only). Each primary section shows an "Add a new service" row with chevron-down when any service in that family is inactive; tap toggles inline expansion. "Other services" section renders below primary sections with one row per `familyInGeo` family that has no active services.

**Goal:** make `ServiceSettingsScreen` data-driven so any variant falls out of a per-service state map. Default state set to **variant 2** to match Figma `386:16335`.

**Deliverables**

1. **New module** `src/data/sitterServices.js` (or extend `sitterProfile.js`) exporting:
   - `SERVICE_STATE = { ACTIVE, INACTIVE, AVAILABLE, UNAVAILABLE }`
   - `SERVICE_FAMILY = { PET_SITTING, TRAINING, GROOMING }`
   - `SERVICES` — flat list of 7 services tagged with `family`, plus `label`, `icon`, `signupLabel`, `signupSublabel`.
   - `DEFAULT_SERVICE_STATES` — variant 2 baseline (Boarding/Doggy Day Care/Drop-In = `ACTIVE`, House Sitting/Dog Walking = `INACTIVE`, Dog Training/Grooming = `AVAILABLE`).

2. **Refactor** [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) to derive sections from `serviceStates` instead of `SITTER_PROFILE.services`. Render rules:
   - For each family in order `[pet_sitting, training, grooming]`, if **any** service in the family is `ACTIVE` → render a primary section with that family's name, a "Services" list of active services, and (Phase 3) family-specific Profile rows. For Phase 1, keep the existing Profile section for pet sitting only.
   - If the active family has any `INACTIVE` services → append an **"Add a new service"** row (chevron-down icon, sublabel listing the inactive service names). Tap toggles inline expansion that lists each inactive service as a plain row (icon + label, empty click, no chevron).
   - After all primary sections, render an **"Other services"** top-level section if any service is `AVAILABLE`, with one row per available service using `signupLabel` + `signupSublabel` (empty click).
   - Business / About you / Destructive sections stay as-is.

3. **Add `ChevronDownIcon`** to [src/assets/icons.jsx](src/assets/icons.jsx) if not present.

**Out of scope this phase**

- Variant config sheet (Phase 2).
- Family-specific Profile rows for Training/Grooming and per-family "View profile" buttons (Phase 3).
- Toast/feedback on empty-click rows.

**Critical files**

- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx)
- [src/data/sitterProfile.js](src/data/sitterProfile.js) / new `src/data/sitterServices.js`
- [src/assets/icons.jsx](src/assets/icons.jsx)

**Reusable building blocks**

- Inline `SettingsRow` / `SubHeading` / `SectionHeader` in `ServiceSettingsScreen` — extend `SettingsRow` to support an expandable variant.
- `ChevronRightIcon` exists; `ChevronDownIcon` likely needs adding.

**Parallelization for the implementing session**

Two agents can run in parallel:
- **Agent A** — Add `ChevronDownIcon` (if missing) and confirm the icon set in `icons.jsx`.
- **Agent B** — Build the data model file (`sitterServices.js` with the four states, family enum, services list, and `DEFAULT_SERVICE_STATES` matching variant 2).

Then sequentially:
- **Agent C** — Refactor `ServiceSettingsScreen` to consume the state map and add the "Add a new service" expansion + "Other services" rendering. Run `npm run build` before reporting done.

**Verification (by user)**

1. `npm run dev` → More → Service settings.
2. Screen matches Figma `386:16335`:
   - Pet sitting section shows Boarding, Doggy Day Care, Drop-In.
   - "Add a new service" row with chevron-down and sublabel "House Sitting or Dog Walking".
   - Tap expands inline, revealing House Sitting and Dog Walking rows.
   - "Other services" section with "Sign-up to dog training" + "Sign-up to grooming".
3. Tapping inactive rows + Other services rows does nothing (empty click).
4. Existing Boarding drill-down (`/service-settings/boarding`) still works.

---

## Phase 1.5 — Polish: inactive-row styling + verify training/grooming icons

**Status:** inactive-row styling complete (landed alongside Phase 1/2 work). Icon audit still open — Training/Grooming icon visuals have not been formally reviewed against Figma.

**What landed:** [src/screens/ServiceSettingsScreen.jsx:394-406](src/screens/ServiceSettingsScreen.jsx#L394) — the inactive-services expansion now renders each row with `leftIcon={<ServiceIcon color={colors.tertiary} />}` and `statusLines={[{ text: 'Inactive', color: 'tertiary' }]}`. The five pet-sitting service icons accept an optional `color` prop (defaults preserved).

**Still open:** icon audit for `TrainingIcon` (currently graduation cap — reads as "school," not "dog training") and `GroomingIcon` (scissors — likely fine). User to provide Figma SVG for training if a swap is wanted.

**Goal:** make the expanded "Add a new service" rows visually read as inactive, and confirm the new training/grooming icons accurately represent those services.

**Deliverables**

1. **Inactive-row styling** — when a service appears under the expanded "Add a new service" row, render it with:
   - Icon stroke/fill in `colors.tertiary` (#62686E).
   - A new sublabel "Inactive" in `colors.tertiary`.

   Today `HouseSitIcon` and `WalkingIcon` each hardcode their own color (`disabledText` and `secondary`) — those colors don't match the spec. The existing icon convention ("no `color` prop — color encodes state from the data layer") needs to bend here because *the same service id* can render as ACTIVE (green) or INACTIVE (tertiary) depending on the variant.

   **Approach:** add an optional `color` prop to the five pet-sitting service icons (`BoardingIcon`, `DaycareIcon`, `DropInIcon`, `WalkingIcon`, `HouseSitIcon`), defaulting to today's hardcoded color so nothing else changes. The screen passes `color={colors.tertiary}` when rendering the inactive expansion.

   The expanded row also gets `statusLines={[{ text: 'Inactive', color: 'tertiary' }]}` — `SettingsRow` already supports `statusLines`, so no component changes needed.

2. **Icon audit** — confirm `TrainingIcon` and `GroomingIcon` match the intended visuals:
   - `GroomingIcon` (scissors) — keep, matches Figma.
   - `TrainingIcon` (graduation cap) — likely replace. Reads as "school," not "dog training." User to provide the Figma SVG (training looked paw/leash-shaped in the Figma asset).
   - If user provides SVG(s), inline the path into [src/assets/icons.jsx](src/assets/icons.jsx) following the existing 24×24 viewBox pattern; keep fill `c.success` (brand green).

**Critical files**

- [src/assets/icons.jsx](src/assets/icons.jsx) — add `color` prop to the 5 pet-sitting service icons; optionally replace `TrainingIcon` path.
- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — in the expanded-inactive map, pass `color={colors.tertiary}` to `<ServiceIcon />` and add the "Inactive" `statusLines` to each row.

**Verification (by user)**

1. Service settings → Pet sitting → tap "Add a new service".
2. House Sitting + Dog Walking rows now show their icons in tertiary grey and a "Inactive" sublabel in tertiary grey.
3. Training and grooming icons in "Other services" read clearly as dog training and grooming respectively.

---

## Phase 2 — Variant config sheet  (upcoming)

**Status:** complete. Verified in browser by user.

**What landed:**
- [src/data/sitterServices.js](src/data/sitterServices.js) — appended a `PRESETS` map with 5 keys (`pet_sitting_all`, `pet_sitting_partial`, `training_only`, `grooming_only`, `all_services`); `pet_sitting_partial` references the existing `DEFAULT_SERVICE_STATES` / `DEFAULT_FAMILY_IN_GEO`. Also added `PRESET_ORDER` and `PRESET_LABEL` exports for the sheet UI.
- [src/context/AppContext.jsx](src/context/AppContext.jsx) — lifted `serviceStates` + `familyInGeo` into context with localStorage init + write-through setters, following the `scheduleMode` pattern. Keys are `SERVICE_STATES_KEY = 'serviceStates'` and `FAMILY_IN_GEO_KEY = 'familyInGeo'`. Deviation from plan: values are JSON-encoded on write and parsed on read (the plan didn't specify, but these maps aren't strings so encoding is required).
- [src/components/ServiceVariantConfigSheet.jsx](src/components/ServiceVariantConfigSheet.jsx) — new file. `BottomSheet variant="full"`, sticky header (`Configure variants` + `Dev only — not in spec` sublabel), three body sections (Quick presets / Per-service state grouped by family / Geo availability), footer with `Reset to default` Flat button + `Done` Default button. Live-edit (no commit/cancel).
- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — replaced the hardcoded `DEFAULT_SERVICE_STATES` / `DEFAULT_FAMILY_IN_GEO` constants with `useApp()` values. Added `configSheetOpen` state plus `applyPreset` / `resetVariants` helpers. Mounted a `Configure variants` Flat button (in its own `paddingBottom: 40` wrapper) below the Destructive area, and mounted the sheet alongside the existing `ChooseProfileSheet`.

**Goal:** ship a dev-only sheet that flips the screen between every variant from a single source of truth so we can user-test all five configurations without code changes.

### Decisions

1. **State model** — keep the current 2-state per-service (`ACTIVE` / `INACTIVE`) + family-level `familyInGeo` boolean. The plan's earlier 4-state framing (`active` / `inactive` / `available` / `unavailable`) was an aspiration that conflated two independent dimensions; `available` / `unavailable` are already expressed by `familyInGeo`. The sheet exposes both dimensions, not a flat 4-chip picker. *(Amended in Phase 2.6: `familyInGeo` now only stores `training` + `grooming`; pet sitting is treated as always-in-geo via the `isFamilyInGeo` helper.)*
2. **State location** — lift `serviceStates` + `familyInGeo` into [src/context/AppContext.jsx](src/context/AppContext.jsx) (not `App.jsx`), matching the existing `scheduleMode` / `resolvedCards` pattern.
3. **Persistence** — both maps persist to `localStorage` (same approach as `scheduleMode`, [AppContext.jsx:5-9](src/context/AppContext.jsx#L5)) so a chosen variant survives a refresh during user testing.
4. **Preset order** — `Pet sitting (all)` → `Pet sitting (partial) + extras` → `Training only` → `Grooming only` → `All services`.
5. **Sheet styling** — no dedicated Figma frame. Follow existing repo conventions: `BottomSheet variant="full"` (sticky header + scrollable body), Button styling per [ChooseProfileSheet:99](src/components/ChooseProfileSheet.jsx#L99).
6. **Reset button** — include a "Reset to default" Flat button at the bottom of the sheet that re-applies the variant-2 baseline (current `DEFAULT_SERVICE_STATES` + `DEFAULT_FAMILY_IN_GEO`).

### Preset definitions

Each preset is a tuple `(serviceStates, familyInGeo)`. Lives in [src/data/sitterServices.js](src/data/sitterServices.js) alongside the catalog so the sheet and screen import from one place.

| Preset key | Pet sitting | Training | Grooming | Figma |
|---|---|---|---|---|
| `pet_sitting_all` | all 5 ACTIVE | INACTIVE, geo=true | INACTIVE, geo=true | baseline |
| `pet_sitting_partial` *(default)* | Boarding / Daycare / Drop-In ACTIVE; House Sit / Walking INACTIVE | INACTIVE, geo=true | INACTIVE, geo=true | `386:16335` |
| `training_only` | all 5 INACTIVE *(but pet sitting is always in geo — see Phase 2.6)* | dog_training ACTIVE | INACTIVE, geo=false | `386:16393` |
| `grooming_only` | all 5 INACTIVE *(but pet sitting is always in geo — see Phase 2.6)* | INACTIVE, geo=false | grooming ACTIVE | structure mirrors Training; reference [`386:15719`](https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=386-15719) for the grooming family layout |
| `all_services` | all 5 ACTIVE | dog_training ACTIVE | grooming ACTIVE | — |

### Deliverables

1. **`src/data/sitterServices.js`** — append `PRESETS` map keyed by the preset ids above; each value is `{ serviceStates, familyInGeo }`.

2. **`src/context/AppContext.jsx`** — add `serviceStates` + `familyInGeo` state, initialized from `localStorage` (falling back to `DEFAULT_SERVICE_STATES` / `DEFAULT_FAMILY_IN_GEO`). Expose setters that also write to `localStorage`. Keys: `SERVICE_STATES_KEY = 'serviceStates'`, `FAMILY_IN_GEO_KEY = 'familyInGeo'`.

3. **`src/components/ServiceVariantConfigSheet.jsx`** — new file. Wraps `BottomSheet variant="full"`.
   - **Header:** `Configure variants` + sublabel `Dev only — not in spec`.
   - **Body sections:**
     1. **Quick presets** — 5 stacked `Button variant="default" size="small" fullWidth` buttons in the order above.
     2. **Per-service state** — 7 service rows grouped under family sub-headers (`Pet sitting`, `Training`, `Grooming`); each row shows the service label + 2 `Chip`s (`Active` / `Inactive`, `checkmark`, `size="small"`).
     3. **Geo availability** — 3 rows, one per family, each with `Chip`s `In geo` / `Not in geo` controlling `familyInGeo[family]`.
   - **Footer:** `Reset to default` Flat button (re-applies variant 2 baseline) + `Done` Button (closes sheet).
   - **Props:**
     ```js
     {
       serviceStates,
       familyInGeo,
       onChangeServiceStates,  // (next) => void
       onChangeFamilyInGeo,    // (next) => void
       onApplyPreset,          // (presetKey) => void  (sets BOTH maps)
       onReset,                // () => void           (re-applies defaults)
       onDismiss,
     }
     ```
   - **Behavior:** edits apply live (no commit/cancel) so the screen behind updates immediately, matching existing patterns.

4. **`src/screens/ServiceSettingsScreen.jsx`** —
   - Replace `const serviceStates = DEFAULT_SERVICE_STATES` / `const familyInGeo = DEFAULT_FAMILY_IN_GEO` ([L256-257](src/screens/ServiceSettingsScreen.jsx#L256)) with values from `useApp()`.
   - Add `configSheetOpen` `useState`.
   - Below the Destructive area, add a new `<Button variant="flat" size="small" fullWidth>` labelled `Configure variants` that opens the sheet.
   - Render `{configSheetOpen && <ServiceVariantConfigSheet ... />}` alongside the existing `ChooseProfileSheet`.

### Out of scope this phase

- Family-specific Profile rows for Training / Grooming (Phase 3).
- Per-family "View profile" link wiring beyond the existing `ChooseProfileSheet` (Phase 3).
- Visual polish — the sheet is a dev tool, not Figma-matched.

### Critical files

- [src/data/sitterServices.js](src/data/sitterServices.js) — add `PRESETS`.
- [src/context/AppContext.jsx](src/context/AppContext.jsx) — add state + setters + localStorage.
- [src/components/ServiceVariantConfigSheet.jsx](src/components/ServiceVariantConfigSheet.jsx) — new file.
- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — wire the button + sheet + consume context state.

### Parallelization

Single agent, sequential, recommended. The work is small and step 1 + 2 both modify shared files; parallelizing risks merge conflicts.

If splitting is preferred:
- **Agent A** — data + context (steps 1 + 2).
- **Agent B** — sheet UI (step 3) against stubbed props.
- **Agent C (or main)** — screen wiring (step 4) once A and B land. Run `npm run build` before reporting done.

### Verification (by user)

1. `npm run dev` → More → Service settings.
2. Default load matches variant 2 (Figma `386:16335`).
3. Scroll to bottom → tap `Configure variants` → sheet opens.
4. Tap each preset in turn → screen re-renders to match each Figma variant.
5. Flip individual chips → screen updates live.
6. Toggle a family's `In geo` to false while no service in that family is `ACTIVE` → that family's row in "Other services" disappears.
7. Tap `Reset to default` → state returns to variant 2.
8. Refresh the page → last-chosen state persists (variant survives reload).

---

## Phase 2.5 — Sheet refinements

**Status:** implementation complete, awaiting user verification in browser. `npm run build` passes.

**What landed:**
- [src/components/Chip.jsx](src/components/Chip.jsx) — added a `disabled` prop (defaults to `false`, so existing call sites are unchanged). When `disabled` is true, `onMouseDown` is not wired, `cursor: 'default'`, the label uses `colors.tertiary`, the border uses `colors.borderInteractive` regardless of `selected`, and body `opacity: 0.6`. The selected blue background fill is preserved per spec. JSDoc updated.
- [src/components/ServiceVariantConfigSheet.jsx](src/components/ServiceVariantConfigSheet.jsx):
  - **Section order** is now `Geo availability` (`topPadding={8}`) → `Quick presets` → `Per-service state` (both default `topPadding={24}`).
  - **`toggleFamilyGeo(family, inGeo)`** wraps the geo setter. When `inGeo === false`, it batches `onChangeServiceStates` with every service in that family set to `SERVICE_STATE.INACTIVE`. Toggling geo back to true leaves services `INACTIVE` (user re-activates manually).
  - **Per-service chips** receive `disabled={!familyInGeo[svc.family]}` on both the `Active` and `Inactive` chip in each row.
  - **Quick presets** are now a wrapped `Chip` row (`flexWrap: 'wrap'`, `gap: 8`, no `checkmark`). Tap calls `handlePresetTap(key)` which sets `lastAppliedPreset` (`useState`), invokes `onApplyPreset(key)`, and starts a 300 ms `setTimeout` (id tracked in a `useRef`) to clear the flash. Rapid taps clear any pending timeout first; a `useEffect` cleanup clears the timeout on unmount. `Button` import is retained for the footer.

**Goal:** reorder the variant config sheet so geo selection (the gating dimension) comes first, disable per-service chips when their family is out of geo, and replace the full-width preset buttons with a compact chip toolbar.

**Deliverables**

1. **Move Geo availability to the top of the sheet** — in [src/components/ServiceVariantConfigSheet.jsx](src/components/ServiceVariantConfigSheet.jsx), reorder the three body sections from `Quick presets → Per-service state → Geo availability` to `Geo availability → Quick presets → Per-service state`. The first `SectionLabel` in the new top section should use `topPadding={8}` (the smaller initial spacing currently applied to `Quick presets`), with the next two reverting to the default `topPadding={24}`. No prop changes; the three section JSX blocks just swap order.

   **Coerce to `INACTIVE` when geo flips off** — when a family's `In geo` chip is toggled to `Not in geo`, the geo handler must *also* coerce every service in that family to `SERVICE_STATE.INACTIVE` via `onChangeServiceStates`. This keeps the data model honest (an out-of-geo family has no business owning `ACTIVE` services) and makes the per-service chips read `Inactive` selected + disabled when the family is out of geo. Toggling geo back on leaves the services `INACTIVE` — the user re-picks which ones to activate. The two state setters can either be called sequentially in the same handler or batched into a new `onToggleFamilyGeo(family, inGeo)` callback exposed from the sheet (cleaner — recommended).

2. **Disable per-service chips when the family's geo is `false`** — for each service row inside `FAMILY_ORDER.map(...)` in the Per-service state section, when `familyInGeo[svc.family] === false`, both the `Active` and `Inactive` `Chip` components for that row should render as non-interactive (visually muted, no tap response). The existing [src/components/Chip.jsx](src/components/Chip.jsx) does **not** currently support a `disabled` prop — its `onMouseDown={onClick}` handler always fires and the cursor is `pointer` whenever `onClick` is set. This phase must add a `disabled` prop to `Chip` (defaults to `false`) that: (a) skips wiring `onMouseDown`, (b) sets `cursor: 'default'`, (c) renders the label in `colors.tertiary` and the border in `colors.borderInteractive` regardless of `selected`, and (d) drops opacity slightly (e.g. `0.6`) on the chip body. Then the sheet passes `disabled={!familyInGeo[svc.family]}` to both chips in each per-service row.

3. **Convert Quick presets from buttons to chips with a momentary "applied" flash** — replace the current `flex-direction: column` stack of `Button variant="default" size="small" fullWidth` rows with a `flex-wrap` row of `Chip` components (`size="small"`, no `checkmark` since presets are momentary actions). Each chip's label is `PRESET_LABEL[key]` and `onClick={() => onApplyPreset(key)}`. Container becomes `{ display: 'flex', flexWrap: 'wrap', gap: 8 }`. Imports of `Button` stay (still used in the footer).

   **Momentary selected flash** — on tap, briefly render that preset's chip with `selected={true}` so the user sees an acknowledgment, then clear it. Add a `lastAppliedPreset` `useState` in `ServiceVariantConfigSheet`; in the wrapper that calls `onApplyPreset(key)`, set `lastAppliedPreset` to `key` and start a `setTimeout` (≈300ms) that clears it back to `null`. Render each chip with `selected={lastAppliedPreset === key}`. Clean up the timeout on unmount (`useEffect` cleanup) so a tap-then-close doesn't leak.

**Critical files**

- [src/components/ServiceVariantConfigSheet.jsx](src/components/ServiceVariantConfigSheet.jsx) — reorder sections, pass `disabled` to per-service chips, replace preset buttons with chips.
- [src/components/Chip.jsx](src/components/Chip.jsx) — add a `disabled` prop that gates `onClick` and applies muted styling. This is a shared component; the change must default to `false` so no existing call site (filter chips, schedule editor) changes behavior.

**Verification (by user)**

1. `npm run dev` → Service settings → `Configure variants`.
2. Sheet body order is `Geo availability` → `Quick presets` → `Per-service state`.
3. Toggle a family (e.g. Training) to `Not in geo` → every service in that family flips to `Inactive` (the `Inactive` chip is selected), and both chips render muted + do nothing on tap.
4. Toggle the same family back to `In geo` → per-service chips become interactive again; services stay `Inactive` until manually re-activated.
5. Quick presets render as a wrapped row of chips. Tapping a preset briefly highlights that chip (≈300ms) and re-renders the screen behind the sheet.
6. Existing filter / schedule chips elsewhere in the app look unchanged (`disabled` defaults to `false`).

---

## Phase 2.6 — Pet sitting is always in geo

**Status:** implementation complete, awaiting user verification in browser. `npm run build` passes.

**Why:** pet sitting is offered in every Rover geo, so the `pet_sitting` slot in `familyInGeo` was dead weight in the user-facing data model and a misleading toggle in the dev variant config sheet. After this change, "Sign-up to pet sitting" always appears in the "Other services" section when a provider has no active pet sitting services — including in the `training_only` and `grooming_only` presets, where today it was hidden by `pet_sitting: false`.

**What landed:**
- [src/data/sitterServices.js](src/data/sitterServices.js):
  - New helper `isFamilyInGeo(family, familyInGeo)` — hardcodes `pet_sitting → true`, otherwise returns `!!familyInGeo[family]`. This is the single point of truth callers should use.
  - `DEFAULT_FAMILY_IN_GEO` is now `{ training: true, grooming: true }` (no `pet_sitting` key).
  - All 5 entries in `PRESETS` had their `pet_sitting` `familyInGeo` key removed; `training` / `grooming` values are unchanged.
  - File-top JSDoc updated to describe the new two-key shape and the pet-sitting carve-out.
- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — the `otherFamilies` filter now reads `isFamilyInGeo(fam, familyInGeo)` instead of `familyInGeo[fam]`, so pet sitting appears in "Other services" whenever no pet sitting service is active. `isFamilyInGeo` added to the existing import.
- [src/components/ServiceVariantConfigSheet.jsx](src/components/ServiceVariantConfigSheet.jsx):
  - **Geo availability** section now filters out `SERVICE_FAMILY.PET_SITTING` before iterating, so only Training and Grooming render rows.
  - **Per-service state** chips use `disabled={!isFamilyInGeo(family, familyInGeo)}` — pet sitting service chips are therefore always interactive; training/grooming chips remain gated by their family's geo toggle.
  - `SERVICE_FAMILY` and `isFamilyInGeo` added to the imports.

**Not touched:**
- [src/context/AppContext.jsx](src/context/AppContext.jsx) — older localStorage values that include a stale `pet_sitting` key are harmless because every read flows through `isFamilyInGeo`, which ignores them.
- [src/components/Chip.jsx](src/components/Chip.jsx).

**Verification (by user)**

1. `npm run dev` → Service settings → `Configure variants`.
2. The Geo availability section shows two rows only: Training, Grooming.
3. Apply the `Training only` preset → screen renders Training as a primary section, and "Other services" now contains both "Sign-up to pet sitting" and (no grooming row, since grooming geo is false). Same exercise for `Grooming only` → "Other services" shows "Sign-up to pet sitting" alongside grooming.
4. In the sheet's Per-service state section, pet sitting service chips stay interactive regardless of any geo toggle.
5. Refresh the page after applying a preset → state persists, no console errors from the stale `pet_sitting` key in older localStorage.

---

## Phase 3 — Family-specific Profile rows + "View profile" buttons

**Status:** complete. Verified in browser by user.

**What landed:**
- [src/data/sitterServices.js](src/data/sitterServices.js) — appended `FAMILY_PROFILE_ROWS` (keyed by `SERVICE_FAMILY`; pet sitting, training, grooming row sets per the spec table) and `getFamilyProfileRows(family)` helper. Row shape: `{ id, label, sublabel, completionKey? }`. `completionKey` is a 2-segment dotted path into `SITTER_PROFILE.profile` (e.g. `'petSitting.testimonialsComplete'`).
- [src/data/sitterProfile.js](src/data/sitterProfile.js) — restructured `SITTER_PROFILE.profile` from `{ testimonialsComplete: true }` to `{ petSitting: { testimonialsComplete: true }, training: { testimonialsComplete: false }, grooming: {} }`.
- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx):
  - Added a module-level `resolveCompletion(path, profile)` helper (2-segment dotted path → `!!profile?.[head]?.[tail]`).
  - Added a `handleViewProfile(family)` helper that returns `openProfileSheet` for pet sitting and `noop` for training/grooming.
  - The family-loop `SectionHeader` now uses `onRightLink={handleViewProfile(family)}` (was `openProfileSheet` unconditionally); `rightLinkLabel="View profile"` stays unconditional.
  - Replaced the pet-sitting-only Profile block with a generic IIFE that pulls `getFamilyProfileRows(family)`: if the array is empty, nothing renders; otherwise it renders the `Profile` `SubHeading` + a `SettingsRow` per row with `rightItem={isComplete ? <CheckCircleIcon /> : <Chevron />}`. Rows render with no `leftIcon`, matching the prior pet sitting pattern.
- The "About you → View profile" Kibble Link Primary control (L508) was explicitly **not** touched — out of scope per Decision #8.

**Goal:** make the family loop in `ServiceSettingsScreen` render a *family-specific* Profile section (different rows for Training vs. Grooming vs. Pet sitting) and surface a "View profile" Flat button on every active family's section header. After this phase, variant 3 (training-only) and variant 4 (grooming-only) match their Figma frames and the existing pet sitting baseline gains a visible "View profile" entry point.

### Figma reference

- **Training-only:** [`386:16393`](https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=386-16393)
- **All-active (grooming visible inside):** [`386:15719`](https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=386-15719) — Figma does not have a dedicated grooming-only frame; the `all` frame is the grooming reference.
- **Pet sitting baseline (partial):** [`386:16335`](https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=386-16335) — already includes a `View profile` Flat button on the section header that today's prototype already wires up.

### Decisions

1. **"View profile" label is identical across families** — `View profile`, not `View training profile` or `View grooming profile`. Confirmed from Figma. This keeps the family-section header API symmetric and matches the existing pet sitting button.
2. **`SectionHeader` is already Phase-3-ready** — [src/screens/ServiceSettingsScreen.jsx:68-110](src/screens/ServiceSettingsScreen.jsx#L68) accepts `rightLinkLabel` + `onRightLink`. No structural change needed; we just pass the prop pair for every active family instead of pet sitting only.
3. **Profile rows are family-specific and live in the data layer** — add a new export `FAMILY_PROFILE_ROWS` to [src/data/sitterServices.js](src/data/sitterServices.js). Keeping it next to the catalog (not in `sitterProfile.js`) preserves the "one place to look for the service-settings shape" principle established in Phase 2. Backing data (which rows are "complete" / show a green check) stays in `sitterProfile.js`.
4. **Only pet sitting opens the picker sheet** — pet sitting has multiple profiles to pick between (pet parent, cat parent, cat parents on Cat in a Flat), so its `View profile` button opens `ChooseProfileSheet`. Training and Grooming each have a **single** profile — their `View profile` button skips the picker and would navigate straight to that single profile in production. In this prototype, "navigate to a single profile" = empty click (no destination screen yet). `ChooseProfileSheet.jsx` is **not modified** in Phase 3.
5. **No collapsible subsection headers** — the `all` frame shows caret-down icons on the Services and Profile subsection headers (collapsible groups). The standalone `training-only` and `pet-sitting-partial` frames do **not** show those carets. Match the standalone frames; skip the collapsible behavior. Easier to revisit in Phase 4 if needed.
6. **No section sublabel under family titles** — the doc previously speculated about "How clients see your training services" sublabels; the Figma does not include them. Skip.
7. **Testimonials row uses a green checkmark when complete** — same `CheckCircleIcon` pattern already used in the pet sitting Testimonials row. Each row in the catalog declares whether it can show a completion indicator (and the backing flag lives in `sitterProfile.js`).
8. **"About you" Link button is out of scope** — the "About you" section uses a separate Kibble Link Primary 100 control with a `View profile` label. That is a different component pattern and not part of this phase.

### Profile rows per family (from Figma)

Define this catalog in [src/data/sitterServices.js](src/data/sitterServices.js) as `FAMILY_PROFILE_ROWS`. Each row: `{ id, label, sublabel?, completionFlag? }`.

| Family | Rows |
|---|---|
| `pet_sitting` | `information` — "Information" / "Edit your pet profile information" <br> `photos` — "Photos" / "Manage your profile gallery" <br> `testimonials` — "Testimonials" / "Ask people to write about your pet care experience." *(completion: `petSittingTestimonialsComplete`)* |
| `training` | `trainer_experience` — "Trainer experience" / "Fill out your training bio to highlight your training qualifications for pet parents." <br> `photos` — "Photos" / "Manage your profile gallery" <br> `credentials` — "Credentials" / "This will show on your profile and the search page." <br> `testimonials` — "Testimonials" / "Ask people to write about your trainer experience." *(completion: `trainingTestimonialsComplete`)* |
| `grooming` | `edit_profile` — "Edit profile" / "Build your Grooming profile" |

> Pet sitting rows match what currently renders in [src/screens/ServiceSettingsScreen.jsx:412-434](src/screens/ServiceSettingsScreen.jsx#L412). Phase 3 migrates them into the catalog so the screen no longer needs an `if (family === PET_SITTING)` branch — the rows just come from the data.

### Deliverables

1. **[src/data/sitterServices.js](src/data/sitterServices.js)** — append:
   - `FAMILY_PROFILE_ROWS` keyed by `SERVICE_FAMILY`; each value is the ordered array of rows in the table above. Each row is `{ id, label, sublabel, completionKey? }` where `completionKey` is the matching path into `SITTER_PROFILE` (e.g. `'training.testimonialsComplete'`).
   - Helper `getFamilyProfileRows(family)` returning the array (or `[]` if unknown).

2. **[src/data/sitterProfile.js](src/data/sitterProfile.js)** — extend `SITTER_PROFILE.profile` to include per-family completion data so the green-check indicators work across all three families. New shape:
   ```js
   profile: {
     petSitting: { testimonialsComplete: true },
     training:   { testimonialsComplete: false },
     grooming:   {},
   }
   ```
   Migrate the existing `testimonialsComplete: true` into `petSitting.testimonialsComplete`.

3. **[src/components/ChooseProfileSheet.jsx](src/components/ChooseProfileSheet.jsx)** — not modified in this phase. Stays hardcoded to its current pet sitting picker.

4. **[src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx)** —
   - Replace the hardcoded pet-sitting Profile block ([L412-434](src/screens/ServiceSettingsScreen.jsx#L412)) with a generic loop that pulls `getFamilyProfileRows(family)` and renders each row via the existing `SettingsRow`. The completion indicator is looked up by `completionKey` against `SITTER_PROFILE.profile`.
   - In the family-loop body, pass `rightLinkLabel="View profile"` + `onRightLink={handleViewProfile(family)}` on the `SectionHeader` for **every** active family.
   - `handleViewProfile(family)` returns a callback that branches on family:
     - `pet_sitting` → `openProfileSheet()` (opens the existing `ChooseProfileSheet`).
     - `training` / `grooming` → empty click (would navigate to the single profile in production; no destination screen yet).

### Out of scope

- Routing to a real "View profile" destination for Training / Grooming — those buttons stay as empty clicks. Pet sitting keeps the existing sheet-as-stub behavior (sheet opens, profile tap dismisses).
- Tapping individual Profile rows to drill into a sub-screen (e.g. an editable "Trainer experience" form) — empty click for this prototype, same as today's pet sitting Profile rows.
- Modifying `ChooseProfileSheet` — stays pet-sitting-only.
- Collapsible Services / Profile subsection headers (caret-down on the subsection itself).
- Match-Figma polish on borders/typography across family groups — Phase 4.

### Critical files

- [src/data/sitterServices.js](src/data/sitterServices.js) — add `FAMILY_PROFILE_ROWS` + helper.
- [src/data/sitterProfile.js](src/data/sitterProfile.js) — restructure `profile` map by family.
- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — generalize the Profile section render + propagate `View profile` to every active family + branch the click handler per family.

### Parallelization

Single agent, sequential, recommended — the work is small and both deliverables touch overlapping data/screen state. If splitting is preferred:
- **Agent A** — data work: append `FAMILY_PROFILE_ROWS` + `getFamilyProfileRows` to `sitterServices.js`; restructure `sitterProfile.profile` to per-family completion data; update any reader of the old `testimonialsComplete` (grep first — likely only `ServiceSettingsScreen.jsx`).
- **Agent B (or main)** — screen wiring: replace the hardcoded Pet sitting Profile block with the data-driven loop, propagate `rightLinkLabel`/`onRightLink` for all active families, branch the click handler so only pet sitting opens the sheet. Run `npm run build` before reporting done.

### Verification (by user)

1. `npm run dev` → More → Service settings.
2. **Variant 2 (default — pet sitting partial):** Pet sitting section header shows `View profile` Flat button on the right. Tapping opens `ChooseProfileSheet` (header: `Pet sitting` / `Choose a profile to view as`) — unchanged from today.
3. **Variant 3 (Training only) via Configure variants → `Training only`:** Training section appears as the primary family with a `View profile` Flat button on the right. Profile subsection lists 4 rows: Trainer experience, Photos, Credentials, Testimonials (Testimonials sublabel reads "Ask people to write about your trainer experience."; no green check by default since `training.testimonialsComplete = false`). Tapping `View profile` does nothing (empty click — no sheet opens).
4. **Variant 4 (Grooming only) via Configure variants → `Grooming only`:** Grooming section appears as the primary family with `View profile` button. Profile subsection lists 1 row: "Edit profile" / "Build your Grooming profile". Tapping `View profile` does nothing (empty click — no sheet opens).
5. **Variant 5 (All services):** all three families render with their own Profile rows + `View profile` buttons stacked top to bottom. Only the Pet sitting button opens the sheet.
6. Existing Boarding drill-down (`/service-settings/boarding`) and the rest of the screen (Business, About you, Destructive) are unaffected.

---

## Phase 3.5 — Collapsible Services / Profile sub-sections (multi-family only)

**Status:** implementation complete, awaiting user verification in browser. `npm run build` passes.

**What landed:**
- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — extended `SubHeading` with optional `collapsible` / `collapsed` / `onToggle` props (defaults preserve the existing render byte-for-byte); when `collapsible` is true the whole row becomes the tap target (`cursor: 'pointer'`, `onClick={onToggle}`) and a right-aligned 24×24 caret slot (`marginLeft: 'auto'`) renders `<ChevronUpIcon />` when collapsed and `<ChevronDownIcon />` when expanded.
- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — added `const [collapsedSubsections, setCollapsedSubsections] = useState({})` next to `expandedFamilies`, plus a `toggleSubsection(family, key)` helper that flips `collapsedSubsections[family][key]` (missing key === expanded). Purely transient — no context / localStorage.
- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — derived `const subsectionsCollapsible = primaryFamilies.length > 1` next to `primaryFamilies`.
- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — wired the family loop's Services `SubHeading` with the trio of props and gated both the `activeServices.map(...)` block **and** the `Add a new service` expandable row on `!collapsedSubsections[family]?.services` (they live inside the Services group together).
- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — wired the family loop's Profile `SubHeading` (inside the existing IIFE) with the same trio and gated `profileRows.map(...)` on `!collapsedSubsections[family]?.profile`. The `return null` for `profileRows.length === 0` was preserved — empty families still render no heading and no caret.

**Goal:** when the screen renders more than one active primary family (e.g. `All services`, or Pet sitting + Training), each family's `Services` and `Profile` sub-section headers become collapsible — tapping the header toggles its rows. When only one primary family is active (variant 2 / variant 3 / variant 4) the carets do not render and the rows stay always-expanded, matching the standalone Figma frames. This unlocks the `all` layout's visual density without regressing the single-family variants. Closes Phase 3 Decision #5.

### Figma reference

- **All-active (carets visible on Services + Profile of every family):** [`386:15719`](https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=386-15719)
- **No-caret references (kept as-is):** training-only [`386:16393`](https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=386-16393), pet-sitting-partial [`386:16335`](https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=386-16335).

### Figma findings (from `386:15719`)

- Each family (Pet sitting / Training / Grooming) contains **two** independently-carat-ed sub-sections: `Services` and `Profile`. That is **6 carets total** in the all-active frame.
- The caret sits in a 24×24 `rightElement` on the **right edge** of the sub-section header row (mirrors the `View profile` Flat button's position on the family-level `SectionHeader`, just one row down). Not left-of-label.
- The vector geometry for all 6 carets is identical (`inset bottom-[38%] left-1/4 right-1/4 top-[37.5%]`) — a single chevron-down state. Figma does not draw a separate expanded/collapsed variant, so the visual flip to chevron-up is an implementation detail.
- The family-level header (`Pet sitting` / `Training` / `Grooming`) keeps its `View profile` Flat button on the right — it is **not** collapsible. Only the `Services` and `Profile` sub-headings within each family collapse.
- No hover/press state is drawn for the caret. Treat as a plain tap target — reuse the standard row-tap idiom from `Add a new service`.
- Default state in the frame is "all carets pointing down" — i.e. **all expanded by default** when the screen first loads.

### Decisions

1. **Carets only render when more than one primary family is active.** Rule: `primaryFamilies.length > 1` (derived in the screen body already — [src/screens/ServiceSettingsScreen.jsx:299](src/screens/ServiceSettingsScreen.jsx#L299)). The boolean is passed into `SubHeading` as `collapsible`.
2. **Single-family-mode skips the caret entirely** — no caret rendered, no tap handler attached, no extra hit area. We do **not** ship a "rendered but disabled" caret. The Phase 3 standalone frames (`386:16335`, `386:16393`) do not show any affordance and we match them exactly.
3. **Default expand state when multiple families render: all expanded.** Matches the Figma `all` frame (every caret is in chevron-down posture). New entries in the state map are implicitly expanded (missing key === expanded).
4. **Granularity: one independent collapse state per `(family, subsection)` pair.** Figma draws each caret independently — collapsing Pet sitting → Services must not collapse Pet sitting → Profile or Training → Services. Single nested map keyed `{ [family]: { services: bool, profile: bool } }` storing `true` = collapsed. Missing key = expanded.
5. **State does not persist across navigation or reload.** The collapse map lives in `useState` inside `ServiceSettingsScreen`, not in `AppContext` and not in `localStorage`. This matches the `expandedFamilies` state already used for the `Add a new service` inline expansion — a transient UI affordance, not a user preference. Re-mounting the screen re-expands everything.
6. **Switching presets in the variant config sheet leaves the collapse map untouched.** Families no longer rendered simply aren't read from the map; new families that appear default to expanded (missing-key === expanded). No `useEffect` reset needed.
7. **The whole sub-section header row is the tap target, not just the caret icon.** Reuses the existing `Add a new service` row pattern ([src/screens/ServiceSettingsScreen.jsx:403-409](src/screens/ServiceSettingsScreen.jsx#L403)). When `collapsible` is false the row has no `onClick`, no `cursor: pointer`.
8. **Family-level `SectionHeader` is not collapsible.** Confirmed against `386:15719` — the family header keeps its `View profile` Flat button on the right; no caret. Only the two sub-sections inside each family collapse.
9. **No animation on expand/collapse.** Figma does not draw transitional states. Conditional render is fine; do not introduce `max-height` transitions or similar.
10. **Caret icon swap mirrors the `Add a new service` row** — `<ChevronDownIcon />` when expanded (matches Figma's drawn state), `<ChevronUpIcon />` when collapsed. Both icons already exist in [src/assets/icons.jsx](src/assets/icons.jsx) and are imported by `ServiceSettingsScreen`.

### Deliverables

1. **[src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx)** — every change lives in this one file.

   1. **Extend `SubHeading`** ([L114-148](src/screens/ServiceSettingsScreen.jsx#L114)) to accept three new props (all optional, default to non-collapsible behavior so the existing call sites are unaffected if anything else ever calls it):
      - `collapsible: bool` — whether to render the caret and wire the tap handler.
      - `collapsed: bool` — current state. When `true`, render `<ChevronUpIcon />`; when `false`, render `<ChevronDownIcon />`. Ignored if `collapsible` is `false`.
      - `onToggle: () => void` — fired when the row is tapped. Only wired when `collapsible` is `true`.

      Implementation: wrap the existing `div` so the entire row becomes a tappable surface when `collapsible` is `true` (`onClick={onToggle}`, `cursor: 'pointer'`); add a right-aligned 24×24 slot at the end of the flex row containing the chevron icon. When `collapsible` is `false`, render the existing markup unchanged (no chevron slot, no `onClick`, no `cursor` change). Keep `gap: 12` and the left icon untouched. The right slot should `marginLeft: 'auto'` so the chevron pins to the trailing edge — matches Figma's `rightElement` placement.

   2. **Add a new state map** alongside `expandedFamilies` (the existing `Add a new service` toggle, [L266](src/screens/ServiceSettingsScreen.jsx#L266)):
      ```js
      // Keyed `{ [family]: { services: true, profile: true } }`. `true` = collapsed.
      // Missing key === expanded. Cleared on screen unmount; presets do not reset it.
      const [collapsedSubsections, setCollapsedSubsections] = useState({})
      ```
      Plus a toggler:
      ```js
      const toggleSubsection = (family, key) =>
        setCollapsedSubsections((prev) => ({
          ...prev,
          [family]: { ...prev[family], [key]: !prev[family]?.[key] },
        }))
      ```

   3. **Derive the `collapsible` flag once** alongside `primaryFamilies` ([L299](src/screens/ServiceSettingsScreen.jsx#L299)):
      ```js
      const subsectionsCollapsible = primaryFamilies.length > 1
      ```

   4. **Wire the Services sub-section** ([L381-398](src/screens/ServiceSettingsScreen.jsx#L381)). Replace the bare `<SubHeading Icon={ListIcon} title="Services" topPadding={32} />` with:
      ```jsx
      <SubHeading
        Icon={ListIcon}
        title="Services"
        topPadding={32}
        collapsible={subsectionsCollapsible}
        collapsed={!!collapsedSubsections[family]?.services}
        onToggle={() => toggleSubsection(family, 'services')}
      />
      ```
      Wrap the existing Services rendering — the `activeServices.map(...)` block (L382-398) **and** the `Add a new service` block (L400-424) — in `{!collapsedSubsections[family]?.services && (<>...</>)}`. The `Add a new service` row is part of the Services group and must hide with it.

   5. **Wire the Profile sub-section** ([L430-450](src/screens/ServiceSettingsScreen.jsx#L430)) inside the existing IIFE. Same shape: pass `collapsible`/`collapsed`/`onToggle` to the `<SubHeading Icon={PersonIcon} title="Profile" ... />`, then gate the `profileRows.map(...)` on `!collapsedSubsections[family]?.profile`. The IIFE's early `return null` when `profileRows.length === 0` stays — if a family has zero profile rows we render neither the heading nor any caret (correct: there is nothing to collapse).

2. **No data-layer changes.** Do not touch [src/data/sitterServices.js](src/data/sitterServices.js), [src/data/sitterProfile.js](src/data/sitterProfile.js), or [src/context/AppContext.jsx](src/context/AppContext.jsx). This is pure UI state confined to `ServiceSettingsScreen`.

3. **No icon work.** `ChevronDownIcon` and `ChevronUpIcon` already exist in [src/assets/icons.jsx](src/assets/icons.jsx) and are already imported by `ServiceSettingsScreen`.

### Out of scope

- Animating the expand/collapse transition (Figma shows no transitional state).
- Collapse on the `Add a new service` row — it owns its own existing expand toggle and is unrelated.
- Collapse on top-level sections (`Other services`, `Business`, `About you`, `Destructive area`).
- Collapse on the family-level `SectionHeader` (`Pet sitting` / `Training` / `Grooming`) — confirmed not collapsible in Figma; the `View profile` Flat button stays.
- Persisting collapse state across reloads or sheet preset changes.

### Critical files

- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — the only file modified.

### Parallelization

Single agent, sequential. The work is small (≈40 lines in one file) and the deliverables are tightly coupled. Run `npm run build` before reporting done.

### Verification (by user)

1. `npm run dev` → More → Service settings.
2. **Default load (variant 2 — pet sitting partial, single active family):** the `Services` and `Profile` sub-headings render with no caret on the right. Tapping the header does nothing. Rows are always visible.
3. **Variant 3 (`Training only`) via `Configure variants` → `Training only`:** still a single active family. Still no carets on Services or Profile. All rows visible.
4. **Variant 5 (`All services`) via `Configure variants` → `All services`:** 3 primary families render. Each family's `Services` and `Profile` sub-headings now show a chevron-down icon on the right (6 carets total). All sub-sections start expanded.
5. Tapping Pet sitting → Services caret collapses **only** that group (the `Services` rows and the `Add a new service` row hide; the caret flips to chevron-up). Pet sitting → Profile rows stay visible. Training and Grooming are unaffected.
6. Tap again → the group re-expands; caret flips back to chevron-down.
7. Each `(family, subsection)` pair toggles independently — verify by collapsing Pet sitting → Profile and Training → Services simultaneously.
8. **2-family case:** apply `Pet sitting (partial) + extras` (a single-family preset), then open `Configure variants` and manually flip the Training family's `dog_training` chip to `Active`. Two families now render → carets appear on every sub-section. Same toggle behavior.
9. **Switching back to a single-family preset (`Pet sitting (all)`):** carets disappear cleanly. No stale tap target. Rows are visible.
10. Reload the page → collapse state resets (everything expanded) as intended.

---

## Phase 4 — Polish

**Status:** implementation complete, awaiting user verification in browser. `npm run build` passes.

**What landed:**
- [src/screens/ServiceSettingsScreen.jsx:69-111](src/screens/ServiceSettingsScreen.jsx#L69) — `SectionHeader` typography swapped from `typography.displayFamily` (Bogart-Semibold) to `typography.fontFamily` (Averta). Matches Figma's Heading 300 token exactly. Size 20px / weight 600 / lineHeight 1.25 / color `colors.primary` were already correct.
- [src/screens/ServiceSettingsScreen.jsx:274-286](src/screens/ServiceSettingsScreen.jsx#L274) — replaced the standalone `SectionDivider` (top-border with 40px margins above & below) with a `SectionGroup` wrapper that renders its children in a 40px bottom-padded container with a `borderBottom: 1px solid #D7DCE0`. The two patterns produce visually identical horizontal lines but place the rule on the trailing edge of the section instead of in a standalone divider element — matches Figma's structure where each section group owns its own `border-b`.
- [src/screens/ServiceSettingsScreen.jsx:415-548](src/screens/ServiceSettingsScreen.jsx#L415) — body sections rewired:
  - Each family in `primaryFamilies` is wrapped in `<SectionGroup>` (bordered).
  - "Other services" is rendered **without** a border (Figma drops the rule under this section in `386:16393`).
  - "Business" and "About you" each get `<SectionGroup>` (bordered).
  - "Destructive area" stays unbordered (last item in the scroll-container, matches Figma).
  - "Configure variants" Flat button stays at the bottom in its own `paddingBottom: 40` wrapper — out of the section-group system because it's a dev affordance.
- Section-title top padding standardized: every `SectionHeader` after the first uses `topPadding={40}`. The first primary family keeps `topPadding={24}` to match the scroll-container's `py-24` from Figma.

**Goal:** match Figma's section-divider treatment (a 1px `#D7DCE0` border on the trailing edge of each grouped section) and align top-level section title typography with the Heading 300 token (Averta Semibold 20/1.25), without touching family-internal layout or any other phase's contracts.

### Figma findings

Reference frames: [`386:15719`](https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=386-15719) (all active), [`386:16335`](https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=386-16335) (pet sitting partial), [`386:16393`](https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=386-16393) (training only).

- **Border color:** `#D7DCE0` confirmed in every frame. Identical to `colors.border` in [src/tokens/tokens.js:142](src/tokens/tokens.js#L142) — no new token needed.
- **Border placement:** Figma renders the rule as `border-b` on the **inner group** of each section (e.g. `pet-sitting`, `training`, `grooming`, `business`, `about-you`), not as a standalone divider. Each bordered group has `pb-40` so the rule sits 40px below its last row.
- **Title spacing:** The row containing the family/section title has `pt-40` (40px top padding) from the line above. The first section in the page uses `pt-24` instead (inherited from the scroll-container's `py-24`).
- **Which sections get the border:**
  - **Pet sitting / Training / Grooming family groups** — yes, `border-b`.
  - **Business** — yes, `border-b`.
  - **About you** — yes, `border-b`.
  - **Other services** — **no border** (confirmed in `386:16393`; the section flows directly into Business with the standard `pt-40` title spacing).
  - **Destructive area** — no border (last section in the scroll-container, no following content).
- **Typography for top-level titles** (`Pet sitting` / `Training` / `Grooming` / `Other services` / `Business` / `About you` / `Destructive area`):
  - `font-['Averta:Semibold']`, `text-[20px]`, `leading-[1.25]`, color `#1F2124`.
  - Matches the `heading_300` design token (also exposed as `textStyles.heading300` in [src/tokens/tokens.js:202](src/tokens/tokens.js#L202)).
  - The current implementation uses `typography.displayFamily` (Bogart-Semibold) which is wrong — Bogart is the display family, Averta is the body family. Figma uses Averta here.
- **Sub-section titles** (`Services`, `Profile`) and row labels remain `Averta Semibold 16` — already correct in the prototype. Phase 4 does **not** touch these.

### Decisions

1. **Match Figma's border-on-section-group structure** rather than keeping the standalone `SectionDivider` element. Both render an identical 1px horizontal rule visually, but Figma's structure means the border belongs to the section above (not a divider between two siblings). Refactoring lets us cleanly skip the rule under "Other services" without special-casing the divider component.
2. **No new shared component.** `SectionGroup` is a local helper inside `ServiceSettingsScreen` next to `SectionHeader` and `SubHeading`. Borrowing the existing convention of small inline section primitives keeps the file self-contained.
3. **`SectionDivider` removed.** Every call site is replaced; nothing else in the screen uses it. No backwards compatibility concern.
4. **Family loop keeps existing internal layout.** The bordered wrapper goes around each family's `SectionHeader + Services + Profile` block. Internal sub-section spacing (`topPadding={32}` on `SubHeading`, 16px row padding) is unchanged.
5. **Top padding for the first family stays 24px (not 40px)** to match the scroll-container's `py-24` from Figma. Every subsequent top-level title (Other services, Business, About you, Destructive area, and the 2nd/3rd family if multiple are active) uses 40px.
6. **Typography fix is the `fontFamily` swap only** — size, weight, lineHeight, color are already correct.
7. **Sub-section / row typography is out of scope.** Only top-level (Heading 300) section titles get reviewed; the rest of the screen already matches Figma.
8. **The toast on empty-click rows is skipped.** Phase 4's original third bullet (small toast) is dropped from this phase. We're optimizing for landing the visible polish in a small PR; toast feedback can ship in a follow-up if user-test feedback calls for it.

### Deliverables

1. **[src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx)** — every change lives in this one file.

   1. **Fix typography on `SectionHeader`** ([L80-90](src/screens/ServiceSettingsScreen.jsx#L80)). Change `fontFamily: typography.displayFamily` to `fontFamily: typography.fontFamily`. Leave size (20), weight (600), lineHeight (1.25), color (`colors.primary`) untouched.

   2. **Replace `SectionDivider` with `SectionGroup`** ([L277-286](src/screens/ServiceSettingsScreen.jsx#L277)). New component:
      ```jsx
      // Wraps a top-level section group. Renders a 40px bottom padding and a
      // 1px #D7DCE0 trailing border that matches Figma's section structure.
      const SectionGroup = ({ children }) => (
        <div
          style={{
            paddingBottom: 40,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {children}
        </div>
      )
      ```

   3. **Rewire body sections** ([L409-642](src/screens/ServiceSettingsScreen.jsx#L409)):
      - Wrap each `primaryFamilies.map(...)` family in `<SectionGroup>` and remove the trailing `<SectionDivider />`.
      - Leave **Other services** as a bare `<div>` — no `SectionGroup` (Figma has no rule here).
      - Wrap **Business** in `<SectionGroup>` and remove the trailing `<SectionDivider />`.
      - Wrap **About you** in `<SectionGroup>` and remove the trailing `<SectionDivider />`.
      - Leave **Destructive area** as a bare `<div>` (last section, no rule beneath in Figma).

   4. **Update top-padding values on `SectionHeader`s** so each section title has the correct 40px gap from the line above:
      - First primary family (`idx === 0`): `topPadding={24}` (matches scroll-container `py-24`).
      - Subsequent families (`idx > 0`): `topPadding={40}`.
      - **Other services** title: `topPadding={40}`.
      - **Business** title: `topPadding={40}`.
      - **About you** title: `topPadding={40}`.
      - **Destructive area** title: `topPadding={40}`.

2. **No data-layer changes.** Phase 4 does not touch [src/data/sitterServices.js](src/data/sitterServices.js), [src/data/sitterProfile.js](src/data/sitterProfile.js), [src/context/AppContext.jsx](src/context/AppContext.jsx), or any sheet / chip component.

3. **No icon or token changes.** `colors.border` already equals `#D7DCE0` ([src/tokens/tokens.js:142](src/tokens/tokens.js#L142)); `typography.fontFamily` already equals `Averta` ([src/tokens/tokens.js:177](src/tokens/tokens.js#L177)).

### Out of scope

- **Toast on empty-click rows.** Dropped from this phase. Revisit in a follow-up if user-test sessions surface the issue.
- Any change to sub-section (`Services`, `Profile`) typography or layout.
- Family-internal row spacing, icon styling, or chevron behavior.
- The `Configure variants` dev-only button (not in Figma; treated as out-of-spec scaffolding).
- The "About you → View profile" Link Primary control (separate Kibble component, unchanged since Phase 3 Decision #8).

### Critical files

- [src/screens/ServiceSettingsScreen.jsx](src/screens/ServiceSettingsScreen.jsx) — the only file modified.

### Verification (by user)

1. `npm run dev` → More → Service settings.
2. **Default load (variant 2 — pet sitting partial):** the Pet sitting family group has a thin grey rule (`#D7DCE0`) running under its last row, separated from the next section title by 40px on either side. Title typography reads as Averta (slightly narrower / cleaner than the previous Bogart cut) at 20px.
3. **Variant 3 (`Training only`) via Configure variants:** the Training family group still has its trailing rule. The "Other services" section that follows has **no** rule under "Sign-up to pet sitting" / "Sign-up to grooming" — it flows straight into Business with 40px spacing above the "Business" title.
4. **Variant 5 (`All services`) via Configure variants:** each of Pet sitting, Training, and Grooming family groups has its own trailing rule. Business and About you also have trailing rules. Destructive area has no rule under it.
5. The `SectionHeader` title font visibly differs from before (Averta is the narrower body face; Bogart is the rounder display face). All other text (sub-section labels, row labels, sublabels) is unchanged.
6. Existing Boarding drill-down (`/service-settings/boarding`) is unaffected.
