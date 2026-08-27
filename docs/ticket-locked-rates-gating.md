# Ticket — locked-rates gating and interaction parity

Follow-up to `docs/plan-details-and-modify.md` §2.5, §2.6 and the "Locked rates" row of §3.
Everything the details/modify-booking pass deliberately **raised rather than fixed** is
collected here.

Production source of truth: `/Users/bernardoprudencio/Projects/web` (`roverdotcom/web`).
Paths below are relative to that repo root; prototype paths are relative to this repo root.

**Nothing here is a live defect.** Item 1 is a fidelity gap, item 2's namespace split is
latent and currently unreachable (its positional-lookup sibling *was* live and is now
fixed — see the subsection under item 2), item 3 is an interaction difference between two surfaces that are both
individually faithful to *a* production surface. None of the three blocks the current pass.

> All prototype line numbers were re-confirmed against the tree after the details/modify pass
> landed. Symbol names remain the durable anchors — re-confirm the numbers if further edits
> land in `useLockedRates.js`, `BookingDetailsScreen.jsx` or `relationshipData.js` before this
> ticket is picked up.

---

## The three gates, side by side

| Surface | Production control | Prototype control | Interaction |
|---|---|---|---|
| Conversation details ledger | `ConversationLockRates` (server-driven `LockRates` payload) — `details/ConversationPriceLedger.tsx:88` | `LockRatesToggleRow` in `BookingDetailsScreen.jsx` (`useLockedRates(client, booking)`, `:198`) | **modal** — `LockRatesModal.tsx` / `LockRatesSheet.jsx` |
| Modify booking (one-time) | `LockedRatesComponent` nested in `RatesComponent` — `RatesComponent.tsx:77-81, :104` | `ModifyBookingScreen`'s Rates section | **no modal** — matches production, via `useLockedRates(..., { mode: 'immediate', snackbar: false })` |
| Manage current week (recurring) | **not rendered** — `RatesComponent` suppressed, see item 1 | `PricingLedger` renders it — `CurrentWeekScreen.jsx:134-136, :187-214` | modal |
| Relationship page "Rates" row | **does not exist** in production | `RelationshipPage/RelationshipPage.jsx:88-106` | modal |

The canonical server-side gate is `_get_lock_rates_toggle()`
(`src/aplaceforrover/conversations/api/mappers/details/price_ledger.py:1720-1742`), called from
`:1446`. Its five conditions — not grooming (`:1721`), provider *and* `is_paid()` (`:1725`),
browsable conversation (`:1726`), no cancelled stay (`:1727`) — are mirrored in
`isLockableConversation` (`src/data/lockableRates.js:139-144`). **There is deliberately no
`is_recurring` check.** The prototype's mirror is correct; the divergences below are all on
the *client* side of production.

---

## Item 1 — `CurrentWeekScreen` renders a control production suppresses

### What production does

`ModifyBookingPage` is one screen serving both one-time ("Modify booking") and recurring
current-week ("Manage current week") — `ModifyBookingForm.utils.ts:206-214`. The two differ
by section suppression, driven by the module-level `hasStay` constant
(`ModifyBooking.constants.ts:46`, injected from `Rover.context.conversation_has_stay`):

| Helper | Anchor | Recurring + `hasStay` |
|---|---|---|
| `shouldShowAdjusmentListComponent` | `ModifyBookingForm.utils.ts:74-82` | `if (props.isRecurring && hasStay) return false;` (`:75`) |
| `shouldShowRatesComponent` | `ModifyBookingForm.utils.ts:84-89` | `!( … \|\| (props.isRecurring && hasStay) )` (`:88`) |

Both are consumed as render gates in `ModifyBookingForm.tsx:804` and `:848` (and again at
`:632` for form state). `LockedRatesComponent` renders **only** inside `RatesComponent`
(`RatesComponent.tsx:77-81` for the Bright Horizons branch, `:104` otherwise) — it has no
other call site on this page. So when `RatesComponent` is suppressed, the locked-rates
toggle disappears with it: **on "Manage current week" production shows no locked-rates
control at all.**

### What we do

`CurrentWeekScreen`'s `PricingLedger` stands in for the recurring dog-walking conversation
and hardcodes a synthetic booking to pass the gate:

```
src/screens/CurrentWeekScreen.jsx:134-136
  const lr = useLockedRates(getClient(owner.id), {
    serviceKey: 'dog_walking', isPaid: true, isCancelled: false,
  })
```

Rendered at `CurrentWeekScreen.jsx:187-214` — `LockRatesToggleRow`, the
`ledgerRowSitter(...)` line when locked, `LockRatesSheet`, and the `Snackbar`. The comment at
`:127-133` already documents the reasoning (faithful to `_get_lock_rates_toggle`, which has
no recurring check) but predates the discovery that production's *client* suppresses the
whole Rates section on this surface. Two separate points also worth noting:

- `ledgerRowSitter` is explicitly LEGACY-ONLY copy (`src/data/lockedRatesCopy.js:118-125`) —
  it exists in the Backbone/template stack, not on the canonical details page.
  `BookingDetailsScreen` deliberately does not render it; `CurrentWeekScreen` does.
- The lock would not *apply* to these walks anyway, but the reason is narrower than
  previously written: recurring sentinel requests are priced `.without_locked_rates()` only
  inside the `sevices_flags.rollout_new_pricer()` branch of
  `change_conversation_dates_and_create_request` (`src/aplaceforrover/recurring/models.py:616-628`),
  and the sibling builder `create_one_time_request_from_recurring` (`:639-675`) does not
  strip locks at all.

### Proposed fix

Remove the locked-rates block from `PricingLedger` — the `useLockedRates` call at `:134-136`
and the render block at `:187-214`, plus the then-unused `LockRatesToggleRow` /
`LockRatesSheet` / `Snackbar` imports (`:5`) and the `toggleLabelLedger` / `ledgerRowSitter`
import (`:8`). Note `toggleLabelLedger` is still used by `BookingDetailsScreen.jsx:12, :468`
and must stay in `lockedRatesCopy.js`; `ledgerRowSitter` has `CurrentWeekScreen` as its only
consumer and becomes dead. Keep the explanatory comment, rewritten to say *why the control is
absent*, with the `ModifyBookingForm.utils.ts:74-89` anchor.

Alternative, if the control is load-bearing for user testing: keep it behind an explicit dev
flag alongside `showLockedRates`, and label it PROTOTYPE-ONLY the way the relationship-page
row already is.

### Acceptance criteria

- [ ] Recurring client → conversation → "Manage current week": no locked-rates toggle, no
      "Rates are locked for …" ledger line, no lock sheet reachable from this screen.
- [ ] `ledgerRowSitter` has zero call sites, or is deleted from `lockedRatesCopy.js`.
- [ ] Lena (boarding) and Amelia (dog walking) still lock/unlock from booking details and the
      relationship row with no behaviour change.
- [ ] `npm run build` clean.

---

## Item 2 — service-key namespace split (latent bug, currently blocks nothing)

### The two namespaces

Three of five browsable services have the same key in both; two do not.

| Service | Booking / rates namespace | Schedule / unit namespace |
|---|---|---|
| Dog walking | `dog_walking` | `dog_walking` |
| Boarding | `boarding` | `boarding` |
| House sitting | `house_sitting` | `house_sitting` |
| Drop-in | **`drop_in_visits`** | **`drop_in`** |
| Daycare | **`dog_daycare`** | **`doggy_daycare`** |

Booking / rates namespace:
- `src/data/lockableRates.js:41-47` (`SERVICE_DISPLAY_NAME`, whose keys become
  `BROWSABLE_SERVICE_KEYS` at `:52`), and the `RATE_TABLE` keys at `:117` / `:122`
- `src/data/relationshipData.js:71-78` (`SERVICES`) and `:88` (`SERVICE_DETAIL`)
- `src/data/contacts.js:180` (`cancelledBookings[].serviceKey`)

Schedule / unit namespace:
- `src/data/services.js:6-7` (`SERVICES[].id`)
- `src/lib/scheduleHelpers.js:59, 208, 215`
- `src/data/sitterServices.js:87-88` and its per-variant state maps
- `src/data/sitterProfile.js:145-146`
- `src/screens/ScheduleOverlay.jsx:12-13`, `src/screens/relationship/AgendaView.jsx:63`,
  `ManageSheet.jsx:21`, `SummarySheet.jsx:13`, `UnitEditor.jsx:48`, `AddSheet.jsx:23-24, :33`
- `src/data/scheduleData.js:47` (`getOwnerRelUnit` hardcodes `serviceId: 'dog_walking'`)

### Sibling defect, now fixed — positional rate lookup

The namespace split had a companion: three places picked a client's per-pet rate out of
`lockedRatesFor(...).rates` **by array position**, `rates[i === 0 ? 0 : 1]`, so every pet
after the first billed at whatever row happened to sit second. That is `additional-dog`
for boarding and nothing of the sort elsewhere — `holiday-rate` for house sitting,
`long-walk` for dog walking, `long-drop-in` for drop-in visits.

Unlike the namespace split this one *was* reachable, and it was live on the modify screen:
a drop-in booking opened with its second pet's rate selector reading "60 minute rate".
All three sites now resolve `standard-rate` / `additional-dog` by slug —
`buildRateRows` in `relationshipData.js` (which `buildModifyFields` and every ledger go
through) and the rate-selector seed in `ModifyBookingScreen.jsx`, which now takes its
default from `booking.modify.rateRows[i].slug` rather than re-deriving a position.

**The namespace half below is unaffected and remains latent.**

### The exact affected call path

`isLockableConversation(booking)` (`src/data/lockableRates.js:139-144`) gates on
`BROWSABLE_SERVICE_KEYS.includes(booking.serviceKey)`, and `lockedRatesFor(client, serviceKey)`
(`:188-204`) looks the key up in `RATE_TABLE` via `lockableRatesFor` (`:146-147`), returning
`null` when the table has no rows. `useLockedRates` (`src/lib/useLockedRates.js:77-81`) turns
a `null` config into `available: false`, which silently renders nothing.

So: **`isLockableConversation({ serviceKey: unit.serviceId, … })` fails closed for `drop_in`
and `doggy_daycare`** — no error, no warning, just a missing control. Every caller today
avoids it:

| Caller | Key source | Namespace |
|---|---|---|
| `BookingDetailsScreen.jsx:199` | `booking` from `getRelationshipData` | booking/rates — correct |
| `RelationshipPage/RelationshipPage.jsx:23-28` | `repBooking` from `getRelationshipData` | booking/rates — correct |
| `CurrentWeekScreen.jsx:134-136` | hardcoded `'dog_walking'` | coincides in both — masks the split |

The hardcoded `'dog_walking'` in `CurrentWeekScreen` is precisely why this has never
surfaced: it is one of the three keys that agree. Any future code that derives a
`serviceKey` from a schedule `unit` — which is the natural thing to do on any schedule
surface — trips it.

### Proposed fix

Pick the booking/rates namespace (it is the one that mirrors production's
`services/constants.py` slugs, which is why `lockableRates.js` chose it) and reconcile:

1. Add an explicit bidirectional map in one place — e.g. `SERVICE_KEY_FROM_UNIT_ID` /
   `UNIT_ID_FROM_SERVICE_KEY` exported from `src/data/services.js`, with a comment naming
   both namespaces and the three keys that coincide.
2. Route every cross-namespace hop through it. Do **not** rename `services.js` ids in place:
   `sitterServices.js`, `sitterProfile.js` and the persisted `serviceStates` dev flag all key
   off them, and `serviceStates` is written to `localStorage` (`AppContext.jsx` `persistJson`),
   so a rename silently invalidates saved dev state.
3. Make `lockableRatesFor` / `lockedRatesFor` loud rather than silent on an unknown key in
   dev — a `console.warn` is enough for a prototype.

### Acceptance criteria

- [ ] A single exported mapping exists; no file hardcodes a translation between the two
      namespaces.
- [ ] Passing a `unit.serviceId` for a drop-in or daycare unit through the mapping into
      `isLockableConversation` returns `true` (given paid, uncancelled).
- [ ] Passing an unmapped key logs a warning instead of silently returning `null`.
- [ ] `serviceStates` values already in `localStorage` still resolve after the change.
- [ ] `npm run build` clean.

---

## Item 3 — reconcile the two surfaces' interaction models

Production has **two** locked-rates interactions, and they are genuinely different. Neither
is wrong; we now host both, so the split needs to be deliberate and documented rather than
incidental.

### A — modify booking: no modal, client-side lingui copy

`ModifyBookingForm.tsx:836-844` wires the toggle:

```
lockedRates={{ ownerName, isRatesLockPending, isRatesLocked,
  onLockedRateChange: (ratesFlag) => { form.onChange({}); calculateNewLockedAddOns(ratesFlag); } }}
```

`calculateNewLockedAddOns` (`ModifyBooking.duck.ts:483-503`) flips state (`:486`), sets a
pending flag (`:487`), POSTs to the locked-service-add-on calculator to reprice (`:491-495`),
clears pending (`:496`) and fires `sitter-request-edit-charges-submit` with
`LockedRates_toggleStatus` (`:497-501`). No confirmation step. **Actual lock/unlock
persistence is deferred to form submit** — `lockAddOns` / `unlockAddOns` at
`ModifyBooking.duck.ts:644-663`, provider-only (`:644`). The toggle is disabled while pending
(`LockedRatesComponent.tsx:62`).

Copy is client-side lingui, not server-driven: label
`Lock your rates for future stays with ${ownerName}` (`LockedRatesComponent.tsx:30`) plus an
info Popover body (`:39-42`), which is suppressed under `isMobileEmbedded()` (`:31`).

### B — conversation details: modal, server-driven copy

`ConversationLockRates.tsx:29-33` does nothing but open a modal —
`openModal(ModalTypes.LockRates)` — and re-seeds the switch from `toggle?.initial`; the switch
label is `toggle.text` off the payload (`:44`). Gated at
`details/ConversationPriceLedger.tsx:88` on `lockRates && lockRates.action`. Every string in
`LockRatesModal.tsx` comes from the server action (`:18` destructures
`{ title, text, rates, action }` off `OpenLockRatesModalAction`), which is built by
`_get_lock_rates_action(initial)` (`price_ledger.py:1741`); the toggle text itself is
`_("Lock rates for future stays with {requester_name}")` (`:1733-1735`). Confirming calls
`handleButtonAction(action)` (`LockRatesModal.tsx:20-23`).

### Where the prototype stands

`useLockedRates.requestChange` unconditionally opens the sheet —
`src/lib/useLockedRates.js:99` (`setSheetMode(nextChecked ? 'lock' : 'unlock')`), committed by
`confirm` at `:103`, both routed through the shared `commit` at `:91-95` — but only in the
default `mode: 'sheet'`. That is surface B, and it is the right model for booking details, the
relationship row and (until item 1 lands) current week. The **no-modal path landed in the
details/modify pass**: `mode: 'immediate'` makes `requestChange` call `commit` directly and
leaves `sheetMode` null, so `ModifyBookingScreen` renders no sheet — surface A.

So this is not "unimplemented" — it is "two models now live in one hook", and the remaining
work is reconciliation:

### Proposed fix

1. ~~Make the two models explicit in `useLockedRates` via a caller-chosen option defaulting to
   the sheet.~~ **Done** — `options.mode` (`'sheet' | 'immediate'`), documented in the hook's
   header comment with both production anchors (`ModifyBookingForm.tsx:836-844` and
   `ConversationLockRates.tsx:29-33`). All pre-existing call sites pass ≤2 arguments and so
   take the unchanged default.
2. Decide whether the no-modal path also needs production's two-phase commit
   (immediate reprice, persistence deferred to submit — `duck.ts:483-503` vs `:644-663`), or
   whether the prototype's single-step commit is close enough. If single-step, say so in a
   comment; do not leave it implicit.
3. Mirror the `isRatesLockPending` disabled state on the no-modal toggle
   (`LockedRatesComponent.tsx:62`) even if the prototype's "request" is synchronous —
   otherwise the control reads as instant in a way production's never does.
4. Keep the copy sources separate and labelled: the modify-screen label is lingui
   (`Lock your rates for future stays with {ownerName}`, note the `your`), the details label
   is server-driven (`Lock rates for future stays with {requester_name}`, no `your`). They are
   **different strings** — do not collapse them into one constant in `lockedRatesCopy.js`.

### Acceptance criteria

- [ ] Booking details, relationship row and (if kept) current week still open
      `LockRatesSheet` and commit only on confirm — no behaviour change from today.
- [ ] The modify-booking toggle commits with no sheet, and fires the same snackbar the
      sheet path does (or deliberately does not, with a comment saying why).
- [ ] The two label strings coexist in `lockedRatesCopy.js` with distinct names and
      provenance comments.
- [ ] The hook's header comment names both production interaction models.
- [ ] `npm run build` clean.

---

## Item 4 — relationship-page "Rates" row (open decision, not a defect)

Carried from plan §1.7 so it is tracked somewhere. Production has **no** rates row on any
relationship surface: `LockRates` is emitted only onto the conversation-details ledger payload
(`price_ledger.py:1446`) and rendered only by `ConversationLockRates` /
`LockedRatesComponent`. Our row (`src/screens/RelationshipPage/RelationshipPage.jsx:88-106`) and all three of
its strings (`src/data/lockedRatesCopy.js:105-116`) are already marked PROTOTYPE-ONLY, and
its plural branch is unexercised because every seeded client locks at most one service.

Options are keep / remove / retitle to production's `toggle.text`
(`price_ledger.py:1733-1735`). **This is a product decision, not a bug**, and it may already
have been settled by the details/modify pass — confirm before acting.

---

## Explicitly NOT changing

| Not changing | Why |
|---|---|
| `isLockableConversation`'s five gates (`lockableRates.js:139-144`) | Faithful mirror of `_get_lock_rates_toggle()` (`price_ledger.py:1720-1742`), including the deliberate absence of an `is_recurring` check. Do not add one |
| `lockedRatesByOwner` being a single boolean per (client × service) | Production's write is full-set replacement (`lockAddOns` / `unlockAddOns`, `duck.ts:654-661`); per-rate locking is not a thing |
| The locked-price snapshot derivation (`lockableRates.js:158-177`) | Deterministic mock data; production reads real `LockedServiceAddOn` rows. Lena's boarding overrides stay pinned because `relationshipData.js` prices her ledger off them |
| Sentence-case rate labels | Documented deliberate divergence (`lockableRates.js:23-29`) |
| `services.js` `SERVICES[].id` values | Renaming them invalidates persisted `serviceStates` in `localStorage`; item 2 adds a mapping instead |
| Bright Horizons branches (`RatesComponent.tsx:77-81, :98, :105-109`) | Out of scope everywhere in this prototype |
| Owner-facing lock copy | This prototype is the sitter's app (`lockedRatesCopy.js:123-124`) |
| `showLockedRates` dev flag | Works as intended; all four surfaces respect it |
