# Casa — Bug Registry & QA ⇄ Dev Channel

This file is the **communication channel** between the `qa-qc` agent and the `frontend-dev` /
`backend-dev` agents. Agents can't call each other — they coordinate *through this file*, and the
main session routes the work. (Frontend⇄backend interface changes go in
`.claude/agents/CONTRACT.md` instead; this file is for defects.)

## Rules

**For QA**
- One entry per defect, newest first, using `qa/templates/bug-report.md` verbatim.
- `CASA-###` IDs are monotonic and never reused — not even for a withdrawn bug.
- Every entry names exactly one **owner** (`frontend-dev` or `backend-dev`) and carries both
  severity and priority. Unrouted or unscored bugs are not filed.
- Only QA moves a bug to `VERIFIED`, `REOPENED`, `CANNOT-REPRODUCE`, or `CLOSED`.

**For devs**
- Read this file before starting; work your bugs in the order given in **Fix order**.
- When you've fixed one: set status to `FIXED`, fill in **Fix applied** (files touched + a
  one-line description), and leave everything else intact. Don't delete the entry, don't mark it
  verified — QA re-tests and closes it.
- If you disagree with a finding, set status to `NEEDS-INFO` and write why under **Dev notes**.
  Pushing back is fine; silently closing is not.
- If the fix belongs to the other side of the boundary, say so in **Dev notes** and leave the
  status at `ASSIGNED` — the main session will reroute.

**Status flow:** `OPEN` → `ASSIGNED` → `FIXED` → `VERIFIED` → `CLOSED`
Side exits: `REOPENED` · `NEEDS-INFO` · `WONTFIX` · `CANNOT-REPRODUCE` · `DUPLICATE`

**Severity:** S1 critical · S2 major · S3 minor · S4 trivial
**Priority:** P0 now · P1 this cycle · P2 next touch · P3 backlog

---

## Triage board

| ID | Title | Sev | Pri | Area | Owner | Status |
|---|---|---|---|---|---|---|
| CASA-001 | Every signed-in page crashes: RLS policy on `household_members` recurses infinitely | S1 | P0 | SEC | backend-dev | OPEN |
| CASA-002 | Only one dateless-template task per day can exist — in the whole database, across households | S1 | P0 | TASK | backend-dev | OPEN |
| CASA-003 | Cron routes accept `Authorization: Bearer undefined` when `CRON_SECRET` is unset | S1 | P0 | SEC | backend-dev | OPEN |
| CASA-004 | The week runs from the chosen end-day instead of to it — the whole week is shifted one day | S1 | P0 | DOM | backend-dev | OPEN |
| CASA-005 | Any signed-in user can read every Casa user's name and phone number | S1 | P0 | SEC | backend-dev | OPEN |
| CASA-006 | Board decides "today" in the server's timezone, so after 21:00 in Argentina it is a day ahead | S2 | P1 | BOARD | frontend-dev | OPEN |
| CASA-007 | "Rotar entre miembros" gives the first 15 days of a rotating task to the same person | S2 | P1 | CRON | backend-dev | OPEN |
| CASA-008 | Any data-layer error shows the raw Next.js error page instead of a Spanish message | S2 | P1 | BOARD | frontend-dev | OPEN |
| CASA-009 | A non-member with a join code can add *any other user* to a household | S2 | P1 | SEC | backend-dev | OPEN |
| CASA-010 | Non-owner members get "¡Guardado!" but their settings changes are silently discarded | S2 | P1 | SET | frontend-dev | OPEN |
| CASA-011 | Tasks with no due date show a points badge but can never score | S2 | P1 | BOARD | frontend-dev | OPEN |
| CASA-012 | Double-tapping "hecha" un-completes the task in the UI and shows an error | S2 | P2 | BOARD | frontend-dev | OPEN |
| CASA-013 | `npm run lint` fails — `require()` import in `src/lib/supabase/server.ts` | S3 | P1 | PERF | backend-dev | OPEN |
| CASA-014 | `/callback` spins forever when the magic link is expired or invalid | S3 | P1 | AUTH | frontend-dev | OPEN |
| CASA-015 | Realtime task updates drop the assignee, so the name vanishes from the card | S3 | P2 | BOARD | frontend-dev | OPEN |
| CASA-016 | 14 user-visible strings (15 sites) are hardcoded instead of living in `src/lib/i18n/es.ts` | S3 | P2 | I18N | frontend-dev | OPEN |
| CASA-017 | Tuteo instead of voseo: "Elige la cena del viernes" | S3 | P2 | I18N | frontend-dev | OPEN |
| CASA-018 | `maximum-scale=1` blocks pinch-zoom on every page | S3 | P2 | A11Y | frontend-dev | OPEN |
| CASA-019 | Icon-only buttons are 32–40 px — below the 44 px touch target on the primary device | S3 | P2 | A11Y | frontend-dev | OPEN |
| CASA-020 | Gamification colours fail WCAG AA contrast (winner's rank pill measures 1.77:1) | S3 | P2 | A11Y | frontend-dev | OPEN |
| CASA-021 | History shows an 8-day week: the exclusive end boundary is printed as the last day | S3 | P2 | HIST | frontend-dev | OPEN |
| CASA-022 | A weekly recurring task saved with no weekday is accepted and never generates anything | S3 | P2 | TASK | frontend-dev | OPEN |
| CASA-023 | A member can add a phone number but can never remove it | S3 | P2 | SET | frontend-dev | OPEN |
| CASA-024 | `/manifest.json` is declared in metadata but does not exist | S3 | P3 | PERF | frontend-dev | OPEN |

## Fix order

_Set by QA at the end of each cycle. Work top-down._

**backend-dev — start here. Nothing else can be verified until CASA-001 lands.**

1. **CASA-001** — RLS infinite recursion. The app is unusable for every signed-in user; it blocks
   verification of CASA-006, -008, -010, -011, -012, -015 and every signed-in test case in this suite.
2. **CASA-002** — `unique nulls not distinct (template_id, due_date)`. Second task of the day fails.
3. **CASA-003** — cron auth bypass when `CRON_SECRET` is unset.
4. **CASA-005** — global profile/phone read policy.
5. **CASA-004** — week window off by one day. Needs a decision recorded in `CONTRACT.md` (see entry).
6. **CASA-009** — `join_household` trusts the caller-supplied `user_id`.
7. **CASA-007** — rotation assigns one person the whole 15-day batch.
8. **CASA-013** — lint error (`require()`), blocks the exit criteria.

**frontend-dev — CASA-014, -016, -017, -018, -019, -020, -021, -024 can be done now; the rest need CASA-001 first.**

9. **CASA-006** — household-timezone "today" on the board.
10. **CASA-008** — error boundaries (`error.tsx`) with Spanish copy.
11. **CASA-010** — hide/disable settings a non-owner cannot save.
12. **CASA-011** — require a due date (or score undated tasks).
13. **CASA-012** — in-flight guard on complete/reopen + "ya estaba hecha" handling.
14. **CASA-014** — `/callback` timeout and error state.
15. **CASA-015** — keep the joined assignee across realtime updates.
16. **CASA-021** — print `week_end - 1 day` in history.
17. **CASA-018**, **CASA-019**, **CASA-020** — a11y batch (zoom, touch targets, contrast).
18. **CASA-016**, **CASA-017** — i18n batch.
19. **CASA-022**, **CASA-023**, **CASA-024** — validation and polish.

---

## Defects

<!-- newest first; full entries below -->

### CASA-024 — The browser asks for `/manifest.json` on every page load and never gets it

| | |
|---|---|
| **Severity** | S3 (minor) |
| **Priority** | P3 |
| **Area** | PERF |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E1 · viewport 390×844 |
| **Test case** | TC-PERF-002 |

**Summary**
Every rendered page carries `<link rel="manifest" href="/manifest.json">`, but `public/manifest.json`
does not exist. On a phone — the primary device for every Casa user — "Agregar a pantalla de inicio"
therefore gets no name, icon or theme colour. The request also falls through `src/proxy.ts`, which
redirects it to `/login`, so the browser is handed an HTML login page where it expects JSON.

**Steps to reproduce** (from a cold start)
1. `cp .env.local.example .env.local && npm run dev`
2. `curl -s http://localhost:3000/login | grep 'rel="manifest"'`
3. `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/manifest.json`

Reproduced: 2/2 attempts.

**Expected**
The manifest URL declared in `src/app/layout.tsx:22` resolves to a valid web-app manifest — or the
declaration is removed until a manifest exists.

**Actual**
`<link rel="manifest" href="/manifest.json"/>` is emitted; `GET /manifest.json` returns `307` to
`/login` (signed out) and would 404 once past the proxy — `ls public/` contains only the four
Next.js starter SVGs.

**Evidence**
- `qa/reports/2026-09-14/L3-routes-curl.txt`
- ```
  manifest link in HTML:
  <link rel="manifest" href="/manifest.json"/>
  GET /manifest.json:
  HTTP 307
  (attempt 2)
  HTTP 307
  ```

**Root cause**
`src/app/layout.tsx:22`
```tsx
  manifest: '/manifest.json',
```
plus `src/proxy.ts:56`, whose matcher excludes only image extensions, so `.json` is proxied too.

**Suggested fix** _(suggestion — the owner decides)_
Add the file (preferred — Casa is a phone-first app):
```diff
+ // public/manifest.json
+ {
+   "name": "Casa",
+   "short_name": "Casa",
+   "description": "Organicen la casa juntos",
+   "start_url": "/",
+   "display": "standalone",
+   "background_color": "#f2f5fc",
+   "theme_color": "#4F46E5",
+   "icons": []
+ }
```
and let it through the proxy:
```diff
-    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
+    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
```
Alternative: delete the `manifest` key from `metadata` until a manifest is authored.

**Acceptance criteria**
- [ ] `GET /manifest.json` returns `200` with `application/json` while signed out
- [ ] The response parses as a web-app manifest with `name`, `start_url` and `theme_color`
- [ ] No console warning about the manifest on `/login` at 390×844

**Regression risk**
`src/proxy.ts` matcher — re-run the whole redirect suite (TC-AUTH-001…005) after touching it; a
too-wide exclusion would let a real route skip the auth redirect.

**Verification steps** _(how QA will close this)_
1. Re-run TC-PERF-002 and TC-AUTH-001…005 in E1.
2. Confirm the manifest request returns JSON and no route lost its redirect.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-023 — Once you give Casa your phone number you can never take it back

| | |
|---|---|
| **Severity** | S3 (minor) |
| **Priority** | P2 |
| **Area** | SET |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static · viewport n/a |
| **Test case** | TC-SET-004 |

**Summary**
`Ajustes` saves the phone number only when the field is non-empty. Clearing the field and pressing
"Guardar cambios" shows "¡Guardado!" and leaves the old number in `profiles.phone_e164`, so WhatsApp
reminders keep going to a number the member tried to delete. `PRODUCT.md` §Product Principles 4 makes
privacy non-negotiable; the only self-service way to stop notifications silently does nothing.

**Steps to reproduce** (from a cold start)
1. Sign in, open `/casa/<id>/ajustes`, type `+5491133334444` in Teléfono, save.
2. Reload, clear the Teléfono field completely, press "Guardar cambios".
3. Reload the page.

Reproduced: 2/2 by code path (BLOCKED from live execution by CASA-001 — see Evidence).

**Expected**
An empty phone field writes `null`: `updatePhone(supabase, userId, null)` exists in
`src/lib/data/profiles.ts:32` precisely for this, and its signature is `phone: string | null`.

**Actual**
The call is skipped, the stored number survives, and the toast still says "¡Guardado!".

**Evidence**
- Source, `src/app/(app)/casa/[id]/ajustes/page.tsx:93-95`
- Live confirmation is blocked by CASA-001 (no signed-in page renders). The defect is a
  straight-line branch, quoted below, with no environment dependency.

**Root cause**
`src/app/(app)/casa/[id]/ajustes/page.tsx:93`
```tsx
      if (phone.trim()) {
        await updatePhone(supabase, userId, phone.trim())
      }
```
An empty string is falsy, so the clear case never reaches the data layer.

**Suggested fix** _(suggestion — the owner decides)_
```diff
-      if (phone.trim()) {
-        await updatePhone(supabase, userId, phone.trim())
-      }
+      await updatePhone(supabase, userId, phone.trim() || null)
```

**Acceptance criteria**
- [ ] Clearing the field and saving sets `profiles.phone_e164` to `NULL`
- [ ] Re-opening Ajustes shows an empty Teléfono field
- [ ] Saving with an unchanged number still works

**Regression risk**
`updatePhone` is called from nowhere else; the reminders cron reads `phone_e164` and already skips
members without one (`src/app/api/cron/reminders/route.ts:62`).

**Verification steps** _(how QA will close this)_
1. After CASA-001 is fixed, run TC-SET-004 end to end in E2/E1.
2. Query `profiles.phone_e164` and assert `NULL`.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-022 — A weekly recurring task saved with no weekday silently never happens

| | |
|---|---|
| **Severity** | S3 (minor) |
| **Priority** | P2 |
| **Area** | TASK |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static + L1 probe · viewport 390×844 |
| **Test case** | TC-TASK-006 |

**Summary**
On `/casa/<id>/nueva`, turning on "Tarea recurrente" with frecuencia "Semanal" and selecting **no**
days still saves. The toast says "Tarea recurrente creada", the template is stored with
`days_of_week = '{}'`, and the generator produces nothing — forever. `PRODUCT.md` §Product Principles 3
("zero admin burden") depends on recurring tasks actually appearing; this one never does and nothing
tells the family why.

**Steps to reproduce** (from a cold start)
1. Sign in, go to `/casa/<id>/nueva`.
2. Title "Regar las plantas", tap "Tarea recurrente", leave frecuencia on "Semanal".
3. Select no days in the Lun–Dom grid. Tap "Guardar".
4. Wait for `/api/cron/generate` to run (or call it directly).

Reproduced: 2/2 at the domain level (see Evidence); the UI branch is a straight-line `disabled` check.

**Expected**
Either the save is blocked with a Spanish validation message, or at least one weekday is required —
the template only produces tasks when `days_of_week` is non-empty, per
`src/lib/domain/recurrence.ts:46` (`if (config.days_of_week.length === 0) break`).

**Actual**
Saved without complaint; `nextOccurrences` returns `[]` on every cron run.

**Evidence**
- `qa/reports/2026-09-14/L1-probe-recurrence.txt`
- ```
  weekly invalid day 9
    n=0 -> []
  ...
  (and the existing unit test "returns empty for weekly with no days" asserts the same)
  ```

**Root cause**
`src/app/(app)/casa/[id]/nueva/page.tsx:340`
```tsx
            disabled={saving || !title.trim()}
```
The only guard is the title. `days_of_week` (weekly) and `dayOfMonth` (monthly) are never validated.

**Suggested fix** _(suggestion — the owner decides)_
```diff
+  const recurrenceInvalid =
+    isRecurring &&
+    ((recurrence === 'weekly' && daysOfWeek.length === 0) ||
+      (recurrence === 'monthly' && (dayOfMonth < 1 || dayOfMonth > 31)))
...
-            disabled={saving || !title.trim()}
+            disabled={saving || !title.trim() || recurrenceInvalid}
```
plus a hint under the day grid using a new `es.task.pickAtLeastOneDay` key (see CASA-016 — new copy
must live in `src/lib/i18n/es.ts`, in voseo: "Elegí al menos un día").

**Acceptance criteria**
- [ ] "Guardar" is disabled while frecuencia is Semanal and no day is selected
- [ ] A Spanish hint from `es.ts` explains why
- [ ] Monthly still saves with a day between 1 and 31; 0 or 32 are rejected
- [ ] A weekly template with one day selected still saves and generates

**Regression risk**
The same Guardar button creates one-off tasks — re-run TC-TASK-001 to confirm non-recurring saves are
unaffected.

**Verification steps** _(how QA will close this)_
1. Re-run TC-TASK-006 and TC-TASK-001 in E1/E2.
2. Confirm `task_templates.days_of_week` is never `'{}'` for a `weekly` row.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-021 — Historial shows every week as 8 days long

| | |
|---|---|
| **Severity** | S3 (minor) |
| **Priority** | P2 |
| **Area** | HIST |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static · viewport 390×844 |
| **Test case** | TC-HIST-002 |

**Summary**
`weeks.week_end` stores the **exclusive** closing boundary (the week-close cron writes
`format(closable.end)`, and `closable.end` is the first instant of the following week). Historial
prints it verbatim as the last day, so a Sun–Sat week is shown as "13 Sep – 20 Sep": eight days, and
the end date overlaps the start date of the next card in the list.

**Steps to reproduce** (from a cold start)
1. Have at least one closed week (`/api/cron/week-close`).
2. Open `/casa/<id>/historial` at 390×844.
3. Compare the printed range with the same window rendered by `formatWeekRange`.

Reproduced: 2/2 by code path (BLOCKED from live execution by CASA-001).

**Expected**
The same convention the domain layer already uses — `src/lib/domain/week.ts:63-66`:
```ts
export function formatWeekRange(window: WeekWindow): string {
  const endDisplay = subDays(window.end, 1) // end is exclusive
```
A week stored as `week_start = 2026-09-13`, `week_end = 2026-09-20` must display "13 Sep – 19 Sep".

**Actual**
"13 Sep – 20 Sep".

**Evidence**
- Source diff between `src/lib/domain/week.ts:64` (subtracts a day) and
  `src/app/(app)/casa/[id]/historial/page.tsx:120` (does not).
- Stored values confirmed against the writer at `src/app/api/cron/week-close/route.ts:34-35`.

**Root cause**
`src/app/(app)/casa/[id]/historial/page.tsx:119`
```tsx
  const startStr = format(parseISO(week.week_start), 'd MMM')
  const endStr = format(parseISO(week.week_end), 'd MMM')
```

**Suggested fix** _(suggestion — the owner decides)_
```diff
-import { format, parseISO } from 'date-fns'
+import { format, parseISO, subDays } from 'date-fns'
...
-  const endStr = format(parseISO(week.week_end), 'd MMM')
+  const endStr = format(subDays(parseISO(week.week_end), 1), 'd MMM')
```
Better alternative: reuse `formatWeekRange` so there is one definition of "how a week reads".

**Acceptance criteria**
- [ ] A week card spans exactly 7 days
- [ ] Consecutive week cards do not share a date
- [ ] The rendered range matches `formatWeekRange` for the same window

**Regression risk**
Only this card. Note that CASA-004 changes which dates are stored — verify this bug **after**
CASA-004, or the expected output moves under you.

**Verification steps** _(how QA will close this)_
1. Close a week via the cron with a known `now`.
2. Assert the card reads `week_start` … `week_end − 1 day`.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-020 — The winner's rank badge is almost unreadable; gamification colours fail contrast

| | |
|---|---|
| **Severity** | S3 (minor) |
| **Priority** | P2 |
| **Area** | A11Y |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E1 · viewport 390×844 |
| **Test case** | TC-A11Y-003 |

**Summary**
The palette's celebration colours (`--crown`, `--accent`, `--success`, `--effort-*`) are used as small
text and as the white-on-gold winner pill. Measured in Chromium, white text on `bg-crown` is
**1.77:1** and `text-crown` on a card is **1.72:1** — WCAG 2.1 AA needs 4.5:1 for body text and 3:1 for
large text or UI components. The most celebrated element in the product — the number "1" next to the
week's winner — is the least legible thing on the screen, outdoors or for a parent with presbyopia.

**Steps to reproduce** (from a cold start)
1. `cp .env.local.example .env.local && npm run dev`
2. Open `/login` at 390×844 in Chromium.
3. Sample the compiled tokens and compute the contrast ratio against `bg-card` / `bg-background`
   (script: `qa/reports/2026-09-14/L3-browser-contrast-focus.txt` header, canvas sRGB readback).

Reproduced: 2/2 attempts (two separate browser sessions, identical numbers).

**Expected**
Text and UI colours meet WCAG 2.1 AA — 4.5:1 for the ≤14 px labels used in
`src/components/leaderboard.tsx:83-92` and `src/app/(app)/casa/[id]/historial/page.tsx:78-87`,
3:1 for the rank pill. `qa/TEST-PLAN.md` §2 ranks accessibility above visual polish.

**Actual** (Chromium, sRGB canvas readback, `bg-card` = rgb(250,252,255))

| token | rgb | ratio on card | AA 4.5 | AA 3.0 |
|---|---|---|---|---|
| white on `bg-crown` (rank pill) | #F6B900 bg | **1.77** | ✗ | ✗ |
| `text-crown` (trophy counts) | 246,185,0 | **1.72** | ✗ | ✗ |
| `text-effort-rapida` (1 pt badge) | 67,192,122 | **2.26** | ✗ | ✗ |
| `text-accent` (streak, "+" nav) | 243,130,29 | **2.55** | ✗ | ✗ |
| `text-success` | 0,173,91 | **2.87** | ✗ | ✗ |
| `text-effort-pesada` (5 pts badge) | 240,80,61 | **3.45** | ✗ | ✓ |
| `text-destructive` | 231,0,11 | 4.64 | ✓ | ✓ |
| `text-primary` | 47,88,200 | 6.10 | ✓ | ✓ |
| `text-muted-foreground` | 81,88,105 | 6.93 | ✓ | ✓ |

**Evidence**
- `qa/reports/2026-09-14/L3-browser-contrast-focus.txt` (full JSON, both passes)
- The colour pairs were measured in a real browser against the compiled CSS; the *usage sites* are
  cited from source because the leaderboard is behind auth (CASA-001).

**Root cause**
`src/app/globals.css:76-81`
```css
  --crown: oklch(0.82 0.17 85);
  --success: oklch(0.65 0.18 155);
  --accent: oklch(0.72 0.17 55);
  --effort-rapida: oklch(0.72 0.15 155);
```
These lightness values (0.65–0.82) are chosen for *fills*, but the components use them as
*foreground* on a near-white surface — e.g. `src/components/leaderboard.tsx:58` `bg-crown text-white`
and `:85` `text-crown`.

**Suggested fix** _(suggestion — the owner decides)_
Keep the bright hues for fills; add darker "-ink" variants for text, and darken the text on the crown
pill instead of using white:
```diff
   --crown: oklch(0.82 0.17 85);
+  --crown-ink: oklch(0.45 0.12 85);   /* ≈ 6.5:1 on card */
   --success: oklch(0.65 0.18 155);
+  --success-ink: oklch(0.45 0.13 155);
   --accent: oklch(0.72 0.17 55);
+  --accent-ink: oklch(0.47 0.14 55);
```
```diff
- i === 0 ? 'bg-crown text-white'
+ i === 0 ? 'bg-crown text-[--crown-ink]'
```
and swap `text-crown` / `text-accent` / `text-success` for the `-ink` tokens wherever they style text.
The dark-theme block at `globals.css:120-126` needs the mirrored values.

**Acceptance criteria**
- [ ] Every foreground/background pair used for text measures ≥ 4.5:1 in light and dark themes
- [ ] The rank pill measures ≥ 3:1
- [ ] Fills (badges, gradients, borders) keep the current bright hues — the product still looks fun

**Regression risk**
`globals.css` is global: re-run the brand check (TC-A11Y-004) on `/login` and re-screenshot the
leaderboard and history cards at 390×844 once CASA-001 unblocks them.

**Verification steps** _(how QA will close this)_
1. Re-run the contrast probe in `qa/reports/2026-09-14/L3-browser-contrast-focus.txt`.
2. Assert every row ≥ 4.5 (text) / ≥ 3.0 (pill), light and dark.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-019 — Icon-only buttons are too small to tap reliably on a phone

| | |
|---|---|
| **Severity** | S3 (minor) |
| **Priority** | P2 |
| **Area** | A11Y |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E1 · viewport 390×844 |
| **Test case** | TC-A11Y-002 |

**Summary**
The shadcn `size="icon"` variant compiles to **32×32 px** and the board's "marcar hecha" button to
**40×40 px**. Both are below the 44×44 px minimum for touch targets, and the complete button is the
single most-tapped control in the product. `PRODUCT.md` §Users makes phones the primary device and
`qa/TEST-PLAN.md` §2 ranks mobile usability third overall.

**Steps to reproduce** (from a cold start)
1. `cp .env.local.example .env.local && npm run dev`
2. Open `/login` at 390×844 in Chromium.
3. Inject an element carrying the same compiled classes and read its box:
   `document.body.appendChild(Object.assign(document.createElement('button'), {className:'size-8'})).getBoundingClientRect()`

Reproduced: 2/2 attempts.

**Expected**
≥ 44×44 px for every interactive control on the mobile viewport (WCAG 2.5.8 AAA / Apple HIG 44 pt /
`.claude/agents/qa-qc.md` L3 "touch targets ≥ 44×44 px").

**Actual** (real browser measurement of the compiled CSS)
```
TOUCH TARGETS: [{"cls":"size-8","w":32,"h":32},          ← Button size="icon"
                {"cls":"size-9","w":36,"h":36},          ← Button size="icon-lg"
                {"cls":"w-10 h-10 rounded-full","w":40,"h":40},  ← board complete/undo button
                {"cls":"w-11 h-11","w":44,"h":44},       ← onboarding emoji picker (OK)
                {"cls":"h-12 w-full","w":390,"h":48}]    ← primary CTAs (OK)
```

**Evidence**
- `qa/reports/2026-09-14/L3-browser-pass2.txt`
- Affected call sites: `src/components/board-view.tsx:93` (`w-10 h-10`),
  `src/app/(app)/casa/[id]/nueva/page.tsx:116` and `src/app/(app)/casa/[id]/ajustes/page.tsx:124`
  (back arrows, `size="icon"` → 32 px), `src/app/(app)/casa/[id]/ajustes/page.tsx:250` (copy code).

**Root cause**
`src/components/ui/button.tsx:31`
```ts
        icon: "size-8",
```
and `src/components/board-view.tsx:93`
```tsx
        className={`w-10 h-10 rounded-full shrink-0 cursor-pointer ${...}`}
```

**Suggested fix** _(suggestion — the owner decides)_
Do not widen the shared shadcn scale (it is used by generated components); override at Casa's call
sites, which is where the mobile commitment lives:
```diff
- className={`w-10 h-10 rounded-full shrink-0 cursor-pointer ${
+ className={`w-11 h-11 rounded-full shrink-0 cursor-pointer ${
```
```diff
-        <Button variant="ghost" size="icon" onClick={() => router.back()} className="cursor-pointer">
+        <Button variant="ghost" size="icon" onClick={() => router.back()} className="size-11 cursor-pointer">
```
(`size-11` = 44 px.) Apply to all four call sites listed above.

**Acceptance criteria**
- [ ] Every `<button>` / `<a>` on `/casa/[id]`, `/nueva` and `/ajustes` measures ≥ 44×44 px at 390×844
- [ ] No layout shift or wrapping introduced in the task card row
- [ ] Desktop (1280) still looks proportionate

**Regression risk**
`board-view.tsx` task card is a flex row — enlarging the button eats horizontal space from the title;
re-check long titles and the effort badge at 390 px.

**Verification steps** _(how QA will close this)_
1. Re-run the Playwright target sweep (`small` array in
   `qa/reports/2026-09-14/L3-browser-pass1.txt`) on every signed-in route once CASA-001 is fixed.
2. Assert the array is empty.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-018 — Pinch-zoom is disabled on every page

| | |
|---|---|
| **Severity** | S3 (minor) |
| **Priority** | P2 |
| **Area** | A11Y |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E1 · viewport 390×844 |
| **Test case** | TC-A11Y-001 |

**Summary**
The root viewport sets `maximum-scale=1`, so nobody can pinch to zoom anywhere in Casa. Two of the
four intended users are the parents (`PRODUCT.md` §Users); on a 390 px screen the 12 px labels in the
leaderboard and task cards are exactly the text a reader would zoom into. This is WCAG 2.1 SC 1.4.4
(Resize Text, level AA).

**Steps to reproduce** (from a cold start)
1. `cp .env.local.example .env.local && npm run dev`
2. Open `/login` at 390×844 in Chromium.
3. Read `document.querySelector('meta[name=viewport]').content`.

Reproduced: 2/2 attempts (two separate browser sessions).

**Expected**
No `maximum-scale` (or `maximum-scale=5`) and no `user-scalable=no`, so the platform pinch-zoom keeps
working.

**Actual**
```
"viewportMeta": "width=device-width, initial-scale=1, maximum-scale=1"
```
observed on `/`, `/login`, `/callback` and `/casa/abc` (all four measured pages).

**Evidence**
- `qa/reports/2026-09-14/L3-browser-pass1.txt` (every route block ends with the `viewportMeta` line)

**Root cause**
`src/app/layout.tsx:25-30`
```tsx
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4F46E5',
}
```

**Suggested fix** _(suggestion — the owner decides)_
```diff
 export const viewport: Viewport = {
   width: 'device-width',
   initialScale: 1,
-  maximumScale: 1,
   themeColor: '#4F46E5',
 }
```
`maximumScale: 1` is usually added to stop iOS zooming on focused inputs; that is already prevented
here because every `Input` renders at `text-base` (16 px), e.g. `login/page.tsx:81`.

**Acceptance criteria**
- [ ] The rendered meta tag contains no `maximum-scale` and no `user-scalable=no`
- [ ] Focusing the email field on iOS Safari does not auto-zoom the page
- [ ] Pinch-zoom works on `/login` and on the board

**Regression risk**
Global to every page. Re-check that no form input is below 16 px (`text-sm` inputs would re-introduce
the iOS auto-zoom the flag was hiding).

**Verification steps** _(how QA will close this)_
1. Re-run the Playwright route sweep and assert `viewportMeta` has no `maximum-scale`.
2. Manual pinch check on a real phone if one is available.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-017 — "Elige la cena del viernes" is tuteo, not voseo

| | |
|---|---|
| **Severity** | S3 (minor) |
| **Priority** | P2 |
| **Area** | I18N |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static · viewport n/a |
| **Test case** | TC-I18N-002 |

**Summary**
The placeholder for the weekly prize in Ajustes uses the Peninsular/Mexican imperative "Elige"
instead of the Argentine "Elegí". It is the only register slip in `es.ts` — every other imperative in
the file is correct voseo ("Revisá", "Elegí tu emoji", "Creá", "Uníte", "Intentá", "Asigná") — which
makes it read as a copy-paste from another product.

**Steps to reproduce** (from a cold start)
1. Open `src/lib/i18n/es.ts`.
2. Read line 106.
3. Cross-check every other imperative in the file.

Reproduced: 2/2 (grep + manual read).

**Expected**
Argentine Spanish with voseo throughout — `PRODUCT.md` §Capabilities ("Entirely in Argentine Spanish
(voseo)") and §Brand Commitments. The voseo imperative of *elegir* is **elegí**.

**Actual**
```ts
weeklyPrizePlaceholder: 'Ej: Elige la cena del viernes',
```

**Evidence**
```
$ grep -n "Elige" src/lib/i18n/es.ts
106:    weeklyPrizePlaceholder: 'Ej: Elige la cena del viernes',
$ grep -n "Elegí\|Revisá\|Creá\|Uníte\|Intentá" src/lib/i18n/es.ts
14, 15, 17, 143  ← the rest of the file is consistently voseo
```

**Root cause**
`src/lib/i18n/es.ts:106`
```ts
    weeklyPrizePlaceholder: 'Ej: Elige la cena del viernes',
```

**Suggested fix** _(suggestion — the owner decides)_
```diff
-    weeklyPrizePlaceholder: 'Ej: Elige la cena del viernes',
+    weeklyPrizePlaceholder: 'Ej: Elegí la cena del viernes',
```

**Acceptance criteria**
- [ ] The placeholder reads "Ej: Elegí la cena del viernes"
- [ ] `grep -nE "\b(Elige|Escribe|Agrega|Completa|Crea|Selecciona|Ingresa)\b" src/lib/i18n/es.ts` is empty

**Regression risk**
None — a single string constant with one consumer
(`src/app/(app)/casa/[id]/ajustes/page.tsx:174`).

**Verification steps** _(how QA will close this)_
1. Re-run TC-I18N-002 (the tuteo grep above) over `es.ts` and `src/**/*.tsx`.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-016 — 14 user-visible strings live in components instead of `es.ts`

| | |
|---|---|
| **Severity** | S3 (minor) |
| **Priority** | P2 |
| **Area** | I18N |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static · viewport n/a |
| **Test case** | TC-I18N-001 |

**Summary**
`src/lib/i18n/es.ts` is documented as the single source of UI copy ("Typed object, not an i18n
framework. Adding a second language later is mechanical."). Fourteen visible strings bypass it. The
text is mostly correct Argentine Spanish, but the rule is what makes the copy auditable — a reviewer
who greps `es.ts` to proofread the product will miss every one of these.

**Steps to reproduce** (from a cold start)
1. `grep -rn --include=*.tsx -E ">[A-ZÁÉÍÓÚÑ][^<>{}]{2,}<|placeholder=\"|title=\"" src/app src/components --exclude-dir=ui | grep -v "es\."`
2. `grep -rn "toast\.\(success\|error\)(" src/app src/components | grep -v "es\."`

Reproduced: 2/2 attempts.

**Expected**
Every user-visible string resolves through `es.*`, per the file header of `src/lib/i18n/es.ts` and
`.claude/agents/qa-qc.md` §L4 ("Hardcoded strings in components are defects even when the text is
correct — they break the single-source rule").

**Actual** — complete inventory

| # | File:line | String | Suggested key |
|---|---|---|---|
| 1 | `src/app/(auth)/login/page.tsx:72` | `Email` | `es.auth.email` |
| 2 | `src/app/(app)/onboarding/page.tsx:146` | `placeholder="Bauti"` | `es.auth.namePlaceholder` |
| 3 | `src/app/(app)/onboarding/page.tsx:177` | `'Continuar'` | `es.common.continue` |
| 4 | `src/app/(app)/onboarding/page.tsx:197` | `Creá una casa nueva y compartí el código` | `es.onboarding.createHouseDesc` |
| 5 | `src/app/(app)/onboarding/page.tsx:214` | `Uníte con el código de otra casa` | `es.onboarding.joinHouseDesc` |
| 6 | `src/app/(app)/onboarding/page.tsx:267` | `Volver` | `es.common.back` |
| 7 | `src/app/(app)/onboarding/page.tsx:308` | `Volver` | `es.common.back` |
| 8 | `src/app/(app)/casa/[id]/nueva/page.tsx:82` | `'Tarea recurrente creada'` | `es.task.recurringCreated` |
| 9 | `src/app/(app)/casa/[id]/nueva/page.tsx:94` | `'Tarea creada'` | `es.task.created` |
| 10 | `src/app/(app)/casa/[id]/ajustes/page.tsx:139` | `General` | `es.settings.general` |
| 11 | `src/app/(app)/casa/[id]/ajustes/page.tsx:201` | `Ninguna` | `es.settings.none` |
| 12 | `src/app/(app)/casa/[id]/ajustes/page.tsx:217` | `Creá tareas recurrentes primero` | `es.settings.noTemplatesYet` |
| 13 | `src/app/(app)/casa/[id]/ajustes/page.tsx:236` | `'Admin'` / `'Miembro'` | `es.settings.roleOwner` / `roleMember` |
| 14 | `src/app/(app)/casa/[id]/ajustes/page.tsx:282` | `Para recibir recordatorios y el resumen semanal por WhatsApp` | `es.settings.phoneHelp` |
| 15 | `src/components/leaderboard.tsx:75` | `title="Ganador de la semana pasada"` | `es.leaderboard.lastWinnerTitle` |

(15 sites, 14 distinct strings — "Volver" appears twice.)

**Evidence**
```
src/app/(auth)/login/page.tsx:72:                <Label htmlFor="email">Email</Label>
src/app/(app)/casa/[id]/ajustes/page.tsx:139:          <h2 className="font-semibold">General</h2>
src/app/(app)/onboarding/page.tsx:146:                placeholder="Bauti"
src/components/leaderboard.tsx:75:                    <span className="text-lg" title="Ganador de la semana pasada">
src/app/(app)/casa/[id]/nueva/page.tsx:82:        toast.success('Tarea recurrente creada')
src/app/(app)/casa/[id]/nueva/page.tsx:94:        toast.success('Tarea creada')
src/app/(app)/casa/[id]/ajustes/page.tsx:201:              Ninguna
src/app/(app)/casa/[id]/ajustes/page.tsx:236:                {m.role === 'owner' ? 'Admin' : 'Miembro'}
src/app/(app)/onboarding/page.tsx:177:              {saving ? <Loader2 .../> : 'Continuar'}
src/app/(app)/onboarding/page.tsx:267:                Volver
```

**Root cause**
No single line — the strings were written inline as the screens were built. `es.ts` already has an
unused `es.settings.copyCode`, `es.settings.whatsapp` and `es.onboarding.timezone`, which shows the
file was meant to hold all of this.

**Suggested fix** _(suggestion — the owner decides)_
Add a `common` group and the missing keys, then replace each literal:
```diff
 export const es = {
+  common: {
+    continue: 'Continuar',
+    back: 'Volver',
+    none: 'Ninguna',
+  },
   auth: {
+    email: 'Email',
+    namePlaceholder: 'Bauti',
```
```diff
-                <Label htmlFor="email">Email</Label>
+                <Label htmlFor="email">{es.auth.email}</Label>
```
Note `title="…"` on `leaderboard.tsx:75` should become an `aria-label` on a focusable element or
visually hidden text — a `title` on a `<span>` is not announced on touch devices (related to
CASA-020's a11y batch, but fix the i18n part here).

**Acceptance criteria**
- [ ] The two greps in "Steps to reproduce" return no hits outside `src/components/ui/**`
- [ ] Every new key is Argentine voseo (see CASA-017)
- [ ] Rendered copy is byte-identical to today's, except where CASA-017 changes it

**Regression risk**
Touches five files and every screen's copy — re-run the full route sweep and re-screenshot at
390×844 to confirm nothing renders `undefined`.

**Verification steps** _(how QA will close this)_
1. Re-run TC-I18N-001 (both greps).
2. Visual pass over `/login`, `/onboarding`, `/nueva`, `/ajustes` at 390×844.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-015 — When someone else completes a task, the assignee's name disappears from the card

| | |
|---|---|
| **Severity** | S3 (minor) |
| **Priority** | P2 |
| **Area** | BOARD |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static · viewport 390×844 |
| **Test case** | TC-BOARD-005 |

**Summary**
The board is served with `tasks.assignee` joined in (`*, assignee:profiles!tasks_assignee_id_fkey(*)`).
The realtime subscription replaces the whole task object with `payload.new`, which is the **raw
`tasks` row** — Postgres logical replication does not carry joined relations. So the moment any member
changes a task on another phone, the assignee emoji + name vanish from that card for everyone else
until a full page reload. In a four-person competition, "who is this one for?" is the card's main
piece of information.

**Steps to reproduce** (from a cold start)
1. Two members open `/casa/<id>` on two devices; both see "🧹 Barrer — 😎 Bauti".
2. Bauti taps the complete button.
3. Look at the other device's card for the same task.

Reproduced: 2/2 by code path (BLOCKED from live execution by CASA-001).

**Expected**
The card keeps rendering the assignee after a realtime update — the join is part of the `Task` shape
the component is typed against (`src/types/index.ts:74-76`, `assignee?: Profile`).

**Actual**
`task.assignee` becomes `undefined`, so `src/components/board-view.tsx:111` renders nothing.

**Evidence**
- `src/lib/data/tasks.ts:77` selects the join; `src/components/board-view.tsx:164` discards it.
- Supabase Realtime `postgres_changes` payloads contain only the changed table's columns — there is
  no join support in the replication stream.

**Root cause**
`src/components/board-view.tsx:162`
```tsx
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) => (t.id === (payload.new as Task).id ? (payload.new as Task) : t))
            )
```
The replacement is wholesale instead of a merge.

**Suggested fix** _(suggestion — the owner decides)_
```diff
           } else if (payload.eventType === 'UPDATE') {
             setTasks((prev) =>
-              prev.map((t) => (t.id === (payload.new as Task).id ? (payload.new as Task) : t))
+              prev.map((t) =>
+                t.id === (payload.new as Task).id
+                  ? { ...t, ...(payload.new as Task), assignee: t.assignee, completed_by_profile: t.completed_by_profile }
+                  : t
+              )
             )
```
INSERTs have the same gap (`:161`); a new task arrives with no assignee until reload. If that matters,
look the profile up from the `members` prop — which is currently passed in and unused
(`board-view.tsx:136`, flagged by lint).

**Acceptance criteria**
- [ ] Completing a task on device A leaves the assignee visible on device B
- [ ] A task inserted by the generator shows its assignee without a reload
- [ ] Reopening still clears `completed_by`/`completed_at`

**Regression risk**
The same reducer handles the optimistic path in `handleComplete`; re-test complete → reopen → complete
and the DELETE branch.

**Verification steps** _(how QA will close this)_
1. Two browser contexts on the same household (E2), complete from one, assert the other still shows
   the assignee.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-014 — An expired magic link leaves you on a spinner forever

| | |
|---|---|
| **Severity** | S3 (minor) |
| **Priority** | P1 |
| **Area** | AUTH |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E1 · viewport 390×844 |
| **Test case** | TC-AUTH-006 |

**Summary**
`/callback` renders a spinner and waits for a `SIGNED_IN` event that may never arrive — expired link,
already-used link, link opened in a different browser, or a Supabase outage. There is no timeout, no
error message and no way back to `/login` except typing the URL. For a non-technical family member
this is a dead end on the very first screen they ever see.

**Steps to reproduce** (from a cold start)
1. `cp .env.local.example .env.local && npm run dev`
2. Open `http://localhost:3000/callback` at 390×844 with no auth fragment (the same state as an
   expired or already-consumed link).
3. Wait 15 seconds.

Reproduced: 2/2 attempts (two browser sessions).

**Expected**
Within a few seconds the user sees a Spanish message and a way forward — e.g.
"El enlace venció. Pedí uno nuevo." plus a link to `/login`.

**Actual** — real browser observation, three samples over 15 s
```
CALLBACK @1000ms:  {"url":"/callback","text":"","spinner":true,"visibleEls":12}
CALLBACK @5000ms:  {"url":"/callback","text":"","spinner":true,"visibleEls":12}
CALLBACK @15000ms: {"url":"/callback","text":"","spinner":true,"visibleEls":12}
callback console: (no errors)
```
`text` is empty — the page has no words on it at all.

**Evidence**
- Screenshot: `qa/reports/2026-09-14/L3-callback-stuck-390.png`
- Log: `qa/reports/2026-09-14/L3-browser-pass2.txt`

**Root cause**
`src/app/(auth)/callback/page.tsx:12-18`
```tsx
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/onboarding')
      }
    })
  }, [supabase, router])
```
Only the happy path is handled; there is no timeout, no `getSession()` fallback, no handling of the
`error`/`error_description` fragment Supabase appends on a failed link, and the subscription is never
unsubscribed.

**Suggested fix** _(suggestion — the owner decides)_
```diff
-  useEffect(() => {
-    supabase.auth.onAuthStateChange((event) => {
-      if (event === 'SIGNED_IN') {
-        router.replace('/onboarding')
-      }
-    })
-  }, [supabase, router])
+  const [failed, setFailed] = useState(false)
+
+  useEffect(() => {
+    const hash = new URLSearchParams(window.location.hash.slice(1))
+    if (hash.get('error')) { setFailed(true); return }
+
+    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
+      if (event === 'SIGNED_IN') router.replace('/onboarding')
+    })
+    supabase.auth.getSession().then(({ data }) => {
+      if (data.session) router.replace('/onboarding')
+    })
+    const t = setTimeout(() => setFailed(true), 8000)
+    return () => { clearTimeout(t); sub.subscription.unsubscribe() }
+  }, [supabase, router])
```
and render, when `failed`, a card with `es.auth.linkExpired` (new key, voseo) and a `<Link href="/login">`.

**Acceptance criteria**
- [ ] Visiting `/callback` without a valid link shows a Spanish message within 10 s
- [ ] A link back to `/login` is present and tappable (≥44 px, see CASA-019)
- [ ] A valid magic link still redirects to `/onboarding` with no visible delay
- [ ] The auth subscription is unsubscribed on unmount (no duplicate listeners after re-render)

**Regression risk**
`/callback` is the only route the magic link lands on; also re-run the `proxy.ts` redirect cases —
a signed-in user hitting `/callback` is redirected to `/onboarding` by the proxy and must not be
caught by the new timeout.

**Verification steps** _(how QA will close this)_
1. Re-run TC-AUTH-006 in E1 and re-capture the 1 s / 5 s / 15 s samples.
2. In E2, complete a real magic-link sign-in and confirm the happy path is unchanged.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-013 — `npm run lint` fails, so the release gate can never go green

| | |
|---|---|
| **Severity** | S3 (minor) |
| **Priority** | P1 |
| **Area** | PERF |
| **Owner** | backend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static · viewport n/a |
| **Test case** | TC-PERF-001 |

**Summary**
`npm run lint` exits `1` on a clean checkout because of one error: a CommonJS `require()` inside
`createServiceClient`. `qa/TEST-PLAN.md` §8 exit criterion 3 requires lint green, so this single line
blocks every sign-off regardless of everything else.

**Steps to reproduce** (from a cold start)
1. `npm install`
2. `npm run lint`
3. `echo $?`

Reproduced: 2/2 attempts.

**Expected**
Exit code 0.

**Actual**
```
/home/user/casa-app/src/lib/supabase/server.ts
  31:28  error  A `require()` style import is forbidden  @typescript-eslint/no-require-imports

✖ 119 problems (1 error, 118 warnings)
EXIT:1
```

**Evidence**
- `qa/reports/2026-09-14/L0-lint.txt` (full output)
- The route handlers do run (`/api/cron/*` returned JSON in E1), so this is a lint failure, not a
  runtime failure.

**Root cause**
`src/lib/supabase/server.ts:30-36`
```ts
export function createServiceClient() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
```
The `require` was presumably used to avoid a name clash with the exported `createClient` above it.

**Suggested fix** _(suggestion — the owner decides)_
```diff
 import { createServerClient } from '@supabase/ssr'
+import { createClient as createSupabaseClient } from '@supabase/supabase-js'
 import { cookies } from 'next/headers'
...
 export function createServiceClient() {
-  const { createClient } = require('@supabase/supabase-js')
-  return createClient(
+  return createSupabaseClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   )
 }
```
Consider also failing fast when the key is missing, which would have prevented CASA-003 from being
silently exploitable:
```diff
+  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
```

**Acceptance criteria**
- [ ] `npm run lint` exits 0
- [ ] `npx next build` still succeeds
- [ ] All three `/api/cron/*` routes still respond 200 with a valid secret

**Regression risk**
`createServiceClient` is imported by all three cron routes; a static import pulls
`@supabase/supabase-js` into the route bundle at build time instead of at call time — confirm the
build output still lists the three `ƒ /api/cron/*` routes.

**Verification steps** _(how QA will close this)_
1. `npm run lint && npx next build` and re-run the cron auth matrix
   (`qa/reports/2026-09-14/L4-cron-auth-with-secret.txt`).

**Cross-boundary note** _(only when both sides are involved)_
The 118 remaining warnings are noise, most of them from `.claude/skills/**` vendor scripts that
`eslint.config.mjs` does not ignore. Not a defect — recorded as an observation in the run report.

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-012 — Double-tapping "hecha" un-completes the task on screen and shows an error

| | |
|---|---|
| **Severity** | S2 (major) |
| **Priority** | P2 |
| **Area** | BOARD |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static · viewport 390×844 |
| **Test case** | TC-BOARD-004 |

**Summary**
The complete button has no in-flight guard. A double tap — routine on a phone — fires `completeTask`
twice. The first call succeeds; the second matches zero rows because of the `.eq('status','open')`
guard, `.single()` turns that into an error, and the catch handler **rolls the card back to open** and
shows "Algo salió mal". The task *is* done in the database, but the board says it is not, and the
member's points appear to have been taken away. The same path fires whenever two members tap the same
task at once, which is exactly what a competition encourages.

**Steps to reproduce** (from a cold start)
1. Sign in, open `/casa/<id>` at 390×844 with at least one open task.
2. Double-tap the round check button quickly (< 300 ms apart).
3. Observe the card and the toast; then reload the page.

Reproduced: 2/2 by code path (BLOCKED from live execution by CASA-001).

**Expected**
A second tap is a no-op: either the button is disabled while the request is in flight, or a
"ya estaba hecha" result is treated as success and the card stays done.

**Actual**
Card flips done → open, red toast "Algo salió mal. Intentá de nuevo.", and the board now disagrees
with the database until the realtime UPDATE (if any) or a reload corrects it.

**Evidence**
- `src/lib/data/tasks.ts:45-47` — the guard plus `.single()`.
- `@supabase/postgrest-js` documents the failure mode in its own source
  (`node_modules/@supabase/postgrest-js/dist/index.mjs`, `single()`):
  ```
  Return `data` as a single object instead of an array of objects.
  Query result must be one row (e.g. using `.limit(1)`), otherwise this returns an error.
  ```
  Zero rows → `error` → `completeTask` throws → `handleComplete`'s catch reverts.

**Root cause**
`src/components/board-view.tsx:180-203`
```tsx
  async function handleComplete(taskId: string) {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'done' as const, ... } : t)))
    try {
      await completeTask(supabase, taskId, userId)
      toast.success(es.board.complete)
    } catch {
      // Revert on error
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'open' as const, ... } : t)))
      toast.error(es.errors.generic)
    }
  }
```
Nothing tracks in-flight ids, and the catch cannot tell "already done" from "network died".
`useTransition`/`useOptimistic` are imported and left unused at `board-view.tsx:3` and `:145` — the
guard looks like it was planned and not wired up.

**Suggested fix** _(suggestion — the owner decides)_
```diff
+  const [busy, setBusy] = useState<Set<string>>(new Set())
+
   async function handleComplete(taskId: string) {
+    if (busy.has(taskId)) return
+    setBusy((b) => new Set(b).add(taskId))
     setTasks((prev) => ...)
     try {
       await completeTask(supabase, taskId, userId)
       toast.success(es.board.complete)
     } catch {
       setTasks((prev) => ...)
       toast.error(es.errors.generic)
+    } finally {
+      setBusy((b) => { const n = new Set(b); n.delete(taskId); return n })
     }
   }
```
and pass `disabled={busy.has(task.id)}` to the `TaskCard` button. Optionally, `backend-dev` can make
`completeTask` idempotent by dropping `.single()` in favour of `.maybeSingle()` and re-reading the row
— that also fixes the "two members tapped at once" case, which the client guard cannot.

**Acceptance criteria**
- [ ] Five rapid taps produce exactly one `PATCH` and one success toast
- [ ] The card never flips back to open after a successful completion
- [ ] Completing a task another member already completed shows a friendly Spanish message, not
      `es.errors.generic`, and leaves the card done
- [ ] A genuine network failure still reverts the card

**Regression risk**
`handleReopen` shares the pattern and needs the same guard. Re-test complete → reopen → complete and
the realtime reconciliation (CASA-015).

**Verification steps** _(how QA will close this)_
1. After CASA-001, drive the board with Playwright: `dblclick` the complete button and count network
   requests via `page.on('request')`.
2. Reload and assert the card is still done.

**Cross-boundary note** _(only when both sides are involved)_
The idempotent-`completeTask` variant is `backend-dev`'s (`src/lib/data/tasks.ts`). If they take it,
record the signature change in `CONTRACT.md`. The client-side guard alone closes this bug.

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-011 — A task with no due date shows "3 pts" but can never earn a point

| | |
|---|---|
| **Severity** | S2 (major) |
| **Priority** | P1 |
| **Area** | BOARD |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static · viewport 390×844 |
| **Test case** | TC-LEAD-004 |

**Summary**
`due_date` is optional end to end: the create form lets you clear the date field, `createTask` accepts
`due_date: null`, and the board deliberately shows dateless tasks under "Esta semana"
(`board-view.tsx:52-53`). But **both** scoring paths select tasks by `due_date`, so a dateless task is
invisible to the leaderboard and to week close. The member sees a 3 pts badge, taps it done, gets the
"¡Listo!" toast — and the scoreboard does not move. In a product whose retention engine is the
scoreboard, points that silently evaporate are worse than no points.

**Steps to reproduce** (from a cold start)
1. Sign in, `/casa/<id>/nueva`, title "Ordenar el garage", esfuerzo Normal.
2. Clear the "Fecha de vencimiento" field completely. Guardar.
3. On the board, find it under "Esta semana" (badge shows "3pts") and complete it.
4. Look at "Tabla de posiciones".

Reproduced: 2/2 by code path (BLOCKED from live execution by CASA-001).

**Expected**
Either the task scores, or the product does not offer the state: `PRODUCT.md` §Purpose —
"members earn points by completing tasks". A completed task showing a points badge must add those
points to the week it was completed in.

**Actual**
Standings are unchanged. The task stays in "Hechas" only because of the separate
`completed_at`-based branch at `board-view.tsx:40-45`; the scoring filter has no such branch.

**Evidence**
- `src/app/(app)/casa/[id]/page.tsx:39-42`
  ```tsx
  const weekTasks = allTasks.filter((t) => {
    if (!t.due_date) return false
    return t.due_date >= weekStart && t.due_date < weekEnd
  })
  ```
- `src/app/api/cron/week-close/route.ts:67-72` — the authoritative snapshot uses
  `.gte('due_date', weekStartStr).lt('due_date', weekEndStr)`, so a dateless task is excluded there too.
- `src/app/(app)/casa/[id]/nueva/page.tsx:91` — `due_date: dueDate || null` makes the state reachable.

**Root cause**
The board and the scoreboard disagree about what "this week's tasks" means: the board falls back to
`completed_at` for dateless tasks, the scorer does not.

**Suggested fix** _(suggestion — the owner decides)_
Smallest fix — make the date required, which also sidesteps the `(NULL, NULL)` collision in CASA-002:
```diff
-              <Label htmlFor="dueDate">{es.task.dueDate}</Label>
+              <Label htmlFor="dueDate">{es.task.dueDate}</Label>
               <Input
                 id="dueDate"
                 type="date"
+                required
                 value={dueDate}
```
```diff
-            disabled={saving || !title.trim()}
+            disabled={saving || !title.trim() || (!isRecurring && !dueDate)}
```
Better alternative (keeps the flexibility, needs `backend-dev` for the second half): score by
`completed_at` when `due_date` is null, in **both** places, mirroring `board-view.tsx:40-45`.

**Acceptance criteria**
- [ ] Either a one-off task cannot be saved without a date, or a dateless completed task adds its
      points to the week it was completed in
- [ ] The board and the leaderboard agree on the same set of scoring tasks
- [ ] `/api/cron/week-close` produces the same standings the board showed before close

**Regression risk**
Touches the leaderboard input set — re-run the whole scoring suite (TC-LEAD-001…004) and the
week-close cases (TC-CRON-003…005).

**Verification steps** _(how QA will close this)_
1. Create a dateless task (if still possible), complete it, and compare the board standings with a
   `week-close` dry run for the same window.

**Cross-boundary note** _(only when both sides are involved)_
If the "score by `completed_at`" route is chosen, `backend-dev` owns
`src/app/api/cron/week-close/route.ts` and must land the matching change in the same cycle, recorded
in `CONTRACT.md`. Two scorers that disagree is the actual defect here.

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-010 — A non-owner is told "¡Guardado!" while their settings change is thrown away

| | |
|---|---|
| **Severity** | S2 (major) |
| **Priority** | P1 |
| **Area** | SET |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static + local Postgres RLS harness · viewport 390×844 |
| **Test case** | TC-SET-002 |

**Summary**
`Ajustes` renders every field as editable for every member, but the RLS policy only lets the **owner**
update `households`. A non-owner who changes the weekly prize, the end-day or the dreaded task sees
the success toast and no error — because a blocked `UPDATE` matches zero rows and PostgREST reports no
error. The setting silently reverts on the next page load. In a two-person flat where only one person
created the house, that is the other person's every settings change.

**Steps to reproduce** (from a cold start)
1. Owner creates a household; a second member joins with the code.
2. The **member** opens `/casa/<id>/ajustes`, types a new "Premio semanal", taps "Guardar cambios".
3. A green "¡Guardado!" toast appears.
4. Reload the page.

Reproduced: 2/2 at the database layer (below); the UI branch is unconditional.

**Expected**
Either the member cannot edit owner-only fields (they are disabled with an explanation), or the
attempt reports `es.errors.notAuthorized` — the string already exists at `src/lib/i18n/es.ts:146`
and is currently used nowhere.

**Actual**
Success toast, no change. Verified against the real schema on PostgreSQL 16.13 with the shipped
policies:
```
--- updateHousehold as owner after fix ---
UPDATE 1
--- updateHousehold as NON-owner after fix (expect UPDATE 0) ---
UPDATE 0
```
`UPDATE 0` is not an error to PostgREST, so `updateHousehold` resolves and the caller toasts success.

**Evidence**
- `qa/reports/2026-09-14/L2-rls-rootcause-and-fix.txt`
- Policy: `supabase/migrations/001_initial_schema.sql:66-72` ("Owners can update their households").

**Root cause**
`src/app/(app)/casa/[id]/ajustes/page.tsx:84-101`
```tsx
      await updateHousehold(supabase, householdId, { ... })
      if (phone.trim()) { await updatePhone(supabase, userId, phone.trim()) }
      toast.success(es.settings.saved)
```
combined with `src/lib/data/households.ts:110-114`, which only throws on `error` — never on
"zero rows affected".

**Suggested fix** _(suggestion — the owner decides)_
Two halves; the frontend half alone closes the bug:
```diff
+  const isOwner = members.some((m) => m.profile_id === userId && m.role === 'owner')
...
   <Input id="houseName" value={name} onChange={...} className="h-10" />
+  {/* disable owner-only controls */}
+  <Input id="houseName" value={name} onChange={...} disabled={!isOwner} className="h-10" />
```
and show `es.settings.dangerZone`-style help text for members. The personal Teléfono field must stay
editable — it is the member's own profile row and RLS allows it.

Optional hardening for `backend-dev`: make `updateHousehold` return the updated row and throw when it
is empty:
```diff
-  const { error } = await supabase.from('households').update(updates).eq('id', householdId)
-  if (error) throw error
+  const { data, error } = await supabase.from('households').update(updates).eq('id', householdId).select('id')
+  if (error) throw error
+  if (!data?.length) throw new Error('NOT_AUTHORIZED')
```

**Acceptance criteria**
- [ ] A non-owner sees owner-only fields disabled, with a Spanish explanation from `es.ts`
- [ ] A non-owner can still edit and save their own Teléfono
- [ ] An owner's save still works and still toasts `es.settings.saved`
- [ ] No path shows "¡Guardado!" when nothing was written

**Regression risk**
`updateHousehold` is also used to set `dreaded_template_id`; the week-close cron reads that field
(`src/app/api/cron/week-close/route.ts:117`). Re-run TC-SET-001…003 and TC-CRON-005.

**Verification steps** _(how QA will close this)_
1. In E2 (or the local RLS harness), attempt the update as a member and assert the UI reports failure.
2. Assert `households.reward_text` is unchanged.

**Cross-boundary note** _(only when both sides are involved)_
The `updateHousehold` hardening is `backend-dev`'s (`src/lib/data/households.ts`). If they take it,
record the new throwing behaviour in `CONTRACT.md` so the frontend can catch `NOT_AUTHORIZED`.

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-009 — Anyone with a join code can drag another person into a household

| | |
|---|---|
| **Severity** | S2 (major) |
| **Priority** | P1 |
| **Area** | SEC |
| **Owner** | backend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 + local Postgres RLS harness · viewport n/a |
| **Test case** | TC-SEC-004 |

**Summary**
`join_household(code, user_id)` is `SECURITY DEFINER` and inserts the **caller-supplied** `user_id`
without checking it against `auth.uid()`. Any signed-in user who has a join code can therefore add
*any other Casa user* to *any household* — including one the caller is not a member of. The victim's
board, tasks and standings then appear inside a household they never agreed to join, and the
household's members can see the victim's profile. `PRODUCT.md` §Product Principles 4: privacy is
non-negotiable.

**Steps to reproduce** (from a cold start)
1. Apply `supabase/migrations/001_initial_schema.sql` to a Postgres 16 instance with the auth stubs in
   `qa/reports/2026-09-14/L2-pg-harness-setup.sql`, then the seed in `L2-pg-seed.sql`.
2. `set role authenticated; set qa.uid = '<Mamá, a member of household B only>';`
3. `select join_household('AAAAAA', '<Papá, a user in no household>');`
4. `select * from household_members where household_id = '<household A>';`

Reproduced: 2/2 attempts.

**Expected**
The function refuses to act for anyone but the caller — `user_id` must equal `auth.uid()`, or the
parameter should not exist at all.

**Actual**
```
=== Mama (member of B only) calls join_household(AAAAAA, Papa) — adds a THIRD PARTY to a household she is not in ===
 returned_household
--------------------
 "Depto Palermo"

             household_id             | display_name
--------------------------------------+--------------
 aaaaaaaa-0000-0000-0000-000000000001 | Bauti
 aaaaaaaa-0000-0000-0000-000000000001 | Hernan
 aaaaaaaa-0000-0000-0000-000000000001 | Papa     ← added by someone who is not in this household
```
The same call also returns the household's **full row, including `join_code`**, to a non-member:
```
{"id":"bbbb...","name":"Casa de los viejos","join_code":"BBBBBB","week_end_day":0, ...}
```

**Evidence**
- `qa/reports/2026-09-14/L4-sec-join-household.txt`
- `prosecdef = t` for `join_household` confirmed via `pg_proc`.

**Root cause**
`supabase/migrations/001_initial_schema.sql:97-118`
```sql
create or replace function join_household(code text, user_id uuid)
returns json
language plpgsql security definer as $$
...
  insert into household_members (household_id, profile_id, role)
  values (h.id, user_id, 'member');

  return row_to_json(h);
```
`security definer` bypasses the `household_members` insert policy
(`profile_id = auth.uid()`, line 90), and nothing re-imposes it.

**Suggested fix** _(suggestion — the owner decides)_
Drop the parameter and use the session identity:
```diff
-create or replace function join_household(code text, user_id uuid)
+create or replace function join_household(code text)
 returns json
 language plpgsql security definer
+set search_path = public
+as $$
 declare
   h households%rowtype;
+  uid uuid := auth.uid();
 begin
+  if uid is null then
+    raise exception 'Not authenticated';
+  end if;
   select * into h from households where join_code = upper(code);
   if not found then
     raise exception 'Invalid join code';
   end if;
-  if exists (select 1 from household_members where household_id = h.id and profile_id = user_id) then
+  if exists (select 1 from household_members where household_id = h.id and profile_id = uid) then
     raise exception 'Already a member';
   end if;
   insert into household_members (household_id, profile_id, role)
-  values (h.id, user_id, 'member');
-  return row_to_json(h);
+  values (h.id, uid, 'member');
+  return json_build_object('id', h.id, 'name', h.name);   -- do not leak join_code
 end;
```
If the two-argument signature must stay for compatibility, at minimum add
`if user_id <> auth.uid() then raise exception 'Not authorized'; end if;`.

Cross-boundary: the caller at `src/lib/data/households.ts:52-55` passes `user_id` and must drop it in
the same change.

**Acceptance criteria**
- [ ] `join_household` ignores or rejects any identity other than `auth.uid()`
- [ ] An anonymous call fails
- [ ] The return value no longer contains `join_code`
- [ ] The happy path (member joins with a valid code) still works, and a second attempt still raises
      "Already a member" so `onboarding/page.tsx:108` keeps showing `es.errors.alreadyMember`
- [ ] `set search_path = public` added (see the run report's observation on mutable search paths)

**Regression risk**
`joinHousehold` is called from `onboarding/page.tsx:104`; the error-string matching there
(`msg.includes('Already')`) must keep matching. Re-run TC-ONB-003 and TC-ONB-004.

**Verification steps** _(how QA will close this)_
1. Re-run `qa/reports/2026-09-14/L4-sec-join-household.txt` against the fixed function.
2. Assert the third-party insert now raises and `household_members` is unchanged.

**Cross-boundary note** _(only when both sides are involved)_
`frontend-dev` must drop the `userId` argument at `src/lib/data/households.ts:46-58` and
`src/app/(app)/onboarding/page.tsx:104` in lockstep — record the new signature in `CONTRACT.md`
(`joinHousehold(supabase, joinCode)`).

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-008 — Any data error drops the family onto a raw Next.js error page

| | |
|---|---|
| **Severity** | S2 (major) |
| **Priority** | P1 |
| **Area** | BOARD |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static · viewport 390×844 |
| **Test case** | TC-BOARD-006 |

**Summary**
Every data-access function in `src/lib/data/**` throws on error, and the four server components call
them with **zero** `try`/`catch`. There is no `error.tsx`, no `global-error.tsx` and no
`not-found.tsx` anywhere in `src/app`. So any Supabase hiccup — or CASA-001, which happens on every
single request today — replaces the whole app with Next.js's untranslated error screen. For a
Spanish-only family tool, that is an unrecoverable dead end with no "Intentá de nuevo".

**Steps to reproduce** (from a cold start)
1. `find src/app -name "error.tsx" -o -name "global-error.tsx" -o -name "not-found.tsx"` → no results.
2. Sign in and open `/casa/<id>` against the schema as shipped (CASA-001 makes
   `getHouseholdMembers` throw on every request).
3. Observe the rendered page.

Reproduced: 2/2 (file check + the CASA-001 failure path).

**Expected**
A Spanish error state with a retry, per `PRODUCT.md` §Users (non-technical adults) and the fact that
`es.errors.generic` exists for exactly this. Next.js 16 documents `error.tsx` as the segment-level
boundary (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`).

**Actual**
No boundary exists, so the failure escapes to the framework default.

**Evidence**
```
$ find src/app -name "error.tsx" -o -name "global-error.tsx" -o -name "not-found.tsx"
(nothing)

=== try/catch coverage in server components ===
--- src/app/(app)/layout.tsx: 0 try blocks, 2 awaited data calls
--- src/app/(app)/casa/[id]/page.tsx: 0 try blocks, 6 awaited data calls
--- src/app/(app)/casa/[id]/historial/page.tsx: 0 try blocks, 5 awaited data calls
```

**Root cause**
Not one line — a missing file. The throwing call sites are
`src/app/(app)/layout.tsx:19-20`, `src/app/(app)/casa/[id]/page.tsx:28,36,59-65`,
`src/app/(app)/casa/[id]/historial/page.tsx:26-38`, all of which call functions whose bodies end in
`if (error) throw error`.

**Suggested fix** _(suggestion — the owner decides)_
```diff
+ // src/app/(app)/error.tsx
+ 'use client'
+ import { Button } from '@/components/ui/button'
+ import { es } from '@/lib/i18n/es'
+
+ export default function AppError({ reset }: { error: Error; reset: () => void }) {
+   return (
+     <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6 text-center">
+       <p className="text-lg font-semibold">{es.errors.generic}</p>
+       <Button onClick={reset} className="h-12 px-6">Reintentar</Button>
+     </div>
+   )
+ }
```
Add the same under `src/app/(auth)/` and a `src/app/global-error.tsx` for root-layout failures. Do
**not** render `error.message` — it can contain Postgres details (see the run report's note on
`hint`/`details` leakage). New copy goes in `es.ts` (CASA-016).

**Acceptance criteria**
- [ ] A thrown data error renders a Spanish card with a working "Reintentar", not the Next.js screen
- [ ] The boundary covers `/casa/[id]`, `/historial`, `/ajustes`, `/nueva` and `/onboarding`
- [ ] No raw `error.message` or stack reaches the DOM in production
- [ ] `global-error.tsx` catches a root-layout failure

**Regression risk**
An `error.tsx` in `(app)` swallows errors that used to surface loudly in development — make sure the
error is still `console.error`-ed so QA can see it in the dev log.

**Verification steps** _(how QA will close this)_
1. Point `NEXT_PUBLIC_SUPABASE_URL` at an unreachable host, load `/casa/<id>`, and confirm the
   Spanish card renders.
2. Re-run after CASA-001 to confirm the happy path is untouched.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-007 — "Rotar entre miembros" gives the same person the first 15 days of the rotation

| | |
|---|---|
| **Severity** | S2 (major) |
| **Priority** | P1 |
| **Area** | CRON |
| **Owner** | backend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static + L1 probe · viewport n/a |
| **Test case** | TC-CRON-002 |

**Summary**
The generator picks the rotation assignee **once per template**, then writes that same assignee onto
every date in the batch. Because the horizon produces 15 dates, a brand-new rotating daily task is
assigned to `memberIds[0]` for 15 consecutive days; only from the 16th does it start alternating, one
new day per cron run. "Rotar entre miembros" is the fairness mechanism of the whole product
(`PRODUCT.md` §Operating Context), and on day one it visibly does not rotate.

**Steps to reproduce** (from a cold start)
1. Create a household with three members.
2. Create a recurring **daily** task with asignación "Rotar entre miembros".
3. Call `GET /api/cron/generate` once with a valid `CRON_SECRET`.
4. `select due_date, assignee_id from tasks where template_id = '<t>' order by due_date;`

Reproduced: 2/2 at the domain level for the date count (below); the assignment structure is a
single-expression read of the route.

**Expected**
Consecutive occurrences of a rotating template alternate members —
`src/lib/domain/recurrence.ts:92-95`: "Pick the next assignee in a rotation. Given the list of member
IDs and the last assignee, return the next one." Applied per occurrence, three members and 15 dates
give a b c a b c …

**Actual**
15 rows, all with the same `assignee_id`.

**Evidence**
- `qa/reports/2026-09-14/L1-probe-recurrence.txt` — the batch really is 15 dates wide:
  ```
  daily from 2026-09-14, horizon 14 (cron uses 14)
    n=15 -> ["2026-09-14","2026-09-15", ... ,"2026-09-28"]
  ```
- `pickRotatedAssignee` itself is correct (`qa/reports/2026-09-14/L1-probe-recurrence.txt`,
  rotation block) — the defect is purely where it is called.

**Root cause**
`src/app/api/cron/generate/route.ts:41-69` computes `assigneeId` **outside** the date loop that starts
at `:83`:
```ts
    let assigneeId = template.default_assignee_id
    if (template.assignment === 'rotate') {
      ...
      assigneeId = pickRotatedAssignee(memberIds, lastTask?.assignee_id ?? null)
    }
    ...
    for (const dateStr of dates) {
      const { error } = await supabase.from('tasks').upsert({ ..., assignee_id: assigneeId, ... })
```

**Suggested fix** _(suggestion — the owner decides)_
Advance the rotation inside the loop:
```diff
     let assigneeId = template.default_assignee_id
+    let memberIds: string[] = []
+    let lastAssignee: string | null = null
     if (template.assignment === 'rotate') {
       const { data: members } = await supabase...
       if (members && members.length > 0) {
-        const memberIds = members.map(...)
+        memberIds = members.map(...)
         const { data: lastTask } = await supabase...
-        assigneeId = pickRotatedAssignee(memberIds, lastTask?.assignee_id ?? null)
+        lastAssignee = lastTask?.assignee_id ?? null
       }
     }
 
     for (const dateStr of dates) {
+      if (template.assignment === 'rotate' && memberIds.length > 0) {
+        assigneeId = pickRotatedAssignee(memberIds, lastAssignee)
+        lastAssignee = assigneeId
+      }
       const { error } = await supabase.from('tasks').upsert({ ..., assignee_id: assigneeId, ... })
```
Note this only advances for rows the upsert actually inserts if you also skip duplicates; because
`ignoreDuplicates: true` silently no-ops on existing dates, the rotation will drift on re-runs. The
robust version derives the assignee deterministically from the occurrence index, e.g.
`memberIds[(baseIndex + i) % memberIds.length]` where `baseIndex` comes from the last stored task —
idempotent across repeated cron runs. Recommended.

**Acceptance criteria**
- [ ] A fresh rotating daily template produces a b c a b c … across the whole 15-day batch
- [ ] Re-running `/api/cron/generate` twice in a row does not change any existing assignee
- [ ] A rotating **weekly** template rotates per occurrence, not per run
- [ ] `assignment = 'fixed'` still uses `default_assignee_id` for every date

**Regression risk**
The week-close dreaded-task reassignment overwrites assignees for the current window
(`src/app/api/cron/week-close/route.ts:123-129`) — verify the two do not fight after a week closes.

**Verification steps** _(how QA will close this)_
1. Seed a three-member household in the local Postgres harness, run the generator logic, and assert
   the assignee sequence cycles.
2. Run it twice and diff the table.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-006 — After 9 pm in Argentina the board thinks it is tomorrow

| | |
|---|---|
| **Severity** | S2 (major) |
| **Priority** | P1 |
| **Area** | BOARD |
| **Owner** | frontend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static + L1 probe · viewport 390×844 |
| **Test case** | TC-BOARD-003 |

**Summary**
The board computes "today" from the **server's** clock, not the household's timezone. On Vercel the
server runs in UTC; Buenos Aires is UTC−3. So every day between 21:00 and 24:00 local — prime
chore-and-check-the-app time — today's tasks jump into the red "Atrasadas" section and tomorrow's
tasks appear under "Hoy". Nothing is actually late. The week window on the same page *is* computed in
the household timezone, so the two halves of the screen disagree.

**Steps to reproduce** (from a cold start)
1. Household timezone `America/Argentina/Buenos_Aires`, a task due today.
2. Set the server clock (or `TZ`) so that local time is 21:30 in Buenos Aires — i.e. 00:30 UTC the
   next day.
3. Load `/casa/<id>` at 390×844.

Reproduced: 2/2 at the domain level (below). System `TZ` during this run was UTC — the same as Vercel.

**Expected**
"Hoy" means today **in the household's timezone**. The rest of the page already does this:
`src/app/(app)/casa/[id]/page.tsx:30-31` passes `household.timezone` into `getWeekWindow` and
`daysRemaining`.

**Actual**
```
--- 2026-09-16 21:30 ART = 2026-09-17T00:30Z ---
server-local "today" (what casa/[id]/page.tsx computes): 2026-09-17
household-local today:                                   2026-09-16
week window: 2026-09-13 Sun 00:00 -> 2026-09-20 Sun 00:00 daysRemaining= 4
```
With `today = 2026-09-17`, `groupTasks` puts a task due `2026-09-16` into `overdue`
(`board-view.tsx:46`) and a task due `2026-09-17` into `today` (`:48`).

**Evidence**
- `qa/reports/2026-09-14/L1-probe-week.txt` (last block)
- Environment: `Intl.DateTimeFormat().resolvedOptions().timeZone === 'UTC'`, offset 0.

**Root cause**
`src/app/(app)/casa/[id]/page.tsx:68`
```tsx
  const today = format(now, 'yyyy-MM-dd')
```
`now` is a plain `new Date()` and `format` is timezone-naive — it reads the *server's* local fields.
Every other date in this file went through `toZonedTime` inside the domain layer first.

**Suggested fix** _(suggestion — the owner decides)_
```diff
-import { format } from 'date-fns'
+import { format } from 'date-fns'
+import { toZonedTime } from 'date-fns-tz'
...
-  const today = format(now, 'yyyy-MM-dd')
+  const today = format(toZonedTime(now, household.timezone), 'yyyy-MM-dd')
```
Cleaner alternative for `backend-dev` to consider: export a `todayInTimezone(now, tz)` helper from
`src/lib/domain/week.ts` so no page has to remember this again, and list it in `CONTRACT.md`.

**Acceptance criteria**
- [ ] At 21:30 ART, a task due that day is in "Hoy", not "Atrasadas"
- [ ] At 21:30 ART, a task due the next day is **not** in "Hoy"
- [ ] The same value is used for the `⚠️` overdue prefix logic anywhere else it appears
- [ ] A household on a different `timezone` value groups by *its* local day

**Regression risk**
`today` feeds all four board groups. Re-run TC-BOARD-001…003 at 00:30 UTC and 15:00 UTC, and check
`src/app/api/cron/reminders/route.ts:31`, which already does the zoned conversion correctly and
should stay consistent with the board.

**Verification steps** _(how QA will close this)_
1. Re-run the L1 probe with the fixed expression and assert server-local and household-local agree.
2. Load the board with a faked clock at 00:30 UTC and screenshot the sections.

**Cross-boundary note** _(only when both sides are involved)_
If the `todayInTimezone` helper route is taken, `backend-dev` adds it to `src/lib/domain/week.ts` and
records it in `CONTRACT.md`; the page change stays with `frontend-dev`.

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-005 — Any signed-in user can read every Casa user's name and phone number

| | |
|---|---|
| **Severity** | S1 (critical — privacy breach) |
| **Priority** | P0 |
| **Area** | SEC |
| **Owner** | backend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 + local Postgres RLS harness · viewport n/a |
| **Test case** | TC-SEC-002 |

**Summary**
`profiles` is readable by everyone: `create policy "Users can read any profile" on profiles for select
using (true)`. `profiles` holds `display_name` **and `phone_e164`**. So any authenticated user — a
stranger who signed up with a magic link, not just a household member — can enumerate every Casa
user's name and mobile number, across every household. `PRODUCT.md` §Product Principles 4 states
privacy is non-negotiable, and `qa/TEST-PLAN.md` §4 R3 ranks cross-household leakage as critical.

**Steps to reproduce** (from a cold start)
1. Apply `supabase/migrations/001_initial_schema.sql` plus the stubs in
   `qa/reports/2026-09-14/L2-pg-harness-setup.sql` and the seed in `L2-pg-seed.sql`
   (Bauti + Hernán in household A, Mamá in household B).
2. `set role authenticated; set qa.uid = '<Bauti, household A>';`
3. `select display_name, phone_e164 from profiles where display_name = 'Mama';`

Reproduced: 2/2 attempts.

**Expected**
A member can read only the profiles of people who share a household with them. Everything else in the
schema is correctly scoped with `is_member()`; `profiles` is the one table that is not.

**Actual**
```
================ TEST 4: CROSS-HOUSEHOLD PROFILE/PHONE READ (Bauti reads Mamas phone) ================
 display_name |   phone_e164
--------------+----------------
 Mama         | +5491177778888
(1 row)
```
For contrast, the same outsider correctly sees zero of household A's tasks (`TEST 3` in
`L4-sec-policies.txt`) — so the isolation model is right everywhere except here.

**Evidence**
- `qa/reports/2026-09-14/L2-rls-reachability.txt` (TEST 4)
- `qa/reports/2026-09-14/L4-sec-policies.txt` (TEST S3, the contrasting task isolation)

**Root cause**
`supabase/migrations/001_initial_schema.sql:15-16`
```sql
create policy "Users can read any profile"
  on profiles for select using (true);
```

**Suggested fix** _(suggestion — the owner decides)_
Scope reads to shared households, reusing the existing `SECURITY DEFINER` helper style:
```diff
-create policy "Users can read any profile"
-  on profiles for select using (true);
+create or replace function shares_household(p uuid)
+returns boolean
+language sql security definer stable
+set search_path = public as $$
+  select exists (
+    select 1
+    from household_members mine
+    join household_members theirs on theirs.household_id = mine.household_id
+    where mine.profile_id = auth.uid() and theirs.profile_id = p
+  );
+$$;
+
+create policy "Users can read their own profile"
+  on profiles for select using (auth.uid() = id);
+
+create policy "Users can read profiles of household mates"
+  on profiles for select using (shares_household(id));
```
The helper must be `SECURITY DEFINER` so it does not re-enter `household_members` RLS — the same
mistake that causes CASA-001. Note the join-flow ordering: `join_household` inserts the membership row
before any profile read is needed, so onboarding still works.

Consider moving `phone_e164` out of `profiles` into a `profile_contacts` table readable only by its
owner and the service role — the cron is the only consumer
(`src/app/api/cron/reminders/route.ts:36`) and it uses the service key.

**Acceptance criteria**
- [ ] A user in household B cannot select a profile from household A
- [ ] A user can always read their own profile
- [ ] Household mates still resolve in `getHouseholdMembers` (`*, profile:profiles(*)`) and on task
      cards (`assignee:profiles!tasks_assignee_id_fkey(*)`)
- [ ] `qa/reports/2026-09-14/L2-rls-reachability.txt` TEST 4 returns 0 rows
- [ ] The reminders cron (service role) still reads `phone_e164`

**Regression risk**
Every screen resolves profiles through a join: board task cards, leaderboard, members list, history
hall of fame. Re-run TC-BOARD-001, TC-LEAD-001, TC-SET-003 and TC-HIST-001 after the change. Also
re-check onboarding: `getUserHouseholds` runs before any household mate exists.

**Verification steps** _(how QA will close this)_
1. Re-run `qa/reports/2026-09-14/L2-rls-reachability.txt` against the new policies.
2. Add the negative case to the regression suite as TC-SEC-002.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-004 — Choosing "la semana cierra el domingo" makes the week *start* on Sunday

| | |
|---|---|
| **Severity** | S1 (critical — scoring) |
| **Priority** | P0 |
| **Area** | DOM |
| **Owner** | backend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 static + L1 probe · viewport n/a |
| **Test case** | TC-DOM-001 / TC-DOM-002 / TC-DOM-003 |

**Summary**
`getWeekWindow` treats `week_end_day` as the day the week **begins**, not the day it ends. With the
default `week_end_day = 0` the window is Sunday 00:00 → Saturday 23:59, so the day the household
chose as the closing day is the first day of the *next* week. Three consequences, all visible to the
family: a chore done on Sunday scores for next week instead of the week that is closing; the board
says "7 días restantes" on the day the week is supposed to end; and the week-close snapshot freezes
the wrong seven days. `qa/TEST-PLAN.md` §2 ranks scoring correctness first, and §4 R1 flags exactly
this.

**Steps to reproduce** (from a cold start)
1. `npx vitest run <probe>` with the script saved at
   `qa/reports/2026-09-14/L1-probe-week.txt` (header shows the exact inputs), or in a node REPL:
2. `getWeekWindow(new Date('2026-09-13T15:00:00Z'), 0, 'America/Argentina/Buenos_Aires')`
   — 2026-09-13 is a Sunday; 15:00Z is 12:00 in Buenos Aires.
3. `daysRemaining(new Date('2026-09-13T15:00:00Z'), 0, 'America/Argentina/Buenos_Aires')`

Reproduced: 2/2 attempts. Note Argentina has had **no DST since 2009**, so no DST effect is involved —
this is a pure day-index error.

**Expected**
The function's own contract, `src/lib/domain/week.ts:22-24`:
```
 * The week ENDS at midnight on weekEndDay. So if weekEndDay is 0 (Sunday),
 * the week runs Mon 00:00 → Sun 23:59:59 and closes at Sun midnight.
```
For `weekEndDay = 0` and any reference date in that week, the window must be
`start = Monday 00:00`, `end = following Monday 00:00` (exclusive), and `daysRemaining` on Sunday must
be **1**. The UI label agrees: "¿Qué día cierra la semana?" (`es.onboarding.weekEndDay`), as does the
column name `week_end_day` and `PRODUCT.md` §Operating Context ("configurable end-day").

**Actual** (`weekEndDay = 0`, `America/Argentina/Buenos_Aires`, noon local each day)
```
ART 2026-09-13 Sun | start=2026-09-13 Sun | end(excl)=2026-09-20 Sun | lastIncludedDay=2026-09-19 Sat | daysRemaining=7 | range="13 Sep – 19 Sep"
ART 2026-09-14 Mon | start=2026-09-13 Sun | end(excl)=2026-09-20 Sun | lastIncludedDay=2026-09-19 Sat | daysRemaining=6
ART 2026-09-19 Sat | start=2026-09-13 Sun | end(excl)=2026-09-20 Sun | lastIncludedDay=2026-09-19 Sat | daysRemaining=1
ART 2026-09-20 Sun | start=2026-09-20 Sun | end(excl)=2026-09-27 Sun | lastIncludedDay=2026-09-26 Sat | daysRemaining=7
```
Membership check for the window computed on Wednesday:
```
window: 2026-09-13 Sun 00:00 -> 2026-09-20 Sun 00:00
  2026-09-13 Sun inWeek=true    ← should be the LAST day of the previous week
  ...
  2026-09-19 Sat inWeek=true
  2026-09-20 Sun inWeek=false   ← should be the last day of THIS week
```
The same shift appears for `weekEndDay = 1`: on Monday the window restarts and `daysRemaining` jumps
from 1 to 7.

**Evidence**
- `qa/reports/2026-09-14/L1-probe-week.txt` (full walk for `weekEndDay` 0 and 1, membership table,
  `getClosableWeek` walk)
- `src/lib/domain/week.ts` has **no unit test file** — `npm test` covers only `ranking` and
  `recurrence` (18 tests, 2 files), which is why this shipped.

**Root cause**
`src/lib/domain/week.ts:36-41`
```ts
  let daysUntilEnd = (weekEndDay - currentDayOfWeek + 7) % 7
  // If today IS the end day, this week has already ended — move to next
  if (daysUntilEnd === 0) daysUntilEnd = 7

  const end = addDays(today, daysUntilEnd)
  const start = subDays(end, 7)
```
The exclusive boundary must be the midnight **after** `weekEndDay`, i.e. `weekEndDay + 1`. As written,
`end` lands on `weekEndDay` itself, so the entire window slides back one day and the end day is
excluded.

**Suggested fix** _(suggestion — the owner decides)_
```diff
-  // How many days until the next weekEndDay?
-  let daysUntilEnd = (weekEndDay - currentDayOfWeek + 7) % 7
-  // If today IS the end day, this week has already ended — move to next
-  if (daysUntilEnd === 0) daysUntilEnd = 7
-
-  const end = addDays(today, daysUntilEnd)
+  // Days until the midnight that CLOSES the week: the midnight after weekEndDay.
+  // If today is the end day, the week closes tonight → 1 day.
+  const daysUntilEnd = ((weekEndDay - currentDayOfWeek + 7) % 7) + 1
+
+  const end = addDays(today, daysUntilEnd)
   const start = subDays(end, 7)
```
With that, `weekEndDay = 0` gives `start = Monday 00:00`, `end = Monday 00:00` (exclusive), Sunday is
inside the week, and `daysRemaining` on Sunday is 1. `getClosableWeek`, `formatWeekRange` and
`isInWeek` need no change — they are derived.

Ready-to-paste regression tests (`src/lib/domain/__tests__/week.test.ts` — QA does not own test files,
so this is for `backend-dev` to add):
```ts
import { describe, it, expect } from 'vitest'
import { getWeekWindow, daysRemaining, isInWeek, formatWeekRange, getClosableWeek } from '../week'
import { format } from 'date-fns'

const TZ = 'America/Argentina/Buenos_Aires'
const at = (isoUtc: string) => new Date(isoUtc)
const d = (x: Date) => format(x, 'yyyy-MM-dd')

describe('getWeekWindow — weekEndDay = 0 (Sunday)', () => {
  it('includes the end day itself', () => {
    const w = getWeekWindow(at('2026-09-20T15:00:00Z'), 0, TZ) // Sunday noon ART
    expect(d(w.start)).toBe('2026-09-14') // Monday
    expect(d(w.end)).toBe('2026-09-21')   // exclusive: next Monday
    expect(isInWeek(new Date('2026-09-20T12:00:00'), w)).toBe(true)
  })

  it('daysRemaining counts down to 1 on the end day', () => {
    const days = (iso: string) => daysRemaining(at(iso), 0, TZ)
    expect(days('2026-09-14T15:00:00Z')).toBe(7) // Monday
    expect(days('2026-09-19T15:00:00Z')).toBe(2) // Saturday
    expect(days('2026-09-20T15:00:00Z')).toBe(1) // Sunday — the end day
    expect(days('2026-09-21T15:00:00Z')).toBe(7) // next Monday, new week
  })

  it('formats the range as Mon–Sun', () => {
    expect(formatWeekRange(getWeekWindow(at('2026-09-16T15:00:00Z'), 0, TZ))).toBe('14 Sep – 20 Sep')
  })
})

describe('getWeekWindow — every weekEndDay', () => {
  it('always spans exactly 7 days and ends the day after weekEndDay', () => {
    for (let end = 0; end <= 6; end++) {
      for (let i = 0; i < 7; i++) {
        const now = at(`2026-09-${14 + i}T15:00:00Z`)
        const w = getWeekWindow(now, end, TZ)
        expect((+w.end - +w.start) / 86400000).toBe(7)
        expect(new Date(+w.end - 86400000).getDay()).toBe(end) // last included day
        expect(isInWeek(new Date(+now - 3 * 3600e3), w)).toBe(true)
      }
    }
  })
})

describe('getClosableWeek', () => {
  it('returns the seven days that just finished', () => {
    const c = getClosableWeek(at('2026-09-21T06:00:00Z'), 0, TZ) // Monday 03:00 ART
    expect(d(c.start)).toBe('2026-09-14')
    expect(d(c.end)).toBe('2026-09-21')
  })
})
```

**Acceptance criteria**
- [ ] `getWeekWindow(now, e, tz)` spans exactly 7 days and its last included day is weekday `e`, for
      every `e` in 0…6 and every reference day
- [ ] `daysRemaining` returns 1 on the end day and 7 on the day after
- [ ] `formatWeekRange` reads Mon–Sun for `weekEndDay = 0`
- [ ] `src/lib/domain/__tests__/week.test.ts` exists and `npm test` is green
- [ ] `/api/cron/week-close` closes the window that contains the end day

**Regression risk**
`getWeekWindow` is the highest-fan-out function in the codebase: the board window and `daysRemaining`
(`casa/[id]/page.tsx:30-31`), the scoring filter (`:39-42`), `getClosableWeek`, the week-close guard
(`week-close/route.ts:51-56`) and the dreaded-task reassignment window (`:119-121`). **Any week
already stored in `weeks` was computed with the old boundary** — decide whether existing rows are
migrated or left as historical, and say which in `CONTRACT.md`.

**Verification steps** _(how QA will close this)_
1. Re-run the probe in `qa/reports/2026-09-14/L1-probe-week.txt` and compare every line.
2. Run `npm test` and confirm the new `week.test.ts` cases pass.
3. Drive `/api/cron/week-close?now=<Monday 03:00 ART>` against the harness and assert
   `week_start`/`week_end` cover Mon…Sun.

**Cross-boundary note** _(only when both sides are involved)_
Once the boundary moves, `frontend-dev` must re-verify CASA-021 (history range display), whose
expected output depends on it.

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-003 — Cron endpoints accept `Bearer undefined` when `CRON_SECRET` is not set

| | |
|---|---|
| **Severity** | S1 (critical — security) |
| **Priority** | P0 |
| **Area** | SEC |
| **Owner** | backend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E1 stub · viewport n/a |
| **Test case** | TC-SEC-003 |

**Situation in one line:** if the environment variable is missing, the comparison string becomes the
literal `"Bearer undefined"`, and anyone on the internet who sends that header gets a service-role
client.

**Summary**
All three cron routes authenticate with
`authHeader !== \`Bearer ${process.env.CRON_SECRET}\``. When `CRON_SECRET` is undefined the template
literal interpolates the string `"undefined"`, so `Authorization: Bearer undefined` passes. Past the
check the handler builds `createServiceClient()`, which uses `SUPABASE_SERVICE_ROLE_KEY` and
**bypasses RLS entirely**. An anonymous caller could close weeks early (deciding the winner and the
dreaded task), regenerate tasks, and enumerate every household. A missing env var in a deploy should
fail closed; here it fails wide open.

**Steps to reproduce** (from a cold start)
1. `grep -v '^CRON_SECRET' .env.local.example > .env.local` (simulates a deploy where the variable was
   never set in the dashboard).
2. `npm run dev`
3. `curl -s -H "Authorization: Bearer undefined" http://localhost:3000/api/cron/week-close`
4. Repeat for `/api/cron/generate` and `/api/cron/reminders`.

Reproduced: 2/2 attempts.

**Expected**
No `CRON_SECRET` → every request is rejected with 401. Secrets handling is called out in
`.claude/agents/qa-qc.md` §L4 ("cron routes must enforce `CRON_SECRET`") and
`qa/TEST-PLAN.md` §4 R4.

**Actual**
```
### CRON_SECRET is UNSET in the environment ###
--- /api/cron/week-close  (no Authorization header) ---
HTTP 401
--- /api/cron/week-close  with 'Authorization: Bearer undefined' ---
{"message":"No households","results":[]}
HTTP 200
--- /api/cron/generate  with 'Authorization: Bearer undefined' ---
{"message":"No templates","results":[]}
HTTP 200
--- /api/cron/reminders  with 'Authorization: Bearer undefined' ---
{"message":"No households","results":[]}
HTTP 200
### ATTEMPT 2 (reproduction) ###
week-close: {"message":"No households","results":[]} [HTTP 200]
generate:   {"message":"No templates","results":[]} [HTTP 200]
reminders:  {"message":"No households","results":[]} [HTTP 200]
```
(The empty result sets are only because the stub `NEXT_PUBLIC_SUPABASE_URL` is unreachable — the
handler body ran. With the secret correctly set, all three return 401 for any wrong value: see
`qa/reports/2026-09-14/L4-cron-auth-with-secret.txt`.)

**Evidence**
- `qa/reports/2026-09-14/L4-cron-secret-bypass.txt` (both attempts)
- `qa/reports/2026-09-14/L4-cron-auth-with-secret.txt` (the control: correct/wrong/undefined/no header)

**Root cause**
Identical in all three routes —
`src/app/api/cron/week-close/route.ts:10-13`, `generate/route.ts:8-11`, `reminders/route.ts:7-10`:
```ts
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
```
`${undefined}` stringifies to `"undefined"`. The comparison is also non-constant-time, and it is
copy-pasted three times.

**Suggested fix** _(suggestion — the owner decides)_
One shared guard that fails closed:
```diff
+ // src/app/api/cron/auth.ts
+ import { timingSafeEqual } from 'node:crypto'
+ import type { NextRequest } from 'next/server'
+
+ export function cronAuthorized(request: NextRequest): boolean {
+   const secret = process.env.CRON_SECRET
+   if (!secret) return false                       // fail closed
+   const header = request.headers.get('authorization') ?? ''
+   const expected = Buffer.from(`Bearer ${secret}`)
+   const got = Buffer.from(header)
+   return got.length === expected.length && timingSafeEqual(got, expected)
+ }
```
```diff
-  const authHeader = request.headers.get('authorization')
-  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
+  if (!cronAuthorized(request)) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
```
Apply to all three routes in the same change. Consider also asserting `SUPABASE_SERVICE_ROLE_KEY` in
`createServiceClient` (see CASA-013) so a half-configured deploy crashes loudly instead of running
with `"undefined"` as a key.

**Acceptance criteria**
- [ ] With `CRON_SECRET` unset, all three routes return 401 for every header value including
      `Bearer undefined` and `Bearer `
- [ ] With `CRON_SECRET` set, the correct value returns 200 and every other value returns 401
- [ ] The comparison is length-checked and constant-time
- [ ] The guard exists in exactly one place

**Regression risk**
All three cron routes; Vercel's scheduler sends `Authorization: Bearer $CRON_SECRET`, so re-verify the
happy path before deploying. A constant-time compare that forgets the length check throws on mismatched
buffers — hence the explicit length test above.

**Verification steps** _(how QA will close this)_
1. Re-run `qa/reports/2026-09-14/L4-cron-secret-bypass.txt` with `CRON_SECRET` removed — expect 401×3.
2. Re-run `L4-cron-auth-with-secret.txt` with it set — expect 200/401/401/401.

**Cross-boundary note** _(only when both sides are involved)_
n/a

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-002 — You cannot create a second task for the same day — anywhere in Casa

| | |
|---|---|
| **Severity** | S1 (critical) |
| **Priority** | P0 |
| **Area** | TASK |
| **Owner** | backend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 + local Postgres 16.13 · viewport n/a |
| **Test case** | TC-TASK-002 / TC-TASK-003 |

**Summary**
`tasks` carries `unique nulls not distinct (template_id, due_date)`. The intent — one instance per
recurring template per day — is right, but `NULLS NOT DISTINCT` makes two `NULL` template ids equal.
Every ad-hoc task has `template_id = NULL`, so the constraint collapses to "one dateless-template task
per due date **in the entire table**". The second chore a family adds for a given day fails with a
unique violation and a generic Spanish error. Worse, the constraint has no `household_id` in it, so
one household's task blocks the other household's task on the same date — a cross-tenant collision in
a product whose whole premise is two separate households.

**Steps to reproduce** (from a cold start)
1. Apply `supabase/migrations/001_initial_schema.sql` (plus the auth stubs in
   `qa/reports/2026-09-14/L2-pg-harness-setup.sql` and seed `L2-pg-seed.sql`).
2. `insert into tasks (household_id, title, effort, points, due_date, created_by) values (<A>, 'Lavar los platos', 'normal', 3, '2026-09-15', <Bauti>);`
3. `insert into tasks (household_id, title, effort, points, due_date, created_by) values (<A>, 'Sacar la basura', 'rapida', 1, '2026-09-15', <Bauti>);`
4. And from the *other* household: same date, different household id.
5. And twice with no `due_date` at all.

Reproduced: 2/2 attempts.

**Expected**
A household can create as many one-off tasks per day as it likes. The uniqueness that matters is
"one generated instance per (template, date)", which only applies when `template_id IS NOT NULL` —
the comment in the migration says exactly that: `-- Prevent duplicate task instances from recurring templates`.

**Actual**
```
=== the constraint as shipped ===
 tasks_template_id_due_date_key | UNIQUE NULLS NOT DISTINCT (template_id, due_date)

=== T1: two one-off tasks, SAME household, SAME due date (the everyday case) ===
INSERT 0 1
ERROR:  duplicate key value violates unique constraint "tasks_template_id_due_date_key"
DETAIL:  Key (template_id, due_date)=(null, 2026-09-15) already exists.

=== T2: one-off task in the OTHER household, same due date (cross-household collision) ===
ERROR:  duplicate key value violates unique constraint "tasks_template_id_due_date_key"
DETAIL:  Key (template_id, due_date)=(null, 2026-09-15) already exists.

=== T3: two one-off tasks with NO due date ===
INSERT 0 1
ERROR:  duplicate key value violates unique constraint "tasks_template_id_due_date_key"
DETAIL:  Key (template_id, due_date)=(null, null) already exists.
```
The intended behaviour still works — two generator runs for the same (template, date) produce one row:
```
=== T4: does the intended template idempotency still work? ===
INSERT 0 1 / INSERT 0 0
 barrer_rows = 1
```
In the UI this surfaces as `toast.error(es.errors.generic)` at
`src/app/(app)/casa/[id]/nueva/page.tsx:98` with no explanation.

**Evidence**
- `qa/reports/2026-09-14/L2-tasks-unique-constraint.txt` (full transcript, PostgreSQL 16.13)
- Harness: `qa/reports/2026-09-14/L2-pg-harness-setup.sql`, `L2-pg-seed.sql`

**Root cause**
`supabase/migrations/001_initial_schema.sql:166-167`
```sql
  -- Prevent duplicate task instances from recurring templates
  unique nulls not distinct (template_id, due_date)
```
`NULLS NOT DISTINCT` (PostgreSQL 15+) makes `(NULL, d)` collide with `(NULL, d)`.

**Suggested fix** _(suggestion — the owner decides)_
Replace the table constraint with a **partial unique index** that only covers generated rows:
```diff
   create_by ...,
-  -- Prevent duplicate task instances from recurring templates
-  unique nulls not distinct (template_id, due_date)
 );
+
+-- One instance per (template, date); ad-hoc tasks (template_id IS NULL) are unconstrained.
+create unique index tasks_template_due_unique
+  on tasks (template_id, due_date)
+  where template_id is not null;
```
Migration for an existing database (`002_fix_tasks_unique.sql`):
```sql
alter table tasks drop constraint tasks_template_id_due_date_key;
create unique index tasks_template_due_unique
  on tasks (template_id, due_date)
  where template_id is not null;
```
`src/app/api/cron/generate/route.ts:98` passes `{ onConflict: 'template_id,due_date', ignoreDuplicates: true }`;
PostgREST infers a partial index only if the predicate is supplied, so the upsert may need to become an
insert with an explicit pre-check, or the `onConflict` target must be verified against the new index —
please confirm idempotency with T4 above after the change.

**Acceptance criteria**
- [ ] Two one-off tasks with the same `due_date` in the same household both insert
- [ ] Two one-off tasks with the same `due_date` in **different** households both insert
- [ ] Two one-off tasks with `due_date IS NULL` both insert
- [ ] Running `/api/cron/generate` twice still produces exactly one row per (template, date)
- [ ] A migration file exists so an already-deployed database is fixed, not just a fresh one

**Regression risk**
The generator's idempotency depends on this index (`generate/route.ts:85-99`) — that is the case to
re-test hardest. `deleteTask` + regenerate also interacts: a deleted generated task will be recreated
on the next run, which is existing behaviour but worth confirming is unchanged.

**Verification steps** _(how QA will close this)_
1. Re-run `qa/reports/2026-09-14/L2-tasks-unique-constraint.txt` end to end — T1/T2/T3 must all insert,
   T4 must still yield one row.
2. Create two tasks for the same day through the UI once CASA-001 is fixed.

**Cross-boundary note** _(only when both sides are involved)_
If the upsert has to change shape, `createTask`'s signature does not — no `CONTRACT.md` change
expected. If it does, record it.

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_

---

### CASA-001 — Nobody can open the app: reading the members table triggers infinite RLS recursion

| | |
|---|---|
| **Severity** | S1 (critical) |
| **Priority** | P0 |
| **Area** | SEC |
| **Owner** | backend-dev |
| **Status** | OPEN |
| **Found in** | RUN-2026-09-14 · env E0 + local Postgres 16.13 with the shipped migration · viewport 390×844 |
| **Test case** | TC-SEC-001 |

**Summary**
The policy `"Owners can manage members"` on `household_members` queries `household_members` inside its
own `USING` clause. PostgreSQL detects the cycle and aborts every statement against the table with
`42P17 infinite recursion detected in policy for relation "household_members"`. Because permissive
policies are OR-ed, the recursive one is evaluated on plain `SELECT`s too — so `getHouseholdMembers`,
`getUserHouseholds` and the owner check inside the `households` UPDATE policy all fail. Every
signed-in route in Casa calls at least one of them, which means the app layout itself throws and
**no signed-in page renders at all** — combined with CASA-008 (no error boundary), the family sees the
raw Next.js error screen.

**Steps to reproduce** (from a cold start)
1. Apply `supabase/migrations/001_initial_schema.sql` verbatim to a PostgreSQL 16 database, with the
   Supabase auth stubs from `qa/reports/2026-09-14/L2-pg-harness-setup.sql` and the two-household seed
   from `L2-pg-seed.sql`.
2. `set role authenticated;`
3. `set qa.uid = '11111111-1111-1111-1111-111111111111';` (Bauti, owner of household A)
4. `select household_id, profile_id, role from household_members;`
5. Repeat for the joined form used by `getUserHouseholds` and for an `update households …`.

Reproduced: 2/2 attempts (and again after the candidate fix was rolled back).

**Expected**
A member reads the membership rows of their own households. `getHouseholdMembers`
(`src/lib/data/households.ts:84-94`) is called by the board, the new-task page, settings and history;
`getUserHouseholds` (`:60-70`) is called by the app layout on every request.

**Actual**
```
================ TEST 1: household_members SELECT as a normal member (getHouseholdMembers) ================
ERROR:  infinite recursion detected in policy for relation "household_members"
================ TEST 3: getUserHouseholds nested select equivalent ================
ERROR:  infinite recursion detected in policy for relation "household_members"
================ TEST 5: non-owner member updates household settings ================
ERROR:  infinite recursion detected in policy for relation "household_members"
================ TEST 6: owner updates household settings ================
ERROR:  infinite recursion detected in policy for relation "household_members"
================ TEST 7: outsider reads household A members ================
ERROR:  infinite recursion detected in policy for relation "household_members"
```
Only `select * from households` survives, because that policy goes through the `SECURITY DEFINER`
helper `is_member()`.

**Evidence**
- `qa/reports/2026-09-14/L2-rls-reachability.txt` (failing transcript)
- `qa/reports/2026-09-14/L2-rls-rootcause-and-fix.txt` (the candidate fix applied inside a
  transaction, all five cases passing, then rolled back)
- Harness: `L2-pg-harness-setup.sql`, seed: `L2-pg-seed.sql`

**Root cause**
`supabase/migrations/001_initial_schema.sql:78-86`
```sql
create policy "Owners can manage members"
  on household_members for all using (
    exists (
      select 1 from household_members hm
      where hm.household_id = household_members.household_id
        and hm.profile_id = auth.uid()
        and hm.role = 'owner'
    )
  );
```
The subquery re-enters the same table, so its own policies apply, which include this policy. The
migration already knows the workaround — `is_member()` at `:50-57` is `SECURITY DEFINER` precisely to
break this cycle — it just was not used here. The same pattern appears in the `households` UPDATE
policy at `:66-72`, which is why owner saves fail too.

**Suggested fix** _(suggestion — the owner decides)_
Add an `is_owner()` companion to `is_member()` and route both policies through it:
```diff
+create or replace function is_owner(h uuid)
+returns boolean
+language sql security definer stable
+set search_path = public as $$
+  select exists (
+    select 1 from household_members
+    where household_id = h and profile_id = auth.uid() and role = 'owner'
+  );
+$$;
+
 create policy "Owners can manage members"
-  on household_members for all using (
-    exists (
-      select 1 from household_members hm
-      where hm.household_id = household_members.household_id
-        and hm.profile_id = auth.uid()
-        and hm.role = 'owner'
-    )
-  );
+  on household_members for all using (is_owner(household_id));
```
```diff
 create policy "Owners can update their households"
-  on households for update using (
-    exists (
-      select 1 from household_members
-      where household_id = id and profile_id = auth.uid() and role = 'owner'
-    )
-  );
+  on households for update using (is_owner(id));
```
**This exact fix was executed against the shipped schema and verified** — see the transcript:
```
--- getHouseholdMembers after fix ---            2 rows (Bauti owner, Hernan member)
--- updateHousehold as owner after fix ---       UPDATE 1
--- updateHousehold as NON-owner after fix ---   UPDATE 0
--- outsider reads household A members ---       count = 0
```
Ship it as `supabase/migrations/002_fix_member_policy_recursion.sql` so already-deployed databases get
it, not only fresh ones.

**Acceptance criteria**
- [ ] `select * from household_members` succeeds for a member of that household
- [ ] It returns **zero** rows for a user who is not a member (isolation preserved)
- [ ] An owner can `update households`; a non-owner gets `UPDATE 0`
- [ ] An owner can still insert/delete membership rows (the ALL policy still works)
- [ ] `getUserHouseholds` returns the caller's households and nothing else
- [ ] Delivered as a numbered migration, not an edit to `001`

**Regression risk**
Everything. `household_members` is read by the app layout, board, new-task page, settings, history and
the week-close/generate crons (via the service role, which is unaffected). After the fix, re-run the
whole isolation suite — TC-SEC-001, TC-SEC-002, TC-SEC-005 — plus every signed-in route case, because
they have never actually executed.

**Verification steps** _(how QA will close this)_
1. Re-run `qa/reports/2026-09-14/L2-rls-reachability.txt` against the patched schema: TESTs 1, 3, 5, 6,
   7 must return rows/`UPDATE n` instead of `42P17`.
2. Then unblock and execute the 23 signed-in test cases currently marked `BLOCKED` in
   `qa/test-cases/`, which is the real proof.

**Cross-boundary note** _(only when both sides are involved)_
n/a — but note that once this lands, `frontend-dev` can finally execute CASA-006, -008, -010, -011,
-012 and -015. Sequence backend first.

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_
