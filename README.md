# Seqera Runs Dashboard

Pipeline run status dashboard built for the Seqera Design Engineer take-home.
Angular 22 · Angular Material · SCSS · Signals · Standalone components.

---

## Quick start

```bash
npm install
npm start          # http://localhost:4200  →  /showcase (default)
npm test           # 81 unit tests (Vitest)
npm run storybook  # component library
npm run build      # production build
```

Two routes, one screen:

| Route | Dataset | Purpose |
|---|---|---|
| `/showcase` | 20-run extended dataset | Default landing; proves the design scales |
| `/sample` | `runs.json` verbatim (7 runs) | Proves we respect the real data, including its messy edge cases |

---

## Information design

### What the user needs at a glance

The health bar answers 3 questions without scrolling:

1. **Is anything broken right now?** — the criticality headline ("3 runs need your attention") fires in amber whenever failures or attention-needed counts are non-zero. When everything's fine, it reads calm ("All runs healthy"). The state is driven by computed KPIs and `aria-live="polite"` so screen readers announce changes.

2. **What kind of problem is it?** — KPI cards segment runs by status with icon + colour + count. Cards are the **primary filter**: clicking Failed shows only failed runs. The active card renders a selected ring (`aria-pressed`) and a dismissable chip below the bar so the active filter is unmistakeable and one-click to clear.

3. **What should I look at next?** — the table default-sorts by **risk** (Failed → Needs attention → Running → Submitted → Succeeded → Cancelled), most-recent first within a group. Users see the highest-risk run at row 1 without touching any control.

### Why a drawer, not a second page

The detail is a side drawer that slides in over the list rather than navigating to a new route. This lets users scan the list while reading details, and makes the "next run" workflow — open, read, close, open — feel fast. The drawer closes on Esc, on the ✕ button, and by clicking the scrim; focus returns to the originating row each time.

### Inverted-pyramid drawer layout

For a **FAILED** run the error card appears first — the user's priority is the cause, not the submission timestamp. The hierarchy for failed runs is: Error (parsed `Caused by:` + Copy) → Metadata → Task breakdown → Cost & resources → Top processes. For succeeded runs the error card is replaced with a success summary; the rest is identical.

The "Explain error (AI)" button is a deliberate stub. It signals intent — this is where AI assistance would live — without pretending the feature is built.

### Needs-attention rule

"Needs attention" fires on clear signals only: the run FAILED, or it SUCCEEDED but has failed tasks (`stats.failedCount > 0`), or it has retries (`load.retries > 0`), or CPU efficiency is very low (`< 20%`). Memory efficiency was deliberately excluded — every run in the real dataset has memory efficiency well below 10%, so flagging on it would mark everything as needing attention and defeat the purpose of the signal.

---

## Component & code structure

### Container / presentational split

`RunsPageComponent` is the **only smart component**. It injects `RunsService`, holds all view-state signals, and derives `visibleRuns`, `kpis`, `selectedRun`, and `executorOptions` via `computed()`. Every other component is purely presentational: it receives data via `input()`, emits events via `output()`, and has no knowledge of where the data comes from.

```
RunsPageComponent (container)
├─ HealthBarComponent    input: kpis, activeFilter  output: filter
├─ FilterBarComponent    input: search, status, executor, executors  output: *Change, clearAll
├─ RunsTableComponent    input: runs, selectedId, loading, sort  output: select, sortChange, clearFilters
│   └─ RunRowComponent   input: run, selected  output: select
└─ RunDrawerComponent    input: run  output: close
    ├─ StatusPillComponent
    └─ TaskBarComponent
```

This boundary is enforced, not just intended. None of the child components call `inject()` for data services. The benefit is obvious: each can be tested and story-booked in isolation with a fixture, no service mocking required.

### Adapter pattern: normalize once at the boundary

The service fetches raw JSON and maps it through `toRunVM` / `toRunDetailVM` before any component sees it. Components consume `RunVM` — a clean, nullable-resolved model where `durationLabel` is already `"13m 4s"` or `"—"`, `taskBreakdown` is either a typed object or `null`, and `error` is either a structured `{ process, cause, raw }` or `null`.

Templates have no `?.` chains, no inline ternaries for nulls, no formatting logic. They just bind to the clean model.

### Pure functions in `core/derive/`

Every derivation is a standalone, testable pure function:

| Function | What it does |
|---|---|
| `durationFmt(ms)` | `784042` → `"13m 4s"` · `null` → `"—"` |
| `costFmt(n)` | `0.03` → `"$0.03"` · `null` → `"—"` |
| `taskBreakdown(raw)` | Counts from `tasks[].status`; falls back to `load.*` counts when `tasks` is absent |
| `needsAttention(raw)` | One predicate, per-signal cases, all unit-tested |
| `sortRuns(runs, state)` | Risk sort + column sort; pure, returns new array |
| `applyFilters(runs, params)` | Search + status + executor; pure, returns new array |
| `summarize(runs)` | `RunVM[]` → `KpiStats`; feeds the health bar |

Each has its own spec file. The tests for `durationFmt`, `pctFromCounts`, and `needsAttention` each include the real edge cases from the dataset (null durations, zero totals, null `failedPct` with a non-zero `failedCount`).

### Signals over Observables

All view state is signals. `RunsService` exposes `runs`, `loadStatus`, `scenario`, and `lastLoadedAt` as `signal()`s; the container derives everything via `computed()`. The only Observable in the feature layer is the debounced search:

```ts
private readonly searchDebounced = toSignal(
  toObservable(this.search).pipe(debounceTime(150)),
  { initialValue: '' },
);
```

This bridges back into the signal graph without leaking Observable semantics into the template.

The 600ms skeleton delay is a `setTimeout` inside `RunsService.load()` that sets `loadStatus` to `'loading'` immediately and `'ready'` after the fetch resolves, so the shimmer rows always appear even in dev (where the JSON loads in ~1ms from disk).

---

## Data realities honored

The `runs.json` dataset is intentionally messy. Each edge case has a corresponding adapter test and visual treatment:

| Run | Problem | Treatment |
|---|---|---|
| `tender_shockley` | CANCELLED; no `tasks`, `metrics`, `duration`, `start` | `durationLabel = "—"`, `tasks = null` → "No task data available"; adapter does not throw |
| `scruffy_colden` | FAILED; `errorMessage` and `exitStatus` both `null` | `error = null` in the VM; drawer renders "This run failed but reported no error message." — honest, no invented cause |
| `viralrecon` | FAILED with `exitStatus: 0` | Status drives health, not exit code; `exitStatus` is preserved and displayed as-is |
| All runs | `failedPct: null` in `stats` even when tasks failed | `taskBreakdown` derives percentages from raw counts (`failedCount / total`); never reads `*Pct` fields |
| Metrics | `cpu`, `mem`, `time` sub-objects are JSON `null` on many processes (e.g. UNICYCLER has `cpu: null`) | Adapter filters `m.cpu != null` before accessing `.mean`; the raw model types all three as `RawBoxplot \| null` |

---

## States

| State | Trigger | Treatment |
|---|---|---|
| **Loading** | `loadStatus === 'loading'` (simulated 600ms on every dataset switch) | 8 shimmer skeleton rows in the table body; no spinner |
| **Empty** | Filters produce zero visible runs | Illustration + "No runs match your filters" + "Clear filters" button |
| **Failed** | `loadStatus === 'error'` | Full-width error banner with `role="alert"` |
| **Global parse error** | Angular error boundary | Caught by the router; fallback UI prevents a blank page |

Skeleton rows are `<tr>` elements with a shimmer gradient so the table's grid structure is preserved during load — users see the shape of data, not a spinner.

---

## Interaction & keyboard

### Table keyboard navigation

`RunsTableComponent` sets `role="grid"` on the table and handles `ArrowUp` / `ArrowDown` to move between rows. `Enter` and `Space` on a focused row open the drawer. `Tab` exits the table naturally.

Each row carries `[attr.data-run-id]="run.id"`. When the drawer closes, `RunsPageComponent` calls `runsTable.focusRunById(lastSelectedId)` via a `viewChild` reference, wrapped in `queueMicrotask()` to run after Angular's change detection settles. Keyboard users never lose their place.

### Drawer keyboard

The drawer uses `cdkTrapFocus` so Tab cycles only within the panel while it's open. Focus moves to the close button on open. Escape closes via `@HostListener('document:keydown.escape')`. Within the drawer's tablist, `Tab` moves focus to/from the tablist as a whole; `ArrowLeft` / `ArrowRight` / `Home` / `End` navigate between tabs (ARIA composite widget pattern).

### Filter state consistency

The active filter, visible runs, and the dismissable chip are all derived from the same `statusFilter` signal. There is no way for the chip to show without the table reflecting it — they share one source of truth.

### Copy button

"Copy" in the error card and the work-directory field swaps its icon to `check` and its label to "Copied!" for 1.2s via a `copiedTarget` signal and `setTimeout`, then reverts. The timer is cleared on destroy.

---

## Accessibility

- **Colour is never the only status indicator.** Every status uses icon + text + colour. The run row also gets a left border colour, so the table row itself has a structural cue beyond the pill.
- **Focus rings** use `--c-primary` (`#4256E7`) at ≥3:1 contrast, applied via `:focus-visible`.
- **AA contrast**: status text colours are darkened variants (e.g. `--c-fail-text: #B91C1C` on white = 5.9:1). Bootstrap's `#FFC107` yellow was rejected — it fails AA as text on white.
- **`aria-sort`** on sortable column headers; `aria-pressed` on active KPI cards; `role="grid"` on the table; `role="dialog"` + `aria-modal` + `aria-labelledby` on the drawer.
- **Live regions**: the criticality headline has `aria-live="polite"` so screen readers announce when the health state changes after filtering.
- **Semantic markup**: `<nav>` for the sidebar, `<aside>` for the drawer, `<dl>` for metadata grids, `<section aria-labelledby>` for drawer sections.
- Disabled sidebar links use `aria-disabled="true"` + `tabindex="-1"` rather than the `disabled` attribute, which removes focus visibility on some browsers.

---

## Motion

Motion tokens in `src/styles/_motion.scss`:

```scss
--motion-fast:  120ms;
--motion-base:  180ms;
--motion-slow:  240ms;
--ease-out: cubic-bezier(.2, .8, .2, 1);
```

All durations collapse to `0ms` under `prefers-reduced-motion: reduce`.

- **Drawer** slides in from the right (`translateX(100%)` → `translateX(0)`), `--motion-base`, ease-out.
- **KPI cards** lift 2px on hover with a shadow transition.
- **Row hover** transitions background and left-border colour at `--motion-fast`.
- **Refresh button** spins at `--motion-slow` while `loadStatus === 'loading'`.
- **`@formkit/auto-animate`** on the table body so rows animate on filter/sort changes rather than snapping.
- **View Transitions API** via `withViewTransitions()` for the `/sample` ↔ `/showcase` route swap.

---

## Testing strategy

81 tests across 8 files. The strategy is to test where bugs will actually happen.

**Pure functions get the most tests (highest ROI):**
- Format utils: `null` inputs, zero-divide in `pctFromCounts`, boundary values.
- Sort utils: full risk ordering, ties broken by recency, null durations sorted last.
- Filter utils: case-insensitive search, matches on name/pipeline/user, combined filters, empty results.
- Attention utils: each signal individually — FAILED always true, SUCCEEDED+failedCount, retries, low CPU.
- Task utils: the `tasks`-absent fallback to `load.*` counts, and CANCELLED → `null`.

**Adapter tests cover the real edge cases:**
- `tender_shockley`: no throw; `durationLabel = "—"`; `tasks = null`.
- `scruffy_colden`: no throw; `error = null` (not a made-up cause).
- `viralrecon` exit-0-on-FAILED: status trusted, not exit code.
- `failedPct: null` with `failedCount > 0`: derives from counts, no NaN.
- Defensive metrics: processes where `cpu` / `mem` / `time` are JSON `null`; confirms no throw and correct exclusion from `topProcesses`.

**Container test (locks the consistency invariant):**
- Applying a status filter → only matching runs in `visibleRuns`.
- `onSelect` → `selectedRun` set; `onDrawerClose` → `selectedRun` null.

The test suite doesn't chase coverage on Material internals or Angular lifecycle. If someone breaks a derivation, a data-handling rule, or the filter-consistency guarantee, a test fails immediately.

---

## What's deferred

| Feature | Reason |
|---|---|
| Virtual scrolling | Not needed at demo scale; `cdk-virtual-scroll-viewport` would wrap `RunsTableComponent` |
| Tasks / Metrics / Config / Logs drawer tabs | Overview is fully built; stub tabs show a placeholder with the correct icon. Real content requires richer data or additional fetch logic |
| Run comparison | Multi-select state + diff view; out of scope for a single-screen layout |
| Real history / sparklines | Needs aggregated time-series data, not present in the current schema |
| Role-based views | Depends on an auth layer |
| Live auto-refresh | Demo-only in `/showcase` (the "Updated Xm ago" counter + manual refresh); `/sample` data is static by design |
| Storybook story updates | Sprint 1 atom stories use earlier fixture shapes; health-bar, filter-bar, runs-table organism stories not yet written |

---

## Project structure

```
src/
  app/
    core/
      models/           raw-run.model.ts  run.model.ts        typed JSON ↔ domain boundary
      derive/           format  task  attention  sort  filter  pure derivation functions
      runs.adapter.ts   raw JSON → RunVM / RunDetailVM
      runs.service.ts   HttpClient + signals (load, runs, loadStatus, scenario, lastLoadedAt)
    features/runs/
      runs-page/        container — the only smart component
      health-bar/       KPI cards + criticality headline
      filter-bar/       search + dropdowns + active chips
      runs-table/       role=grid + skeleton + empty state + keyboard navigation
      run-row/          single table row
      run-drawer/       slide-in detail panel with tab navigation
    shared/
      health-bar/       thin re-export from features
      kpi-card/         individual KPI tile
      status-pill/      colour + icon + text
      task-bar/         segmented proportional bar
      executor-pill/    executor badge
      run-identity/     run name + pipeline + attention tag
      skeleton-row/     shimmer <tr>
      duration-label/   tabular-nums span
      cost-label/       tabular-nums span
      user-cell/        avatar + name
  styles/
    _tokens.scss        CSS custom properties (colours, spacing, radii)
    _motion.scss        animation tokens + reduced-motion override
  public/
    runs.json           7-run sample dataset (verbatim from spec)
    runs.showcase.json  20-run extended dataset
```
