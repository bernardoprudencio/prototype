# Plan — recurring booking details + one-time modify booking

Research pass only; no code written. Production source of truth:
`/Users/bernardoprudencio/Projects/web` (`roverdotcom/web`).

**Figma:** no frame covers either surface. The repo references only UX2-7159 (missed cards)
and UX2-2136 (provider settings). Production source is the authority for both halves.

---

## 0. Corrections to the prompt's premises

Stated before anything else, because three of them change the shape of the work.

| # | Prompt said | Production / prototype actually says |
|---|---|---|
| 1 | `contacts.js` clients carry a `lockedRates` block and a `pricing` field | Clients carry `lockedServices: [serviceKey]`; there is no top-level `pricing` (only `recurringSchedule.pricing`). Rates live in `src/data/lockableRates.js`. **CLAUDE.md is stale.** |
| 2 | Job 2 is "request vs. booked stay", `ModifyBookedStayAPIForm` vs the request ledger | `ModifyBookedStayAPIForm` renders on **both** paths. The discriminator is `hasStay` (`ModifyBooking.constants.ts:46`), and the top-level fork is `ContactRoverSupportForm` vs `ModifyBookedStayAPIForm` (`ModifyBookingForm.tsx:918-965`). |
| 3 | A one-time booking "should get production's modify-booking screen, not the recurring schedule manager" | ModifyBookingPage **is** the recurring current-week screen too. `getHeaderText` → `Modify request` / `Manage current week` / `Modify booking` (`ModifyBookingForm.utils.ts:206-214`), and Django *forces* it for recurring (`account_stays/views.py:1353-1355`, comment: "always show EBS modify form for recurring conversations"). One screen, section suppression. |
| 4 | The recurring details entry point is "a placeholder, not a design" | It is not reachable at all. `booking` is null for `-conv-recurring`, so Details is `disabled` (`ConversationScreen.jsx:169`). The fallback only fires on a direct URL. |
| 5 | `relationship_progress` mappers might belong on details | They are a **different screen** (`screens/relationship-tracker/<requester_opk>/`, `views.py:992-1112`), absent from `ConversationScreenSerializer:539-569`. None of it belongs on details. |

---

# JOB 1 — Booking details for recurring / ongoing relationships

## 1.1 Headline finding

**Production has no recurring details page.** One route, one mapper set, one payload:
`GET /api/v7/screens/conversations/<opk>/` → `ConversationDetailsMapper.map()`
(`conversations/api/mappers/conversation.py:44-104`). Recurring-ness is a per-mapper branch.

`is_recurring` is FK presence: `recurring_billing_relationship_id is not None`
(`conversations/models/conversation.py:632-633`). **Each Conversation IS one week.** The RBR
cycles `initial_conversation` / `active_conversation` / `next_conversation`
(`recurring/models.py:238,244,250`). Object selection is a plain opk lookup with no recurring
redirection (`views.py:157-167`).

So "the booking" for a recurring conversation is **this conversation's own week**. The sentinel
(`next_conversation.request`) is read only for the *weekly rate* figures
(`recurring/models.py:426-438`) and for request/skipped service-summary states.

## 1.2 Mapper-by-mapper recurring branch table

| Mapper | Verdict | Branch |
|---|---|---|
| `booking_card.py` | **CHANGES** (5) | `_("Price per week")` `:34-40`; `" ".join([_("Weekly"), service_title])` `:79-85`; `_("Starts")+date` or `""` `:114-122`; `_format_recurring_days_of_week` `:145-148`; `_("Your earnings this week")` vs `per week` `:202-217` |
| `booking_ctas.py` | **CHANGES** (7) | `modify_btn = ModifyBookingProviderButton if not self.conv.is_recurring else ModifyScheduleProviderButton` `:265-267`; provider set `:326-333`, requester `:336-342`; `_is_ongoing_recurring_relationship()` `:123-129` |
| `booking_status.py` | **CHANGES** + conditional drop | `if is_recurring: … service_skipped_this_week → SkippedWeekStatus() else OngoingRecurringStatus()` `:401-404`; `ConfirmedStatus` `:383-390`; whole section `None` if `should_collapse_financial_sections()` `:41-50` |
| `price_ledger.py` | **CHANGES** (10+) | **extra weekly-total section, recurring only** `:504-507`; `_("Price per week — {amount} — Charged each Monday morning")` `:302-306`; `_("{owner} paid {amount} on {date} for this week.")` `:346-353`; `_("Subtotal this week")`/`_("First week subtotal")` `:1069-1080`; `_("Your earnings this week")` `:512-514` |
| `service_summary.py` | **CHANGES** (builder fork) | `get_recurring_service_schedule` vs `get_non_recurring_service_schedule` `:752-755`; 5 recurring builders dispatched `:681-701`; `OngoingRecurringSummaryBuilder.SCHEDULE_TITLE = "This week's service happens on"` `:467-468` |
| `additional_information.py` | **CHANGES — row omitted** | `_should_show_cancellation_policy` requires `not self.conv.request.is_recurring` `:240-245` — **and `_is_requester()`, so it never fires on our sitter-side screen anyway. No prototype impact.** |
| `message_header.py` | indirect only | inherits `booking_ctas` forks via ctor `:61-77` |
| `message_actions.py` | UNCHANGED | sentinel-aware only `:50-56` |
| `expiry_notice.py` | UNCHANGED | sentinel-aware only `:21-31` |
| `blocking_messages.py`, `location_info.py`, `pets_info.py`, `other_party_details.py`, `connect_through_rover.py`, `trust_and_safety.py`, `tips_for_safe_stay.py`, `sitter_interest.py` | UNCHANGED | zero recurring refs |
| `booking_earnings.py` | **not on this payload** | helper module for `BookingEarningsScreenView` (`views.py:61-65`) |
| `relationship_progress/` | **not on this payload** | `RelationshipProgressScreenView` `views.py:992-1112`, gated `is_rollout_alt_monetisation` `:1011-1013` |

Shared calculator `mappers/base.py` also forks and affects every consumer:
`_get_price_label` `:309-316` (`Price this week` / `Price per week` / `Price`),
`_get_provider_price` `:334-340`, `_get_requester_price` `:348-353`.

## 1.3 Price-ledger scoping

Per-week, plus one recurring-only section.

- Normal sections price off `self.conv.request` — this week's real request.
- `price_ledger.py:504-507` appends `PriceSection(items=[self._get_total_price_per_week(request)])` **only when `is_recurring`**.
- `:1102-1129` uses `original_request = self.conv.first_request or request`; amount from `rbr.price`.
- `:1131-1143` picks `rbr.price` (requester) vs `rbr.stay_price` (provider) — both resolve through `next_conversation.request` (`recurring/models.py:426-438`).
- Title switches on whether today is in/after the start week (`:1069-1080`).

## 1.4 Locked rates on recurring — confirms CLAUDE.md, with one refinement

`_get_lock_rates_toggle()` (`price_ledger.py:1720-1742`) guards on: not grooming, provider-only,
`is_paid()`, browsable service type, not cancelled. **`is_recurring` is absent.** The recurring
exclusion exists only on the retiring legacy stay page (`account_stays/views.py:554-568`).

`recurring/models.py:616-628` strips locks from the sentinel via `.without_locked_rates()`.
**Refinement CLAUDE.md should absorb:** that stripping is conditional on `rollout_new_pricer()`
(`:616`), and the sibling builder `create_one_time_request_from_recurring` (`:637-675`) does not
strip at all.

## 1.5 Findings that change current prototype code

| # | Production | Prototype today | Change |
|---|---|---|---|
| A | Details reachable for every conversation; `OPEN_DETAILS_PAGE` emitted from `booking_card.py:227-238` | Details `disabled` for recurring (`ConversationScreen.jsx:169`) because `-conv-recurring` matches no booking | Give recurring clients a real **this-week** booking object |
| B | Recurring details describes this week's conversation, which has a stay | `upcoming[0] ?? past[0] ?? archived[0]` (`BookingDetailsScreen.jsx:193-194`) | Delete the fallback; resolve a real weekly booking |
| C | `OngoingRecurringStatus` / `SkippedWeekStatus` | copy exists (`bookingDetailsCopy.js:49,103`) but **`statusFields` never emits either key** | Emit them from a recurring-aware status derivation |
| D | Recurring-only weekly-total ledger section + week-scoped labels | single ledger shape; only Lena has a `ledger` (`relationshipData.js:351-362`) | Add a weekly ledger builder and week-scoped labels |
| E | Service summary titled "This week's service happens on" | `SERVICE_SUMMARY_TITLE` only | Add the recurring title variant |
| F | `Weekly ` service-title prefix, `Price per week`, `Starts {date}` | none | Add to the recurring booking's derived fields |
| G | CTA set forks: `ModifyScheduleProviderButton` (recurring) vs `ModifyBookingProviderButton` (one-time) | `MODIFY_REQUEST` renders unconditionally with **no onClick** (`BookingDetailsScreen.jsx:271-282`); `MODIFY_BOOKING`/`MODIFY_SCHEDULE`/`CANCEL_BOOKING` all unused | Fork the header CTA. **Collides with Job 2 — see §3** |
| H | No production "Rates" row on any relationship surface | invented row at `RelationshipPage.jsx:86-106` | See §1.7 — decision needed |

## 1.6 Job 1 file-by-file change list

1. **`src/data/relationshipData.js`** — add a `buildRecurringWeekBooking(client)` that returns a
   real booking for `` `${client.id}-conv-recurring` ``: `isRecurring: true`, this week's
   Monday→Sunday window derived from `PROTO_TODAY`, `serviceName` prefixed `Weekly `,
   `statusKey: 'ongoingRecurring'` (or `'skippedWeek'`), and a weekly `ledger`. Include it in
   `getRelationshipData().bookings.upcoming` so `ConversationScreen`'s existing match
   (`:120-125`) finds it with no change to that lookup.
2. **`src/data/relationshipData.js`** — extend `statusFields` (`:151-178`) with a recurring
   branch emitting `ongoingRecurring` / `skippedWeek`, mirroring `booking_status.py:401-404`.
   Add a `skippedThisWeek` input rather than inventing a flag inside the function.
3. **`src/data/relationshipData.js`** — extend `detailFields` (`:86-97`) with a recurring variant
   supplying the "This week's service happens on" title key and the weekday list, mirroring
   `OngoingRecurringSummaryBuilder`.
4. **`src/data/bookingDetailsCopy.js`** — add, with provenance comments:
   `PRICE_PER_WEEK` / `PRICE_THIS_WEEK` (`base.py:309-316`),
   `TOTAL_PER_WEEK` + `chargedEachMonday` (`price_ledger.py:302-306`),
   `SUBTOTAL_THIS_WEEK` / `FIRST_WEEK_SUBTOTAL` (`:1069-1080`),
   `YOUR_EARNINGS_THIS_WEEK` (`:512-514`),
   `paidForWeek(owner, amount, date)` (`:346-353`),
   `RECURRING_SCHEDULE_TITLE` (`service_summary.py:467-468`),
   `WEEKLY_PREFIX` + `startsOn(date)` (`booking_card.py:79-122`).
   Also add `MODIFY_SCHEDULE_CTA` if the existing `MODIFY_SCHEDULE` string does not match
   `ModifyScheduleProviderButton`'s label — verify against the button definition before adding.
5. **`src/screens/BookingDetailsScreen.jsx`** — delete the
   `upcoming[0] ?? past[0] ?? archived[0]` fallback (`:184-195`); a miss becomes a genuine
   not-found. Branch the header CTA on `booking.isRecurring`. Branch the service-summary title.
   Render the recurring-only weekly-total section inside the existing ledger block
   (`:350-409`) — an extra `PriceSection`, not a restructure.
6. **`src/screens/ConversationScreen.jsx`** — no change needed for Details; once (1) lands,
   `booking` resolves and `disabled` clears on its own. Confirm by reading, not by editing.
7. **`docs/` or `CLAUDE.md`** — correct the `lockedServices` / `pricing` staleness and add the
   `rollout_new_pricer()` refinement from §1.4.

## 1.7 The relationship-page "Rates" row — decision needed

Production has **no** rates row on any relationship surface.
`conversations/api/domain/items/relationship_progress.py` (93 lines, whole file) has no rate
field; `model/progress.ts` carries only `heading`, `tiers`, `callout`, `earnings`; zero `rates`
matches under `pages/src/account/RelationshipPage/` or the SSR relationship routes. The only
production lock UI is the **conversation details ledger** (`ConversationLockRates.tsx:22-48`,
gated `ConversationPriceLedger.tsx:88`) and modify-booking (`RatesComponent.tsx:77-104`).

Our row (`RelationshipPage.jsx:86-106`, copy `lockedRatesCopy.js:111-114`) is already marked
PROTOTYPE-ONLY. Three options, **your call**:

- **(a) Keep as-is.** It is honestly labelled and gives a second path to the lock sheet.
- **(b) Remove it.** Maximum parity; details becomes the only lock surface, as in production.
- **(c) Keep, retitled** to production's toggle text ("Lock rates for future stays with {name}",
  `toggle.text`) so at least the copy is real.

I lean **(b)** if parity is the goal of this pass, **(c)** if the row is load-bearing for
user-testing. Not deciding this unilaterally.

## 1.8 Job 1 out of scope

- `relationship_progress/` mappers — different screen; our `RelationshipPage` already mirrors them.
- `booking_earnings.py` and alt-monetization earnings — separate view, server-driven tier data.
- `should_collapse_financial_sections()` collapsed-status variant (`booking_status.py:41-50`).
- Sentinel request/skipped service-summary builders (`RequestRecurringSummaryBuilder`,
  `SkippedRecurringSummaryBuilder`) beyond the copy needed for `skippedWeek`.
- Bright Horizons ledger suffixes (`price_ledger.py:1162-1164, 1201-1215, 1319-1333`).
- Graduated-take-rate danger banner (`:1536-1551`).
- `additional_information` cancellation-policy row — requester-only, unreachable on our screen.

---

# JOB 2 — Modify request / modify booking for one-time bookings

## 2.1 The convergence question, resolved from source

**Answer: both. They converge on the modify screen and diverge on the agenda.**

- **Modify screen converges.** One production screen serves one-time (`Modify booking`) and
  recurring current-week (`Manage current week`) — `ModifyBookingForm.utils.ts:206-214`. Django
  *forces* it for recurring (`account_stays/views.py:1353-1355`). There is no recurring guard or
  redirect on the page; a direct hit renders it (`ModifyBookingForm.tsx:708-712` only suppresses
  an informational alert). They differ by **section suppression**:
  `shouldShowRatesComponent` excludes `isRecurring && hasStay`
  (`ModifyBookingForm.utils.ts:84-89`); `shouldShowAdjusmentListComponent` returns false for
  `isRecurring && hasStay` (`:74-82`).
- **Agenda diverges.** The agenda analogue is a separate flag-gated surface
  (`RecurringScheduleOverviewPage` / `RecurringScheduleTemplatePage`, flag
  `recurring_schedule_web_management`, `public-configs.ts:487`), and the redirect into it
  requires a recurring relationship — `useConversationActionHandler.ts:428-439`:
  `if (isRecurringScheduleWebManagementEnabled && conversation?.recurringRelationship) { redirect(...) }`
  then falls through to `window.location.href = action.webUrl` (ModifyBookingPage).

**Mapping onto the prototype.** `scheduleMode` is the prototype's stand-in for
`recurring_schedule_web_management`. The recurring check is a **second, independent**
discriminator layered on top:

| | recurring client | one-time client |
|---|---|---|
| `scheduleMode: 'agenda'` | agenda (`ScheduleOverlay` → `RelationshipManagement`) | **ModifyBookingScreen** — falls through, exactly as production does |
| `scheduleMode: 'modification'` | `ScheduleScreen` (current-week editor) | **ModifyBookingScreen** |

So: `scheduleMode` still applies, but **only to recurring clients**. A one-time client reaches
the modify screen in both modes. That is the production behaviour, not a simplification.

Corollary from the prototype survey, worth recording even though it is not the chosen route:
`expandUnit` already handles `frequency:'once'` (`scheduleHelpers.js:134-135`), `buildAgenda`
is frequency-agnostic, and `shortRuleLabel` already returns `'One-time'`. A one-time unit
*would* render through `AgendaView` with only a data-shape change. Its blockers are cosmetic
(week-scoped `Week of {date}` and `{Owner} will be charged $X`, plus an `allEnded` end card at
`RelationshipManagement.jsx:214` that can never fire without `repeatEndDate`). We are not
taking that route because production doesn't — but the finding stands if you later want it.

## 2.2 The `hasStay` discriminator

`ModifyBooking.constants.ts:46` — `inject('Rover.context.conversation_has_stay', true)`, from
`account_stays/views.py:1182` `"has_stay": bool(self.get_object().stay)`.

| Behaviour | `hasStay` true (booked) | false (request) |
|---|---|---|
| Header | `Modify booking` / `Manage current week` | `Modify request` |
| `modificationReason` field | required, rendered | absent |
| Message field | required, `minLength(10)` | optional |
| Ledger summary | rendered | suppressed (`ModifyBookingFormLedger.tsx:207`) |
| Submit | `putConversation` | `putRecurringRelationship` |
| Support fallback on invalid dates | yes | no |

**We mock `hasStay: true`, non-recurring, sitter side** — that is "Modify booking", the screen
the prompt is after. The request path is a copy-and-validation variant of the same form, cheap
to add later; not in this pass.

## 2.3 Section inventory and order (mobile 375-first)

From `ModifyBookingForm.tsx:664-965` and `ModifyBookedStayAPIForm.tsx:135-276`, filtered to
`hasStay && !isRecurring && sitter`:

| # | Section | Production anchor | Build? |
|---|---|---|---|
| 1 | Header `Modify booking` | `utils.ts:206-214` | yes |
| 2 | `Why are you modifying this booking?` + `Please select a reason` | `:688-692` | yes |
| 3 | `Which dates?` + date-range picker | `:753`, `ServiceDatePicker.tsx` | yes, range branch only |
| 4 | `Which pets?` + pet selector | `:773`, `DogSelectorComponent.tsx` | yes |
| 5 | Rates rows + `List price: {x}` / `Price on profile: {x}` | `RatesComponent.tsx:73-75`, `ServiceRateSelectorComponent.tsx:76-78` | yes |
| 5a | `LockedRatesComponent` (nested in Rates) | `RatesComponent.tsx:77-104` | **deferred — see §2.5** |
| 6 | `Extras and Adjustments` + `ShortNoticeBanner` + `NoPenaltyInsertCard` | `AdjustmentsListComponent.tsx:136-218` | yes, static |
| 7 | `Summary` + ledger (`Subtotal`, `Previous total`, `Amount owed`, `Your earnings`) | `ModifyBookedStayAPIForm.tsx:135-150`, `ModifyBookingFormLedger.tsx:162-232` | yes |
| 8 | Message textarea + `Write your message here` | `:187-190` | yes |
| 9 | 72-hour confirmation note | `:200-202` | yes |
| 10 | `Submit changes` / `Cancel` | `:222-276` | yes |

**Mobile layout.** `ModifyBookedStayAPIForm.tsx:222-276` uses
`flexDirection={['column','column','row']}` with a duplicated Cancel gated
`display={['none','block']}` / `[['block','none']]` — button order inverts on mobile. At 375 we
render the column form: Submit above Cancel. `ServiceDatePicker.tsx:44` and
`ServiceRateSelectorComponent.tsx:40` carry `MQ.SM_DOWN` layout branches for the picker and rate
rows. `isMobileEmbedded()` suppresses the locked-rates Popover (`LockedRatesComponent.tsx:31`).

## 2.4 The CTA gate

Production derives it from `is_recurring`, not a flag — `booking_ctas.py:265-267`:
`ModifyBookingProviderButton` (one-time) vs `ModifyScheduleProviderButton` (recurring).

**Our labels are wrong for one-time in both modes.** `ConversationScreen.jsx:164` gives
`'Manage schedule'` or `'Modify schedule'`; production's one-time label is **`Modify booking`**.

Proposed derivation: `const isRecurringClient = !!client.recurringSchedule`. It holds cleanly —
`recurringSchedule` is present on exactly **owen, james, sarah** and absent on the other seven
(marcus, priya, lena, diego, amelia, nora, takashi). Confirmed against all ten clients in
`contacts.js:86-246`.

**Do-not-touch conflict, raised not routed around.** `getOwnerRelUnit`
(`src/data/scheduleData.js:38-61`) always returns `frequency:'weekly'` and dereferences
`owner.template[0].time` unguarded at `:51` — it **throws** for a client with no template. It is
on the do-not-touch list. The plan therefore does **not** call it for one-time clients: the
modify screen takes its data from `getRelationshipData(ownerId)`, and `onOpenSchedule`
(`ConversationScreen.jsx:70-85`) only reaches `getOwnerRelUnit` on the recurring branch, which
is its existing behaviour. No edit to `scheduleData.js` is required. Flagging it so the
constraint is visibly satisfied rather than silently sidestepped.

## 2.5 Locked rates on this surface — a second do-not-touch conflict

Production commits with **no modal**: toggle → `onLockedRateChange`
(`ModifyBookingForm.tsx:836-844`) → `ModifyBooking.duck.ts:483-503` dispatches, POSTs, fires
analytics immediately; persistence deferred to submit (`:644-663`). Copy is client-side lingui:
`Lock your rates for future stays with {ownerName}` (`LockedRatesComponent.tsx:30`) plus a
Popover body (`:39-42`).

Our `useLockedRates.requestChange` unconditionally sets `sheetMode` and defers to
`LockRatesSheet` (`useLockedRates.js:69-77`) — that mirrors the **ConversationPage** surface
(`ConversationLockRates.tsx` + `LockRatesModal.tsx`), whose copy is *server-driven*, not lingui.
A no-modal variant means changing `useLockedRates.js`, which is do-not-touch.

**Recommendation: omit section 5a from this pass** and raise the interaction difference as its
own ticket. The screen is complete and honest without it; adding it either violates the
constraint or ships an interaction production does not have.

## 2.6 A related gating contradiction to raise separately

Production suppresses `RatesComponent` **and** `AdjustmentsListComponent` when
`isRecurring && hasStay` (`ModifyBookingForm.utils.ts:74-89`), and `LockedRatesComponent` is
nested inside `RatesComponent` (`RatesComponent.tsx:77-81, :104`). So on **Manage current week**
the locked-rates control does not render at all.

Our `CurrentWeekScreen`'s `PricingLedger` renders it, with a hardcoded
`serviceKey: 'dog_walking', isPaid: true, isCancelled: false` (`CurrentWeekScreen.jsx:135-136`).
Per the standing constraint this is **raised, not fixed here**: it is locked-rates gating, not
presentation.

Second item for the same ticket — a latent bug either job could trip:
`lockableRates.js:41-47` uses `drop_in_visits` / `dog_daycare`; `data/services.js` and
`scheduleHelpers` use `drop_in` / `doggy_daycare`. `dog_walking`, `boarding`, `house_sitting`
coincide, which is why the hardcoded `'dog_walking'` works and masks it. Feeding a schedule
`unit.serviceId` into `isLockableConversation` silently fails the gate for those two services.

## 2.7 Job 2 file-by-file change list

1. **`src/data/modifyBookingCopy.js`** (new) — all Job 2 strings verbatim with provenance:
   headers (`utils.ts:206-214`), `Which dates?` / `Which pets?` (`:753,:773`),
   `Why are you modifying this booking?` / `Please select a reason` (`:688-692`),
   `Summary` (`ModifyBookedStayAPIForm.tsx:135`),
   `Extras and Adjustments` (`AdjustmentsListComponent.tsx:136-140`),
   ledger labels `Subtotal` / `Previous total` / `Amount owed` / `Your earnings`
   (`ModifyBookingFormLedger.tsx:162-232`), the 7 `getLedgerSummary` sub-labels
   (`ModifyBooking.utils.ts:76-114`), both `ShortNoticeBanner` strings (`:20-21`), both
   `NoPenaltyInsertCard` strings (`:19-23`), `List price:` / `Price on profile:`
   (`ServiceRateSelectorComponent.tsx:76-78`), message label + `Write your message here`
   (`ModifyBookedStayAPIForm.tsx:187-190`), the 72-hour note (`:200-202`),
   `Submit changes` / `Cancel` (`:231-273`).
2. **`src/screens/ModifyBookingScreen.jsx`** (new) — sections 1-10 per §2.3, mobile-column
   layout, inline styles from `tokens.js`. Data from `getRelationshipData(ownerId)` +
   `getClient(ownerId)`.
3. **`src/App.jsx`** — new overlay route `/conversation/:ownerId/modify` at the same zIndex as
   the schedule routes (20). Leave `/schedule` alone.
4. **`src/screens/ConversationScreen.jsx`** — replace the `scheduleMode` label ternary at `:164`
   and the `onOpenSchedule` target at `:70-85` with the derivation in §2.4: one-time →
   `Modify booking` → `/conversation/:ownerId/modify`; recurring → existing `scheduleMode`
   behaviour untouched.
5. **`src/data/relationshipData.js`** — expose the fields the modify screen needs on a one-time
   booking (rate rows, adjustments, previous total) if not already derivable. Read first; add
   only what is missing.
6. **`src/components/index.js`** — export any new shared pieces (a select row, a textarea).
   Prefer reusing `Row`, `Chip`, `RadioRow`, `TimeInput`, `CalInput`.

**Tokens.** Not pre-audited. Sections 2 (select) and 8 (textarea) have no existing prototype
analogue, so they are the likely gaps. Per the standing constraint, any production value
without a token equivalent will be **proposed as an addition to `tokens.js`**, not hardcoded —
called out at implementation time rather than guessed at now.

## 2.8 Job 2 out of scope — stated, not half-built

| Excluded | Why |
|---|---|
| `GroomingDateTimePicker` | grooming not in scope; rebuilds dates with fresh `uuid.v4()`, enforces a 1-hour arrival window |
| `alt-monentisation-booking-earnings/` | server-driven tier data via `useApiBookingEarningsRetrieve`; no local logic |
| `StayModificationCreditLedger` / `RequestModificationCreditLedger` + BH contexts (~380 lines) | Bright-Horizons-gated; arithmetic entirely server-side behind an opaque `CreditLedgerResponse` |
| `ContactRoverSupportForm` | 45-line wrapper; real logic lives outside the page |
| `checkPrice` / `getExtrasAndAdjustments` (`duck.ts:509-623, 776-836`) | server pricer round-trip on every field change. Ledger figures will be **static mock data** |
| `minMaxPriceValidator` / `validatePriceBetween` (`constants.ts:212-316`) | scales by `(1 - serviceFee)`, clamps short-notice, BH negative caps |
| Penalty math and waivers (`AdjustmentsListComponent.tsx:68-122`) | policy-encoded; the two `NoPenaltyInsertCard` strings carry the meaning without the math |
| `RateModal` holiday-rate escalation | distinctive but needs `shouldShowRateWarning` (`utils.ts:92-117`) |
| `Suppress Notifications` checkbox | impersonation-only |
| Non-contiguous / multi-date / daycare picker branches (`ServiceDatePicker.tsx`, 5-way dispatch) | one branch (date range) only |
| The request path (`hasStay: false`) | copy-and-validation variant; add later if wanted |
| `LockedRatesComponent` | §2.5 — do-not-touch conflict |

---

# 3. Where the two jobs collide

| Collision | Detail | Resolution |
|---|---|---|
| **`ConversationScreen.jsx:161-174`** | Job 1 needs Details enabled for recurring; Job 2 needs the schedule CTA label and target derived from recurring-ness. In production **both come from the same mapper**, `booking_ctas.py` | **Do them as one change**, from one `isRecurringClient` derivation. Do not sequence them apart |
| **`src/data/relationshipData.js`** | Job 1 adds a recurring weekly booking + recurring `statusFields`/`detailFields`; Job 2 needs one-time rate/adjustment fields on a booking | Single coordinated pass on this file |
| **Header CTA copy** | Job 1's details header CTA and Job 2's conversation CTA are the *same two production buttons* (`ModifyBookingProviderButton` / `ModifyScheduleProviderButton`) | One copy source. Decide whether it lives in `bookingDetailsCopy.js` or `modifyBookingCopy.js` before either job writes it — **recommend `bookingDetailsCopy.js`**, since `booking_ctas.py` feeds the details payload |
| **`src/App.jsx`** | both add overlay routes | Job 2 owns the file; Job 1 needs no route change |
| **Locked rates** | Job 1 §1.7 (relationship row), Job 2 §2.5 (no-modal), §2.6 (`CurrentWeekScreen`) | All three deferred to one separate gating ticket |
| **Service-key namespace split** | §2.6 | Same ticket. Blocks nothing in this pass |

**Recommended sequencing.** Phase 0: shared foundation — `isRecurringClient` derivation, the
recurring weekly booking, and the one CTA-row edit. Phase 1: Job 1 details sections. Phase 2:
Job 2 new screen. Phase 0 must not be split across the two jobs.

---

# 4. Verification plan

Applies to both halves.

1. `npm run build` clean. Non-negotiable, before anything is called done.
2. **Recurring details reachable.** Open a recurring client (owen / james / sarah) →
   conversation → Details is **enabled** → lands on `-conv-recurring` with a real this-week
   booking. Assert the weekly ledger section, `Weekly ` service prefix, and week-scoped labels.
3. **Recurring status keys render.** `ongoingRecurring` visible by default; flip the
   skipped-week input and assert `skippedWeek`. Both currently render nowhere.
4. **No fallback regression.** A bogus `conversationOpk` now shows not-found rather than
   silently rendering `upcoming[0]`. Assert deliberately.
5. **One-time details unchanged.** Lena's paid boarding booking (the only one with a `ledger`,
   `relationshipData.js:305-364`) renders byte-identically. This is the regression canary.
6. **CTA matrix, all four cells of §2.1.** Recurring × `agenda` → agenda; recurring ×
   `modification` → `ScheduleScreen`; one-time × both → `ModifyBookingScreen` labelled
   `Modify booking`. Toggle `scheduleMode` in `TestingModeScreen` between runs.
7. **Modify screen at 375.** All ten sections in order, Submit above Cancel, no horizontal
   scroll. Then check ≥769px against the `useIsWide()` neighbours for consistency.
8. **Copy provenance sweep.** `grep` the two new/edited copy files for entries lacking a
   provenance comment; `grep` the new screen for string literals. Both must come back empty
   except for `aria-label`s.
9. **Locked rates untouched.** Lena (boarding) and Amelia (dog_walking) lock/unlock through
   details and the relationship row exactly as today; `useLockedRates.js`, `AppContext.jsx`,
   `scheduleHelpers.js`, `scheduleData.js`, `RelationshipManagement.jsx`, `SummarySheet.jsx`,
   `UnitEditor.jsx` show **no diff**. `git diff --stat` on that list is the check.
10. `PROTO_TODAY` only. `grep` the diff for date literals; the this-week window must be derived.

---

# 5. Open decisions for you

1. **§1.7** — keep / remove / retitle the relationship-page "Rates" row.
2. **§2.5** — confirm omitting `LockedRatesComponent` from the modify screen, versus relaxing
   the `useLockedRates.js` do-not-touch to add a no-modal path.
3. **§2.6** — file the locked-rates gating ticket (`CurrentWeekScreen` renders a control
   production suppresses; service-key namespace split) as its own work, as the constraints imply.
4. **§2.2** — confirm the request path (`hasStay: false`, "Modify request") stays out of this pass.
