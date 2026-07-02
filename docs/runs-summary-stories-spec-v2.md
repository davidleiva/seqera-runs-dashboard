# Spec: `runs-summary` v2 — interactive "glance" block (Storybook)

Evolves v1 (`runs-summary-stories-spec.md`, kept as-is) into a set of **interactive
lenses**: every number is clickable and filters, and "needs attention" is a visible,
consistent marker — so the user can always answer "which ones?". Built additively in
Storybook.

## ⚠ Non-destructive

- Extend the SAME component at `src/app/features/runs/runs-summary/` (or add a `v2`
  variant if you prefer to keep v1 rendering). Do NOT delete v1's story.
- Still **not wired into `runs-page`**. Presentational, `OnPush`, no services.
- One cross-cutting exception (opt-in, see "Attention marker"): a small marker on
  `run-row`. That's the only touch outside this folder — do it only if explicitly asked;
  otherwise leave `run-row` alone and keep the marker inside the summary bar for now.
- Apply skills `seqera-design-tokens`, `motion-microinteractions`, `angular-architecture`,
  `storybook-stories`.

---

## Core idea: the summary is a set of lenses over the table

Three tiers, each a **clickable entry point** that filters the list. This is what makes
the numbers reconcilable ("which ones?" = one click) and lets the user work by concept.

The three lenses are a **progressive zoom, not parallel groups**:

```
Needs attention (8)  ⊃  Failed (3)  ⊃  Pattern: ABACAS (2)
```

Make that relationship legible; don't present them as unrelated counts.

## Component contract

```ts
@Component({ selector: 'app-runs-summary', standalone: true, changeDetection: OnPush })
class RunsSummaryComponent {
  summary = input.required<RunsSummaryVM>();
  activeLens = input<SummaryLens | null>(null);     // highlights the active lens
  lens = output<SummaryLens | null>();               // clicking a lens (toggle = null)
}

type SummaryLens =
  | { kind: 'status'; status: RunStatus }
  | { kind: 'attention' }
  | { kind: 'insight'; insight: SummaryInsight };

interface RunsSummaryVM {
  total: number;
  counts: Record<RunStatus, number>;      // FAILED/RUNNING/SUBMITTED/SUCCEEDED/CANCELLED
  succeededWithIssues: number;            // subset of SUCCEEDED that needs attention
  // needsAttention is DERIVED, never stored: counts.FAILED + succeededWithIssues
  successRatePct: number;
  totalCostLabel: string;
  insight: SummaryInsight | null;
}

interface SummaryInsight {
  kind: 'recurring-error' | 'executor-failures' | 'high-cost';
  label: string;                          // "2 runs failed on the same process (ABACAS)"
  count: number;
  filter: { status?: RunStatus; process?: string; executor?: string };
}
```

> **Derive, don't store, `needsAttention`.** Compute it in the component as
> `counts.FAILED + succeededWithIssues`. This kills the earlier 5-vs-8 inconsistency:
> the headline number and the bar hatch always reconcile because they read the same source.

## Layout & interactions

1. **Verdict headline (lens: attention)** — if `needsAttention > 0`: amber, warning icon,
   **"{needsAttention} runs need your attention"**, rendered as a `<button>` that emits
   `lens({kind:'attention'})`. On **hover**, a tooltip shows the composition:
   **"{counts.FAILED} failed + {succeededWithIssues} succeeded with issues"** — this is the
   "make it explainable" fix. If `needsAttention === 0`: calm "All runs healthy ·
   {successRatePct}% succeeded" (not a button).
   Right side: "Total {total} · {totalCostLabel}" (display-only).

2. **Segmented status bar (lens: status)** — full-width bar split by status
   (Failed → Running → Submitted → Succeeded → Cancelled) using status fills. Each segment
   and each legend item is a `<button>` emitting `lens({kind:'status', status})`; the active
   one gets a selected treatment; clicking it again emits `null`.
   - **Attention marker on the bar (the reconciliation).** Overlay a subtle **hatch/pattern
     in the attention colour on the `succeededWithIssues` portion of the Succeeded segment**.
     So the user sees: red (failed, inherently attention) + hatched-green (succeeded with
     issues) = the 8. The number and the bar now visibly agree.
   - Add a small legend note for the marker: **"▨ {needsAttention} need attention"** using
     the attention colour, so the hatch is explained.

3. **Insight pill (lens: insight)** — only if `summary.insight`. Its own line below the bar
   (keep it out of the headline row: it's a tier-3 detail, a subset of the problems, not a
   competing primary alert). A `<button>` emitting `lens({kind:'insight', insight})`.
   Clicking filters the table to those specific runs (e.g. failed + process ABACAS) →
   answers "which two?".

### Single source of truth (when wired later)

All three lenses write the SAME filter state in `runs-page` (a `lens` signal) that the
filter-bar also reflects (chip + dropdown). Summary and filter-bar never diverge. Filtering
from the summary is **not** duplication of the status dropdown — attention and error-pattern
are lenses the dropdown can't express.

## Attention marker — make it consistent everywhere

Define ONE token for "needs attention": the amber colour `#B45309` (text) / `#D97706` (fill)
plus a small warning glyph. Use it:
- as the **hatch** on the bar's succeeded-with-issues portion, and its legend note;
- (opt-in, touches `run-row`) as a **small marker on each attention row** in the table, so
  "attention" is a property you can spot in the list, not only a headline number. Only add
  the row marker when explicitly requested; keep `run-row` untouched otherwise.

## Colour / a11y / motion

- Status fills: Failed `#DC3545`, Running `#2563EB`, Submitted `#64748B`, Succeeded
  `#198754`, Cancelled `#94A3B8` (distinct grey from Submitted). Text uses darkened variants.
  Attention `#B45309`. Primary/focus `#4256E7`.
- Bar `aria-label` states the full distribution incl. attention:
  "20 runs: 3 failed, 1 running, 1 submitted, 13 succeeded (5 need attention), 2 cancelled".
  Interactive segments/legend/headline/insight are `<button>` with clear accessible names
  and visible `:focus-visible`. The hatch must not be the ONLY signal — the legend note and
  the aria-label carry it too (not colour/pattern alone).
- Segments animate width on load (~180ms ease-out); respect `prefers-reduced-motion`.
  Tabular-nums on counts; radius 4px; surface white; border `#E4E9EF`.

## Fixtures (`runs-summary.fixtures.ts`)

```ts
export const summaryShowcase: RunsSummaryVM = {
  total: 20,
  counts: { FAILED: 3, RUNNING: 1, SUBMITTED: 1, SUCCEEDED: 13, CANCELLED: 2 },
  succeededWithIssues: 5,                 // → needsAttention derived = 3 + 5 = 8
  successRatePct: 65,
  totalCostLabel: '$0.49',
  insight: {
    kind: 'recurring-error', count: 2,
    label: '2 runs failed on the same process (ABACAS)',
    filter: { status: 'FAILED', process: 'ABACAS' },
  },
};

export const summarySample: RunsSummaryVM = {
  total: 7,
  counts: { FAILED: 2, RUNNING: 0, SUBMITTED: 0, SUCCEEDED: 4, CANCELLED: 1 },
  succeededWithIssues: 1,                 // needsAttention = 2 + 1 = 3
  successRatePct: 57, totalCostLabel: '$0.13', insight: null,
};

export const summaryHealthy: RunsSummaryVM = {
  total: 12,
  counts: { FAILED: 0, RUNNING: 0, SUBMITTED: 0, SUCCEEDED: 12, CANCELLED: 0 },
  succeededWithIssues: 0,                 // needsAttention = 0 → calm verdict
  successRatePct: 100, totalCostLabel: '$0.41', insight: null,
};
```

## Stories

1. **Showcase** — `summaryShowcase`: attention headline (8), bar with hatch on 5/13
   succeeded, insight pill. The headline case.
2. **Sample** — `summarySample`: real data, attention 3, no insight.
3. **Healthy** — `summaryHealthy`: calm verdict, no hatch, no insight.
4. **SingleRun** / **Empty** — edges (bar with one segment / "No runs yet").

Interaction (play functions) — the whole point of v2:
- **HeadlineFilters** — clicking the headline emits `lens({kind:'attention'})`.
- **SegmentFilters** — clicking the Failed segment emits `lens({kind:'status',status:'FAILED'})`.
- **InsightFilters** — clicking the pill emits `lens({kind:'insight', ...})`.
- **HeadlineTooltip** — hover shows "3 failed + 5 succeeded with issues".
- **ActiveLensHighlight** — passing `activeLens` highlights the matching control.

Keep `addon-a11y` green (button names, bar aria-label, contrast; hatch + legend + label,
never pattern-only).

---

## Diff vs v1 (quick reference)

- v1: static summary with a headline, bar, insight (display only).
- **v2: everything is a clickable lens** (`lens` output), **`needsAttention` is derived**
  (fixes the count mismatch), the **bar carries a hatch** marking succeeded-with-issues so
  the number reconciles visually, the **headline has a composition tooltip**, and the three
  lenses read as a **zoom (attention ⊃ failed ⊃ pattern)**.