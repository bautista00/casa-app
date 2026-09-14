# DOM — Domain logic (`src/lib/domain/**`)

The highest-value suite in Casa: pure, framework-free, and reused by every future client. All cases
run in **E0** (no services). All verdicts in this file came from **real execution** — the probe
scripts are quoted in `qa/reports/2026-09-14/L1-probe-*.txt`.

| ID | Title | Pri | Verdict (RUN-2026-09-14) | Bug |
|---|---|---|---|---|
| TC-DOM-001 | The chosen week-end day is inside the week it ends | P0 | FAIL | CASA-004 |
| TC-DOM-002 | `daysRemaining` is 1 on the end day | P0 | FAIL | CASA-004 |
| TC-DOM-003 | Every week window spans exactly 7 days | P0 | PASS | — |
| TC-DOM-004 | `getClosableWeek` returns the seven days that just ended | P0 | PASS | — |
| TC-DOM-005 | `formatWeekRange` prints an inclusive range | P2 | PASS | — |
| TC-DOM-006 | `isInWeek` is start-inclusive and end-exclusive | P1 | PASS | — |
| TC-DOM-007 | Four-way tie produces no winner and no last place | P0 | PASS | — |
| TC-DOM-008 | Two-way tie at the top still names a last place | P0 | PASS | — |
| TC-DOM-009 | Two-way tie at the bottom names a winner but no last place | P0 | PASS | — |
| TC-DOM-010 | Empty household does not crash and declares nothing | P1 | PASS | — |
| TC-DOM-011 | One-member household names that member the winner | P1 | PASS | — |
| TC-DOM-012 | Two-member household names both a winner and a last place | P0 | PASS | — |
| TC-DOM-013 | Ranks use competition numbering (1,1,3,3) | P0 | PASS | — |
| TC-DOM-014 | Points from a member who left the household are ignored | P1 | PASS | — |
| TC-DOM-015 | Daily recurrence covers the whole horizon, both ends | P1 | PASS | — |
| TC-DOM-016 | Monthly on the 31st clamps in 30-day months and February | P1 | PASS | — |
| TC-DOM-017 | Monthly on the 29th resolves in leap and non-leap Februaries | P1 | PASS | — |
| TC-DOM-018 | `nextOccurrences` never returns a duplicate date | P1 | PASS | — |
| TC-DOM-019 | A 14-day cron horizon still reaches every monthly occurrence | P1 | PASS | — |
| TC-DOM-020 | Rotation recovers when the last assignee has left the household | P1 | PASS | — |
| TC-DOM-021 | Rotation handles a one-member and an empty household | P2 | PASS | — |

---

### TC-DOM-001 — The chosen week-end day is inside the week it ends

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |
| **Automated** | `npm test -- week` (test file does not exist yet — see CASA-004) |

**Preconditions**
`weekEndDay = 0` (Sunday, the default from `createHousehold`), timezone `America/Argentina/Buenos_Aires`.

**Steps**
1. `getWeekWindow(new Date('2026-09-20T15:00:00Z'), 0, TZ)` — 2026-09-20 is a Sunday, 12:00 local.
2. Read `start`, `end` and the last included day (`end − 1 day`).
3. `isInWeek(Sunday 2026-09-20, window)`.

**Expected result**
`start = 2026-09-14` (Monday), `end = 2026-09-21` (exclusive), last included day `2026-09-20` Sunday,
`isInWeek(Sunday) === true` — per the doc comment at `src/lib/domain/week.ts:22-24`: "the week runs
Mon 00:00 → Sun 23:59:59 and closes at Sun midnight".

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-004
**Notes** Actual `start = 2026-09-20`, `end = 2026-09-27`, last included day Saturday; the Sunday that
was supposed to close the week opens a new one. Chores done on the final day score for the next week.

---

### TC-DOM-002 — `daysRemaining` is 1 on the end day

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |
| **Automated** | `npm test -- week` |

**Preconditions** As TC-DOM-001.

**Steps**
1. Call `daysRemaining(now, 0, TZ)` at noon local for each day Mon → Sun of one week.

**Expected result**
7, 6, 5, 4, 3, 2, **1** — "days remaining in the current week (including today)"
(`src/lib/domain/week.ts:46-48`) must reach 1 on the closing day so the badge can read
"1 día restante" (`es.leaderboard.dayLeft`).

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-004
**Notes** Sunday returns 7. The singular branch in `src/components/leaderboard.tsx:33` is therefore
unreachable for `weekEndDay = 0`.

---

### TC-DOM-003 — Every week window spans exactly 7 days

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |
| **Automated** | `npm test -- week` |

**Preconditions** None.

**Steps**
1. For `weekEndDay` 0…6 and for each of seven consecutive reference days, call `getWeekWindow`.
2. Assert `(end − start) === 7 days` and that the reference day is inside the window.

**Expected result**
Always exactly 7 days, and `now` always falls inside its own window.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Verified for `weekEndDay` 0 and 1 across a full week each. The window length and
self-containment are correct; only its *offset* is wrong (CASA-004).

---

### TC-DOM-004 — `getClosableWeek` returns the seven days that just ended

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |
| **Automated** | `npm test -- week` |

**Preconditions** `weekEndDay = 0`.

**Steps**
1. Walk one week of reference dates; call `getClosableWeek(now, 0, TZ)` and `getWeekWindow(now, 0, TZ)`.
2. Assert `closable.end === current.start` and `closable` spans 7 days.

**Expected result**
The closable window is always the one immediately preceding the current one, and it rolls over exactly
once per week.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Correct relative to `getWeekWindow`; it inherits CASA-004's offset. Separately noted: the
guard at `src/app/api/cron/week-close/route.ts:52` compares `currentWeek.start` with the closable
start, which by construction can never be equal — the branch is dead code (Observation, not a defect).

---

### TC-DOM-005 — `formatWeekRange` prints an inclusive range

| | |
|---|---|
| **Priority** | P2 |
| **Type** | functional |
| **Level** | L1 unit |
| **Env** | E0 |
| **Automated** | `npm test -- week` |

**Steps**
1. `formatWeekRange(getWeekWindow(anyWednesday, 0, TZ))`.

**Expected result**
The printed end date is `window.end − 1 day`, i.e. seven days inclusive — the function subtracts a day
explicitly (`src/lib/domain/week.ts:64`, `// end is exclusive`).

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** `"13 Sep – 19 Sep"` for the 13→20 window. Correct convention. History does **not** follow it
— see CASA-021.

---

### TC-DOM-006 — `isInWeek` is start-inclusive and end-exclusive

| | |
|---|---|
| **Priority** | P1 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |

**Steps**
1. Build a window, then test every day from `start − 2` to `start + 8`.

**Expected result**
`start` is inside, `end` is outside, everything between is inside.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Membership table in `qa/reports/2026-09-14/L1-probe-week.txt`.

---

### TC-DOM-007 — Four-way tie produces no winner and no last place

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |
| **Automated** | `npm test -- ranking` |

**Preconditions** Four members, each with 3 points from one task.

**Steps**
1. `computeStandings(tasks, members)` then `determineResults(standings)`.

**Expected result**
All four rank 1; `winner === null`, `lastPlace === null`, `isTie === true`. Nobody inherits the
dreaded task on a total tie — `PRODUCT.md` §Purpose gives the dreaded task to "the last-place member",
and there isn't one.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Also verified for the all-zero-points household (nobody did anything all week): same result.

---

### TC-DOM-008 — Two-way tie at the top still names a last place

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |

**Preconditions** a=5, b=5, c=3, d=1.

**Expected result**
Ranks 1,1,3,4; `winner === null` (`isTie === true`); `lastPlace === d`. The prize is withheld, but the
dreaded task still lands.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —

---

### TC-DOM-009 — Two-way tie at the bottom names a winner but no last place

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |

**Preconditions** a=5, b=3, c=1, d=1.

**Expected result**
Ranks 1,2,3,3; `winner === a`; `lastPlace === null` — the dreaded task is not handed to an arbitrary
one of two equally-last members.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —

---

### TC-DOM-010 — Empty household does not crash and declares nothing

| | |
|---|---|
| **Priority** | P1 |
| **Type** | negative |
| **Level** | L1 unit |
| **Env** | E0 |

**Expected result**
`computeStandings([], [])` → `[]`; `determineResults([])` → `{winner: null, lastPlace: null, isTie: true}`.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —

---

### TC-DOM-011 — One-member household names that member the winner

| | |
|---|---|
| **Priority** | P1 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |

**Expected result**
`winner` is the only member, `lastPlace === null` (you cannot be last against yourself), `isTie === false`.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Holds even at 0 points: a solo member who did nothing still "wins" the week. Defensible for a
one-person household but worth a product decision — recorded as an Observation, not a defect.

---

### TC-DOM-012 — Two-member household names both a winner and a last place

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |

**Preconditions** The Bauti + brother flat: a=5, b=0.

**Expected result**
`winner === a`, `lastPlace === b`, `isTie === false`.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** The existing unit test "returns null lastPlace when bottom ties" actually asserts this case;
its name is misleading (Observation).

---

### TC-DOM-013 — Ranks use competition numbering

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |

**Steps**
1. Points 5,5,3,3 → expect ranks 1,1,3,3.
2. Points 5,3,3,1 → expect 1,2,2,4.
3. Points 5,5,5,1 → expect 1,1,1,4.

**Expected result**
Standard competition ranking, with ties sharing a rank and the following rank skipped accordingly —
the documented tie rule at `src/lib/domain/ranking.ts:22-26`.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** All three sequences matched exactly.

---

### TC-DOM-014 — Points from a member who left the household are ignored

| | |
|---|---|
| **Priority** | P1 |
| **Type** | negative |
| **Level** | L1 unit |
| **Env** | E0 |

**Preconditions** A completed task whose `completed_by` is not in the members list.

**Expected result**
The task contributes nothing and no phantom row appears in the standings.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** A 99-point ghost task was silently dropped, as intended.

---

### TC-DOM-015 — Daily recurrence covers the whole horizon, both ends

| | |
|---|---|
| **Priority** | P1 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |
| **Automated** | `npm test -- recurrence` |

**Expected result**
`horizon = 14` from a given day returns 15 dates: the start day through start+14 inclusive. This is
the documented behaviour the existing test asserts (8 dates for `horizon = 7`).

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Consecutive cron runs overlap by 14 of the 15 dates; the `(template_id, due_date)` uniqueness
makes that idempotent (TC-TASK-003).

---

### TC-DOM-016 — Monthly on the 31st clamps in short months

| | |
|---|---|
| **Priority** | P1 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |

**Expected result**
`day_of_month = 31` yields the last day of any shorter month, never a skipped month:
Jan 31 → Feb 28 → Mar 31.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Also checked `day_of_month = 30` (Jan 30 → Feb 28 → Mar 30). Clamping is intentional
(`Math.min(targetDay, daysInMonth(...))`, `src/lib/domain/recurrence.ts:62`).

---

### TC-DOM-017 — Monthly on the 29th resolves in leap and non-leap Februaries

| | |
|---|---|
| **Priority** | P1 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |

**Expected result**
2026 (non-leap) → `2026-02-28`; 2024 (leap) → `2024-02-29`.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —

---

### TC-DOM-018 — `nextOccurrences` never returns a duplicate date

| | |
|---|---|
| **Priority** | P1 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |

**Steps**
1. Run daily, weekly (1 day and all 7 days) and monthly (days 30 and 31, long horizons) and compare
   `out.length` with `new Set(out).size`.

**Expected result**
Always equal.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Including the month-end clamping cases, which were the likeliest source of collisions.

---

### TC-DOM-019 — A 14-day cron horizon still reaches every monthly occurrence

| | |
|---|---|
| **Priority** | P1 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |

**Steps**
1. `nextOccurrences({monthly, day_of_month: 31}, 2026-01-15, 14)` → `[]` (Jan 31 is 16 days out).
2. Same config from 2026-01-20 → must include `2026-01-31`.

**Expected result**
A monthly occurrence enters the 14-day window before its date arrives, so a **daily** generator run
creates it in time. Empty output far from the date is correct, not a miss.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** This case exists to stop a future reader mis-filing the empty result as a bug. It does mean
the generator **must run at least once every 14 days** — note it in the deployment checklist.

---

### TC-DOM-020 — Rotation recovers when the last assignee has left the household

| | |
|---|---|
| **Priority** | P1 |
| **Type** | negative |
| **Level** | L1 unit |
| **Env** | E0 |

**Steps**
1. `pickRotatedAssignee(['b','c'], 'a')` where `a` is no longer a member.

**Expected result**
A valid current member, not `null` and not `a` — the documented fallback at
`src/lib/domain/recurrence.ts:104` (`if (idx === -1) return memberIds[0]`).

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Returns `b`. The rotation restarts rather than resuming, which is acceptable.

---

### TC-DOM-021 — Rotation handles a one-member and an empty household

| | |
|---|---|
| **Priority** | P2 |
| **Type** | boundary |
| **Level** | L1 unit |
| **Env** | E0 |

**Expected result**
`(['a'], 'a')` → `'a'`; `([], anything)` → `null`; `(members, null)` → first member.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
