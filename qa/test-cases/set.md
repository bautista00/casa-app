# SET — Household settings (`/casa/[id]/ajustes`)

House name, week-end day, weekly prize, dreaded task, members, invite code and the member's own phone
number.

| ID | Title | Pri | Verdict (RUN-2026-09-14) | Bug |
|---|---|---|---|---|
| TC-SET-001 | An owner's settings change persists | P1 | BLOCKED | — |
| TC-SET-002 | A non-owner is not told a change was saved when it was not | P1 | FAIL | CASA-010 |
| TC-SET-003 | The invite code is shown and can be copied | P2 | BLOCKED | — |
| TC-SET-004 | A phone number can be removed | P2 | FAIL | CASA-023 |
| TC-SET-005 | The dreaded task can be set and cleared | P1 | BLOCKED | — |
| TC-SET-006 | The timezone can be configured | P2 | FAIL | — (see Notes) |

---

### TC-SET-001 — An owner's settings change persists

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Preconditions** Signed in as the household owner.

**Steps**
1. `/casa/<id>/ajustes`: change the house name, the week-end day and the weekly prize.
2. "Guardar cambios", then reload.
3. Go back to the board.

**Expected result**
All three persist; the board's week window and days-left badge reflect the new end-day immediately.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker: CASA-001 (the page's own `getHouseholdMembers` call throws) and no E2 credentials.
The database half **was** verified in the local harness: as the owner, the update affects 1 row.

---

### TC-SET-002 — A non-owner is not told a change was saved when it was not

| | |
|---|---|
| **Priority** | P1 |
| **Type** | negative |
| **Level** | L2 contract + L3 E2E |
| **Env** | E0 (local Postgres harness, executed) + E2 (blocked) |

**Preconditions** A second member who is not the owner.

**Steps**
1. As the member, change the weekly prize and save.
2. Read the toast.
3. Reload and re-read the field.
4. In the database, attempt the same update as a non-owner and count affected rows.

**Expected result**
Either the owner-only fields are not editable for a member, or the failure is reported —
`es.errors.notAuthorized` ("No tenés permiso para esta acción") exists for exactly this and is
currently used nowhere.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-010
**Notes** Executed at the database layer: owner `UPDATE 1`, non-owner `UPDATE 0` **with no error**.
PostgREST reports no error for zero affected rows, and `updateHousehold` only throws on `error`, so
the page shows "¡Guardado!" and the change silently vanishes on reload. The UI half is blocked;
the silent-success mechanism is proven.

---

### TC-SET-003 — The invite code is shown and can be copied

| | |
|---|---|
| **Priority** | P2 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Open Ajustes, read the code, tap the copy button.
2. Paste elsewhere.

**Expected result**
A 6-character code from the unambiguous alphabet (`households.ts:6` — no O/0/I/1), the toast
`es.settings.codeCopied`, and the clipboard holding that exact code.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-SET-001. Note for the next run: `copyCode`
(`ajustes/page.tsx:103-109`) awaits `navigator.clipboard.writeText` with no `try`/`catch`, so a
denied clipboard permission or a non-secure context produces an unhandled rejection and no toast.
Recorded as an Observation; confirm the behaviour before deciding whether to file it.

---

### TC-SET-004 — A phone number can be removed

| | |
|---|---|
| **Priority** | P2 |
| **Type** | negative |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Save a phone number.
2. Clear the field completely and save again.
3. Reload and read the field; check `profiles.phone_e164`.

**Expected result**
The field is empty and the column is `NULL`. `updatePhone`'s signature is `phone: string | null`
precisely so this works, and `PRODUCT.md` §Product Principles 4 makes opting out of notifications a
privacy requirement, not a nicety.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-023
**Notes** `if (phone.trim())` at `ajustes/page.tsx:93` skips the call for an empty string, so the old
number survives and the toast still says "¡Guardado!". Verdict from code review; live execution blocked
by CASA-001.

---

### TC-SET-005 — The dreaded task can be set and cleared

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. With at least one recurring template, select it as "La tarea odiada" and save.
2. Close a week with a clear last place.
3. Return to Ajustes, select "Ninguna", save, close another week.

**Expected result**
`households.dreaded_template_id` is set, and the week-close cron reassigns that template's upcoming
instances to the last-place member (TC-CRON-005). With "Ninguna", nothing is reassigned.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-SET-001. With no templates the section shows the hardcoded
"Creá tareas recurrentes primero" (CASA-016). Note the board never shows *which* task is the dreaded
one, so the family can only see it in Ajustes — Observation.

---

### TC-SET-006 — The timezone can be configured

| | |
|---|---|
| **Priority** | P2 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Open Ajustes and look for a timezone control.
2. Open the create-household step in onboarding and look for one there.

**Expected result**
The household can set its timezone — `PRODUCT.md` §Operating Context: "Households define their own
weekly cycle (configurable end-day **and timezone**)".

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** — (not filed; see Notes)
**Notes** No timezone control exists anywhere. `Household.timezone` is stored, defaulted to
`America/Argentina/Buenos_Aires` in `createHousehold` and in the schema, honoured by the domain layer,
included in `updateHousehold`'s allowed updates, and `es.onboarding.timezone` / `es.settings.timezone`
("Zona horaria") are both defined and unused — everything but the input. Recorded as an
**unbuilt feature**, not a defect: QA does not file screens that were never written. It matters more
than it looks, because the whole family shares one timezone today and the week boundary depends on it.
Listed in the run report's Observations and coverage gaps.
