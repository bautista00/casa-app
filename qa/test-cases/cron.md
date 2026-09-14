# CRON — Automation (`src/app/api/cron/*`)

"Zero admin burden" (`PRODUCT.md` §Product Principles 3) rests entirely on these three routes:
`generate` creates recurring instances, `week-close` freezes the week and picks the winner,
`reminders` nudges people on WhatsApp.

Auth behaviour was exercised live in E1 against the running dev server. The data behaviour needs a
real database and is `BLOCKED`, except where the local Postgres harness or an executed domain probe
settles it.

| ID | Title | Pri | Verdict (RUN-2026-09-14) | Bug |
|---|---|---|---|---|
| TC-CRON-001 | Every cron route enforces `CRON_SECRET` | P0 | FAIL | CASA-003 |
| TC-CRON-002 | A rotating template rotates across consecutive occurrences | P1 | FAIL | CASA-007 |
| TC-CRON-003 | `generate` is idempotent across repeated runs | P0 | PASS | — |
| TC-CRON-004 | `week-close` closes a week exactly once | P0 | BLOCKED | — |
| TC-CRON-005 | `week-close` hands the dreaded task to the last-place member | P0 | BLOCKED | — |
| TC-CRON-006 | `reminders` fires at 08:00 household-local, once | P1 | BLOCKED | — |
| TC-CRON-007 | `reminders` actually sends a WhatsApp message | P1 | FAIL | — (see Notes) |

---

### TC-CRON-001 — Every cron route enforces `CRON_SECRET`

| | |
|---|---|
| **Priority** | P0 |
| **Type** | security |
| **Level** | L3 E2E |
| **Env** | E1 |
| **Automated** | curl matrix, `qa/reports/2026-09-14/L4-cron-secret-bypass.txt` |

See **TC-SEC-003** for the full case; duplicated into this suite because it is a cron regression too.

**Expected result**
401 for a missing header, a wrong secret, and **any** header when `CRON_SECRET` is unset; 200 only for
the exact value.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-003
**Notes** With the variable unset, `Authorization: Bearer undefined` returns 200 on all three routes.
With it set, the matrix is correct (200/401/401/401).

---

### TC-CRON-002 — A rotating template rotates across consecutive occurrences

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L2 contract |
| **Env** | E2 |

**Preconditions** Three members; one daily template with `assignment = 'rotate'`; no existing
instances.

**Steps**
1. `GET /api/cron/generate` once with a valid secret.
2. `select due_date, assignee_id from tasks where template_id = <t> order by due_date;`
3. Run it again the next day and re-read.

**Expected result**
The assignee alternates per occurrence — a, b, c, a, b, c … across the whole batch — and a re-run does
not reshuffle existing rows. `pickRotatedAssignee`'s contract is "given the last assignee, return the
next one" (`src/lib/domain/recurrence.ts:92-95`), applied per occurrence.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-007
**Notes** Verdict from code structure plus an executed probe. `assigneeId` is computed once, outside
the date loop (`generate/route.ts:41-69` vs `:83`), and the batch is 15 dates wide (executed:
`qa/reports/2026-09-14/L1-probe-recurrence.txt`), so a new rotating daily task goes to one person for
15 consecutive days. `pickRotatedAssignee` itself passes every L1 case. Database confirmation blocked
by the lack of E2.

---

### TC-CRON-003 — `generate` is idempotent across repeated runs

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L2 contract |
| **Env** | E0 (local Postgres harness) |

**Steps**
1. Insert a template instance for a date with `on conflict (template_id, due_date) do nothing`.
2. Insert the identical row again.
3. Count.

**Expected result**
One row. Consecutive daily runs overlap by 14 of 15 dates (TC-DOM-015), so without this the board
would fill with duplicates within a week.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Executed on PostgreSQL 16.13 —
`qa/reports/2026-09-14/L2-tasks-unique-constraint.txt`, section T4. **Re-run first after CASA-002**:
the fix replaces the constraint with a partial index and this is the behaviour that must survive.

---

### TC-CRON-004 — `week-close` closes a week exactly once

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L2 contract |
| **Env** | E2 |

**Steps**
1. Call `/api/cron/week-close?now=<the day after the end day>` with a valid secret.
2. Read `weeks` and `week_scores`.
3. Call it again with the same `now`, and again with `now` two days later.

**Expected result**
One `weeks` row with `closed_at` set, one `week_scores` row per member, and every subsequent call
reports "already closed" without writing anything. The `unique (household_id, week_end)` constraint is
the backstop.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker: no E2 database and no service-role key. Two things to check closely on the next run:
(a) the window it freezes will move once CASA-004 lands; (b) the guard at `week-close/route.ts:51-56`
compares `currentWeek.start` with the closable start, which by construction can never match — the
branch is dead. It is harmless today (the closable week has always ended), but it means a household
created mid-week gets a closed week with no tasks and a winner picked from an empty board on the first
run. Verify that case explicitly.

---

### TC-CRON-005 — `week-close` hands the dreaded task to the last-place member

| | |
|---|---|
| **Priority** | P0 |
| **Type** | functional |
| **Level** | L2 contract |
| **Env** | E2 |

**Preconditions** `dreaded_template_id` set; a clear last place (no bottom tie).

**Steps**
1. Close the week.
2. Read the assignee of the dreaded template's open instances in the new week.

**Expected result**
All reassigned to the last-place member — `PRODUCT.md` §Purpose ("The last-place member inherits the
'dreaded task'"), implemented at `week-close/route.ts:117-130`. On a bottom tie, nobody inherits
(TC-DOM-009).

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-CRON-004. Note the interaction with CASA-007: the generator may immediately
overwrite these assignees on its next run for dates it re-touches — test the two crons together, in
both orders.

---

### TC-CRON-006 — `reminders` fires at 08:00 household-local, once

| | |
|---|---|
| **Priority** | P1 |
| **Type** | boundary |
| **Level** | L2 contract |
| **Env** | E2 |

**Steps**
1. Call `/api/cron/reminders?now=<11:00Z>` — 08:00 in Buenos Aires.
2. Call it at `10:00Z` and `12:00Z`.

**Expected result**
Only the 11:00Z call produces results; the route is designed for an hourly schedule and gates on
`hour !== 8` in the household's own timezone (`reminders/route.ts:25-29`).

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-CRON-004. The timezone conversion here is done correctly
(`toZonedTime(now, household.timezone)`) — it is the board that forgets to do it (CASA-006). Also
worth checking on the next run: if the scheduler misses the 08:00 slot, that day's reminders are
skipped entirely with no catch-up.

---

### TC-CRON-007 — `reminders` actually sends a WhatsApp message

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L2 contract |
| **Env** | E2 |

**Steps**
1. Give a member a phone number and an open task due today.
2. Call `/api/cron/reminders` at their 08:00.
3. Check whether a WhatsApp template message was delivered.

**Expected result**
A message is sent through `WhatsAppChannel` — `PRODUCT.md` §Capabilities: "WhatsApp notifications are
the current notification channel (nobody in the family reads email daily)".

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** — (not filed; see Notes)
**Notes** Nothing is sent. The send is an explicit `// TODO` at
`src/app/api/cron/reminders/route.ts:67-68`, the composed `message` variable is unused (lint warning
at `:65`), and `WhatsAppChannel` (`src/lib/notify/whatsapp.ts`) is never imported anywhere. The route
nonetheless returns `{"message":"Reminders sent"}`. Recorded as **unimplemented**, not as a defect:
the code says so in the open, and QA does not file unbuilt features. Two things belong on someone's
list, and are in the run report's Observations: the route should not claim "sent", and the WhatsApp
channel has never been exercised at all.
