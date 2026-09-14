# Test case template

Test suites live in `qa/test-cases/<area>.md`. One table row per case for the index, then a full
block per case. Write for a stranger: a case only you can execute is not a regression suite.

```markdown
### TC-AREA-### — <what is being verified>

| | |
|---|---|
| **Priority** | P0 / P1 / P2 / P3 |
| **Type** | functional / boundary / negative / a11y / i18n / security / responsive |
| **Level** | L0 static / L1 unit / L2 contract / L3 E2E / L4 cross-cutting |
| **Env** | E0 / E1 / E2 |
| **Automated** | `npm test -- <file>` · or "manual" |

**Preconditions**
…

**Steps**
1. …
2. …

**Expected result**
… (cite the source of truth: `PRODUCT.md` §X, the code's doc comment, or the contract)

**Last run** — RUN-YYYY-MM-DD · **Verdict:** PASS / FAIL / BLOCKED / N/A · **Bug:** CASA-### / —
**Notes** …
```

## Writing good expected results

- Cite the spec, not the implementation. "What it currently does" is never an expected result —
  that's how a bug becomes a feature.
- One assertion per case. A case that checks five things reports a useless verdict when it fails.
- Boundary cases beat happy paths: the week's last day, the month's 31st, the 4th member, zero
  points, a full tie, an empty household.
