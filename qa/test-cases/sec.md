# SEC — Security, privacy and data isolation

Casa holds two households' family data and one service-role key. `PRODUCT.md` §Product Principles 4
makes privacy non-negotiable, and RLS — not route handlers — is the authorization boundary.

**How these were run.** There is no live Supabase project in this cycle (E2 unavailable), so the
schema was applied **verbatim** to a local PostgreSQL 16.13 instance with thin Supabase stubs
(`auth.users`, `auth.uid()`, an `authenticated` role). Harness and seed are checked in at
`qa/reports/2026-09-14/L2-pg-harness-setup.sql` and `L2-pg-seed.sql`; re-running them reproduces every
verdict below. The seed mirrors `PRODUCT.md` §Users: Bauti + Hernán in one household, Mamá in another.

| ID | Title | Pri | Verdict (RUN-2026-09-14) | Bug |
|---|---|---|---|---|
| TC-SEC-001 | A member can read their own household's member list | P0 | FAIL | CASA-001 |
| TC-SEC-002 | A user cannot read a profile from another household | P0 | FAIL | CASA-005 |
| TC-SEC-003 | Cron routes reject every request without the exact secret | P0 | FAIL | CASA-003 |
| TC-SEC-004 | `join_household` can only act for the calling user | P1 | FAIL | CASA-009 |
| TC-SEC-005 | A non-member cannot read another household's tasks | P0 | PASS | — |
| TC-SEC-006 | A non-member cannot read another household itself | P0 | PASS | — |
| TC-SEC-007 | Members cannot write `weeks` or `week_scores` | P1 | PASS | — |
| TC-SEC-008 | The service-role key never reaches the client bundle | P0 | PASS | — |
| TC-SEC-009 | No phone number or email appears in logs or responses | P1 | PASS | — |
| TC-SEC-010 | The migration applies cleanly to a fresh PostgreSQL 16 | P1 | PASS | — |

---

### TC-SEC-001 — A member can read their own household's member list

| | |
|---|---|
| **Priority** | P0 |
| **Type** | security |
| **Level** | L2 contract |
| **Env** | E0 (local Postgres harness) / E2 |
| **Automated** | `psql -f qa/reports/2026-09-14/L2-pg-harness-setup.sql` then the RLS script |

**Preconditions**
Migration applied; Bauti (owner) and Hernán (member) in household A; session identity = Bauti.

**Steps**
1. `set role authenticated; set qa.uid = '<Bauti>';`
2. `select household_id, profile_id, role from household_members;`
3. Repeat the joined form used by `getUserHouseholds`.

**Expected result**
Two rows (Bauti, Hernán). `getHouseholdMembers` and `getUserHouseholds` are called on every signed-in
route, so this must succeed or the app cannot render.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-001
**Notes** `ERROR: infinite recursion detected in policy for relation "household_members"`. This is the
single blocker for 23 other cases in this suite set.

---

### TC-SEC-002 — A user cannot read a profile from another household

| | |
|---|---|
| **Priority** | P0 |
| **Type** | security |
| **Level** | L2 contract |
| **Env** | E0 (local Postgres harness) / E2 |

**Preconditions** Bauti in household A; Mamá in household B, with a phone number stored.

**Steps**
1. `set role authenticated; set qa.uid = '<Bauti>';`
2. `select display_name, phone_e164 from profiles where display_name = 'Mama';`

**Expected result**
Zero rows. A household's data — names and phone numbers included — stays inside that household
(`PRODUCT.md` §Product Principles 4; `qa/TEST-PLAN.md` §4 R3).

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-005
**Notes** Returned `Mama | +5491177778888`. The policy is `using (true)`, so any signed-up stranger
can enumerate every Casa user's name and mobile number.

---

### TC-SEC-003 — Cron routes reject every request without the exact secret

| | |
|---|---|
| **Priority** | P0 |
| **Type** | security |
| **Level** | L3 E2E |
| **Env** | E1 |
| **Automated** | `qa/reports/2026-09-14/L4-cron-secret-bypass.txt` (curl matrix) |

**Preconditions** Dev server running.

**Steps**
1. With `CRON_SECRET` **set**: send no header / a wrong value / the correct value to each of
   `/api/cron/week-close`, `/generate`, `/reminders`.
2. With `CRON_SECRET` **unset**: send `Authorization: Bearer undefined` to each route.

**Expected result**
Step 1: 401, 401, 200. Step 2: 401 on all three — a missing secret must fail closed, because past the
check the handler holds a service-role client that bypasses RLS entirely.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-003
**Notes** Step 1 passes. Step 2 returns **200** on all three routes: the template literal interpolates
the string `"undefined"`. Reproduced twice.

---

### TC-SEC-004 — `join_household` can only act for the calling user

| | |
|---|---|
| **Priority** | P1 |
| **Type** | security |
| **Level** | L2 contract |
| **Env** | E0 (local Postgres harness) / E2 |

**Preconditions** Household A with code `AAAAAA`; Mamá is a member of household B only; Papá is in no
household.

**Steps**
1. `set role authenticated; set qa.uid = '<Mamá>';`
2. `select join_household('AAAAAA', '<Papá>');`
3. `select * from household_members where household_id = '<A>';`

**Expected result**
The call is refused — a `SECURITY DEFINER` function must not accept a caller-supplied identity — and
Papá is not added.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-009
**Notes** Papá was added to a household by someone who is not in it. The return value also hands the
caller the household's full row including `join_code`.

---

### TC-SEC-005 — A non-member cannot read another household's tasks

| | |
|---|---|
| **Priority** | P0 |
| **Type** | security |
| **Level** | L2 contract |
| **Env** | E0 (local Postgres harness) / E2 |

**Steps**
1. `set qa.uid = '<Mamá, household B>';`
2. `select count(*) from tasks where household_id = '<household A>';`

**Expected result**
0.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** `is_member()` is `SECURITY DEFINER`, so this policy does not recurse. The isolation model is
correct here — which is what makes CASA-005 stand out as the exception.

---

### TC-SEC-006 — A non-member cannot read another household itself

| | |
|---|---|
| **Priority** | P0 |
| **Type** | security |
| **Level** | L2 contract |
| **Env** | E0 (local Postgres harness) / E2 |

**Steps**
1. `set qa.uid = '<Mamá>'; select count(*) from households;`

**Expected result**
1 — only her own household; the join code of household A is never visible.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** But see CASA-009: the `join_household` RPC leaks a household row around this policy.

---

### TC-SEC-007 — Members cannot write `weeks` or `week_scores`

| | |
|---|---|
| **Priority** | P1 |
| **Type** | security |
| **Level** | L2 contract |
| **Env** | E0 (local Postgres harness) / E2 |

**Steps**
1. `set qa.uid = '<Bauti, owner>';`
2. `insert into weeks (household_id, week_start, week_end) values (…);`

**Expected result**
Rejected. Closed weeks are frozen history written only by the week-close cron under the service role —
a member must not be able to rewrite who won.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** `ERROR: new row violates row-level security policy for table "weeks"`. Both tables carry a
SELECT policy only, which is the correct shape.

---

### TC-SEC-008 — The service-role key never reaches the client bundle

| | |
|---|---|
| **Priority** | P0 |
| **Type** | security |
| **Level** | L0 static |
| **Env** | E0 |
| **Automated** | `grep -rn "SUPABASE_SERVICE_ROLE_KEY" src/` + `grep -rl "use client"` cross-check |

**Steps**
1. List every `process.env.*` read in `src/**`.
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` appears only in `src/lib/supabase/server.ts`.
3. Confirm no file carrying `'use client'` imports from `@/lib/supabase/server`.
4. Confirm `createServiceClient` is imported only by `src/app/api/cron/*`.
5. Confirm no secret is exposed through a `NEXT_PUBLIC_*` name.

**Expected result**
The key is server-only and reachable from route handlers only.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Three `createServiceClient` call sites, all under `src/app/api/cron/`. No client component
imports the server module. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are
public, which is correct for Supabase.

---

### TC-SEC-009 — No phone number or email appears in logs or responses

| | |
|---|---|
| **Priority** | P1 |
| **Type** | security |
| **Level** | L2 contract |
| **Env** | E0 / E1 |

**Steps**
1. Grep the cron routes for what they push into `results` and what they log.
2. Call each route with a valid secret and read the JSON body.

**Expected result**
No `phone_e164`, no email address, no auth token in any response body or server log.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** The reminders route deliberately keeps the phone out of `results`
(`src/app/api/cron/reminders/route.ts:70` pushes household name, display name and a count). Display
names **are** returned — harmless to Vercel's scheduler, but it becomes a real leak while CASA-003 is
open, since an anonymous caller gets the same body. Re-verify after CASA-003.

---

### TC-SEC-010 — The migration applies cleanly to a fresh PostgreSQL 16

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L2 contract |
| **Env** | E0 (local Postgres harness) |

**Steps**
1. `initdb` a fresh PostgreSQL 16 cluster.
2. Apply the auth stubs, then `supabase/migrations/001_initial_schema.sql` with `ON_ERROR_STOP=1`.

**Expected result**
Every statement succeeds; the `handle_new_user` trigger creates a profile row on `auth.users` insert.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Applies with no errors on 16.13, and the signup trigger fired correctly for all four seeded
users. FK constraint names generated by Postgres match the aliases the data layer uses —
`tasks_assignee_id_fkey` in particular (see TC-TASK-005).
