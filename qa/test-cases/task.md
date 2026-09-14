# TASK — Creating tasks and templates (`/casa/[id]/nueva`)

Covers one-off task creation, recurring templates, the effort→points mapping and the database
constraints that back them.

| ID | Title | Pri | Verdict (RUN-2026-09-14) | Bug |
|---|---|---|---|---|
| TC-TASK-001 | A one-off task saves and appears on the board | P0 | BLOCKED | — |
| TC-TASK-002 | Two one-off tasks can share a due date | P0 | FAIL | CASA-002 |
| TC-TASK-003 | Re-running the generator does not duplicate a template's instance | P0 | PASS | — |
| TC-TASK-004 | Effort maps to the documented points | P0 | BLOCKED | — |
| TC-TASK-005 | Task queries match the schema's columns and FK alias names | P1 | PASS | — |
| TC-TASK-006 | A weekly template cannot be saved with no weekday | P2 | FAIL | CASA-022 |
| TC-TASK-007 | A recurring template is created, not an immediate task | P2 | BLOCKED | — |
| TC-TASK-008 | A task can be deleted | P2 | N/A | — |

---

### TC-TASK-001 — A one-off task saves and appears on the board

| | |
|---|---|
| **Priority** | P0 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Preconditions** Signed in, household with at least two members.

**Steps**
1. `/casa/<id>/nueva`: título "Lavar los platos", esfuerzo Normal, asignar a another member, fecha =
   today. Guardar.
2. Land back on the board and find the card.

**Expected result**
Toast "Tarea creada", redirect to `/casa/<id>`, and the card appears under "Hoy" with the assignee's
emoji + name and a "3pts" badge.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker: CASA-001 and no E2 credentials. Note that the page loads members through
`getHouseholdMembers`, which is the function CASA-001 breaks — this route cannot even render its
assignee picker today.

---

### TC-TASK-002 — Two one-off tasks can share a due date

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L2 contract |
| **Env** | E0 (local Postgres harness) / E2 |
| **Automated** | `psql -f qa/reports/2026-09-14/L2-tasks-unique-constraint.txt` steps |

**Preconditions** Schema applied to PostgreSQL 16; two households seeded.

**Steps**
1. Insert an ad-hoc task (`template_id` NULL) for household A due `2026-09-15`.
2. Insert a second, different ad-hoc task for household A due the same day.
3. Insert an ad-hoc task for household **B** due the same day.
4. Insert two ad-hoc tasks with no `due_date` at all.

**Expected result**
All five inserts succeed. A family adds several chores for the same day constantly, and two separate
households must never be able to block each other.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-002
**Notes** Steps 2, 3 and the second half of 4 all fail with
`duplicate key value violates unique constraint "tasks_template_id_due_date_key"` —
`UNIQUE NULLS NOT DISTINCT (template_id, due_date)` treats two NULL template ids as equal, so exactly
one dateless-template task per date can exist **in the whole table**. In the UI this surfaces only as
`es.errors.generic`.

---

### TC-TASK-003 — Re-running the generator does not duplicate a template's instance

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L2 contract |
| **Env** | E0 (local Postgres harness) / E2 |

**Steps**
1. Create a template.
2. Insert an instance for `2026-09-16` with `on conflict (template_id, due_date) do nothing`.
3. Insert the identical row again.
4. Count rows for that template.

**Expected result**
Exactly one row — the idempotency the generator relies on
(`src/app/api/cron/generate/route.ts:85-99`).

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** `INSERT 0 1` then `INSERT 0 0`, one row. **Re-run this case immediately after CASA-002** —
replacing the constraint with a partial index changes how PostgREST infers `onConflict`, and this is
the behaviour that must not regress.

---

### TC-TASK-004 — Effort maps to the documented points

| | |
|---|---|
| **Priority** | P0 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Create one task at each effort level.
2. Read the badge on each card and the `points` column in the database.

**Expected result**
rápida 1, normal 3, pesada 5 — `EFFORT_POINTS` (`src/types/index.ts:6-10`), matching the badge labels
in `board-view.tsx:60-64` and the copy in `es.task.effort*`.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Static cross-check done and consistent: the constant, the three badge labels and the three
i18n strings all agree, and `createTask` writes `Points[task.effort]` server-side rather than trusting
a client value. Only the end-to-end confirmation is blocked.

---

### TC-TASK-005 — Task queries match the schema's columns and FK alias names

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L2 contract |
| **Env** | E0 (local Postgres harness) |

**Steps**
1. Apply the migration and list the generated foreign-key constraint names on `tasks`,
   `household_members` and `week_scores`.
2. Compare with the aliases used in `.select()` across `src/lib/data/*` and the cron routes.

**Expected result**
Every embedded-resource hint resolves. `tasks` has three FKs to `profiles`, so the assignee join
**must** be disambiguated.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Generated names: `tasks_assignee_id_fkey`, `tasks_completed_by_fkey`, `tasks_created_by_fkey`,
`tasks_template_id_fkey`, `tasks_household_id_fkey`, `household_members_profile_id_fkey`,
`week_scores_profile_id_fkey`. The code uses `profiles!tasks_assignee_id_fkey`
(`src/lib/data/tasks.ts:77,104`; `src/app/api/cron/reminders/route.ts:36`) — correct and unambiguous.
The unqualified `profile:profiles(*)` joins on `household_members` and `week_scores` are unambiguous
because each has exactly one FK to `profiles`. `Task.completed_by_profile` is declared in the types
but never selected anywhere — Observation, not a defect.

---

### TC-TASK-006 — A weekly template cannot be saved with no weekday

| | |
|---|---|
| **Priority** | P2 |
| **Type** | negative |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. `/casa/<id>/nueva`, título set, "Tarea recurrente" on, frecuencia "Semanal".
2. Select no days. Tap Guardar.

**Expected result**
Guardar is disabled, or the save is rejected with a Spanish hint — a template with
`days_of_week = '{}'` produces occurrences forever-never
(`src/lib/domain/recurrence.ts:46`).

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-022
**Notes** The only guard on the save button is `!title.trim()`
(`nueva/page.tsx:340`). The domain side is confirmed by execution: weekly with an empty day set
returns `[]` (`qa/reports/2026-09-14/L1-probe-recurrence.txt`).

---

### TC-TASK-007 — A recurring template is created, not an immediate task

| | |
|---|---|
| **Priority** | P2 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Create a daily recurring task.
2. Look at the board immediately, then run `/api/cron/generate`, then look again.

**Expected result**
Nothing on the board until the generator runs; after it runs, 15 instances exist over the next 14 days
(TC-DOM-015).

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker: CASA-001 / no E2. Worth a product decision: from the family's point of view,
creating a task and seeing nothing appear looks like a failure. Recorded as an Observation in the run
report.

---

### TC-TASK-008 — A task can be deleted

| | |
|---|---|
| **Priority** | P2 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Open a task's actions on the board and delete it.

**Expected result**
The task disappears for every member and its points leave the current week's standings.

**Last run** — RUN-2026-09-14 · **Verdict:** N/A · **Bug:** —
**Notes** Not applicable: there is no delete affordance anywhere in the UI. `deleteTask`
(`src/lib/data/tasks.ts:114`), the RLS delete policy and `es.task.delete` all exist, but no component
calls any of them, and there is no edit path either. Recorded as a coverage gap in the run report's
Observations rather than filed as a defect — the scaffolding is there, the screen is not. Re-score this
case once the feature lands.
