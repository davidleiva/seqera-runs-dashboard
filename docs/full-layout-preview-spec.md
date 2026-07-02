# Spec: full-layout preview story (Storybook)

The "whole screen" story: sidebar shell + `runs-layout` + `runs-summary` (v3) + `filter-bar`
+ `runs-table` (row refinement v2), where **clicking a row opens the drawer**. Driven by
fixtures and local state — a rehearsal of the real `runs-page` wiring, without the data layer.

## ⚠ Non-destructive

- Add a story-only host: `src/app/features/runs/_preview/runs-page-preview.component.ts`
  (+ `.stories.ts`). It **composes existing components with fixtures**; it does NOT modify
  `runs-page`, the services, or any component internals.
- Presentational composition + local signals only. No `RunsService`, no HTTP.
- Apply skills `seqera-design-tokens`, `motion-microinteractions`, `angular-architecture`,
  `storybook-stories`.

## What it composes (the full picture)

```
app-shell (sidebar + top header: workspace, badge, "updated", refresh)
└── runs-layout
    ├── [header]   "Runs" title + subtitle
    ├── [summary]  <app-runs-summary>   (v3: inline breakdown, pure status bar, lenses)
    └── runs-panel
        ├── [filters] <app-filter-bar>  (search + status + executor + chips)
        └── [table]   <app-runs-table>  (rows = run-row refinement v2: marker by status, etc.)
<app-run-drawer[-material]>  overlays when a row is selected
```

- **Sidebar/shell**: reuse the existing shell/sidebar component. If the sidebar isn't a
  standalone presentational component yet, add a minimal `app-shell` (dark navy nav + top
  header) for the preview — do not refactor the app's real shell in this task.
- **Drawer**: use the version you want to preview (default: the Material v2,
  `app-run-drawer-material`; the custom one is fine too). It overlays the layout.

## Host state (signals in the preview component)

```ts
private readonly all = signal<RunDetailVM[]>(FULL_PREVIEW_FIXTURE);   // ~20 runs, showcase-like
search = signal(''); status = signal<RunStatus|null>(null); executor = signal<string|null>(null);
activeLens = signal<SummaryLens | null>(null);
selectedId = signal<string | null>(null);

visibleRuns = computed(() => filterAndSort(this.all(), {search, status, executor, activeLens}));
summary     = computed(() => buildSummaryVM(this.all()));      // counts + succeededWithIssues + insight
selectedRun = computed(() => this.all().find(r => r.id === this.selectedId()) ?? null);
```

`filterAndSort` and `buildSummaryVM` can be inline helpers in the preview (or reuse the real
pure functions if they already exist). Keep them simple — this is a demo harness.

## Wiring (the interactions to demonstrate)

- `runs-table (select)` → `selectedId.set($event.id)` → **drawer opens** with that run.
- `runs-table (sortChange)` → update sort.
- `runs-summary (lens)` → set the matching filter (status lens → `status`; attention/insight
  → the corresponding filter); reflect it as a chip in `filter-bar`. Single source of truth.
- `filter-bar (searchChange/statusChange/executorChange/clearAll)` → update the signals.
- `run-drawer (close)` → `selectedId.set(null)`; Esc / backdrop also close (Material handles).
- Active lens dims the bar / shows the chip (per summary v3); filtering is reversible.

## Fixtures

`FULL_PREVIEW_FIXTURE`: ~20 `RunDetailVM` (showcase-scale) so the summary reads "8 need
attention · 3 failed + 5 succeeded with issues", the bar shows the full distribution, and the
insight pill ("2 failed on ABACAS") appears. Reuse/extend the existing drawer + row fixtures;
keep the real edge cases (cancelled no-tasks, failed no-message) among them so the table and
drawer show them.

## Stories

1. **FullLayout** — everything composed, no run selected (drawer closed). The money shot:
   sidebar + fixed container nesting + summary v3 + filter-bar + refined table.
2. **DrawerOpen** — `selectedId` preset to the failed ABACAS run so the screenshot shows the
   drawer open, error-first, beside the list.
3. **Filtered** — `activeLens` preset to `{kind:'attention'}`: table shows only the 8, bar
   dimmed, chip visible.

Interaction (play functions):
- **RowOpensDrawer** — click a row → drawer opens with that run.
- **LensFilters** — click the Failed segment / attention headline → table filters, chip shows.
- **EscCloses** — Esc closes the drawer.

Keep `addon-a11y` green across all (landmarks: nav + header + section; keyboard: row select
with Enter, ↑/↓ move focus, Esc closes; contrast; focus trap in drawer).

## Responsive

Include a `Narrow` param (~800px) to confirm: summary card wraps, gutters shrink, drawer
becomes a full-width overlay (Material over-mode), table drops secondary columns.

---

This preview is effectively the real `runs-page` minus the data layer. When we wire the
actual page, swap `FULL_PREVIEW_FIXTURE` for `RunsService.runs()` and the same computed
signals apply — the composition and wiring carry straight over.