# Spec: data layer + `runs-page` container

Turns the presentational components into the real app. This is where the
"data handling that isn't brittle" criterion is won. Apply skills
`runs-data-contract`, `angular-architecture`, `motion-microinteractions`.

Build in this order: pure functions → adapter → service → routing → container.

---

## 1. Pure functions (`core/derive/`)

Stateless, no Angular, independently testable. Signatures:

```ts
durationFmt(ms: number | null): string          // 784042 -> "13m 4s"; 7615 -> "8s"; null -> "—"
costFmt(cost: number | null): string             // 0.03 -> "$0.03"; null -> "—"
pctFromCounts(part: number, total: number): number  // total 0 -> 0 (no NaN)
taskBreakdown(raw: RawRun): TaskBreakdown | null  // from tasks[]; fallback load.*; none -> null
needsAttention(raw: RawRun): boolean             // FAILED || (SUCCEEDED && failed>0) || retries>0 || low eff
riskRank(status: RunStatus): number              // Failed<Attention<Running<Submitted<Succeeded<Cancelled
sortRuns(runs: RunVM[], sort: SortState): RunVM[] // pure, returns new array
```

Unit-test each against the real edge cases (see `angular-architecture` testing checklist).

## 2. Adapter (`core/runs.adapter.ts`)

`toRunVM(raw: RawRun): RunVM` — the single normalization point. Raw messy JSON in,
clean domain model out. Resolve every null, precompute every label/flag so components
never touch raw fields.

- `durationLabel`, `costLabel` via the formatters.
- `needsAttention`, `tasks` (or `null`), `error` (`{process?, cause?, raw?}` or `null`).
- Parse `error.cause` from the `Caused by:` line of `errorMessage` when present;
  if `errorMessage`/`exitStatus` are null on a FAILED run → `error: null` (honest, no invention).
- Trust `status`, not `exitStatus`, for health (failed run can have `exitStatus: 0`).
- Never read `*Pct` — derive via `pctFromCounts`.
- Defensive on missing `manifest`/`metrics`/`tasks`/`cost`/`userName`/`executors`.

Type the raw shape as `RawRun` (from `runs-data-contract`); narrow `unknown` here.

## 3. RunsService (`core/runs.service.ts`)

```ts
@Injectable({ providedIn: 'root' })
class RunsService {
  // loads the dataset for the active scenario and maps through toRunVM
  load(scenario: 'sample' | 'showcase'): void;
  readonly runs = signal<RunVM[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
}
```

- `sample` → `assets/runs.json` (verbatim, 7 runs, edge cases intact).
- `showcase` → `assets/runs.showcase.json` (amplified, schema-valid; see note).
- Use `HttpClient` (or `fetch`); set `loading` then `ready`/`error`. Simulate ~600ms
  so the skeleton is visible. On parse failure → `status = 'error'` (no crash).

## 4. Routing (`app.routes.ts`)

- `/` → redirect to `/showcase` (landing that shines).
- `/sample` and `/showcase` → same `RunsPageComponent`, differ only by the scenario
  passed to `RunsService.load(...)` (route data or param).
- Enable `provideRouter(routes, withViewTransitions())` for route/scenario transitions.
- A visible badge per route: "Sample dataset · 7 runs" / "Extended demo data".

## 5. `runs-page` container (the ONLY smart component)

Owns view state as signals; derives everything with `computed()`; stays declarative.

```ts
search = signal('');
statusFilter = signal<RunStatus | null>(null);   // from KPI card / dropdown
executorFilter = signal<string | null>(null);
sort = signal<SortState>({ key: 'risk', dir: 'desc' });
selectedId = signal<string | null>(null);

visibleRuns = computed(() => sortRuns(applyFilters(runsService.runs(), …), sort()));
kpis = computed(() => countByStatus(runsService.runs()));   // counts + cost + attention
selectedRun = computed(() => runsService.runs().find(r => r.id === selectedId()) ?? null);
```

Template wiring:
- `<app-health-bar [kpis]="kpis()" [active]="statusFilter()" (filter)="statusFilter.set($event)">`
- criticality headline: if failures/attention > 0 show the amber line, else calm.
- `<app-filter-bar>` for search/status/executor + active-filter chips + clear.
- `<app-runs-table [runs]="visibleRuns()" [selectedId]="selectedId()" [loading]="status()==='loading'"
   [sort]="sort()" (select)="selectedId.set($event.id)" (sortChange)="sort.set($event)"
   (clearFilters)="resetFilters()">`
- `<app-run-drawer [run]="selectedRun()" (close)="selectedId.set(null)">` (Esc closes,
  focus management).
- **State consistency**: an active filter ⇒ `visibleRuns` only contains matches (lock it).
- **Global error**: when `status()==='error'`, render a friendly fallback, never blank.

## 6. Tests

Pure functions + adapter on the edge cases; one container test that "Failed" filter
leaves only failed runs visible.

---

## Note — `/showcase` dataset

`runs.showcase.json` must be the **raw `runs.json` shape** (the adapter converts it),
just amplified: more runs, one live RUNNING run with partial task counts, and runs
spread across dates so per-day trend sparklines can be aggregated for real. Keep the
real 7 runs' edge cases represented too. (Ask for the generator when you reach this.)