# ONB — Onboarding (`/onboarding`)

Profile setup, then create-a-house or join-a-house. This is the first thing a new family member ever
sees, so a dead end here costs the whole install.

| ID | Title | Pri | Verdict (RUN-2026-09-14) | Bug |
|---|---|---|---|---|
| TC-ONB-001 | `/onboarding` is not reachable signed out | P0 | PASS | — |
| TC-ONB-002 | A new user sets a name and emoji and reaches the choose step | P0 | BLOCKED | — |
| TC-ONB-003 | Joining with a valid code lands on that household's board | P0 | BLOCKED | — |
| TC-ONB-004 | An invalid code shows the Spanish error and stays on the step | P1 | BLOCKED | — |
| TC-ONB-005 | Joining a household twice is refused with the right message | P1 | BLOCKED | — |
| TC-ONB-006 | Creating a house makes the creator its owner | P0 | BLOCKED | — |
| TC-ONB-007 | A returning member with a household skips straight to the board | P1 | BLOCKED | — |

---

### TC-ONB-001 — `/onboarding` is not reachable signed out

| | |
|---|---|
| **Priority** | P0 |
| **Type** | security |
| **Level** | L3 E2E |
| **Env** | E1 |

**Steps**
1. Signed out, `GET /onboarding`.

**Expected result**
`307` to `/login` from `src/proxy.ts`, before any component runs.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** `HTTP 307 | redirect:http://localhost:3000/login`.

---

### TC-ONB-002 — A new user sets a name and emoji and reaches the choose step

| | |
|---|---|
| **Priority** | P0 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Preconditions** A freshly signed-up user whose profile is still the trigger default `'Nuevo'`.

**Steps**
1. Land on `/onboarding` after the magic link.
2. Type a name, pick an emoji, tap "Continuar".

**Expected result**
`profiles.display_name` and `emoji` are saved and the "Crear una casa / Unirse a una casa" step
appears. The `'Nuevo'` sentinel written by `handle_new_user` is what routes the user here
(`src/app/(app)/layout.tsx:23` and `onboarding/page.tsx:51`).

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker: no E2 credentials, so no magic link can be consumed. Owner of the blocker: project
owner. Note that this step calls `getUserHouseholds` on mount, which CASA-001 breaks — verify it right
after that fix.

---

### TC-ONB-003 — Joining with a valid code lands on that household's board

| | |
|---|---|
| **Priority** | P0 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. From the choose step, tap "Unirse a una casa".
2. Type a valid 6-character code (lower case, to check the normalisation) and tap "Unirse".

**Expected result**
The user becomes a `member` of that household and is redirected to `/casa/<id>`. The code is
upper-cased on input (`onboarding/page.tsx:296`) and again in the RPC.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-ONB-002. The database half was exercised in the local harness: a valid code
does insert the membership row. It also revealed CASA-009 — the RPC will happily do this for someone
else's account.

---

### TC-ONB-004 — An invalid code shows the Spanish error and stays on the step

| | |
|---|---|
| **Priority** | P1 |
| **Type** | negative |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Enter `ZZZZZZ` and tap "Unirse".

**Expected result**
Toast `es.errors.invalidCode` ("Código de invitación inválido"); the user stays on the join step with
the code still editable.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-ONB-002. The mapping is `msg.includes('Already') ? alreadyMember :
invalidCode` (`onboarding/page.tsx:106-113`), so *any* non-"Already" failure — including a network
error — reports "invalid code". Worth tightening; recorded as an Observation.

---

### TC-ONB-005 — Joining a household twice is refused with the right message

| | |
|---|---|
| **Priority** | P1 |
| **Type** | negative |
| **Level** | L2 contract (executed) + L3 E2E (blocked) |
| **Env** | E0 (local Postgres harness) + E2 |

**Steps**
1. Join a household.
2. Call `join_household` with the same code and the same user again.

**Expected result**
Refused; exactly one membership row; the UI shows `es.errors.alreadyMember` ("Ya sos miembro de esta
casa").

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** The database guard **was** executed and works: the second call raises `Already a member` and
no duplicate row is created (the `(household_id, profile_id)` primary key is a second line of defence).
The UI mapping is blocked. Note the exception text is English and the UI pattern-matches on it — see
TC-I18N-006.

---

### TC-ONB-006 — Creating a house makes the creator its owner

| | |
|---|---|
| **Priority** | P0 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. "Crear una casa": name it, pick a week-end day, tap "Crear".
2. Check `household_members.role` for the creator and the landing route.

**Expected result**
`role = 'owner'` and a redirect to `/casa/<id>`.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-ONB-002. Two things to test hard on the next run: `createHousehold` does two
inserts without a transaction (`households.ts:21-43`), so if the member insert fails the user ends up
with an orphan household they cannot see (the SELECT policy needs the membership row) and no way back
— worth a deliberate failure-injection case. And the week-end day chosen here is the one CASA-004
misinterprets.

---

### TC-ONB-007 — A returning member with a household skips straight to the board

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. As a user who already has a profile and a household, navigate to `/onboarding`.

**Expected result**
Immediate redirect to `/casa/<first household>` (`onboarding/page.tsx:53-57`).

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker as TC-ONB-002. This is also the "Crear una casa" entry point from the header
switcher (`app-shell.tsx:109-115`), which sends the user to `/onboarding` — where this redirect will
bounce them straight back to the board, so a member with a household **cannot reach the create-house
screen at all**. Recorded as an Observation; confirm in the browser before filing.
