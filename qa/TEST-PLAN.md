# Casa — Master Test Plan

**Owner:** `qa-qc` agent (Senior QA/QC) · **Version:** 1.0 · **Created:** 2026-09-14
**Product spec:** `PRODUCT.md` · **Architecture rules:** `AGENTS.md`, `.claude/agents/CONTRACT.md`

This plan is the standing agreement on *how* Casa gets tested. It changes when the product
changes — not per cycle. Per-cycle scope, results and verdicts live in `qa/reports/`.

---

## 1. Objective

Casa is a gamified chore app for a 2–4 person family in Argentina. It succeeds only if the
family trusts it: **the scoreboard must be right, the app must work on a phone, and it must run
itself.** Testing exists to protect those three promises, in that order.

## 2. Quality attributes, ranked

Ranking matters — it decides what gets fixed first when time runs out.

| # | Attribute | Why it ranks here | How it's tested |
|---|---|---|---|
| 1 | **Scoring correctness** | Wrong points = unfair game = product dead | L1 unit (domain), L2 contract |
| 2 | **Data isolation & privacy** | Two households, family data, "privacy is non-negotiable" | L4 security, RLS review |
| 3 | **Mobile usability** | Phones are the primary device for every user | L3 E2E at 390×844 |
| 4 | **Automation reliability** | "Zero admin burden": recurrence, week close, reminders | L1 + L2 on cron & recurrence |
| 5 | **Spanish/voseo correctness** | The whole UI is Argentine Spanish; wrong register reads as broken | L4 i18n audit |
| 6 | **Accessibility** | Non-technical adults, small screens, one-handed use | L4 a11y audit |
| 7 | **Visual polish (claymorphism)** | Fun is the retention engine, but it's below correctness | L3 + L4 brand audit |

## 3. Scope

**In scope**
- Auth (magic link), onboarding, household create/join
- Task board: create, complete, reopen, delete, grouping (overdue / today / this week / done)
- Leaderboard and standings, winner + last place, reward and dreaded task
- History and hall of fame
- Household settings (week end-day, timezone, reward, members)
- Domain logic: week windows, ranking, recurrence, rotation
- Cron routes: generate, reminders, week-close
- Cross-cutting: i18n/voseo, a11y, responsive, security, build integrity

**Out of scope (this project)**
- Load/performance testing beyond page-weight sanity — 4 users, no scale risk
- Cross-browser matrices beyond mobile Chrome/Safari and desktop Chrome
- Native app (not built), marketing site (doesn't exist), analytics (deliberately absent)
- Penetration testing of Supabase itself; we test *our* policies and secrets handling

## 4. Risk register

Drives where effort goes. Re-score each cycle.

| ID | Risk | Likelihood | Impact | Score | Mitigation |
|---|---|---|---|---|---|
| R1 | Week-boundary/timezone logic wrong (DST, end-day, `America/Argentina/Buenos_Aires`) | High | Critical | 🔴 | Exhaustive unit cases at every boundary; test the end-day itself |
| R2 | Standings/tie-break wrong → wrong winner or wrong "dreaded task" | Medium | Critical | 🔴 | Table-driven tie cases: full tie, 2-way top tie, bottom tie, empty, single member |
| R3 | RLS gap leaks one household's data into another | Low | Critical | 🔴 | Policy review per table; verify every `.select()` is member-scoped |
| R4 | Secrets leak (service-role key, `CRON_SECRET`) to the client | Low | Critical | 🔴 | Grep `NEXT_PUBLIC_`/client components; verify cron auth on every route |
| R5 | Recurrence generates duplicates or skips month-ends (30/31, Feb) | Medium | Major | 🟠 | Boundary cases; idempotency check on repeat cron runs |
| R6 | Unhandled data-layer rejection → error boundary instead of a friendly message | High | Major | 🟠 | Call-site audit; every `throw`ing call needs UI handling |
| R7 | Mobile layout defects (overflow, targets < 44px, content under bottom nav) | High | Major | 🟠 | 390×844 as the default viewport for every UI case |
| R8 | Hardcoded strings / wrong register (tuteo instead of voseo) | High | Minor | 🟡 | Grep audit of JSX literals vs `src/lib/i18n/es.ts` |
| R9 | New dev can't boot the app (env drift vs `.env.local.example`) | Medium | Minor | 🟡 | L0 env-parity check every cycle |

## 5. Test levels

Executed cheapest-first; see `.claude/agents/qa-qc.md` for the operating detail.

- **L0 Static & build** — `npm run lint`, `npx tsc --noEmit`, `npm run build`, env parity.
- **L1 Unit** — `npm test` (Vitest) over `src/lib/domain/**`, plus coverage-gap analysis.
- **L2 Contract & integration** — signatures vs `CONTRACT.md`; queries vs the SQL schema; RLS reachability; call-site error handling.
- **L3 E2E / UI** — dev server + browser, mobile-first (390×844), then desktop.
- **L4 Cross-cutting** — i18n/voseo, brand, a11y, security/privacy, state & data integrity.
- **L5 Exploratory** — timeboxed charters against the top risks.

## 6. Environments

| Env | Description | What it can test | What it cannot |
|---|---|---|---|
| **E0 Static** | Repo + `node_modules`, no services | L0, L1, L2, code-level L4 | Anything requiring a browser or DB |
| **E1 Stub** | `.env.local` from `.env.local.example`, `npm run dev` | L3 unauthenticated: `/`, `/login`, `/callback`, redirects, layout, fonts, console errors | Signed-in flows, any real data |
| **E2 Live** | Real Supabase project (read-only via MCP) | RLS/policy/advisor review, schema verification | Destructive or seeded flows — **never mutate family data** |

**Rule:** every result records the environment it came from. Signed-in flows that E1 can't reach
are reported `BLOCKED`, never `PASS`. A blocked case is honest; a guessed pass is malpractice.

## 7. Entry criteria

- Branch builds and installs (`npm install` clean).
- `PRODUCT.md` and `CONTRACT.md` reflect the change under test.
- The previous cycle's `FIXED` bugs are ready for verification.

## 8. Exit criteria (release sign-off)

Sign-off is **GO** only when all of these hold:

1. Zero open **S1** defects. No exceptions, no waivers.
2. Zero open **S2/P0** defects.
3. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.
4. 100% of **P0/P1** test cases executed (not necessarily passed — executed and adjudicated).
5. Every previously `FIXED` bug re-verified, with its regression set re-run.
6. Every `BLOCKED` case has a named blocker and an owner.
7. Scoring, week-close, and household-isolation suites pass in full — these are never waivable.

Anything short of that is **GO-WITH-RISKS** (risks enumerated and accepted in writing) or
**NO-GO**. QA states the verdict; the product owner may override it, but the verdict stands
in the record.

## 9. Deliverables per cycle

- Updated suites in `qa/test-cases/<area>.md`
- `qa/reports/YYYY-MM-DD-<cycle>.md` — executive summary first
- New/updated entries in `qa/BUGS.md`, triaged and routed to an owner
- Evidence under `qa/reports/YYYY-MM-DD/`
- A handoff message naming bug IDs in recommended fix order

## 10. Conventions

- Test case IDs: `TC-<AREA>-###` · Bug IDs: `CASA-###` (monotonic, never reused)
- Areas: `AUTH`, `ONB`, `BOARD`, `TASK`, `LEAD`, `HIST`, `SET`, `CRON`, `DOM`, `I18N`, `A11Y`, `SEC`, `PERF`
- Verdicts: `PASS` · `FAIL` · `BLOCKED` · `N/A`
- Bug statuses: `OPEN` → `ASSIGNED` → `FIXED` (dev) → `VERIFIED` (QA) → `CLOSED`,
  plus `REOPENED`, `WONTFIX`, `CANNOT-REPRODUCE`, `DUPLICATE`
- Severity `S1–S4` and priority `P0–P3` are both mandatory on every defect

## 11. Metrics tracked per cycle

Small team, so keep it to what actually changes behaviour:

- Defects found by severity, and **where** they were caught (L0 catches are cheap wins)
- Escape rate: defects found in a later cycle that an earlier suite should have caught
- Reopen rate: fixes that failed verification — a spike means reports lack acceptance criteria
- Blocked-case count: how much of the product QA cannot currently reach

## 12. Roles

| Role | Agent | Responsibility |
|---|---|---|
| QA/QC | `qa-qc` | Plans, tests, documents, triages, verifies, signs off. Never fixes. |
| Frontend | `frontend-dev` | Fixes UI/copy/styling defects; moves bugs to `FIXED` |
| Backend | `backend-dev` | Fixes data/domain/schema/cron defects; moves bugs to `FIXED` |
| Coordinator | main session | Dispatches handoffs between QA and devs |

Channel: **`qa/BUGS.md`** (QA ⇄ devs) and **`.claude/agents/CONTRACT.md`** (frontend ⇄ backend).
Agents don't call each other; they write to the channel and the main session routes.
