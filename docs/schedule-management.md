# Schedule Management — Reference Document

A reference for the recurring schedule system in the Rover sitter prototype. Covers what sitters can do today, how the underlying data model works, and what the system is already built to support next.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Model](#2-data-model)
3. [Service Types](#3-service-types)
4. [Recurrence Rules](#4-recurrence-rules)
5. [Billing Model](#5-billing-model)
6. [What Sitters Can Do Today](#6-what-sitters-can-do-today)
7. [Overnight Services](#7-overnight-services)
8. [Change Review & Confirmation](#8-change-review--confirmation)
9. [Known Edge Cases & Gaps](#9-known-edge-cases--gaps)
10. [What's Ready to Build Next](#10-whats-ready-to-build-next)

---

## 1. Overview

The schedule system manages the ongoing service agreement between a sitter and a client. The prototype currently supports one service per client relationship. A sitter can add, modify, and cancel that service — either for a single session or across all future sessions at once. All changes are previewed together before being confirmed, and each change is evaluated for financial impact (refunds or charges) based on which sessions are already paid.

### Core concepts

| Concept | What it means |
|---------|---------------|
| **Unit** | The service rule — "what, when, how often, and at what cost." Example: "Walk every Mon/Wed/Fri at 9am, starting March 3, for $20 per walk." |
| **Occurrence** | A single session derived from a unit. Example: "Walk on Monday, March 10." Occurrences are calculated on the fly and never stored. |
| **Agenda** | The full schedule view: all sessions across all units, sorted by date, grouped by day. Skipped sessions are not shown. |
| **Paid-Through Sunday** | The billing boundary. Any session on or before this Sunday is treated as paid. All sessions after it are upcoming and unpaid. |

### How it flows

```
Unit (stored rule) → expandUnit() → Occurrences → buildAgenda() → Agenda (displayed)
```

The sitter edits units (adding, modifying, removing). A diff is computed between the saved and draft state. The sitter reviews the summary and confirms. On confirmation, draft units become the new saved state and a schedule-change event is sent to the conversation.

---

## 2. Data Model

A **unit** is a plain JavaScript object — the core schedule rule. It defines everything about a service: what it is, when it starts, how often it repeats, which pets are included, and what it costs. Created via `defaultUnit()` in `src/lib/scheduleHelpers.js`.

| Field | Type | What it means | Notes |
|-------|------|---------------|-------|
| `id` | number | Unique identifier for this rule | Auto-incremented from 100 on creation |
| `serviceId` | string | Which service this is (e.g., `dog_walking`) | One of the 5 service IDs defined in `services.js` |
| `startDate` | `'YYYY-MM-DD'` | The first date this service occurs | Required; all recurrence math is relative to this |
| `endDate` | `'YYYY-MM-DD'` | Check-out date for overnight stays | Only used for boarding and house sitting |
| `repeatEndDate` | `'YYYY-MM-DD'` | The last date this rule is active | Empty means it runs indefinitely. Set automatically when a sitter cancels from a date forward. |
| `startTime` | `'HH:MM'` | Start time in 24-hour format | Defaults to `'09:00'` |
| `durationMins` | number | How long the session lasts, in minutes | Not used for overnight services. Defaults to 60 min (480 for daycare). |
| `petIds` | number[] | Which pets are included in this booking | Currently defaults to all pets in the relationship. Selecting specific pets is not yet exposed in the UI. |
| `frequency` | string | How often the service repeats | `'once'`, `'weekly'`, or `'monthly'` |
| `weekDays` | number[] | Which days of the week to schedule | 0=Sun, 1=Mon … 6=Sat. Only applies to weekly recurring daytime services. Not yet exposed in the UI. |
| `everyNWeeks` | number | How often the weekly pattern repeats | 1=every week, 2=every other week. Not yet exposed in the UI. |
| `skippedKeys` | string[] | Individual dates to exclude from the schedule | Each entry is a `'YYYY-MM-DD'` string. When a sitter cancels a single session, that date is added here. There's currently no UI to undo a skip. |
| `overrides` | object | Per-date changes to the normal service details | Key is a date (`'YYYY-MM-DD'`); value contains any fields that differ from the rule (e.g., a different start time). Used when a sitter edits a single session. Not directly visible or editable in the UI — it's set behind the scenes. |
| `cost` | number | Price per session in USD | Used for all billing calculations |
| `_parentTime` | string | UI tracking flag: the original start time before a "this and all future" time edit | Not a real data field. Exists only to drive the agenda badge display ("Changed from 9am"). Would not survive a backend round-trip. |
| `_continuation` | boolean | UI tracking flag: this unit was created as a spin-off when splitting a rule | Not a real data field. Exists only to show the "Updated" badge in the agenda. Would not survive a backend round-trip. |

---

## 3. Service Types

There are five service types in the data model, split into two categories: **daytime** and **overnight**.

| Service ID | Label | Category | Duration |
|-----------|-------|----------|----------|
| `dog_walking` | Dog Walking | Daytime | 30, 45, 60, or 120 min |
| `drop_in` | Drop-In Visit | Daytime | 30, 45, 60, or 120 min |
| `doggy_daycare` | Doggy Day Care | Daytime (hour-based) | 4 hr, 8 hr, or 12 hr |
| `boarding` | Boarding | Overnight | Check-in + check-out date |
| `house_sitting` | House Sitting | Overnight | Check-in + check-out date |

**In the current prototype**, each client relationship has a single service. The service type is set when the relationship is created and cannot be changed in the UI. Selecting or switching service types per unit is ready to build — see [Section 10](#10-whats-ready-to-build-next).

**Daytime services** use a start time and a duration. They support multi-day weekly recurrence (e.g., Mon + Wed + Fri).

**Overnight services** use a check-in date and a check-out date instead of a duration. They repeat on the same start day-of-week. See [Section 7](#7-overnight-services) for full details.

---

## 4. Recurrence Rules

A unit's recurrence is controlled by three fields: `frequency`, `weekDays`, and `everyNWeeks`.

### Frequency options

| `frequency` | How it behaves |
|-------------|---------------|
| `'once'` | A single session on the start date. Does not repeat. |
| `'weekly'` | Repeats weekly (or every N weeks). For daytime services, one session per selected weekday per cycle. For overnight, the whole stay repeats on the same start day-of-week. |
| `'monthly'` | Repeats on the same calendar date each month (e.g., the 3rd of every month). |

### How far out does the schedule generate?

`expandUnit()` generates sessions up to the earliest of:
1. The `repeatEndDate`, if one is set
2. 6 months from the start date
3. 8 weeks from today (whichever is further than option 2)
4. A hard cap of 120 sessions total

### Recurrence labels

`shortRuleLabel(unit)` generates a human-readable display string:
- `"Repeats Mon, Wed and Fri"` — weekly on multiple days
- `"Repeats every 2 weeks on Mon"` — bi-weekly
- `"Repeats monthly"` — monthly
- `"One-time"` — no recurrence

---

## 5. Billing Model

### Paid-Through Sunday

All units in a relationship share a single billing boundary: the **paid-through Sunday**. This is the Sunday of the week containing today.

Any session whose date is on or before this Sunday is considered **paid**. All sessions after it are **upcoming and unpaid**.

> **Why a full week?** The billing model treats the current week as already paid. This prevents a sitter from being charged when rearranging sessions within the same week.

### Financial impact of changes

| What happens | Financial result |
|---|---|
| Cancel a paid upcoming session | Refund for that session |
| Cancel an unpaid upcoming session | No financial impact |
| Add a service with paid upcoming sessions | Charge for the paid sessions |
| Move a session within the same paid week | Net $0 |
| Skip a paid session | Refund for that one session |
| Skip an unpaid session | No financial impact |
| Change only the time of a session | No financial impact |

### Same-week moves = $0

The paid boundary is always derived from the **saved state**, not the current draft. This means if a sitter moves a walk from Tuesday to Thursday within the same already-paid week, the net is $0 — no refund for Tuesday, no charge for Thursday.

### Cancellation impact

When a sitter cancels a rule, the system calculates:
- How many future paid sessions are being removed (these trigger a refund)
- How many future unpaid sessions are being removed (no refund)
- The total refund amount

Only future sessions are counted. Past sessions that have already happened are not affected.

---

## 6. What Sitters Can Do Today

The current prototype exposes the following actions in the sitter UI.

### Add a service

**How:** "Add" button → fill in the form → confirm

The sitter sets a start date, start time, and whether the service repeats. On confirm, a new rule is created and added to the schedule. It appears with a green **"Added"** badge in the agenda until the changes are saved.

> Today the service type is fixed per relationship and not selectable in this form. The form is ready to support service type selection — see [Section 10](#10-whats-ready-to-build-next).

---

### Skip a single session

**How:** Tap a session in the agenda → "Skip this service"

The date is added to the rule's skip list. The session disappears from the agenda. If it was a paid session, a refund is applied when the changes are confirmed.

> Once a session is skipped, there is currently no UI to restore it. The data model supports it, but the flow hasn't been built yet.

---

### Cancel a single session

Same behavior as skipping. The date is added to the rule's skip list, and a refund is applied if the session was already paid.

---

### Cancel from a date forward

**How:** Tap a session → "Cancel this and following"

All sessions on that date and after are cancelled. If this session is part of a multi-day recurring rule (e.g., Mon/Wed/Fri), only the sessions on this specific day of the week are cancelled going forward — the other days continue as normal.

Technically, this works by setting an end date on the current rule and (if needed) creating a continuation rule for the remaining weekdays.

---

### Cancel an entire recurring rule

**How:** "Manage" button → select a rule → "Cancel"

The entire rule is removed. All future paid sessions generate a refund.

---

### Edit the time of a session

**How:** Tap a session → edit the time → choose scope

The sitter changes the start time and then picks:
- **This occurrence only** — only that one session is updated. The change is stored as a per-date override.
- **This and all future** — the rule is split. The original rule gets an end date just before this session, and a new rule picks up from here with the new time. If the rule had multiple weekdays (e.g., Mon/Wed/Fri), a separate continuation rule is created for the unchanged days.

Changed sessions appear with a blue **"Changed"** badge (showing old time → new time). Sessions from a continuation rule show a blue **"Updated"** badge.

> Duration, pets, and service type are not exposed for editing in this flow today — only time. These are ready to build — see [Section 10](#10-whats-ready-to-build-next).

---

### Review and confirm changes

**How:** Any edit → "Review changes" button

Before committing, the sitter sees a summary of everything that will change: sessions added, removed, or shifted, each with its financial impact. A net total is shown at the bottom. The sitter can confirm all changes at once or discard them and return to the last saved state.

---

## 7. Overnight Services

Overnight services (Boarding, House Sitting) use a different data model and have some special behaviors.

### How they differ from daytime services

| | Daytime | Overnight |
|--|---------|-----------|
| Duration | Set in minutes (e.g., 60 min) | Derived from check-in + check-out dates |
| Recurrence days | Selected weekdays (e.g., Mon/Wed/Fri) | Same start day-of-week each cycle |
| `durationMins` field | Used | Ignored |
| `endDate` field | Not used | Required (check-out date) |

**Night count** is the number of days between check-in and check-out. A stay from Monday to Wednesday = 2 nights.

### Recurrence constraint

Stays of **7 or more nights cannot be set to repeat**. The repeat option is silently disabled in the UI for these stays. (No explanation is currently shown to the sitter — a known gap.)

### How overnight stays appear in the agenda

Each night of a stay gets its own entry in the agenda. A 3-night stay (Mon check-in, Thu check-out) creates three rows: Mon (Night 1 of 3), Tue (Night 2 of 3), Wed (Night 3 of 3).

---

## 8. Change Review & Confirmation

All edits are staged as a draft before being committed. The review sheet lets the sitter see everything at once before it takes effect.

### How changes are detected

`computeScheduleDiff(savedUnits, draftUnits)` compares the saved and draft rule arrays and categorizes changes:

| Category | What it means |
|---|---|
| `added` | New rules not in the saved state, each with a charge amount |
| `removed` | Rules that were deleted, each with a refund amount |
| `modified` | Rules present in both but structurally changed (e.g., an end date was set) |
| `skipped` | Dates newly added to a rule's skip list, each with a refund amount if the session was paid |
| `overridden` | Per-date changes (e.g., a new start time for a single session) |
| `refundTotal` | Total refund across removed + skipped |
| `chargeTotal` | Total charge across added |
| `netAmount` | `chargeTotal − refundTotal`. Positive = net charge, negative = net refund, 0 = no impact |

**Key rule:** The paid boundary is always derived from the saved state, not the draft. This ensures moving sessions within an already-paid week doesn't create false charges.

**Continuation rules are not counted as "new":** When a rule is split (e.g., to change "this and all future"), the continuation rule gets a new ID — but its sessions match sessions that already existed. The diff compares by service + date (not ID), so these sessions show as "Updated" rather than "Added."

### What the review sheet shows

Changes are listed in date order. Each row shows:
- The service name and date
- What changed (e.g., time shift)
- The financial impact for that session (refund or charge)

At the bottom, the net total is displayed. If the net is $0, no financial row is shown.

### Confirming vs. discarding

On **confirm**: the draft becomes the new saved state, and a summary message is sent to the conversation.

On **discard** (before confirming): all draft changes are thrown away and the schedule reverts to the last saved state.

---

## 9. Known Edge Cases & Gaps

### Accepted behaviors

**Week spanning a month boundary**
When a week straddles two calendar months (e.g., March 30–April 5), `AgendaView` shows "Week of Mar 30" under both the March and April month headers. The data is correct; this is a display quirk accepted as-is.

**Same-week move = $0 net**
Moving a session within the same already-paid week nets to $0. This is intentional. The paid boundary is fixed from the saved state, not recalculated from the draft.

**Rule splitting after "this and all future"**
When a sitter changes the time starting from a specific session, the rule is split into two or three units. These get new IDs but their sessions are matched to existing ones by service + date, not ID. The `_continuation` and `_parentTime` flags on these units drive agenda badge display — they would not survive serialization to a real backend.

**PROTO_TODAY anchor**
`PROTO_TODAY = new Date()` is evaluated once when the `owners.js` module loads. All schedule math is relative to that moment. There is no way to mock or override the current date in the prototype.

**120-session hard cap**
`expandUnit()` silently stops generating sessions after 120. For long-running, high-frequency rules, future dates could be truncated. No indication is shown to the sitter.

---

### Known gaps to address

**No conflict detection**
`overlaps()` exists in `scheduleHelpers.js` and can detect sessions of the same type at the same time on the same day. It is not called during add or edit flows. A sitter can currently create two walks at the same time without any warning.

**No unskip flow**
Once a date is skipped, there is no way to restore it through the UI. The data model supports it (remove the date from `skippedKeys`), but the flow hasn't been built.

**Overnight >6 nights: silent restriction**
When a stay is 7 or more nights, the repeat option is disabled without explanation. A sitter may not understand why they can't set it to repeat.

**`everyNWeeks` not supported for monthly frequency**
The data model has `everyNWeeks`, but the monthly recurrence logic always steps by exactly one month. "Every 2 months" is not supported even though the field exists.

**`weekDays` not cleared when switching to monthly**
Monthly recurrence doesn't use `weekDays`, but the field is not cleared when a sitter switches from weekly to monthly. Stale data sits in the unit silently.

**Paid-through date is always this week**
`getPaidThruSunday()` always returns the Sunday of the current week, regardless of when the relationship started or how billing actually works. In production, the paid-through date would come from a billing record.

---

## 10. What's Ready to Build Next

The data model and schedule logic already support the following. None of these require structural changes — they need UI to expose them.

### Per-unit service type selection

The `serviceId` field on each unit can be any of the five service types. The underlying data, recurrence, and billing logic all handle each type correctly. What's missing is a service-type picker in the add/edit form so sitters can choose which service they're adding.

### Per-unit pet selection

Each unit has a `petIds` array that controls which pets are included in that booking. Currently the UI defaults to all pets in the relationship. Adding a pet toggle to the add/edit form would let sitters configure this per unit.

### Frequency and weekday customization

The `frequency`, `weekDays`, and `everyNWeeks` fields are fully supported in the data model and recurrence engine. The add form can be extended to let sitters choose: once, weekly (with day selection), bi-weekly, or monthly.

### Duration selection

`durationMins` is stored per unit and used in billing and display. Exposing a duration picker (30, 45, 60, 120 min for walks and drop-ins; 4, 8, 12 hr for daycare) in the add/edit form is straightforward.

### Editing service type, pets, or duration on existing units

The "edit this and all future" flow already supports changing these fields — `overrideFromDate()` handles the rule split. The UI currently only exposes time editing in this flow. Expanding the edit form to include service type, pets, and duration would unlock per-unit and per-date granularity.

### Unskip a session

The data model supports unskipping — it's just removing a date from `skippedKeys`. A UI flow to show skipped sessions and let the sitter restore them is ready to build.
