# Casa — Frontend ⇄ Backend Contract

This file is the **communication channel** between the `frontend-dev` and `backend-dev`
agents. Neither agent can call the other directly — they coordinate *through this file*,
and the main session routes work between them.

**Rules for both agents**
- Read this file **first**, before touching any code. It is the source of truth for the
  interface that crosses the frontend/backend boundary.
- The boundary is: the **types** in `src/types/index.ts`, the **data-access functions** in
  `src/lib/data/*`, and the **domain functions** in `src/lib/domain/*`. Frontend consumes
  these; backend provides them.
- If you **change** anything in the "Interface" section below, update this file in the same
  change. A signature change that isn't reflected here is a bug.
- If you **need something from the other side**, append an entry to "Handoffs & Requests"
  instead of reaching across the boundary yourself. The main session will dispatch it.
- Keep entries short. This is a coordination log, not documentation — `PRODUCT.md` and the
  code are the real docs.

**Defects are not handoffs.** Bugs found by the `qa-qc` agent live in `qa/BUGS.md`, routed to one
owner with severity and priority. Use this file only for *interface* coordination between
frontend and backend.

---

## Interface (current surface frontend relies on)

### Types — `src/types/index.ts`
`Effort` · `EFFORT_POINTS` · `TaskStatus` · `Recurrence` · `AssignmentMode` · `HouseholdRole`
`Profile` · `Household` · `HouseholdMember` · `TaskTemplate` · `Task` · `Week` · `WeekScore` · `MemberStanding`

### Data access — `src/lib/data/*` (every fn takes `SupabaseClient` as first arg)
- **profiles**: `getProfile`, `upsertProfile`, `updatePhone`
- **households**: `createHousehold`, `joinHousehold` (⚠️ signature changed, see handoff below), `getUserHouseholds`, `getHousehold`, `getHouseholdMembers`, `updateHousehold`
- **tasks**: `createTask`, `completeTask`, `reopenTask`, `getHouseholdTasks`, `getWeekTasks`, `deleteTask`
- **templates**: `createTemplate`, `getActiveTemplates`, `updateTemplate`, `deactivateTemplate`
- **weeks**: `getWeekHistory`, `getWeekScores`, `getWinCount`, `getWinStreak`, `getCurrentWeekWinner`

### Domain (framework-free) — `src/lib/domain/*`
- **ranking**: `computeStandings`, `determineResults`
- **week**: `WeekWindow`, `getWeekWindow`, `daysRemaining`, `formatWeekRange`, `isInWeek`, `getClosableWeek`
- **recurrence**: `nextOccurrences`, `pickRotatedAssignee`

> When you add/change an exported signature here, list it above with its file. Don't paste full
> bodies — a name + file is enough for the other side to `grep` it.

---

## Handoffs & Requests

Append newest at the top. Format:

```
### [OPEN|DONE] <date> <from> → <to>: <one-line ask>
Context: what's needed and why (1–3 lines).
Resolution: (filled in by the side that delivers) what was added/changed + where.
```

<!-- entries below -->

### [OPEN] 2026-09-19 backend-dev → frontend-dev: `joinHousehold` no longer takes `userId` (CASA-009)
Context: `join_household`'s RPC signature changed from `(code, user_id)` to `(code)` — it now uses
`auth.uid()` internally instead of trusting a caller-supplied user id, which let any signed-in user with
a join code add a third party to any household. `src/lib/data/households.ts`'s `joinHousehold` follows
suit: `joinHousehold(supabase, joinCode)`, no `userId` argument, and its return type narrowed to
`Pick<Household, 'id' | 'name'>` (the RPC no longer returns the full row — it used to leak `join_code`
to a caller who wasn't a member yet).
Needed: `src/app/(app)/onboarding/page.tsx:104` still calls
`joinHousehold(supabase, userId, joinCode.trim())` — drop the `userId` argument. The
`msg.includes('Already')` error-string match right below it keeps working unchanged (the RPC still
raises exactly `'Already a member'`). Only `household.id` is read off the return value today, so the
narrower return type needs no other changes at that call site. `npx next build`'s type-check currently
fails on this one line (TS2554, "Expected 2 arguments, but got 3") until this lands.
Resolution:

### [OPEN] 2026-09-19 backend-dev → frontend-dev: week-boundary fix lands; re-verify CASA-021, decide on historical `weeks` rows (CASA-004)
Context: `getWeekWindow` was off by one day — the chosen `week_end_day` was excluded from its own week
instead of being the last day in it. Fixed in `src/lib/domain/week.ts` (see `qa/BUGS.md` CASA-004 for
the full before/after). `getClosableWeek`, `formatWeekRange` and `isInWeek` are derived and needed no
change, but any `weeks` row **already stored on the live project** was computed under the old boundary.
Decision recorded here (not applied to data, just documented): treat existing `weeks` rows as
historical — leave `week_start`/`week_end` as stored rather than recomputing them, since the reward and
dreaded-task rotation for those weeks already happened under the old boundary at the time. Only newly
closed weeks (after this migration set lands) use the corrected window.
Needed: CASA-021 (history range display, `formatWeekRange(...)` in `historial/page.tsx`) was verified
against the OLD boundary's stored-value convention. Its fix itself (call `formatWeekRange` instead of
re-deriving) holds either way, but re-run its verification once this lands, per that entry's own
ordering note ("verify this bug after CASA-004, or the expected output moves under you").
Resolution:

### [DONE] 2026-09-19 frontend-dev → backend-dev: let `/manifest.json` through the proxy matcher (CASA-024)
Context: `public/manifest.json` and `public/icon.svg` now exist and `src/app/layout.tsx` declares the
manifest, but `src/proxy.ts:56` only excludes image extensions, so `GET /manifest.json` returns
`307 → /login` and the browser gets an HTML login page where it expects JSON. `src/proxy.ts` is outside
the frontend boundary and the change alters which requests skip the auth redirect, so I did not make it.
Needed: add `manifest.json` to the negative lookahead, anchored like `favicon.ico` —
`'/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'`.
Re-run TC-AUTH-001…005 afterwards; CASA-024 stays ASSIGNED until this lands.
Resolution: `src/proxy.ts`'s matcher now excludes `manifest.json`, anchored exactly as requested —
`'/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'`.
`icon.svg` needed no separate entry (already covered by the `.svg` branch). Not re-verified live in
this environment (no running server/Supabase project here) — please re-run TC-AUTH-001…005 as planned.

### [DONE] 2026-09-12 main → both: channel established
Context: CONTRACT.md created as the frontend/backend coordination channel.
Resolution: Interface section seeded from current `src/types`, `src/lib/data`, `src/lib/domain`.
