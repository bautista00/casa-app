# LEAD — Leaderboard, winner and the dreaded task

The scoreboard is the product. `qa/TEST-PLAN.md` §2 ranks scoring correctness first, and the Casa
calibration in `.claude/agents/qa-qc.md` makes anything that gets points, standings, the winner or the
dreaded task wrong at least S1/P0.

The pure ranking maths is covered in `qa/test-cases/dom.md` (TC-DOM-007…014, all PASS). This file
covers the rendered board and the data that feeds it.

| ID | Title | Pri | Verdict (RUN-2026-09-14) | Bug |
|---|---|---|---|---|
| TC-LEAD-001 | Standings on screen match the tasks completed this week | P0 | BLOCKED | — |
| TC-LEAD-002 | The days-left badge counts down to "1 día restante" | P0 | FAIL | CASA-004 |
| TC-LEAD-003 | A tie is shown as a tie, with no crown | P0 | BLOCKED | — |
| TC-LEAD-004 | Every task the board shows as scoring actually scores | P0 | FAIL | CASA-011 |
| TC-LEAD-005 | Tied members are styled alike | P3 | BLOCKED | — |
| TC-LEAD-006 | The weekly prize is shown when set and hidden when not | P2 | BLOCKED | — |

---

### TC-LEAD-001 — Standings on screen match the tasks completed this week

| | |
|---|---|
| **Priority** | P0 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Preconditions**
Four members; a known set of completed tasks inside the current week window and at least one completed
task from the previous week.

**Steps**
1. Open `/casa/<id>`.
2. Add up the points of the completed tasks in the current window by hand.
3. Compare with each row of "Tabla de posiciones".

**Expected result**
Row points equal the hand-computed totals; last week's completed task contributes nothing. Credit goes
to `completed_by`, not to the assignee (`src/lib/domain/ranking.ts:40-45`) — whoever actually did it
gets the points.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker: CASA-001 plus no E2 credentials. The underlying `computeStandings` is fully covered
and passing at L1; what is untested is the *selection* of tasks fed into it, which is where CASA-004
and CASA-011 bite.

---

### TC-LEAD-002 — The days-left badge counts down to "1 día restante"

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L1 unit + L3 E2E |
| **Env** | E0 (executed) / E2 (blocked) |

**Preconditions** `week_end_day = 0` (the default), timezone Buenos Aires.

**Steps**
1. Evaluate `daysRemaining(now, 0, TZ)` at noon local for Mon → Sun.
2. On the closing day, read the badge in the leaderboard header.

**Expected result**
7 → 1 across the week, and on the closing day the badge reads the singular
`es.leaderboard.dayLeft` — "1 día restante" (`src/components/leaderboard.tsx:33`).

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-004
**Notes** Executed at L1: the sequence is 7,6,5,4,3,2,1 for Sun→Sat but restarts at 7 **on Sunday**,
the day the household nominated as the closing day. The singular branch can never render for
`weekEndDay = 0`. Urgency on the last day is the mechanic that makes the game work.

---

### TC-LEAD-003 — A tie is shown as a tie, with no crown

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Arrange two members on identical points and identical task counts.
2. Close the week with `/api/cron/week-close`.
3. Open `/casa/<id>/historial`.

**Expected result**
`weeks.winner_profile_id` is NULL and the history card reads "🤝 Empate"
(`historial/page.tsx:136-139`); no member is crowned on the board.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-LEAD-001. The decision logic itself passes at L1 (TC-DOM-007/008).

---

### TC-LEAD-004 — Every task the board shows as scoring actually scores

| | |
|---|---|
| **Priority** | P0 |
| **Type** | boundary |
| **Level** | L3 E2E |
| **Env** | E2 |

**Preconditions** One task created with the due-date field cleared.

**Steps**
1. Confirm the card appears under "Esta semana" with its points badge.
2. Complete it.
3. Read the leaderboard.

**Expected result**
Either the points are credited, or the product never lets the task exist in that state. A card that
advertises "3pts" and pays 0 breaks the only promise the scoreboard makes.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-011
**Notes** Verdict from code review of both scorers, executed against the source this run: the board
shows dateless tasks (`board-view.tsx:52-53`) and even keeps them in "Hechas" via `completed_at`
(`:40-45`), but the leaderboard filter drops them (`casa/[id]/page.tsx:39-42`) and so does the
week-close snapshot (`week-close/route.ts:71-72`). Live confirmation blocked by CASA-001.

---

### TC-LEAD-005 — Tied members are styled alike

| | |
|---|---|
| **Priority** | P3 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Arrange a two-way tie at the top.
2. Compare the two rows' backgrounds and rank pills.

**Expected result**
Two members on rank 1 look the same.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-LEAD-001. Static reading suggests they will not:
`src/components/leaderboard.tsx:46-62` styles by array **index** (`i === 0`, `i === 1`) while printing
`member.rank`, so the second of two rank-1 members gets the silver treatment next to a "1". Recorded
as an Observation, not filed — cosmetic, and it needs the rendered page to confirm.

---

### TC-LEAD-006 — The weekly prize is shown when set and hidden when not

| | |
|---|---|
| **Priority** | P2 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. With `reward_text` empty, open the board.
2. Set a prize in Ajustes, return to the board.

**Expected result**
No prize block when empty; "🎁 Premio de la semana" plus the text when set
(`leaderboard.tsx:117-125`).

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-LEAD-001. `es.leaderboard.noPrize` ("Sin premio definido") exists but is never
rendered — the empty state is simply blank. Observation.
