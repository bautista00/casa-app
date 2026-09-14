# Run report template

File as `qa/reports/YYYY-MM-DD-<cycle>.md`. Executive summary first — the reader may stop there,
so it must carry the verdict on its own.

```markdown
# RUN-YYYY-MM-DD — <cycle name>

**Tester:** qa-qc · **Build:** <branch @ short-sha> · **Envs:** E0 static, E1 stub
**Scope:** … · **Explicitly not tested:** …

## Verdict: GO / GO-WITH-RISKS / NO-GO
One line: why.

| | Count |
|---|---|
| Cases executed | |
| Passed / Failed / Blocked | |
| Defects: S1 / S2 / S3 / S4 | |
| Verified from last cycle | |
| Reopened | |

**Blocking release:** CASA-### , CASA-### …
**Could not test:** … (blocker + owner)

## Results by area
| Area | Cases | Pass | Fail | Blocked | Notes |
|---|---|---|---|---|---|

## Level-by-level detail
### L0 Static & build
### L1 Unit
### L2 Contract & integration
### L3 E2E / UI
### L4 Cross-cutting
### L5 Exploratory charters

## Defects filed
| ID | Sev | Pri | Owner | Title |
|---|---|---|---|---|

## Recommended fix order
1. …

## Observations (not defects)
Improvements, design smells, and coverage gaps. Kept out of the bug registry on purpose so the
dev queue stays defects-only.

## Coverage gaps for next cycle
```
