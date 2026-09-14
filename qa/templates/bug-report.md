# Bug report template

Copy this block verbatim into `qa/BUGS.md` (newest first) and fill every field.
A field you can't fill is itself information — write "not localised" or "n/a", never leave it blank.

```markdown
### CASA-### — <one-line symptom, in the user's terms>

| | |
|---|---|
| **Severity** | S# (critical/major/minor/trivial) |
| **Priority** | P# |
| **Area** | AUTH / ONB / BOARD / TASK / LEAD / HIST / SET / CRON / DOM / I18N / A11Y / SEC / PERF |
| **Owner** | frontend-dev / backend-dev |
| **Status** | OPEN |
| **Found in** | RUN-YYYY-MM-DD · env E0/E1/E2 · viewport 390×844 |
| **Test case** | TC-AREA-### (or "exploratory charter #N") |

**Summary**
One paragraph: what breaks, for whom, and why it matters to a family using Casa.

**Steps to reproduce** (from a cold start)
1. …
2. …
3. …

Reproduced: 2/2 attempts.

**Expected**
… — per `PRODUCT.md` §X / the doc comment at `path/file.ts:NN` / test `TC-…`.

**Actual**
…

**Evidence**
- Screenshot: `qa/reports/YYYY-MM-DD/CASA-###-slug.png`
- Console / stack / failing assertion:
  ```
  …
  ```

**Root cause**
`path/to/file.tsx:123`
```tsx
// the offending snippet, quoted
```
Why this produces the behaviour, in one or two sentences.

**Suggested fix** _(suggestion — the owner decides)_
```diff
- broken line
+ fixed line
```
Smallest change that resolves it. Note any alternative the dev might prefer.

**Acceptance criteria**
- [ ] …
- [ ] …

**Regression risk**
What else reads this code / shares this component, and must be re-tested.

**Verification steps** _(how QA will close this)_
1. …

**Cross-boundary note** _(only when both sides are involved)_
What the other owner must provide; coordinate via `CONTRACT.md`.

**Dev notes** _(filled by the dev)_
**Fix applied** _(filled by the dev: files + one-line description)_
```
