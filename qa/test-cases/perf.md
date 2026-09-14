# PERF — Build integrity, static checks and page weight

`qa/TEST-PLAN.md` §3 puts load testing out of scope — four users, no scale risk. What this suite
protects is the other thing `PERF` stands for here: the project stays buildable, type-safe,
lint-clean, and a new developer can boot it from a fresh clone.

All cases run in **E0**/**E1** and all verdicts came from real execution.

| ID | Title | Pri | Verdict (RUN-2026-09-14) | Bug |
|---|---|---|---|---|
| TC-PERF-001 | `npm run lint` exits 0 | P1 | FAIL | CASA-013 |
| TC-PERF-002 | Every asset the app references resolves | P3 | FAIL | CASA-024 |
| TC-PERF-003 | `npm run build` succeeds | P0 | PASS | — |
| TC-PERF-004 | `npx tsc --noEmit` is clean after route typegen | P1 | PASS | — |
| TC-PERF-005 | `npm test` is green | P0 | PASS | — |
| TC-PERF-006 | Every `process.env` read exists in `.env.local.example` | P1 | PASS | — |
| TC-PERF-007 | The exported API matches `CONTRACT.md` | P1 | PASS | — |
| TC-PERF-008 | The app boots and serves every route with stub credentials | P1 | PASS | — |

---

### TC-PERF-001 — `npm run lint` exits 0

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L0 static |
| **Env** | E0 |
| **Automated** | `npm run lint; echo $?` |

**Expected result**
Exit 0 — `qa/TEST-PLAN.md` §8 exit criterion 3.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-013
**Notes** One error: `src/lib/supabase/server.ts:31` `A require() style import is forbidden`. Also 118
warnings, of which ~100 come from vendored scripts under `.claude/skills/**` that
`eslint.config.mjs` does not ignore, and ~18 are genuine unused imports/variables in `src/**`. Full
output: `qa/reports/2026-09-14/L0-lint.txt`.

---

### TC-PERF-002 — Every asset the app references resolves

| | |
|---|---|
| **Priority** | P3 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E1 |

**Steps**
1. Load `/login` and list every `<link>` and `<script src>` the document requests.
2. Fetch each one.

**Expected result**
All resolve with 200 and the right content type.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-024
**Notes** `<link rel="manifest" href="/manifest.json">` is emitted but `public/manifest.json` does not
exist, and `src/proxy.ts` redirects the request to `/login` (307) rather than letting it 404 honestly.
Fonts and scripts are fine; no failed requests appeared in the browser console on any route.

---

### TC-PERF-003 — `npm run build` succeeds

| | |
|---|---|
| **Priority** | P0 |
| **Type** | functional |
| **Level** | L0 static |
| **Env** | E0 |
| **Automated** | `npm run build` |

**Expected result**
Build completes, and the route table lists the 12 expected routes plus the proxy.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Compiled in 9.4 s with Turbopack, with **no `.env.local` present** — good, the app does not
need secrets at build time. Route table confirms `ƒ Proxy (Middleware)`, i.e. Next.js 16 picked up
`src/proxy.ts` under the renamed convention. Output:
`qa/reports/2026-09-14/L0-build.txt`.

---

### TC-PERF-004 — `npx tsc --noEmit` is clean after route typegen

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L0 static |
| **Env** | E0 |
| **Automated** | `npx next typegen && npx tsc --noEmit` |

**Steps**
1. On a clean clone with no `.next/`, run `npx tsc --noEmit`.
2. Run `npm run build` (or `npx next typegen`), then run `tsc --noEmit` again.

**Expected result**
Clean **after** typegen. `LayoutProps<'/'>` is a global helper Next.js generates into `.next/types`
during `next dev`, `next build` or `next typegen` — documented at
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md:109` and
`.../05-config/02-typescript.md:104`.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Step 1 fails with `src/app/layout.tsx(32,50): error TS2304: Cannot find name 'LayoutProps'`;
step 2 exits 0. **This is documented framework behaviour, not a defect** — `src/app/layout.tsx:32`
uses the idiom exactly as the Next.js 16 docs show it. What *is* missing is a `typecheck` script that
runs typegen first, so CI does not fail on a cold checkout; recorded as an Observation, not a bug.
Evidence: `qa/reports/2026-09-14/L0-tsc-clean-checkout.txt`.

---

### TC-PERF-005 — `npm test` is green

| | |
|---|---|
| **Priority** | P0 |
| **Type** | functional |
| **Level** | L1 unit |
| **Env** | E0 |
| **Automated** | `npm test` |

**Expected result**
All tests pass.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** 2 files, 18 tests, 1.17 s. Coverage is the problem, not correctness: `ranking` and
`recurrence` are covered, `src/lib/domain/week.ts` has **no test file at all** — which is why CASA-004
shipped. A ready-to-paste `week.test.ts` is included in the CASA-004 entry. Vitest also prints a Vite
config warning (`ESM syntax in a file loaded as CommonJS (vitest.config.ts)`) — harmless today, will
break on a future Vite major; Observation.

---

### TC-PERF-006 — Every `process.env` read exists in `.env.local.example`

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L0 static |
| **Env** | E0 |
| **Automated** | `grep -rno "process\.env\.[A-Z_]*" src` vs `grep -oE "^[A-Z_]+" .env.local.example` |

**Expected result**
Perfect parity in both directions — a missing entry breaks onboarding for every new developer.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Six variables read in `src/**`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`. All six are
in `.env.local.example`, and it contains nothing unused. Note that none of them is *validated* at
startup, which is what turns a missing `CRON_SECRET` into CASA-003.

---

### TC-PERF-007 — The exported API matches `CONTRACT.md`

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L2 contract |
| **Env** | E0 |
| **Automated** | `grep -hn "^export" src/lib/data/*.ts src/lib/domain/*.ts src/types/index.ts` |

**Steps**
1. List every export from `src/lib/data/*`, `src/lib/domain/*` and `src/types/index.ts`.
2. Diff against the Interface section of `.claude/agents/CONTRACT.md`.

**Expected result**
Exact match in both directions — a drift is a defect against `backend-dev`.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** No drift. All 24 data functions, all 10 domain exports (including the `WeekWindow`
interface) and all 14 type exports are listed in `CONTRACT.md`, and nothing extra is exported.
Separately: `getWeekTasks`, `deleteTask`, `updateTemplate`, `deactivateTemplate`, `isInWeek` and
`formatWeekRange` are part of the contract but called from no UI — see the run report's Observations.

---

### TC-PERF-008 — The app boots and serves every route with stub credentials

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E1 |

**Steps**
1. `cp .env.local.example .env.local && npm run dev`
2. Request all nine routes and record status, redirect target, size and time.

**Expected result**
The server boots, nothing 500s, and the redirect behaviour matches TC-AUTH-001/002.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Ready in 396 ms. `/login` 200 (20 KB, 3.4 s on first compile, ~0.5 s after), `/callback` 200
(16 KB), everything else 307 → `/login` in under 10 ms. No 500s, no unhandled rejections in the dev
log. Page weight is trivial and well within scope for four users.
