# Spec: `runs-page` assembly + app shell

Wire all components into the working screen. This is the single **smart container** plus
the surrounding shell. Single-agent work (Claude Code) — touches the container, routing
and layout. Apply skills `angular-architecture`, `seqera-design-tokens`,
`motion-microinteractions`, `runs-data-contract`.

Assumes the data layer exists (pure functions, `toRunVM` adapter, `RunsService`) and the
presentational components are built: `health-bar`, `filter-bar`, `runs-table`,
`run-drawer`. If the data layer isn't done, build it first per `data-layer-spec.md`.

---

## App shell (`app.component` + layout)

- **Left sidebar** (dark navy `#0B1F33`): Seqera logo (green ok), grouped nav
  (Pipelines: Launchpad / Runs[active] / Actions · Compute · Data), user footer.
  Static for this exercise — only "Runs" routes anywhere.
- **Top header**: workspace selector (static), right side "Updated Xm ago" + refresh
  icon (re-runs `RunsService.load`), route **badge** ("Sample dataset · 7 runs" /
  "Extended demo data").
- **Content**: the `runs-page`. Light bg `#F8F9FA`.

## `runs-page` composition (top → bottom)

```
[criticality headline]      ← amber line if failed+attention > 0, else nothing
<app-health-bar>            ← KPI cards as filters
<app-filter-bar>            ← search + status + executor + chips + clear
<app-runs-table>            ← list (loading / empty / populated)
<app-run-drawer>            ← slides over the right when a run is selected
```

## View state (signals in the container)

```ts
search = signal('');
statusFilter = signal<RunStatus | null>(null);
executorFilter = signal<string | null>(null);
sort = signal<SortState>({ key: 'risk', dir: 'desc' });
selectedId = signal<string | null>(null);

// debounce the raw search coming from filter-bar (don't debounce in the dumb component)
private searchDebounced = /* toSignal(toObservable(search).pipe(debounceTime(150))) */;

visibleRuns = computed(() =>
  sortRuns(applyFilters(runsService.runs(), {
    search: searchDebounced(), status: statusFilter(), executor: executorFilter(),
  }), sort()));

kpis = computed(() => summarize(runsService.runs()));       // counts + cost + attention
selectedRun = computed(() =>
  runsService.runs().find(r => r.id === selectedId()) ?? null);
hasActiveFilters = computed(() =>
  !!searchDebounced() || !!statusFilter() || !!executorFilter());
```

`applyFilters` and `summarize` are **pure functions in `core/`** (tested). The container
stays declarative — no imperative filtering in methods/templates.

## Wiring

```html
@if (status()==='error') { <app-error-state/> }
@else {
  @if (kpis().failed + kpis().needsAttention > 0) {
    <p class="headline">{{ attentionCount() }} runs need your attention</p>
  }
  <app-health-bar [kpis]="kpis()" [activeStatus]="statusFilter()"
                  (filter)="statusFilter.set($event)" />
  <app-filter-bar [search]="search()" [status]="statusFilter()"
                  [executor]="executorFilter()" [executors]="executorOptions()"
                  (searchChange)="search.set($event)"
                  (statusChange)="statusFilter.set($event)"
                  (executorChange)="executorFilter.set($event)"
                  (clearAll)="resetFilters()" />
  <app-runs-table [runs]="visibleRuns()" [selectedId]="selectedId()"
                  [loading]="status()==='loading'" [sort]="sort()"
                  (select)="selectedId.set($event.id)"
                  (sortChange)="sort.set($event)"
                  (clearFilters)="resetFilters()" />
}
<app-run-drawer [run]="selectedRun()" (close)="selectedId.set(null)" />
```

## States integration

- **Loading**: `RunsService` sets `status='loading'` (simulate ~600ms) → table renders
  skeleton rows; header shows a loading hint.
- **Empty**: `visibleRuns()` empty → table's empty state; its `clearFilters` → `resetFilters()`.
- **Failed run**: selecting it opens the drawer error-first (drawer handles it).
- **Global error**: parse/load failure → `status='error'` → `<app-error-state>` fallback,
  never a blank page.

## Cross-component behaviour

- **Filter consistency (lock this)**: `visibleRuns` reflects ALL active filters; the
  chips in filter-bar and the pressed KPI card always match `visibleRuns`. No active
  chip while unrelated rows remain.
- **Keyboard flow**: ↑/↓ move row focus in the table; Enter sets `selectedId` (opens
  drawer); focus moves into the drawer; Esc closes it and **returns focus to the
  originating row**. Tab order is logical (headline → KPIs → filters → table → drawer).
- **Selecting another run** while the drawer is open just swaps `selectedId` (drawer
  updates in place).

## Routing

```ts
provideRouter([
  { path: '', redirectTo: 'showcase', pathMatch: 'full' },
  { path: 'sample',  component: RunsPageComponent, data: { scenario: 'sample' } },
  { path: 'showcase', component: RunsPageComponent, data: { scenario: 'showcase' } },
], withViewTransitions());
```

- The container reads `scenario` from the route and calls `RunsService.load(scenario)`.
- Landing on `/showcase`; both routes show their badge.

## Responsive

- Health-bar KPI cards wrap (grid auto-fit) on narrow widths.
- Drawer becomes a full-width overlay (with scrim) under ~900px instead of a side panel.
- Table: keep key columns (Run, Status, Tasks) and let secondary columns drop/scroll on
  narrow; never break the row layout.

## Tests

- Container test: applying "Failed" leaves only failed runs in `visibleRuns`.
- Container test: selecting a row sets `selectedRun`; `close` clears it.

---

## Note — `/showcase` dataset

`/showcase` needs `assets/runs.showcase.json` (raw `runs.json` shape, amplified: more
runs, one live RUNNING run, dates spread for trend sparklines, edge cases kept). Ask for
the generator when you wire `/showcase`.