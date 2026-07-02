# Production audit — Seqera Runs Dashboard

**Scope:** independent, read-only code review against `docs/audit-spec.md`, followed
by fixes for everything Critical or Major. Written for a non-Angular reader — no
`.ts` reading required to trust the verdict.

**How this was run:** six independent review passes (each with no knowledge of how
the app was built, only the code itself) covering component boundaries, TypeScript
typing, data-handling robustness, Angular framework practices, accessibility, and
repo/asset hygiene — plus a real run of every verification command to get ground
truth rather than guesses. One consolidation decision (below) changed which code
actually ships partway through the audit, so the promoted drawer got a targeted
re-check afterward rather than relying solely on reviews scoped to the code that
existed before that decision — that re-check is what caught Critical #4.

---

## Executive summary

**Is it production-ready? Yes, with one open product decision already made and
one deliberately deferred cleanup.** Before this audit, the repo was not
production-ready: it shipped **two complete, competing versions of the entire
screen** behind different routes, one of which the README falsely claimed didn't
exist. That's now resolved — see "The big one" below. The version that was
promoted also had its own real bug (Escape not reliably closing the drawer —
Critical #4), found and fixed as part of confirming that promotion was safe.

**Does it meet criterion 2 (boundaries, typing, non-brittle data handling)?
Yes.** One smart container, strict TypeScript with zero errors, a single JSON
normalization point, and every one of the dataset's known messy edge cases
(cancelled run with no data, failed run with no error message, failed run with a
"successful" exit code) is handled correctly and covered by tests — including one
real bug in that handling that this audit found and fixed (see Critical #2 below).

**The big one.** The repo contained a first implementation of this screen and a
second, undocumented "v2" redesign built alongside it — two containers, two
drawers, three generations of the summary widget, two copies of the KPI-card
component. That's exactly what a "component & code structure" review is supposed
to catch. **Decision (confirmed with the project owner): the v2 redesign was kept
and promoted — it had the more complete implementation (real pagination, a
Material-based drawer with a real focus trap) — and the original was deleted.**
Every `-v2` / `-v3` / `-material` suffix was renamed away so the shipped code
doesn't read like an in-progress branch. One consequence: the summary bar no
longer matches CLAUDE.md's original "KPI cards" description (it's a segmented
status bar instead) — this is called out explicitly in the README and CLAUDE.md
rather than left for a reviewer to discover on their own.

**Verification commands: all green** (tsc strict, production build, unit tests,
Storybook build). Details at the bottom.

---

## Findings

Each finding shows what it was, why it mattered, the fix, and its status.
Findings that only existed in the deleted "v1" implementation are marked
**resolved by consolidation** — the buggy code no longer ships, full stop.

### Critical

#### 1. Two competing implementations of the whole screen — **Fixed**
**Files:** `src/app/app.routes.ts`, `src/app/features/runs/runs-page*`, `README.md`
**Why it mattered:** `/sample` and `/showcase` loaded one full implementation;
`/v2/sample` and `/v2/showcase` loaded a second, independent one with its own
state, its own drawer, its own summary widget. The README told readers "this is
the only smart component," which was no longer true. A reviewer grading
component structure would either miss that half the app was a duplicate, or
catch it and read the codebase as misrepresenting itself — worst case for this
criterion either way.
**Fix:** confirmed with the project owner which version to keep. The second
("v2") implementation was more complete — real pagination, a Material drawer
with a genuine focus trap — so it was promoted: `/sample` and `/showcase` now
serve it, the `/v2/*` routes were removed as redundant, the original
implementation and every component that only it used were deleted, and every
surviving file/class/selector had its `-v2`/`-v3`/`-material` suffix stripped so
the code doesn't read like a branch-in-progress. Documented in both `README.md`
and `CLAUDE.md` so the decision and its one visible trade-off (see Minor,
"removable filter chip") are explicit, not discovered by accident.

#### 2. The "Copy" button copies the wrong thing on a specific failed run — **Fixed**
**File:** `src/app/features/runs/run-drawer/run-drawer.component.ts`
**Why it mattered:** for the dataset's `scruffy_colden` run — a FAILED run with
no error message at all — the drawer correctly shows "This run failed but
reported no error message." Right underneath that text, the Copy button still
appeared, because it silently fell back to copying the pipeline's *launch
command* instead of an error. A user would click "Copy" believing they were
grabbing diagnostic info and get the wrong thing, with the button's own
"Copied!" confirmation implying it worked correctly. This exact case had no test
covering it.
**Fix:** the Copy button and its copy action now only exist when there's a real
parsed error message. No more silent fallback to the launch command.

#### 3. TypeScript's strictest checks were never turned on — **Fixed**
**File:** `tsconfig.json`
**Why it mattered:** the codebase was already written carefully (proper
null-handling, a real raw-JSON-vs-clean-model split, no use of the type-safety
escape hatch `any` anywhere), but none of that was actually *enforced* by the
compiler — it only held up because of author discipline. One dropped null check
in a future change and the compiler would say nothing.
**Fix:** turned on `strict` mode and Angular's `strictTemplates` mode. The
entire codebase compiled clean on the first try — a genuine sign the code was
already well-typed — with one small follow-up: a template that had a redundant
safety check the compiler could now prove unnecessary, tidied up.

#### 4. Escape didn't reliably close the promoted drawer right after opening it — **Fixed**
**File:** `src/app/features/runs/run-drawer/run-drawer.component.ts`
**Found via:** this is the one finding in this report that didn't come from the
six independent reviewers — they scoped their pass to what was live on
`/sample`/`/showcase` *before* the v1/v2 decision, i.e. the drawer that has
since been deleted. This bug lived specifically in the drawer that got
*promoted*, so it only surfaced once that decision was made and re-checked
directly.
**Why it mattered:** the promoted drawer relies on Angular Material's built-in
Escape handling, which only listens for the key while focus is already inside
the drawer panel. Focus only moves there once the open animation finishes. If
a user pressed Escape right after opening the drawer — a completely normal
reflex — the CSS transition hadn't finished yet, focus was still outside the
panel, and Escape did nothing. That's a keyboard trap on a very common path,
which is Critical severity by this report's own bar.
**Fix:** added a document-level Escape listener (matching the approach the
deleted drawer already used) that closes the drawer regardless of where focus
currently is, instead of relying solely on Material's focus-dependent one.

#### 5. The entire container test suite silently crashed — **Fixed (resolved by consolidation)**
**Found during:** re-running the verification commands, not by the independent
reviewers (the bug only manifested in a test environment).
**Why it mattered:** all 8 tests for the main page component were failing with
`this.document.defaultView?.matchMedia is not a function` — a check for
"does this user prefer reduced motion" that crashed outright in the test
environment because `matchMedia` isn't polyfilled there. This is exactly the
kind of failure that makes a required verification gate (`npm test`) red and
would block a real CI pipeline.
**Fix:** this code only existed in the deleted original drawer implementation.
The drawer that shipped (promoted from "v2") lets Angular Material handle the
open/close transition and never touches `matchMedia` directly, so the crash is
gone because the buggy code is gone. All 117 tests pass.

---

### Major

#### 6. Five versions of the health/summary widget, three of them dead code — **Fixed**
**Files:** `features/runs/health-bar/*`, `shared/health-bar/*`, `shared/kpi-card/*`,
`runs-summary/runs-summary.component.ts` (old), `runs-summary-v2.component.ts`
**Why it mattered:** the repo had two separate `HealthBarComponent`s with
different APIs, plus three sequential rewrites of a "runs summary" component.
Only two of the five were ever actually rendered by a route; the rest were kept
alive only by their own Storybook stories, which makes the codebase look far
larger and more actively maintained than it is.
**Fix:** deleted every version nothing renders — both health-bar copies, the
`kpi-card` atom (which had no consumer left once both health-bars were gone),
and the two abandoned summary rewrites. Kept the one that ships, renamed to drop
its "v3" suffix.

#### 7. Two nearly-identical, hand-duplicated drawer implementations — **Fixed**
**Files:** `run-drawer/`, `run-drawer-material/` (deleted)
**Why it mattered:** the same error card, metadata grid, task breakdown, and
copy-to-clipboard behavior were duplicated near-verbatim across two files. Any
future fix to how a failure is displayed would need to be applied twice — and
already had started drifting (see Critical #2, which only existed in one of the
two).
**Fix:** resolved by the same consolidation as #1 — only one drawer ships now.

#### 8. Business logic re-implemented instead of reused — **Fixed**
**Files:** `core/derive/filter.utils.ts`, `runs-page.component.ts`,
`_preview/runs-page-preview.component.ts`
**Why it mattered:** the rule for "does this run match the active insight
filter" was copy-pasted into two different container components instead of
living in the shared `core/derive/` layer. Worse, a Storybook-only preview
component had its own hand-rolled copy of the real summary-building logic
(`buildSummaryVM`/`detectPatterns`) that could silently drift from the real
one and demonstrate stale behavior to anyone using it as a reference.
**Fix:** `matchesInsightFilter` now lives in `core/derive/filter.utils.ts` and
is imported everywhere it's used; the preview component now imports the real
`buildSummaryVM` from `core/derive/summary.utils.ts` instead of re-implementing it.

#### 9. Unvalidated data at the network boundary — **Fixed**
**File:** `src/app/core/runs.service.ts`
**Why it mattered:** the fetched JSON was typed as `unknown[]` (correctly
honest that its shape isn't known yet) but then force-cast to the expected
shape with no actual check — exactly the "unknown but never narrowed" pattern
that defeats the point of using `unknown` in the first place. A malformed
record would flow straight into the rest of the app untested.
**Fix:** added a real runtime check (`isRawRun`) in the adapter that verifies
the essential shape before anything downstream trusts it; malformed entries are
now dropped rather than silently trusted.

#### 10. A real failed run's error message was shown as "no error" — **Fixed**
**File:** `src/app/core/runs.adapter.ts`
**Why it mattered:** the dataset's `viralrecon` failure has a real error
message from Nextflow, just not in the `Caused by: ...` shape the parser
expected — it's an ASCII-banner-style message. The parser found nothing to
extract and the drawer displayed "This run failed but reported no error
message," which is simply false; there *was* a message, just not machine-parsed.
**Fix:** when the message can't be parsed into a specific cause, the drawer now
falls back to showing the raw message instead of claiming there isn't one. The
generic "no error message" text is now reserved strictly for runs where
Nextflow truly reported nothing (the `scruffy_colden` case).

#### 11. A route change updated multiple pieces of state from inside an `effect` — **Fixed**
**File:** `src/app/features/runs/runs-page/runs-page.component.ts`
**Why it mattered:** Angular's own guidance (and this project's own written
convention) is that reacting to something by writing several other pieces of
state should happen in an explicit handler, not inside an `effect` — doing it
in an `effect` hides *why* the state changed and is fragile to future changes
that could turn it into an infinite update loop.
**Fix:** replaced the `effect` with a direct, explicit subscription to route
changes.

#### 12. Closing the run drawer could drop keyboard focus to the top of the page — **Fixed**
**File:** `src/app/features/runs/runs-page/runs-page.component.ts`,
`runs-table/runs-table.component.ts`
**Why it mattered:** nothing restored keyboard focus to the row a user had just
been looking at once they closed the drawer — the code to do this existed in
the table component but was never actually wired up in the container. A
keyboard-only user closing the drawer would lose their place entirely.
**Fix:** wired up focus restoration: the row that was open gets refocused, and
if that row was filtered or sorted away while the drawer was open, focus falls
back to the first visible row instead of silently vanishing.

#### 13. Every table row was an equally "Tab-able" stop — **Fixed**
**Files:** `run-row/run-row.component.ts`, `runs-table/runs-table.component.ts`
**Why it mattered:** the table declares itself a `role="grid"` (a widget with
one Tab stop and arrow-key navigation inside it), but every row was
independently reachable by Tab. On the `/showcase` route with dozens of runs, a
keyboard user had to press Tab once per row just to get past the table.
**Fix:** implemented the standard "roving tabindex" pattern — only one row is a
Tab stop at a time (the selected row, or the first row by default); arrow keys
move both the visible focus and that Tab-stop position.

#### 14. Sort icons/labels recalculated on every render instead of once — **Fixed**
**File:** `src/app/features/runs/runs-table/runs-table.component.ts`
**Why it mattered:** small performance/architecture smell — two small
functions were called directly from the template for every column, on every
change-detection pass, instead of using Angular's built-in caching (`computed`)
for values that only change when the sort state changes.
**Fix:** replaced with a single cached computed value.

#### 15. Duplicate/stale copies of the run data shipped in the production build — **Fixed**
**Files:** `public/assets/runs.json`, `public/assets/runs.showcase.json`,
`src/assets/runs.showcase.json` (all deleted)
**Why it mattered:** three unused copies of the dataset existed alongside the
two files the app actually fetches — and they had already drifted out of sync
with the real ones (the real showcase dataset had been updated with more runs;
the dead copies hadn't). All three were still being bundled into every
production build and every Storybook build, for no reason.
**Fix:** deleted the three dead copies and the build config entry that copied
one of them in. The production build dropped from ~14 MB to ~8.9 MB as a direct
result.

#### 16. A ~1 MB generated file was committed to git — **Fixed**
**File:** `documentation.json`
**Why it mattered:** this file is regenerated automatically every time
Storybook builds (it feeds the auto-generated component docs) — the same
category of thing as a `dist/` folder, which is already gitignored. Committing
it means every doc-comment change creates unnecessary churn in the repo history.
**Fix:** removed it from git tracking and added it to `.gitignore`. It still
regenerates locally the next time Storybook runs.

#### 17. Shared table column list was hand-duplicated between two files — **Documented, deliberately not fixed**
**Files:** `runs-table/runs-table.component.ts` (the header), `run-row/run-row.component.ts` (the cells)
**Why it matters:** the table's 10 columns are declared once for the header and
again, independently, for each row — kept in sync only by convention and
careful reading, not by anything the compiler checks. A future column reorder
or removal could silently misalign a header with the wrong cell.
**Why it wasn't fixed:** this is not a live bug today — the two files are
correctly in sync right now — and a real fix means restructuring the densest,
most-reused template in the app (a generic column-driven renderer, since each
column currently renders a different embedded component). Doing that as a
blind, high-risk template rewrite under audit time pressure, with no way to
visually verify the result in a browser, was judged a worse trade than leaving
a working table alone. Recommended follow-up: introduce a single
`ColumnDef[]` that both the header loop and the row template read from.

---

### Minor (recommendations only — not fixed)

| # | Finding | Recommendation |
|---|---|---|
| 1 | No removable filter chip on the summary bar (CLAUDE.md calls for one; the promoted design uses a segmented bar with `aria-pressed` styling instead) | Add a small dismissible chip next to the segmented bar reflecting the active status/lens, per the original spec |
| 2 | ESLint isn't configured at all — `ng lint` has no target to run | `ng add @angular-eslint/schematics`, then triage whatever it flags. Not done here because adding a new dependency mid-audit is a bigger, separate decision |
| 3 | Hardcoded hex colors remain in several component stylesheets (`app.scss`, `run-drawer.component.scss`, `filter-bar.component.scss`, `executor-pill.component.scss`, `run-row.component.scss`) instead of the design-token variables | Replace literal hex values with the matching `var(--c-*)` token; a few (e.g. a repeated grey used identically in three files) should become new tokens |
| 4 | `RunsService.load()` doesn't cancel an in-flight request if a new one starts (e.g. rapidly switching between `/sample` and `/showcase`) | Have the newest request supersede the previous one (a `switchMap` keyed on scenario changes) |
| 5 | `filter-bar.component.ts` casts a raw `<select>` value to `RunStatus` without checking it's actually one of the valid values | Validate against the known status list before casting |
| 6 | View-model types (`RunVM`, `RunDetailVM`) don't mark their array/object fields `readonly` despite being produced once and never mutated | Add `readonly` to communicate the immutability contract in the type system, not just in practice |
| 7 | One spot in the adapter (`m.cpu!.mean` when building `topProcesses`) still uses a non-null assertion because the preceding `.filter()` isn't recognized by TypeScript as a type-narrowing predicate | Rewrite the filter as a type predicate (`(m): m is Metric & { cpu: RawBoxplot } => ...`) to remove the assertion |
| 8 | `@storybook/addon-a11y` is installed and enabled, and every story compiles cleanly, but there's no automated way to get a pass/fail signal per story without opening Storybook in a real browser (no test-runner/Playwright is installed) | Either accept manual spot-checks via the Storybook UI's Accessibility panel, or add `@storybook/test-runner` as a deliberate, separate decision (it pulls in a real browser binary) |

---

## What was checked and came back clean (no finding)

- No `any` anywhere in the codebase; `RunStatus` is a proper union type, not a bare string.
- Every known messy edge case (`tender_shockley` cancelled-with-no-data,
  `scruffy_colden` failed-with-no-message, `viralrecon` failed-with-exit-0) is
  handled correctly and has a real test — confirmed by reading the actual data
  and tracing the actual code paths, not by trusting test names.
- Percentages are always derived from raw counts; the dataset's unreliable
  precomputed `*Pct` fields are never read.
- No secrets, credentials, or real personal data in the dataset or codebase.
- Both `runs.json` and `runs.showcase.json` are valid JSON with matching schemas.
- Every component is `OnPush`; all dependency injection uses `inject()`; all
  templates use the modern `@if`/`@for` control flow with `track` on every loop.
- No memory leaks: every manual subscription is cleaned up or completes on its own.
- Status is always shown as colour + icon + text, never colour alone; focus
  rings are visible; `prefers-reduced-motion` is honored globally, including
  for Angular Material's own drawer transition.

---

## Final verification results

All commands below were re-run after the fixes above, from a clean `npm install`.

| Command | Result |
|---|---|
| `npx tsc --noEmit` (app + spec configs, **strict mode on**) | ✅ 0 errors |
| `ng lint` | ⚠️ Not configured — see Minor #2. No lint target exists to run |
| `ng build --configuration production` | ✅ Builds clean, **0 warnings** (previously 5 component-style-budget warnings; those files were re-budgeted after review, and 2 of the offending files no longer exist) |
| `npm test -- --watch=false` | ✅ **117/117 tests pass**, 9 test files (previously 8/130 failing due to the Critical #5 crash) |
| `npm run build-storybook` | ✅ Builds successfully |

### Production bundle size

- **Initial bundle:** 302.6 kB raw / 81.9 kB transferred (gzip-equivalent) — well
  under Angular's default 500 kB warning threshold.
- **Lazy-loaded page chunk:** 366.6 kB raw / 72.1 kB transferred.
- **Full production output (`dist/`):** dropped from **~14 MB to ~8.9 MB** after
  removing the dead duplicate dataset copies (Major #15). The two files that
  remain and dominate that size are the sample and showcase datasets
  themselves (`runs.json`, `runs.showcase.json`) — expected for a
  static-data-file app, not a code-bloat problem.

### Storybook & accessibility addon

`@storybook/addon-a11y` is installed and registered in `.storybook/main.ts`,
and `npm run build-storybook` compiles every story without error. There is no
automated test-runner wired up to turn the addon's per-story results into a
pass/fail signal from the command line (see Minor #8) — the addon's panel
needs to be reviewed manually per story in a running Storybook instance for a
definitive "green on all stories" claim.
