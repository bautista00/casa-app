# HIST — History and hall of fame (`/casa/[id]/historial`)

Closed weeks, past winners, trophy counts and streaks.

| ID | Title | Pri | Verdict (RUN-2026-09-14) | Bug |
|---|---|---|---|---|
| TC-HIST-001 | Closed weeks are listed newest first with their winner | P1 | BLOCKED | — |
| TC-HIST-002 | A week card spans exactly seven days | P2 | FAIL | CASA-021 |
| TC-HIST-003 | The hall of fame is hidden until someone has won | P2 | BLOCKED | — |
| TC-HIST-004 | Win counts and streaks are correct | P1 | BLOCKED | — |
| TC-HIST-005 | The empty state appears before any week has closed | P2 | BLOCKED | — |

---

### TC-HIST-001 — Closed weeks are listed newest first with their winner

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Preconditions** At least three closed weeks with different winners, and one tied week.

**Steps**
1. Open `/casa/<id>/historial` at 390×844.
2. Read the order of the cards and each card's winner line.

**Expected result**
Ordered by `week_end` descending, limit 20 (`getWeekHistory`, `src/lib/data/weeks.ts:5-20`); each card
shows 👑 + the winner's emoji and name, or "🤝 Empate" when `winner_profile_id` is NULL; only closed
weeks appear (`.not('closed_at','is',null)`).

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker: CASA-001 (the page calls `getHouseholdMembers`) and no E2 credentials. One thing to
watch: the winner's name is resolved from the **current** member list
(`historial/page.tsx:118`), so a past winner who has since left the household will silently render as
"🤝 Empate". Recorded as an Observation — confirm before filing.

---

### TC-HIST-002 — A week card spans exactly seven days

| | |
|---|---|
| **Priority** | P2 |
| **Type** | boundary |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Close a week whose stored window is `week_start = 2026-09-13`, `week_end = 2026-09-20`.
2. Read the date range printed on the card.
3. Compare with `formatWeekRange` for the same window.

**Expected result**
"13 Sep – 19 Sep". `weeks.week_end` is the **exclusive** boundary — the cron writes
`format(closable.end)` and `closable.end` is the first instant of the next week — so the display must
subtract a day, exactly as `src/lib/domain/week.ts:64` does.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-021
**Notes** `historial/page.tsx:120` formats `week_end` verbatim, giving "13 Sep – 20 Sep": eight days,
and consecutive cards share a date. Verdict from reading the writer and the reader together; live
execution blocked. Re-test **after** CASA-004, which changes which dates get stored.

---

### TC-HIST-003 — The hall of fame is hidden until someone has won

| | |
|---|---|
| **Priority** | P2 |
| **Type** | boundary |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. With zero closed weeks, open Historial.
2. Close one week with a winner and reload.

**Expected result**
The "Salón de la Fama" card is absent while every member has 0 wins
(`historial/page.tsx:48`), then appears listing only members with at least one win.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-HIST-001.

---

### TC-HIST-004 — Win counts and streaks are correct

| | |
|---|---|
| **Priority** | P1 |
| **Type** | boundary |
| **Level** | L2 contract |
| **Env** | E2 |

**Preconditions** Weeks W1…W5 with winners a, a, b, a, a (newest last).

**Steps**
1. Read each member's trophy count and flame count in the hall of fame and on the board.

**Expected result**
`getWinCount` counts every week that member won; `getWinStreak` counts consecutive wins from the most
recent closed week backwards and stops at the first non-win (`src/lib/data/weeks.ts:51-76`). For the
sequence above: a → 4 wins, streak 2; b → 1 win, streak 0. The flame only renders above a streak of 1
(`leaderboard.tsx:88`).

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-HIST-001. Two things to check while there: `getWinCount` does **not** filter on
`closed_at` (harmless today, since `winner_profile_id` is only written at close, but it is an
unguarded assumption), and a tied week — `winner_profile_id` NULL — correctly breaks a streak, which
is the interesting boundary.

---

### TC-HIST-005 — The empty state appears before any week has closed

| | |
|---|---|
| **Priority** | P2 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Open Historial for a brand-new household.

**Expected result**
`es.history.noHistory` — "Todavía no hay historial" — and no hall of fame.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-HIST-001. Also note that the page fetches `getWeekScores` nowhere despite
importing it (lint warning at `historial/page.tsx:4`) — the per-member points of a closed week are
stored but never shown to the family. Recorded as an Observation.
