# RUN-2026-09-20 — Verification cycle (re-test of the RUN-2026-09-14 frontend queue)

**Tester:** qa-qc · **Build:** `claude/qa-qc-agent-workflow-f2da0l` @ working tree, Next.js 16.3.4
**Envs:** E0 static, E1 stub (`.env.local` copied from `.env.local.example`, `npm run dev`) ·
**E2 live: still unavailable**
**Scope:** re-verification of the 15 bugs `frontend-dev` moved to `FIXED` (CASA-006, -008, -010, -011,
-012, -014, -015, -016, -017, -018, -019, -020, -021, -022, -023), plus the four release gates.
**Explicitly not tested:** the backend queue (CASA-001, -002, -003, -004, -005, -007, -009, -013 are
untouched and still `OPEN`); **CASA-024**, which the coordinator rerouted to `backend-dev` on
2026-09-14 and set back to `OPEN` — the remaining step is the matcher at `src/proxy.ts:56`; any new
exploratory charter — this cycle is a verification pass, not a discovery pass.

---

## Verdict: NO-GO

**Every frontend fix holds, and none of the five S1 defects that made Casa unusable has moved.** The
verdict is unchanged from the baseline and for the same reason: exit criterion 1 is "zero open S1
defects, no exceptions", and there are five.

| | Count |
|---|---|
| Cases executed | 20 (11 executed to a verdict, 9 re-attempted and still blocked) |
| Passed / Failed / Blocked | 9 / 2 / 9 |
| Defects filed: S1 / S2 / S3 / S4 | 0 / 0 / 1 / 0 |
| Verified from last cycle | **15 of 15** |
| Reopened | **0** |
| Newly filed | 1 (CASA-025, S3/P2, `frontend-dev`) |

**Blocking release:** CASA-001, CASA-002, CASA-003, CASA-004, CASA-005 (five open S1 — criterion 1);
CASA-013 (`npm run lint` still exits 1 — criterion 3); CASA-007 and CASA-009 (criterion 7, scoring and
household isolation); and the 31 signed-in P0/P1 cases that remain unexecuted (criteria 4, 5, 7).
All eight are `backend-dev`'s. **CASA-025 does not block release** — S3/P2, one word.

**Could not test:** the same 31 signed-in cases as the baseline, with the same two named blockers.
1. **CASA-001** — `getUserHouseholds` / `getHouseholdMembers` throw on every request, so no signed-in
   route renders. *Blocker owner: `backend-dev`.*
2. **No E2 environment** — no real Supabase credentials, so no magic link can be issued or consumed.
   *Blocker owner: project owner.* A throwaway Supabase project, or a seeded local stack, unblocks all 31.

---

## What changed since RUN-2026-09-14

The frontend queue is empty. All 15 `FIXED` entries are now `VERIFIED`, none was reopened, and the
only new defect is a 2.20:1 icon in markup the CASA-014 fix introduced. The backend queue has not
moved at all — the eight items in it are byte-for-byte the ones filed on 2026-09-14.

Four of the fixes deviated from the suggested diff in my own bug entries. **In all four cases the
deviation was right and my suggestion was wrong**, which is worth recording because it is the reverse
of the usual reopen pattern:

| Bug | My suggestion | What the dev did | Adjudication |
|---|---|---|---|
| CASA-008 | `reset` prop; `(app)/error.tsx` only | `retry` prop; root `error.tsx` **as well as** `(app)/` | Correct. `next@16.3.4`; the doc says `retry` is stable since v16.3.0 and preferred over `reset`, and that `error.js` does not wrap the layout of its own segment — so `(app)/error.tsx` alone would never have caught the `(app)/layout.tsx:19-20` throws the entry cites |
| CASA-012 | `useState<Set<string>>` lock | `useRef<Set<string>>` lock, state only for `disabled` | Correct. Two taps in the same tick both read the same pre-update state, so a `useState` guard does not serialise them; the ref mutates synchronously before the first `await` and does |
| CASA-015 | preserve `t.assignee` wholesale | resolve the profile from the `members` prop by `assignee_id` | Correct, and better. Preserving wholesale would have shown the *previous* person after a re-assignment; resolving also closes the INSERT gap the entry flagged as a secondary |
| CASA-022 | `dayOfMonth < 1 \|\| > 31` | `!Number.isInteger(dayOfMonth) \|\| …` | Correct. My version passes when the field is cleared, because `parseInt('') \|\| 1` silently rewrote "no day" to "the 1st" |

---

## Results by area

| Area | Cases | Pass | Fail | Blocked | Notes |
|---|---|---|---|---|---|
| PERF | 4 | 3 | 1 | 0 | Build, `tsc` and `npm test` green; lint still exits 1 on CASA-013 |
| A11Y | 4 | 3 | 1 | 0 | Zoom and touch targets clean; contrast has exactly one real failure left → CASA-025 |
| I18N | 2 | 2 | 0 | 0 | Both greps empty; no tuteo anywhere in the source |
| AUTH | 1 | 1 | 0 | 0 | `/callback` is unauthenticated, so this one is genuinely live-verified |
| BOARD | 4 | 0 | 0 | 4 | TC-BOARD-003…006 — fixes verified by code path, cases still blocked by CASA-001 |
| SET | 2 | 0 | 0 | 2 | TC-SET-002, -004 — same |
| LEAD | 1 | 0 | 0 | 1 | TC-LEAD-004 — same |
| TASK | 1 | 0 | 0 | 1 | TC-TASK-006 — same |
| HIST | 1 | 0 | 0 | 1 | TC-HIST-002 — the render function is proven by probe; the case needs a closed week |

**Read this table together with the next one.** A bug can be `VERIFIED` while its test case is
`BLOCKED`: the fix is proven at the level the defect was *found* at (every one of these was filed
"Reproduced: 2/2 by code path"), while the end-to-end case still needs a session. I am not calling a
blocked case a pass, and I am not holding a provable fix open for an environment that does not exist.

---

## Verification outcomes, bug by bug

| ID | Verified how | Live residual (all blocked by CASA-001 / no E2) |
|---|---|---|
| CASA-006 | Domain probe: 21:30 ART → server-local `2026-09-17`, household-local `2026-09-16`; `2026-03-01T02:30Z` → `2026-02-28` | The rendered board sections at a faked clock |
| CASA-008 | Files + Next 16 doc check (`retry` stable v16.3.0; `error.js` does not wrap its own segment's layout); only `error.digest` reaches the DOM | The rendered Spanish card — E1 cannot force a server throw, `src/proxy.ts:40-42` redirects to `/login` first |
| CASA-010 | `isOwner` at `ajustes:87`; four controls `disabled`; `updateHousehold` skipped unless owner (`:94`) | The member-vs-owner run in E2 |
| CASA-011 | Reachability proof: `createTask` has one caller, now always dated; the generator always writes `due_date` | Standings vs a `week-close` dry run |
| CASA-012 | Ref-based lock is synchronous pre-`await`; `PGRST116` → card stays done + `es.board.alreadyDone` | Counting `PATCH`es under a `dblclick` |
| CASA-014 | **Live, E1** — 1/5/9/15 s samples, `?error=` and `#error=`, 48 px back link, no console errors | A *valid* magic link redirecting to `/onboarding` |
| CASA-015 | `withJoins` resolves from `members`; reopen still clears `completed_by` | Two devices on one household |
| CASA-016 | Both greps empty, plus a widened `aria-label` / string-literal sweep | Visual pass over `/onboarding`, `/nueva`, `/ajustes` |
| CASA-017 | Widened tuteo grep over `es.ts` + `src` — empty | none |
| CASA-018 | **Live, E1** — viewport meta on 5 routes, `/login` input at 16 px | A real pinch on iOS Safari |
| CASA-019 | Measured at every Casa call site: 0 below 44 px tall | The Playwright sweep on live signed-in routes |
| CASA-020 | Re-measured light + dark, with BEFORE baselines reproducing the original numbers exactly | Re-screenshotting the live leaderboard |
| CASA-021 | Probe: stored `2026-09-13`/`2026-09-20` renders "13 Sep – 19 Sep" | The live card with a genuinely closed week |
| CASA-022 | Guard on both the disabled button and the handler's early return | The live save + `days_of_week` assertion |
| CASA-023 | Straight-line branch removal; `updatePhone` is typed `string \| null` | Asserting `phone_e164 IS NULL` |

---

## Level-by-level detail

### L0 Static & build
Re-run in full. Evidence in `qa/reports/2026-09-20/`.

| Gate | Result | |
|---|---|---|
| `npm run lint` | **exit 1** | 1 error, 111 warnings. The single error is unchanged: `src/lib/supabase/server.ts:31` — "A `require()` style import is forbidden". That is **CASA-013**, `backend-dev`, still `OPEN`. `L0-lint.txt` |
| `npx tsc --noEmit` | exit 0 | clean. `L0-tsc.txt` |
| `npm run build` | exit 0 | 12 routes compiled, 8/8 static pages generated. `L0-build.txt` |
| `npm test` | exit 0 | 18/18 in 2 files. `L1-test.txt` |

Of the 111 lint warnings, 92 come from `.claude/skills/impeccable/scripts/**` — tooling, not app code,
and out of scope. The 19 in `src/**` are unused imports and `react-hooks/exhaustive-deps`; none is new
this cycle and none is a defect. **TC-PERF-001 FAIL · TC-PERF-003 PASS · TC-PERF-004 PASS ·
TC-PERF-005 PASS.**

### L1 Unit
`npm test` unchanged at 18/18. No new domain code landed this cycle, so the coverage gaps recorded in
the baseline (DST transitions, month-end recurrence, full ties, single-member households) are unchanged
and remain the L1 item for next cycle.

Two throwaway probes were run against the real `date-fns` / `date-fns-tz` in this tree, kept as
evidence: `qa/reports/2026-09-20/VERIFY-probe-021-006.mjs` → `.txt`.

### L2 Contract & integration
No signature changed this cycle. `CONTRACT.md` is untouched, which is correct — the dev chose the
in-page fix for CASA-006 over a `todayInTimezone` helper, and took only the frontend half of CASA-010
and CASA-012, leaving both backend halves recorded as cross-boundary notes rather than silently
dropping them.

One reachability check worth naming, because it is what makes CASA-011 closable: `createTask`
(`src/lib/data/tasks.ts:6`) has exactly **one** caller in the codebase,
`src/app/(app)/casa/[id]/nueva/page.tsx:103`, and the only other producer of `tasks` rows is
`src/app/api/cron/generate/route.ts:94`, which always writes `due_date: dateStr`. With the form now
requiring a date, the dateless state is unreachable rather than merely discouraged.

### L3 E2E / UI
E1 only. `/callback` and `/login` are the two routes a signed-out browser can actually reach, and both
were driven at 390×844.

- **`/callback`** — verifying copy at 1 s and 5 s; expired-link card at 9 s and 15 s with a 48 px
  "Volver a iniciar sesión"; `?error=access_denied` and `#error=access_denied` both fail over at 1.2 s
  instead of waiting out the timeout. Zero console errors or warnings across the sweep.
- **`/login`, `/`, `/casa/abc`, `/onboarding`** — viewport meta is `width=device-width, initial-scale=1`
  on all five paths checked; the email input computes to 16 px.
- Everything behind auth is unchanged from the baseline: unreachable.

Evidence: `qa/reports/2026-09-14/VERIFY-a11y-remeasure.txt`,
`CASA-014-verify-callback-timeout-390.png`, `CASA-014-verify-callback-error-param-390.png`,
`CASA-018-verify-login-390.png`.

### L4 Cross-cutting

**i18n / voseo — clean.** Both TC-I18N-001 greps return zero hits outside `src/components/ui/**`, and
the TC-I18N-002 tuteo grep — widened past the acceptance list with `Elimina|Guarda|Envía|Revisa|
Intenta|Une` — is empty across `es.ts`, `src/app` and `src/components`. All 15 hardcoded sites now
resolve through `es.*`. The dev also gave three icon-only controls real accessible names
(`es.nav.newTask`, `es.settings.copyCode`, `es.board.markOpen`) and turned the leaderboard crown from a
hover-only `title` into `role="img"` + `aria-label`, which is the right reading of the note I left in
that entry. **TC-A11Y-008 passes as a side effect.**

**Touch targets — clean, with a correction to my own criterion.** Zero Casa call sites below 44 px
tall. The shared `ui/button.tsx` `size="icon"` is still `size-8`, deliberately untouched, and no Casa
call site uses it unmodified.

I have to correct criterion 1 of CASA-019, which I wrote as "every `<button>`/`<a>` … ≥ 44×44 px". That
is unachievable for the Lun–Dom weekday grid: `grid grid-cols-7 gap-1` inside `main.px-4` →
`Card.border-2` → `CardContent.px-(--card-spacing)` leaves `(390−32−4−48−24)/7 ≈ 40 px` per cell at a
390 px viewport, so a 7-across picker physically cannot be 44 px wide on a phone. The cells are
`min-h-11` (44 px) × ~40 px — above WCAG 2.2 SC 2.5.8's 24×24 minimum and inside the spacing exception.
**The criterion was wrong, not the implementation.** Same reading applies to the other ≥44-tall pills
(effort, assignee, recurrence, dreaded).

**Contrast — one real failure, and it is new.** The abstract token sweep showed 4 failing pairs. A
follow-up pass measuring each pair against its **real usage site** reduces that to exactly one:

| Pair | Ratio | Need | Verdict |
|---|---|---|---|
| `callback:65` `MailWarning` 32 px, `accent` on `bg-accent/10` over **background** | **2.20** | 3.0 | **FAIL → CASA-025** |
| `variant="destructive"` text-on-tint (`ui/button.tsx:18`, `ui/badge.tsx:15`) | — | — | Not a failure: **zero** non-`ui/` call sites, so it never renders |
| dark `primary-foreground` on `primary` | 3.32 | 4.5 | Not a live failure — see below |
| dark `accent-foreground` on `accent` | 2.55 | 4.5 | Not a live failure — see below |

**TC-A11Y-003 FAIL** on the first row only. Every text pair CASA-020 was filed against passes in both
themes, the rank pill is 5.70 against a 3.0 threshold, and the BEFORE column of the re-measurement
reproduces the original entry's numbers exactly (1.77 / 1.72 / 2.55 / 2.87 / 6.10 / 4.64), so the
before-and-after figures are directly comparable.

**Correction to my own earlier note:** I had recorded the `error-state.tsx:31` `AlertCircle` as sitting
on a **card**. It does not — no ancestor sets `bg-card`, so it composites over `background`. Recomputed
on the right surface it is **3.68:1** against a 3.0 threshold. Still a pass; verdict unchanged. I am
recording the mistake because the surface assignment is the whole method here, and the same error in
the other direction would have produced a false defect.

**Security, brand, state** — not re-run this cycle. Nothing in the frontend diff touches
`src/lib/supabase/**`, `src/app/api/**` or `supabase/migrations/**`, and the baseline's findings there
are all still `OPEN` and unmodified.

### L5 Exploratory charters
None run. This was a verification cycle; discovery charters resume once CASA-001 opens the signed-in
surface, where the baseline's risk register (R1 week boundaries, R2 tie-breaks, R3 RLS) actually lives.

---

## Defects filed

| ID | Sev | Pri | Owner | Title |
|---|---|---|---|---|
| CASA-025 | S3 | P2 | frontend-dev | The expired-link icon is nearly invisible on the "El enlace ya venció" screen |

**Why a new entry rather than reopening CASA-020.** Three reasons, and I want the reasoning on the
record because it is a judgement call:
1. **CASA-020's own acceptance criteria are met.** They are (a) every pair used for *text* ≥ 4.5:1,
   (b) the rank pill ≥ 3:1, (c) fills keep the bright hues. The failing element is a 32 px icon — a
   non-text graphic under WCAG 1.4.11, not text — so it does not fall under criterion (a) at all.
2. **It is not in CASA-020's scope.** `src/app/(auth)/callback/page.tsx` is not among the files that
   fix touched; the file was *written* by the CASA-014 fix in the same cycle and never got the `-ink`
   sweep. Reopening CASA-020 would attribute a regression to a fix that did not cause it and would
   reset a piece of work that is genuinely finished.
3. **The fix is one word and the token already exists.** `text-accent` → `text-accent-ink`, using the
   token CASA-020 added; measured at **4.75:1** on the same tile. A fresh S3/P2 entry routes that
   cleanly without dragging a 200-line palette entry back into the queue.

Reproduced 2/2 by two independent methods: browser canvas readback on 2026-09-14 and an arithmetic
recompute from the measured token values on 2026-09-20. Both give 2.20.

---

## Recommended fix order

The frontend queue is empty apart from one non-urgent item. **Everything that matters is
`backend-dev`'s, and the order has not changed since 2026-09-14.**

1. **CASA-001** — RLS infinite recursion. *Start here.* Beyond being an S1, it is the single blocker
   on the live half of eight fixes verified this cycle (CASA-006, -008, -010, -011, -012, -015, -022,
   -023) and on all 31 blocked cases.
2. **CASA-002** → 3. **CASA-003** → 4. **CASA-005** → 5. **CASA-004** → 6. **CASA-009** →
   7. **CASA-007** → 8. **CASA-013** → 9. **CASA-024** (rerouted; `src/proxy.ts:56`).
10. **CASA-025** — `frontend-dev`, whenever `callback/page.tsx` is next touched.

After CASA-004 lands, re-read CASA-021's expected strings: it changes which dates are *stored*, not how
they are displayed, so the fix holds either way, but the expected output moves.

---

## Observations (not defects)

Kept out of `qa/BUGS.md` on purpose so the dev queue stays defects-only.

**1. The dark theme is correctness-for-later, and someone will trip over it.** Two pairs fail AA in
the `.dark` block — `primary-foreground` on `primary` at **3.32** and `accent-foreground` on `accent`
at **2.55**, both against a 4.5 threshold. Neither is a live defect today, and I checked that rather
than assuming it: `src/app/globals.css:5` declares `@custom-variant dark (&:is(.dark *))`, which is
**class-gated with no `prefers-color-scheme` rule**, and there is no `ThemeProvider` or `next-themes`
mount in `src/app/layout.tsx`. At runtime the document reports `anyDark: false` and
`colorScheme: "normal"` — nothing ever applies the class, so the surface is unreachable. Both tokens
also predate CASA-020 and were not touched by it.

This matters for **whoever adds a theme switcher**: the moment `.dark` becomes reachable, every primary
button and every accent-filled control ships below AA on day one. These are the two root fills, not the
`-ink` foregrounds, so the palette work done in CASA-020 does not cover them. Re-measure the `.dark`
block before the switcher ships, not after. Worth filing as a real defect at that point — not before,
because a defect on an unreachable surface is noise in a dev's queue.

**2. Pre-existing dateless tasks (CASA-011 residual).** The board still renders a dateless task under
"Esta semana" with a points badge (`board-view.tsx:51-52`) and the scorers still exclude it. That path
is now unreachable for *new* data, and no production data exists — CASA-001 means no signed-in page has
ever rendered — so this is fixture hygiene, not a defect. If a Supabase project is ever seeded from
older fixtures, check for `tasks.due_date IS NULL` before trusting a standings comparison.

**3. Error matching by substring.** `src/app/(app)/onboarding/page.tsx:108` decides between
`es.errors.alreadyMember` and `es.errors.invalidCode` with `msg.includes('Already')` against an English
error string from the data layer. It works today, but it couples user-facing Spanish copy to an
untyped English message, and it is the kind of thing that breaks silently when `joinHousehold`'s error
text is reworded. A typed error code on the `join_household` RPC would be the durable version — worth
raising in `CONTRACT.md` next time that RPC is touched (it will be, for CASA-009).

**4. A role revoked mid-session (CASA-010 residual).** The Ajustes UI trusts a members list read at
page load, so a role revoked while the page is open still produces a silent no-op. The dev routed this
correctly — the `updateHousehold` "throw on zero rows" hardening is `backend-dev`'s and stays in that
entry's cross-boundary note. Low likelihood in a four-person household; not worth its own entry.

**5. `RUN-2026-09-14` needed no correction.** I re-read the baseline against everything found this
cycle. Nothing it reported turned out to be wrong, so it is unchanged. The two corrections this cycle
produced are both to *my own working notes*, not to that report: the over-strict 44×44 criterion in
CASA-019 and the mis-assigned surface for the `error-state.tsx` icon. Both are recorded in the relevant
BUGS.md entries and in L4 above.

---

## Sign-off against `qa/TEST-PLAN.md` §8

| # | Exit criterion | Status |
|---|---|---|
| 1 | Zero open **S1** defects, no exceptions | ❌ **FAIL** — CASA-001, -002, -003, -004, -005 |
| 2 | Zero open **S2/P0** defects | ✅ PASS — the two open S2s (CASA-007, CASA-009) are both P1 |
| 3 | `lint`, `tsc`, `test`, `build` all green | ❌ **FAIL** — `npm run lint` exits 1 on CASA-013 |
| 4 | 100 % of P0/P1 cases executed and adjudicated | ❌ **FAIL** — 31 signed-in cases still unexecuted |
| 5 | Every previously `FIXED` bug re-verified, regression set re-run | ⚠️ **PARTIAL** — all 15 re-verified; the regression sets that need a session (TC-BOARD-001…006, TC-LEAD-001…004, TC-CRON-003…005, TC-SET-001…004, TC-TASK-001/006) were not re-run |
| 6 | Every `BLOCKED` case has a named blocker and owner | ✅ PASS — CASA-001 / `backend-dev`, and no-E2 / project owner |
| 7 | Scoring, week-close and household-isolation suites pass in full — never waivable | ❌ **FAIL** — CASA-004 (week window), CASA-001 / -005 / -009 (isolation) |

### Verdict: **NO-GO**

**Exactly what stands between this tree and GO:**

1. **CASA-001** — RLS infinite recursion (S1/P0, `backend-dev`).
2. **CASA-002** — `(NULL, NULL)` unique collision on `tasks` (S1/P0, `backend-dev`).
3. **CASA-003** — cron accepts `Bearer undefined` when `CRON_SECRET` is unset (S1/P0, `backend-dev`).
4. **CASA-004** — week window shifted one day off the chosen end-day (S1/P0, `backend-dev`).
5. **CASA-005** — every signed-in user can read every user's phone number (S1/P0, `backend-dev`).
6. **CASA-013** — `npm run lint` exits 1 (S3/P1, `backend-dev`) — criterion 3 is binary.
7. **CASA-007** and **CASA-009** — criterion 7 is explicitly never waivable.
8. **An E2 environment** — a throwaway Supabase project or a seeded local stack. Without it, criteria 4,
   5 and 7 cannot be satisfied even after every S1 is closed. *Owner: project owner.* This is the one
   item on the list that no amount of dev work resolves, and it should be started in parallel rather
   than after.

**What would change my mind:** nothing short of all eight. Criterion 1 admits no waiver and there are
five S1s against it. **CASA-025 is not on this list** and should not be treated as release-blocking.

---

## Coverage gaps for next cycle

- **The 31 signed-in cases.** They are the whole point of the next cycle and they need items 1 and 8
  above. Re-run them as the regression set for the eight code-path verifications, not as fresh cases.
- **L1 domain gaps, unchanged from the baseline:** DST transitions in
  `America/Argentina/Buenos_Aires`, month-end recurrence (30/31, February), the end-day boundary itself,
  full ties and bottom ties, single-member and empty households, rotation when the last assignee left.
  These are pure functions — they need no environment and no session, and they are the highest-value
  untested surface in the product. Author them as `TC-DOM-022…` next cycle regardless of CASA-001.
- **`.dark` contrast**, before a theme switcher ships (Observation 1).
- **Exploratory charters** against R1 / R2 / R3, which have never been run against a rendering app.
