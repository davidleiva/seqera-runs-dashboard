# Spec: `runs-summary` — the "glance" block (Storybook)

A NEW organism: the run-health summary that communicates state at a glance, with real
hierarchy (not a flat grid of equal cards). Built in isolation in Storybook.

## ⚠ Non-destructive — read first

- **Additive only.** Create a NEW component in `src/app/features/runs/runs-summary/`.
- **Do NOT modify, replace or delete** the existing `health-bar`, `kpi-card`, `filter-bar`,
  `runs-table` or `runs-page`. Leave everything as-is.
- **Do NOT wire this into `runs-page`** yet. Only build the component + its fixtures +
  its Storybook stories. We'll decide later whether it replaces the current health-bar.
- Presentational (`input()`/`output()`, `OnPush`, standalone). No services.
- Apply skills `seqera-design-tokens`, `motion-microinteractions`, `angular-architecture`,
  `storybook-stories`.

---

## Why this exists

Eight equal-weight cards don't create a glance. This block uses **three tiers**:

1. **Health verdict (primary)** — an actionable headline + a single segmented status bar.
2. **Context (secondary)** — total runs, total cost, and the interactive triage entries.
3. **Insight (differentiator)** — a detected pattern ("2 runs failed on the same process").

## Component contract

```ts
@Component({ selector: 'app-runs-summary', standalone: true, changeDetection: OnPush })
class RunsSummaryComponent {
  summary = input.required<RunsSummaryVM>();
  activeStatus = input<RunStatus | null>(null);   // for highlighting the active filter
  filter = output<RunStatus | null>();             // click a status → filter (toggle = null)
  selectInsight = output<SummaryInsight>();         // click the insight → apply its filter
}

interface RunsSummaryVM {
  total: number;
  counts: Record<RunStatus, number>;               // FAILED/RUNNING/SUBMITTED/SUCCEEDED/CANCELLED
  needsAttention: number;                           // succeeded-but-flagged etc.
  successRatePct: number;                           // derived, e.g. 65
  totalCostLabel: string;                           // "$0.49"
  insight: SummaryInsight | null;                   // null when no pattern found
}

interface SummaryInsight {
  kind: 'recurring-error' | 'executor-failures' | 'high-cost';
  label: string;                                    // "2 runs failed on the same process (ABACAS)"
  count: number;
  filter?: { status?: RunStatus; process?: string; executor?: string };  // what clicking applies
}
```

> The `insight` is computed later by a pure `detectPatterns(runs)` in `core/` (not now).
> For Storybook it's just passed in via fixtures. Keep the component dumb.

## Layout (top → bottom)

1. **Verdict row**
   - If `counts.FAILED + needsAttention > 0`: amber headline with warning icon,
     e.g. **"5 runs need your attention"** — the whole headline is a button that emits
     `filter` toward the attention/failed subset.
   - Else: calm neutral line, e.g. "All runs healthy · {successRatePct}% succeeded".
   - Right side: small "Total {total} · {totalCostLabel}" (display-only, not a filter).
2. **Segmented status bar** — one horizontal bar, full width, split proportionally by
   status using the status fill colours. Order Failed → Running → Submitted → Succeeded →
   Cancelled. Below/beside it a compact legend with counts (`● Failed 3  ● Running 1 …`).
   - Segments and legend items are **buttons** → emit `filter(status)`; clicking the
     active one again emits `null`. `activeStatus` gets a selected treatment.
3. **Insight line** (only if `summary.insight`) — subtle card/line with an icon:
   "⚠ {insight.label}", clickable → `selectInsight`. Omit entirely when `insight` is null.

## Colour / a11y / motion (from the tokens & motion skills)

- Status fills: Failed `#DC3545`, Running `#2563EB`, Submitted `#64748B`, Succeeded
  `#198754`, Cancelled `#64748B` (or a distinct grey). Text/labels use the darkened
  variants (`#B91C1C / #1D4ED8 / #15803D / #475569`), attention `#B45309`. Primary `#4256E7`.
- The segmented bar needs a **text alternative**: an `aria-label` summarising the
  distribution ("3 failed, 1 running, 13 succeeded of 20") so it's not colour-only.
  Interactive segments are `<button>` with accessible names; visible `:focus-visible`.
- Bar fills animate width on load (~180ms ease-out); respect `prefers-reduced-motion`.
- Tabular-nums on all counts. Radius 4px, border `#E4E9EF`, surface white.

## Fixtures (`runs-summary.fixtures.ts`)

```ts
export const summaryShowcase: RunsSummaryVM = {   // matches the 20-run showcase
  total: 20,
  counts: { FAILED: 3, RUNNING: 1, SUBMITTED: 1, SUCCEEDED: 13, CANCELLED: 2 },
  needsAttention: 5,
  successRatePct: 65,
  totalCostLabel: '$0.49',
  insight: {
    kind: 'recurring-error', count: 2,
    label: '2 runs failed on the same process (ABACAS)',
    filter: { status: 'FAILED', process: 'ABACAS' },
  },
};

export const summarySample: RunsSummaryVM = {      // the real 7-run dataset
  total: 7,
  counts: { FAILED: 2, RUNNING: 0, SUBMITTED: 0, SUCCEEDED: 4, CANCELLED: 1 },
  needsAttention: 3, successRatePct: 57, totalCostLabel: '$0.13',
  insight: null,                                   // thin pattern with 7 runs
};

export const summaryHealthy: RunsSummaryVM = {
  total: 12,
  counts: { FAILED: 0, RUNNING: 0, SUBMITTED: 0, SUCCEEDED: 12, CANCELLED: 0 },
  needsAttention: 0, successRatePct: 100, totalCostLabel: '$0.41', insight: null,
};
```

## Stories

1. **Showcase** — `summaryShowcase` (attention headline + segmented bar + insight). Headline case.
2. **Sample** — `summarySample` (real data, no insight).
3. **Healthy** — `summaryHealthy` (calm verdict, all green, no insight, no attention).
4. **SingleRun** — total 1 (edge: bar with one segment).
5. **Empty** — total 0 (verdict "No runs yet", empty bar / placeholder).

Interaction (play functions):
- **FilterFromSegment** — clicking a status segment emits `filter(status)`.
- **InsightClick** — clicking the insight emits `selectInsight`.

Keep `addon-a11y` green on every story (bar text alternative, button names, contrast).

---

## Later (not now)

When we adopt it: `runs-page` passes a computed `RunsSummaryVM` (counts + `detectPatterns`)
and wires `filter`/`selectInsight` to the existing filter signals. The current health-bar
can then be retired. None of that happens in this task.