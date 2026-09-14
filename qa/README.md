# Casa — QA

Quality lives here. Application code is never modified from this directory.

## Map

| Path | What it is |
|---|---|
| `TEST-PLAN.md` | Master test plan: scope, risks, levels, environments, exit criteria. Read first. |
| `test-cases/` | The regression suites, one file per area (`TC-<AREA>-###`). |
| `reports/` | One run report per cycle (`RUN-YYYY-MM-DD`) plus its evidence folder. |
| `BUGS.md` | Bug registry **and** the QA ⇄ dev channel. Devs read this; QA writes it. |
| `templates/` | Bug report, test case, and run report formats. Use them verbatim. |

## Who does what

`qa-qc` (see `.claude/agents/qa-qc.md`) plans, executes, documents, triages, verifies and signs
off. It never fixes code — defects route to `frontend-dev` or `backend-dev` through `BUGS.md`,
and the main session dispatches them.

## Running a cycle

```
"Run a QA cycle on <scope>"        → qa-qc executes L0→L5, files bugs, writes the report
"Fix the bugs QA filed"            → frontend-dev / backend-dev work qa/BUGS.md in fix order
"Verify the fixes"                 → qa-qc re-runs the cases + regression set, closes or reopens
```

A cycle is finished when every defect it filed is `VERIFIED`/`CLOSED`/explicitly accepted, and
the run report carries a verdict against the exit criteria in `TEST-PLAN.md`.

## Ground rules

- **Blocked is not passed.** Anything QA couldn't reach is reported as blocked, with the blocker named.
- **Every bug names one owner** and carries severity + priority. No unrouted bugs.
- **Only QA closes a bug.** Devs mark `FIXED`; QA verifies.
- **Defects only in `BUGS.md`.** Ideas and improvements go in the report's Observations section,
  so the dev queue stays a list of things that are actually broken.
