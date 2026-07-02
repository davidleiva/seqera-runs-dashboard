# Spec: `runs-summary` v3 — reconciled glance + lenses (Storybook)

Supersedes v2's visual approach (v1 and v2 kept as-is for reference). Two goals:
(1) make "N need attention" **reconcile without hover**, and (2) lock the **lens/filter
interaction**. Built additively in Storybook, still not wired into `runs-page`.

Apply skills `seqera-design-tokens`, `motion-microinteractions`, `angular-architecture`,
`storybook-stories`.

## What changes vs v2

- **Headline shows the composition inline** — no hover needed to understand the count.
- **The status bar is pure status again** — REMOVE the partial hatch (it only marked the
  succeeded portion and caused the "why only green?" confusion). Reconciliation now comes
  from the inline breakdown + the consistent **row markers** (in `run-row` refinement v2).
- **Lenses are formalised**: every indicator filters, single-source-of-truth, with clear
  active feedback (segment dimming) and toggle-to-clear.

Keep v2's good parts: `needsAttention` is **derived** (`counts.FAILED + succeededWithIssues`),
insight pill as tier-3.

---

## Layout

1. **Verdict headline (lens: attention)**
   - `needsAttention > 0`: amber, warning icon, with the composition **inline**:
     **"8 runs need your attention · 3 failed + 5 succeeded with issues"**.
     Rendered as a `<button>` emitting `lens({kind:'attention'})`.
   - `needsAttention === 0`: calm "All runs healthy · {successRatePct}% succeeded" (not a button).
   - Right: "Total {total} · {totalCostLabel}" (display-only).
2. **Segmented status bar (lens: status)** — PURE STATUS, no hatch.
   - Full-width, split by status (Failed → Running → Submitted → Succeeded → Cancelled),
     status fills. Segments + legend items are `<button>`s emitting
     `lens({kind:'status', status})`.
   - `aria-label` states the distribution AND the attention count once:
     "20 runs: 3 failed, 1 running, 1 submitted, 13 succeeded, 2 cancelled — 8 need attention".
3. **Insight pill (lens: insight)** — its own line below the bar (tier-3, a subset of the
   problems). `<button>` emitting `lens({kind:'insight', insight})`.

Reconciliation is carried by: the headline breakdown (3+5=8) + the row markers in the table
(all 8 attention runs marked next to their status). The bar no longer tries to encode
attention.

## Lens / filter interaction (formalised)

- **Default**: all runs visible, `activeLens = null`.
- **Click a lens** → sets `activeLens` and filters the table to that subset.
  **Single-select** from the summary (one lens at a time). Clicking the active lens again
  → `null` (clear). Precise composition (status + executor + search together) is the job of
  the filter-bar, not the summary.
- **Single source of truth**: `lens` output drives the same filter state the filter-bar and
  status dropdown read/write. Summary, filter-bar chip, dropdown and table never diverge.
- **Active feedback on the bar**:
  - **status lens** → the active segment stays full opacity; the other segments **dim**
    (reduced opacity/saturation). The active legend item is emphasised.
  - **attention / insight lens (cross-cutting)** → do NOT fake partial-segment highlight;
    **dim the whole bar uniformly** and rely on the chip + filtered table + the headline/
    pill's own active state.
- **Not destructive**: filtering is reversible and obvious — a removable chip ("Failed ✕" /
  "Needs attention ✕") is always shown while active; toggling or clearing restores all.
- **a11y**: dimming is never the only signal (chip + `aria-pressed` on the active lens +
  the aria-label). The active segment keeps AA contrast. All lenses are `<button>` with
  accessible names and visible `:focus-visible`.

## Contract (unchanged from v2, restated)

```ts
summary = input.required<RunsSummaryVM>();
activeLens = input<SummaryLens | null>(null);
lens = output<SummaryLens | null>();

type SummaryLens =
  | { kind: 'status'; status: RunStatus }
  | { kind: 'attention' }
  | { kind: 'insight'; insight: SummaryInsight };

interface RunsSummaryVM {
  total: number;
  counts: Record<RunStatus, number>;
  succeededWithIssues: number;         // needsAttention = counts.FAILED + succeededWithIssues (derived)
  successRatePct: number;
  totalCostLabel: string;
  insight: SummaryInsight | null;
}
```

## Motion

- Bar segments animate width on load (~180ms ease-out). Dimming transitions ~120ms.
- Respect `prefers-reduced-motion` (instant). Tabular-nums on counts; radius 4px; border
  `#E4E9EF`; surface white.

## Fixtures

Reuse v2's `summaryShowcase` / `summarySample` / `summaryHealthy` (unchanged — the VM shape
is the same; only the rendering drops the hatch and adds the inline breakdown).

## Stories

1. **Showcase** — headline "8 need attention · 3 failed + 5 succeeded with issues", pure
   status bar, insight pill.
2. **Sample** — real data, "3 need attention · 2 failed + 1 succeeded with issues", no insight.
3. **Healthy** — calm verdict, no attention, no insight.
4. **StatusLensActive** — `activeLens = {kind:'status', status:'FAILED'}`: Failed segment
   full, others dimmed.
5. **AttentionLensActive** — `activeLens = {kind:'attention'}`: whole bar dimmed, headline
   emphasised.
6. **SingleRun** / **Empty** — edges.

Interaction (play functions):
- **HeadlineFilters / SegmentFilters / InsightFilters** emit the right `lens`.
- **ToggleClears** — clicking the active lens emits `null`.

Keep `addon-a11y` green (button names, bar aria-label with attention count, contrast).

---

## Diff vs v2 (quick reference)

- Remove the partial hatch on the bar (bar = pure status again).
- Add the inline composition to the headline ("· 3 failed + 5 succeeded with issues").
- Formalise lens interaction: single-select, toggle-clear, dim active feedback (segment for
  status lenses, whole-bar for cross-cutting), single source of truth, always-visible chip.
- Reconciliation now lives in: headline breakdown + row markers (run-row refinement v2),
  not on the bar.