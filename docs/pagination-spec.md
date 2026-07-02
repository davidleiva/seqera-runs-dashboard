# Spec: pagination — `runs-table` + `runs-page-v2` container

Add pagination the correct way: state in the container, `runs-table` stays presentational,
summary decoupled. Uses Angular Material `mat-paginator`. Applies to the v2 page + table.
Apply skills `angular-architecture`, `seqera-design-tokens`, `storybook-stories`.

## Principle

Pagination is a container concern. The table renders the slice it's given + the paginator,
and emits page changes. Slicing/state lives in the smart container.

## `runs-table` contract additions

```ts
runs = input.required<RunVM[]>();     // the ALREADY-PAGED slice (container slices it)
total = input<number>(0);              // total rows in the filtered+sorted set (for the pager)
pageIndex = input<number>(0);
pageSize = input<number>(25);
pageSizeOptions = input<number[]>([10, 25, 50]);
pageChange = output<{ pageIndex: number; pageSize: number }>();
```

- Render `mat-paginator` at the bottom of the panel, bound to `total`/`pageIndex`/`pageSize`,
  emitting `pageChange`. The table body renders only the `runs` slice it receives.
- Table stays dumb: it does NOT filter, sort or slice — it displays and emits.

## Container (`runs-page-v2`) state & pipeline

```ts
pageIndex = signal(0);
pageSize = signal(25);

// pipeline: filters -> sort -> paginate
filteredSorted = computed(() => sortRuns(applyFilters(runsSvc.runs(), {
  search: searchDebounced(), status: status(), executor: executor(), lens: activeLens() }), sort()));
total = computed(() => filteredSorted().length);

pagedRuns = computed(() => {
  const size = pageSize();
  const maxPage = Math.max(0, Math.ceil(total() / size) - 1);
  const page = Math.min(pageIndex(), maxPage);          // defensive clamp
  return filteredSorted().slice(page * size, page * size + size);
});
```

## The two correctness rules

1. **Reset to page 0 when filters or sort change — in the handlers, NOT an effect.**
   Writing signals inside an `effect` is an Angular anti-pattern. Do it explicitly:
   ```ts
   onStatusChange(s){ this.status.set(s); this.pageIndex.set(0); }
   onSearchChange(q){ this.search.set(q); this.pageIndex.set(0); }
   onExecutorChange(e){ this.executor.set(e); this.pageIndex.set(0); }
   onSortChange(s){ this.sort.set(s); this.pageIndex.set(0); }
   onLens(l){ /* set matching filter */ this.pageIndex.set(0); }
   onPageChange({pageIndex, pageSize}){ this.pageIndex.set(pageIndex); this.pageSize.set(pageSize); }
   ```
   Plus the defensive clamp above covers any edge where the index outruns the set.

2. **Summary is decoupled from pagination (and from filters).**
   `buildSummaryVM(runsSvc.runs())` — the KPI counts, "N need attention" and the bar reflect
   the FULL run set, never the current page or the active filter. Paging/filtering the table
   must never move the summary numbers.

## mat-paginator

- `pageSizeOptions = [10, 25, 50]`, default 25. Lives inside the list panel, below the table.
- Accessible out of the box; ensure it has a label and sits in the panel's landmark.
- Style to tokens (Inter, `#4256E7` for active). Show "1–25 of N".

## Empty / states

- Filtered to nothing → the empty state (not an empty page); the paginator hides or shows
  "0 of 0". `clearFilters` resets filters AND `pageIndex` to 0.
- Loading → skeleton rows; paginator can be hidden or disabled during load.

## Showcase dataset — bump to ~50 runs

To demonstrate pagination honestly, grow `public/runs.showcase.json` to ~50 runs:
- **Schema-valid**: same raw shape as `runs.json` (stats, load, tasks, metrics, …). The
  safest method is to clone real runs and vary `id`, `runName`, `userName`, timestamps,
  status, counts — do NOT hand-write partial objects that break the adapter.
- Spread `submit` dates across ~2 weeks (supports any future trend view), keep one live
  RUNNING run, and **keep the real edge cases represented** (a cancelled-no-tasks, a
  failed-no-message, a succeeded-with-failed-task, the ABACAS recurring error on ≥2 runs).
- `/sample` stays the untouched 7-run `runs.json` → shows "1–7 of 7", single page. Honest.

## Tests

- `paginate` logic (pure or the computed): slice correctness, clamp when index outruns total.
- Container: changing a filter resets `pageIndex` to 0.
- Container: summary counts DON'T change when paging or filtering.

## Stories (runs-table)

- **ManyRows** — >1 page (e.g. 30 rows, pageSize 10) → paginator visible, page nav works.
- **SinglePage** — 7 rows → "1–7 of 7", pager present but no page nav needed.
- **PageSizeChange** — play function: changing page size updates the slice + emits.
- Keep Empty/Loading stories; verify paginator behaviour in each.

Keep `addon-a11y` green (paginator label, keyboard nav, contrast).

---

## README note

"Pagination via `mat-paginator` for simplicity and product parity (Seqera paginates). For
tens of thousands of runs, virtualisation would be the next step." — put this in next-steps.