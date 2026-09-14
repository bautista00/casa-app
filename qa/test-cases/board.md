# BOARD — The task board (`/casa/[id]`)

The screen the family opens every day: overdue / today / this week / done, plus complete and reopen.

**Reachability.** Every case here needs a signed-in session. E2 is unavailable this cycle and CASA-001
makes the route throw even with credentials, so most cases are `BLOCKED`. Where a defect is provable
without running the page — a timezone-naive expression, a missing guard, a payload shape — the verdict
is `FAIL` and the Notes say the verdict came from code review plus an executed domain probe. No case
here is marked PASS on a guess.

| ID | Title | Pri | Verdict (RUN-2026-09-14) | Bug |
|---|---|---|---|---|
| TC-BOARD-001 | Tasks land in the right section | P0 | BLOCKED | — |
| TC-BOARD-002 | Completing a task moves it to "Hechas" and adds its points | P0 | BLOCKED | — |
| TC-BOARD-003 | "Hoy" means today in the household's timezone | P0 | FAIL | CASA-006 |
| TC-BOARD-004 | A double tap on "hecha" completes the task exactly once | P1 | FAIL | CASA-012 |
| TC-BOARD-005 | A realtime update keeps the assignee on the card | P2 | FAIL | CASA-015 |
| TC-BOARD-006 | A data-layer failure shows a Spanish error, not the Next.js screen | P1 | FAIL | CASA-008 |
| TC-BOARD-007 | Reopening a task removes its points again | P1 | BLOCKED | — |
| TC-BOARD-008 | Empty board shows the "No hay tareas" state | P2 | BLOCKED | — |
| TC-BOARD-009 | No horizontal overflow at 390×844 and nothing hides behind the bottom nav | P1 | BLOCKED | — |

---

### TC-BOARD-001 — Tasks land in the right section

| | |
|---|---|
| **Priority** | P0 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Preconditions**
Signed in, household with `week_end_day` and `timezone` set; four open tasks — one due yesterday, one
due today, one due later this week, one already completed today.

**Steps**
1. Open `/casa/<id>` at 390×844.
2. Read the four section headings and their badge counts.

**Expected result**
Atrasadas 1, Hoy 1, Esta semana 1, Hechas 1 — the grouping contract in
`src/components/board-view.tsx:27-58`.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker: CASA-001 (no signed-in page renders) plus no E2 credentials. Owner: backend-dev.

---

### TC-BOARD-002 — Completing a task moves it to "Hechas" and adds its points

| | |
|---|---|
| **Priority** | P0 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Note the member's current points in the leaderboard.
2. Tap the round check button on an open `normal` (3 pt) task.
3. Observe the toast, the card's section, and the leaderboard.

**Expected result**
Toast `es.board.complete` ("¡Listo!"), the card moves to "Hechas" struck through, and the member's
score rises by exactly 3 (`EFFORT_POINTS.normal`, `src/types/index.ts:6-10`).

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-BOARD-001.

---

### TC-BOARD-003 — "Hoy" means today in the household's timezone

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L3 E2E / L1 probe |
| **Env** | E0 probe (executed) + E2 (blocked) |

**Preconditions**
Household timezone `America/Argentina/Buenos_Aires`; server clock in UTC (as on Vercel); one task due
today and one due tomorrow.

**Steps**
1. Set the reference instant to `2026-09-17T00:30:00Z` — 21:30 the previous evening in Buenos Aires.
2. Compute the value the page uses: `format(now, 'yyyy-MM-dd')` (`casa/[id]/page.tsx:68`).
3. Compare with `format(toZonedTime(now, household.timezone), 'yyyy-MM-dd')`.
4. Feed both into `groupTasks` and read which section each task lands in.

**Expected result**
Both expressions give `2026-09-16`; the task due that day sits in "Hoy" and nothing is marked
"Atrasadas".

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-006
**Notes** Executed at L1: server-local `2026-09-17`, household-local `2026-09-16`. Every evening
between 21:00 and midnight local, today's chores show as overdue and tomorrow's show as today.
Verdict from an executed probe plus the grouping code; the rendered page is blocked by CASA-001.

---

### TC-BOARD-004 — A double tap on "hecha" completes the task exactly once

| | |
|---|---|
| **Priority** | P1 |
| **Type** | negative |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Double-tap the complete button within 300 ms.
2. Count network requests, read the toasts, then reload the page.

**Expected result**
One `PATCH`, one success toast, and the card is still "hecha" after reload. A second tap is a no-op;
a task another member already completed produces a friendly message, not `es.errors.generic`.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-012
**Notes** Verdict from code review: `handleComplete` (`board-view.tsx:180-203`) has no in-flight guard,
and `completeTask`'s `.eq('status','open').single()` turns the second call into an error whose catch
block reverts the optimistic update. `single()`'s "must be one row, otherwise this returns an error"
contract is quoted from the installed `@supabase/postgrest-js`. Live execution blocked by CASA-001.

---

### TC-BOARD-005 — A realtime update keeps the assignee on the card

| | |
|---|---|
| **Priority** | P2 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Open the same board on two devices.
2. Complete a task with an assignee on device A.
3. Look at that card on device B without reloading.

**Expected result**
The card still shows "😎 Bauti". The `Task` type declares `assignee?: Profile`
(`src/types/index.ts:75`) and the server query joins it.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-015
**Notes** Verdict from code review: `board-view.tsx:164` replaces the whole task with `payload.new`,
which is the raw `tasks` row — Supabase realtime carries no joined relations. Live execution blocked
by CASA-001.

---

### TC-BOARD-006 — A data-layer failure shows a Spanish error, not the Next.js screen

| | |
|---|---|
| **Priority** | P1 |
| **Type** | negative |
| **Level** | L3 E2E |
| **Env** | E1 / E2 |

**Steps**
1. Make a data call fail (unreachable Supabase host, or simply run against the schema as shipped,
   which fails on CASA-001).
2. Load `/casa/<id>`.

**Expected result**
A Spanish error card with a retry — `PRODUCT.md` §Users (non-technical adults) and the existence of
`es.errors.generic`.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-008
**Notes** Verdict from a file check executed this run: no `error.tsx`, `global-error.tsx` or
`not-found.tsx` exists anywhere under `src/app`, and the three server components make 13 awaited
throwing calls between them with zero `try` blocks.

---

### TC-BOARD-007 — Reopening a task removes its points again

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Complete a 5 pt task, note the score.
2. Tap the undo button on the same card.
3. Re-read the leaderboard.

**Expected result**
The score returns to its previous value; `completed_by` and `completed_at` are cleared
(`src/lib/data/tasks.ts:52-68`).

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-BOARD-001. Note for the next run: `reopenTask` has **no** status guard, so
reopening twice is harmless — the asymmetry with `completeTask` is worth confirming.

---

### TC-BOARD-008 — Empty board shows the "No hay tareas" state

| | |
|---|---|
| **Priority** | P2 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Open a board for a household with no tasks at all.

**Expected result**
The "Hoy" section is rendered with `es.board.noTasks` + 🎉 and the other three sections are hidden
(`board-view.tsx:233`); the leaderboard still lists every member at 0 points.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-BOARD-001.

---

### TC-BOARD-009 — No horizontal overflow at 390×844 and nothing hides behind the bottom nav

| | |
|---|---|
| **Priority** | P1 |
| **Type** | responsive |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Open the board at 390×844 with a long task title and four members.
2. Assert `documentElement.scrollWidth === clientWidth`.
3. Scroll to the bottom and confirm the last card clears the 64 px bottom nav.

**Expected result**
No horizontal scrollbar; the last card is fully visible above the nav (`pb-20` on the page wrapper,
`casa/[id]/page.tsx:71`).

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-BOARD-001. The signed-out pages measured clean at 390 px
(`qa/reports/2026-09-14/L3-browser-pass1.txt`), so the shell and fonts are not the risk here — the
task-card flex row is, especially once CASA-019 enlarges the complete button.
