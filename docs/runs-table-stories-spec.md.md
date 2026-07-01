# Spec: `runs-table` organism (Storybook)

The organism that composes `run-row` molecules into the list. Presentational and
data-source-agnostic: it receives runs, it does not fetch them. Stories use array
fixtures (real-shaped `RunVM`); the real app feeds it `runs.json` via `RunsService`
(see "Data layer" below). Apply skills `angular-architecture`, `seqera-design-tokens`,
`motion-microinteractions`, `storybook-stories`.

---

## Component contract

```ts
@Component({ selector: 'app-runs-table', changeDetection: OnPush, standalone: true })
class RunsTableComponent {
  runs = input.required<RunVM[]>();          // already filtered+sorted by the parent
  selectedId = input<string | null>(null);
  loading = input<boolean>(false);           // shows skeleton rows
  sort = input<SortState>({ key: 'risk', dir: 'desc' });

  select = output<RunVM>();                   // row clicked / Enter
  sortChange = output<SortState>();           // header clicked
  clearFilters = output<void>();              // from the empty state
}
```

- **Semantic table**: `<table>` with `<thead>` `<th scope="col">`; sortable headers carry
  `aria-sort` and are focusable buttons. Rows are `<tr app-run-row …>`.
- **Sorting**: default `risk` (Failed → Needs attention → Running → Submitted →
  Succeeded → Cancelled; recent first within a group). Re-sortable by Submitted,
  Duration, Cost. The component does NOT mutate data — it emits `sortChange`; the
  parent re-derives. (Or, if self-contained, sort a copy via the pure `sortByRisk`/
  comparator functions — keep it pure either way.)
- **Selection**: `selectedId` drives the highlighted row; clicking/Enter emits `select`.
  ↑/↓ move focus between rows (keyboard). This pairs with the drawer in `runs-page`.
- **Loading**: when `loading`, render ~6 skeleton rows (atom), not a spinner.
- **Empty**: when `runs` is empty, render the empty state (message + "Clear filters"
  button emitting `clearFilters`), not an empty `<tbody>`.
- **Motion**: wrap `<tbody>` with auto-animate so rows animate on filter/sort/reorder.
  Respect reduced-motion.

---

## Stories

Fixtures: build arrays from the `run-row` fixtures.
`const allRuns = [failedViralrecon, succeededWithFailedTask, runningShowcase,
succeededRnaseq, failedNoMessage, cancelledNoData, submittedQueued];`

1. **Populated** — `runs: allRuns` (risk-sorted, mixed states, the headline case).
2. **Empty** — `runs: []` → empty state with "Clear filters".
3. **Loading** — `loading: true` → skeleton rows.
4. **AllHealthy** — only succeeded runs (calm dashboard, no attention).
5. **NeedsAttentionHeavy** — failures + attention-flagged runs only (critical case).
6. **RowSelected** — `selectedId` set to the failed run (highlighted state).
7. **SortByCost** — `sort: { key: 'cost', dir: 'desc' }` (verify `aria-sort` + order).

Interaction stories (play functions):
- **Selecting**: click a row → `select` fires with that run.
- **KeyboardNav**: Tab into the table, ↑/↓ move row focus, Enter emits `select`.
- **Sorting**: click a header → `sortChange` fires; `aria-sort` updates.

Keep `addon-a11y` green on every story (table roles, `scope`, `aria-sort`, focus order,
contrast).

---

## Data layer (build right after the table stories)

The table's real home is the `runs-page` container. Build, in order:

1. **Models** — `RunVM`, `TaskBreakdown`, `RunStatus`, `SortState` (core/models).
2. **Adapter** — `toRunVM(raw): RunVM` mapping `runs.json` → clean model: resolve nulls,
   precompute `durationLabel`/`costLabel`/`needsAttention`/`tasks`. Handle the real
   edge cases (cancelled no tasks, failed no message, `failedPct` null). Pure + tested.
3. **RunsService** — loads the JSON for the active route: `/sample` → `runs.json`
   verbatim; `/showcase` → amplified dataset. Exposes `runs = signal<RunVM[]>`.
4. **`runs-page` container** — owns view state (search, status filter, selectedId,
   sort) as signals; `computed()` produces the filtered+sorted list; passes it to
   `<app-runs-table>` and renders `<app-run-drawer>` for the selected run.

The table stays dumb; the container wires real data. "Fake vs real" is just which
source fills the same `input()`.