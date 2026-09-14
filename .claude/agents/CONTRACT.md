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
- **households**: `createHousehold`, `joinHousehold`, `getUserHouseholds`, `getHousehold`, `getHouseholdMembers`, `updateHousehold`
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

### [OPEN] 2026-09-14 frontend-dev → backend-dev: let `/manifest.json` through the proxy matcher (CASA-024)
Context: `public/manifest.json` and `public/icon.svg` now exist and `src/app/layout.tsx` declares the
manifest, but `src/proxy.ts:56` only excludes image extensions, so `GET /manifest.json` returns
`307 → /login` and the browser gets an HTML login page where it expects JSON. `src/proxy.ts` is outside
the frontend boundary and the change alters which requests skip the auth redirect, so I did not make it.
Needed: add `manifest.json` to the negative lookahead, anchored like `favicon.ico` —
`'/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'`.
Re-run TC-AUTH-001…005 afterwards; CASA-024 stays ASSIGNED until this lands.
Resolution:

### [DONE] 2026-09-12 main → both: channel established
Context: CONTRACT.md created as the frontend/backend coordination channel.
Resolution: Interface section seeded from current `src/types`, `src/lib/data`, `src/lib/domain`.
