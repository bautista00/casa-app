# AUTH — Magic-link sign-in, redirects and the callback

Casa signs in with a Supabase magic link (`PRODUCT.md` §Capabilities). Signed-out behaviour is fully
testable in **E1** (stub `.env.local`, `npm run dev`); anything past a real sign-in needs E2 and is
reported `BLOCKED`.

Method: routes driven with `curl` (`qa/reports/2026-09-14/L3-routes-curl.txt`) and with headless
Chromium at 390×844 (`L3-browser-pass1.txt`, `L3-browser-pass2.txt`).

| ID | Title | Pri | Verdict (RUN-2026-09-14) | Bug |
|---|---|---|---|---|
| TC-AUTH-001 | `/` sends a signed-out visitor to `/login` | P0 | PASS | — |
| TC-AUTH-002 | Every app route redirects a signed-out visitor to `/login` | P0 | PASS | — |
| TC-AUTH-003 | `/login` renders in Spanish with a labelled email field | P0 | PASS | — |
| TC-AUTH-004 | A failed magic-link request shows a Spanish error toast | P1 | PASS | — |
| TC-AUTH-005 | The send button is disabled while the request is in flight | P1 | PASS | — |
| TC-AUTH-006 | An invalid or expired magic link explains itself | P1 | FAIL | CASA-014 |
| TC-AUTH-007 | A signed-in user is bounced away from `/login` | P1 | BLOCKED | — |
| TC-AUTH-008 | Sign-out returns to `/login` and clears the session | P1 | BLOCKED | — |

---

### TC-AUTH-001 — `/` sends a signed-out visitor to `/login`

| | |
|---|---|
| **Priority** | P0 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E1 |
| **Automated** | `curl -sI http://localhost:3000/` |

**Preconditions** `cp .env.local.example .env.local && npm run dev`; no session cookie.

**Steps**
1. `GET /` without following redirects.
2. Follow redirects and read the final URL.

**Expected result**
`307` to `/login`; following it lands on `/login` with `200`. `src/app/page.tsx` redirects
unconditionally and `src/proxy.ts` guards the rest.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** `HTTP 307 | redirect:http://localhost:3000/login`, final `200`.

---

### TC-AUTH-002 — Every app route redirects a signed-out visitor to `/login`

| | |
|---|---|
| **Priority** | P0 |
| **Type** | security |
| **Level** | L3 E2E |
| **Env** | E1 |

**Preconditions** As TC-AUTH-001.

**Steps**
1. `GET` each of `/onboarding`, `/casa/abc`, `/casa/abc/nueva`, `/casa/abc/historial`,
   `/casa/abc/ajustes`, and a route that does not exist (`/nope`).

**Expected result**
All `307 → /login`. No app HTML, no household data, no flash of content.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** All six redirect. `/nope` also redirects rather than 404-ing — acceptable while signed out
(the proxy matcher is deliberately broad), but re-check it whenever `src/proxy.ts:56` changes
(see CASA-024).

---

### TC-AUTH-003 — `/login` renders in Spanish with a labelled email field

| | |
|---|---|
| **Priority** | P0 |
| **Type** | a11y / i18n |
| **Level** | L3 E2E |
| **Env** | E1 |

**Steps**
1. Open `/login` at 390×844 in Chromium.
2. Read `document.title`, `<html lang>`, the visible text, and whether `#email` has a bound label.
3. Check for horizontal overflow and for any console error.

**Expected result**
`lang="es"`; copy from `src/lib/i18n/es.ts`; `<label for="email">` bound to the input; no horizontal
scroll at 390 px; no console errors.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** `lang: "es"`, `scrollW === clientW === 390`, `inputs: [{id:"email", labelled:true}]`,
console clean. The visible label text "Email" is hardcoded rather than sourced from `es.ts` — see
CASA-016; the binding itself is correct.

---

### TC-AUTH-004 — A failed magic-link request shows a Spanish error toast

| | |
|---|---|
| **Priority** | P1 |
| **Type** | negative |
| **Level** | L3 E2E |
| **Env** | E1 |

**Preconditions** `NEXT_PUBLIC_SUPABASE_URL` points at an unreachable host (the stub value does).

**Steps**
1. Open `/login` at 390×844, fill `#email` with `bauti@example.com`, submit.
2. Wait for the toast and read it.

**Expected result**
A visible Spanish error, `es.errors.generic` — "Algo salió mal. Intentá de nuevo." — not a stack trace
and not silence.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** Toast text `"Algo salió mal. Intentá de nuevo."` captured at 1.2 s. Screenshot:
`qa/reports/2026-09-14/L3-login-error-toast-390.png`.

---

### TC-AUTH-005 — The send button is disabled while the request is in flight

| | |
|---|---|
| **Priority** | P1 |
| **Type** | negative |
| **Level** | L3 E2E |
| **Env** | E1 |

**Steps**
1. Submit the login form.
2. Immediately read the submit button's `disabled` attribute.

**Expected result**
Present while loading — no double magic-link request from an impatient double tap.

**Last run** — RUN-2026-09-14 · **Verdict:** PASS · **Bug:** —
**Notes** The attribute was present during the request. Contrast with the board's complete button,
which has no such guard (CASA-012).

---

### TC-AUTH-006 — An invalid or expired magic link explains itself

| | |
|---|---|
| **Priority** | P1 |
| **Type** | negative |
| **Level** | L3 E2E |
| **Env** | E1 |

**Preconditions** Signed out.

**Steps**
1. Open `/callback` with no auth fragment — the same state the browser is in when the link has expired
   or was already used.
2. Sample the page at 1 s, 5 s and 15 s: URL, visible text, spinner present.

**Expected result**
Within a few seconds, a Spanish message and a route back to `/login`. A non-technical user must never
be stranded on a wordless screen.

**Last run** — RUN-2026-09-14 · **Verdict:** FAIL · **Bug:** CASA-014
**Notes** `{"url":"/callback","text":"","spinner":true}` at all three samples; still spinning at 15 s,
no console error, no way out. Screenshot: `qa/reports/2026-09-14/L3-callback-stuck-390.png`.

---

### TC-AUTH-007 — A signed-in user is bounced away from `/login`

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Sign in with a real magic link.
2. Navigate to `/login`.

**Expected result**
`307` to `/onboarding` (`src/proxy.ts:45-49`), which then forwards to the household board if one
exists (`src/app/(app)/onboarding/page.tsx:54-56`).

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Blocker: no `.env.local` with real Supabase credentials in this environment (E2
unavailable); a magic link cannot be issued or consumed. Owner of the blocker: project owner — provide
a test Supabase project or a seeded local Supabase stack.

---

### TC-AUTH-008 — Sign-out returns to `/login` and clears the session

| | |
|---|---|
| **Priority** | P1 |
| **Type** | functional |
| **Level** | L3 E2E |
| **Env** | E2 |

**Steps**
1. Signed in, open the user menu in the header and choose "Cerrar sesión".
2. Try to navigate back to `/casa/<id>`.

**Expected result**
Redirect to `/login`; the back navigation does not restore the board.

**Last run** — RUN-2026-09-14 · **Verdict:** BLOCKED · **Bug:** —
**Notes** Same blocker as TC-AUTH-007. Note also that `handleLogout`
(`src/components/app-shell.tsx:43-46`) does not await a refresh, so re-verify that the server
components see the cleared cookie on the next request.
