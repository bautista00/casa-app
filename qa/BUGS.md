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
| _(no defects filed yet — first cycle pending)_ | | | | | | |

## Fix order

_Set by QA at the end of each cycle. Work top-down._

1. _(pending first cycle)_

---

## Defects

<!-- newest first; full entries below -->
