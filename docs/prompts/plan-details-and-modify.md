# Planning prompt — recurring details + one-time modify booking

Two parity jobs. **Present findings and a plan before writing any code.** Do not implement
in this pass.

Production source of truth is the local `roverdotcom/web` checkout at
`/Users/bernardoprudencio/Projects/web`. Kibble is in-repo at `src/frontend/kibble`.
Where production and my description disagree, production wins — but say so explicitly
rather than silently correcting me.

---

## Job 1 — Booking details for recurring / ongoing relationships

We have `src/screens/BookingDetailsScreen.jsx`, built to mirror production's
`/account/conversations/<opk>/details`. It works for one-time bookings. It is *not* wired
for a recurring relationship: the only recurring entry point is a synthetic
`-conv-recurring` conversationOpk that falls back to `upcoming[0] ?? past[0] ?? archived[0]`,
which is a placeholder, not a design.

I want to plan bringing details into the recurring/ongoing relationship surfaces, matching
production as closely as possible.

Ground the plan in these production files:

- `src/aplaceforrover/conversations/api/mappers/details/` — the 20 section mappers:
  `additional_information.py`, `blocking_messages.py`, `booking_card.py`, `booking_ctas.py`,
  `booking_earnings.py`, `booking_status.py`, `connect_through_rover.py`, `expiry_notice.py`,
  `location_info.py`, `message_actions.py`, `message_header.py`, `other_party_details.py`,
  `pets_info.py`, `price_ledger.py`, `service_summary.py`, `sitter_interest.py`,
  `tips_for_safe_stay.py`, `trust_and_safety.py`
- `src/aplaceforrover/conversations/api/mappers/details/relationship_progress/` — `base.py`,
  `bookings_mapper.py`, `earnings_mapper.py`, `paginated_bookings_mapper.py`,
  `progress_mapper.py`, `requester_mapper.py`

Questions the plan must answer from source, not inference:

1. **Which sections change shape when `conv.is_recurring` is true, and which don't.** Go
   mapper by mapper. `booking_status.py` already branches (`_get_ongoing_stay_status` →
   `OngoingRecurringStatus` / `SkippedWeekStatus` via `conv.is_recurring` and
   `recurring_billing_relationship.service_skipped_this_week`) — we mock both keys in
   `src/data/bookingDetailsCopy.js` already. Find the rest: service summary, price ledger,
   CTAs, earnings, expiry.
2. **What "the booking" even is for a recurring conversation** — which stay/occurrence the
   details page is describing, and how the price ledger is scoped (a week? the sentinel
   request? the relationship?). Note that recurring sentinel requests are priced
   `.without_locked_rates()` (`recurring/models.py`), which we already document.
3. **Where the recurring details page is reached from in production**, and what the
   prototype's equivalent entry point should be — the conversation CTA row, the relationship
   page, the agenda, or more than one.
4. **What the relationship_progress mappers contribute** and whether any of it belongs on
   details, on `src/screens/RelationshipPage/RelationshipPage.jsx`, or both. We currently
   render a prototype-only "Rates" row on the relationship page whose copy is invented —
   flag if production has a real home for it.

Prototype files in scope: `src/screens/BookingDetailsScreen.jsx`,
`src/data/relationshipData.js` (the `statusFields` / `detailFields` derivation and the
`conversationOpk` patterns), `src/data/bookingDetailsCopy.js`, `src/data/contacts.js`
(`recurringSchedule` lives on owen / james / sarah), `src/screens/ConversationScreen.jsx`.

---

## Job 2 — Modify request / modify booking for one-time bookings

`src/screens/ConversationScreen.jsx` renders the same three CTAs for every client, and the
schedule CTA is gated on the **global `scheduleMode` dev flag** — `'agenda'` gives
"Manage schedule", anything else gives "Modify schedule" — with both navigating to
`/conversation/:ownerId/schedule`. Nothing distinguishes a one-time client from a recurring
one. Recurring-ness is expressed only by `client.recurringSchedule` in `contacts.js` and
`getOwnerRelUnit` in `scheduleData.js`.

That's wrong: a one-time booking should get production's modify-booking screen, not the
recurring schedule manager — **unless** schedule management is the agenda view, in which
case I believe it's the same screen for both. **The plan must resolve that explicitly from
production, one way or the other. Do not assume convergence and do not assume divergence.**

Production source:

- `src/frontend/react-lib/src/pages/modify-booking/ModifyBookingPage/` — `ModifyBookingPage.tsx`,
  `ModifyBookingPageContainer.tsx`, `ModifyBooking.duck.ts`, `ModifyBooking.api.ts`,
  `ModifyBooking.utils.ts`, `ModifyBooking.constants.ts`, `context/`, `hooks/`, and
  `components/` (notably `ModifyBookingForm`, `ModifyBookedStayAPIForm.tsx`,
  `ServiceDatePicker.tsx`, `GroomingDateTimePicker`, `DogSelectorComponent.tsx`,
  `RatesComponent.tsx`, `AdjustmentsListComponent.tsx`, `AdjustmentComponent`,
  `StayModificationCreditLedger.tsx`, `RequestModificationCreditLedger`,
  `ShortNoticeBanner.tsx`, `NoPenaltyInsertCard.tsx`, `RateModal.tsx`,
  `LockedRatesComponent.tsx`, `ContactRoverSupportForm.tsx`,
  `components/alt-monentisation-booking-earnings/`)
- `src/frontend/reactNativeApp/src/pages/modify-booking-webview/` — the RN mirror

Questions the plan must answer:

1. **Request vs. booked stay.** Production clearly has two paths —
   `ModifyBookedStayAPIForm` and the request-modification ledger are not the same flow.
   Name the discriminator, what each renders, and which of the two (or both) we mock.
2. **Section inventory and order** for the one-time modify screen, mapped to the components
   above, with the mobile layout (this prototype is 375-wide first).
3. **Which parts are genuinely out of scope for a mock** — grooming date/time, alt
   monetization earnings, contact-support form, penalty math — and say so rather than
   half-building them.
4. **Does the agenda view converge?** Read `src/screens/relationship/AgendaView.jsx` and
   `RelationshipManagement.jsx` against production and state whether one-time and recurring
   share a screen in `scheduleMode === 'agenda'`. If they converge, the CTA fix is a label
   and a data shape, not a new screen. If they diverge, we need a new screen and a real
   discriminator.
5. **The CTA gate itself.** The label/target should be driven by whether the client is
   recurring, not by a dev flag. Propose the derivation (the existing
   `client.recurringSchedule` is the obvious candidate — check it holds for all ten clients
   in `contacts.js`) and where `scheduleMode` should still apply.
6. Note that `LockedRatesComponent.tsx` on this surface commits **with no modal**
   (`ModifyBooking.duck.ts:482-502`), unlike the booking-details modal we already built —
   so if the mock renders locked rates here, the interaction differs.

Prototype files in scope: `src/screens/ConversationScreen.jsx`, `src/screens/ScheduleScreen.jsx`,
`src/screens/ScheduleOverlay.jsx`, `src/screens/CurrentWeekScreen.jsx`, `src/App.jsx` (routes),
`src/data/contacts.js`, `src/data/relationshipData.js`.

---

## Standing constraints — both jobs

- **Scope is presentation and component structure.** Don't change locked-rates gating logic
  or the lock/unlock state model. If parity work surfaces evidence either is wrong, raise it
  separately rather than folding it in.
- **Copy stays in data.** Every user-facing string comes from a `src/data/*Copy.js` file
  (`bookingDetailsCopy.js`, `lockedRatesCopy.js`, `hubCopy.js`, or a new one), verbatim from
  production, with a provenance comment. If production copy differs from ours, fix the copy
  file and tell me the diff — never inline a string in a component. Mark prototype-only
  strings as such.
- **Tokens and inline styles only.** No CSS modules. Use `src/tokens/tokens.js`. Where
  production has a value with no token equivalent, say so and propose an addition to
  `tokens.js` rather than hardcoding.
- **Do not touch:** `src/lib/useLockedRates.js`, `src/context/AppContext.jsx`,
  `src/lib/scheduleHelpers.js`, `src/data/scheduleData.js`,
  `src/screens/relationship/RelationshipManagement.jsx`,
  `src/screens/relationship/SummarySheet.jsx`, `src/screens/relationship/UnitEditor.jsx`.
  If a job genuinely requires one of them, stop and raise the conflict — don't route around it.
- **Never hardcode dates.** Derive from `PROTO_TODAY` in `src/data/owners.js`.
- **Figma:** if a frame covers either surface, fetch it with the Figma MCP tool and prefer it
  over your own inference, saying explicitly where they disagree. If no frame exists, say so
  and treat production source as the authority.
- `npm run build` must be clean before anything is reported done.

## Deliverable

One plan, two clearly separated halves, each with: findings that change the current code
(a table where production and prototype differ is ideal), a numbered file-by-file change
list, an explicit out-of-scope list, and a verification plan. Call out any place where the
two jobs collide — shared components, shared routes, shared data shapes — rather than
planning them in isolation.
