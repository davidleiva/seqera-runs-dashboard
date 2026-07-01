# Seqera Runs Dashboard — Project Spec

Take-home for a Design Engineer role at Seqera. Build a **pipeline run status
dashboard**: one view to read the health of workflow runs at a glance, drill into
any run, and understand why something failed.

Stack: **Angular (standalone components, signals, OnPush) + Angular Material + SCSS.**
Data is static (`runs.json`); no backend.

This file is the source of truth for *what* and *why*. The detailed *how* lives in
the three skills under `.claude/skills/`. Read those when building UI, handling data,
or adding motion.

---

## What we're building

A single **master–detail screen**:

- A **health bar** of KPI cards at the top (status counts + cost) that double as filters.
- A **dense, risk-sorted table** of runs.
- A **detail drawer** that slides in when a run is selected, error-first for failures.

Two routes, same components, different data source:

- **`/sample`** → the provided `runs.json`, untouched. Proves we respect the data,
  including its messy edge cases. **Never "fix" the ugly cases here.**
- **`/showcase`** → an amplified, schema-valid dataset (more runs, one live RUNNING
  run, enough history for sparklines). Proves the design scales. Landing route.

Each route shows a clear badge ("Sample dataset · 7 runs" / "Extended demo data").

---

## Closed design decisions

**Layout & navigation**
- Master–detail in one screen. Detail is a **drawer**, no accordion tier.
- Light Seqera shell: dark navy sidebar, `#F8F9FA` content background.

**Health / glance layer**
- KPI cards = the **primary filter**. Remove redundant status tabs; a `Status`
  dropdown covers the long tail (Cancelled, Submitted).
- Only cards that map to a filterable subset are clickable. **Total runs** (resets)
  and **Total cost** (no subset) are display-only and must NOT look clickable.
- Active card shows a selected ring + an `aria-pressed` state; a removable filter
  **chip** appears, with "clear". Radio behaviour (one status at a time).
- Conditional **criticality headline**: if failures/attention > 0, an amber line
  ("3 runs need your attention"); if all green, the page reads calm.

**Runs table**
- **Dense rows** (card-like treatment), not loose cards — built for hundreds of runs.
- Default sort = **risk**: Failed → Needs attention → Running → Submitted →
  Succeeded → Cancelled; most recent first within a group. Columns re-sortable
  (Submitted, Duration, Cost) with `aria-sort`.
- Status = **colour + icon + text + left border**, never colour alone.
- Columns: Run + pipeline, Status (+ exit), User, Submitted, Duration,
  Tasks (mini segmented bar), Cost, Retries, Executor. Detail (commitId,
  sessionId, workDir) belongs in the drawer, not the row.

**Needs attention** (product-judgment layer)
- Mark runs that aren't failed but warrant a look, from **clear signals only**:
  failed tasks > 0 despite SUCCEEDED, retries > 0, very low efficiency.
- Do NOT invent anomaly detection from magic duration/cost thresholds.

**Drawer (inverted pyramid)**
- Header: status badge + run name + pipeline + actions.
- Tabs: Overview (built in full) / Tasks / Metrics / Config / Logs (lighter/stubs).
- Overview order for a failure: **1) Error card first** (parsed `Caused by:` +
  Copy + disabled "Explain error (AI)" stub) → 2) Metadata → 3) Task breakdown →
  4) Cost & resources → 5) Top resource usage by process (from `metrics[]`).
- For a success: replace the error card with a success summary; rest is the same.

**States** (see also the data-contract skill)
- **Loading** = list skeleton (shimmer), not a spinner. Simulate ~600ms.
- **Empty** = clear message + "Clear filters" in one click.
- **Failed** = the critical case; drawer opens error-first.
- **Global parse error** = an Angular error boundary / fallback UI, never a blank page.

---

## Data realities to honour (this is where points are won)

The real dataset is inconsistent on purpose. Handle, don't hide:

- `tender_shockley` — CANCELLED, no `tasks`/`metrics`/`duration`/`start`.
- `scruffy_colden` — FAILED but `errorMessage` and `exitStatus` are `null`.
- The failed `viralrecon` run has `exitStatus: 0` (a failure with a success code).
- `failedPct: null` even when a task failed → derive % from counts, never trust
  pre-computed fields.
- `manifest` / `metrics` / `tasks` / `cost` can be absent → defensive access, the
  UI degrades per section with honest placeholders ("No task data available").

Filter state must stay consistent: an active filter ⇒ the list shows only matching
rows (don't show an active chip while unrelated rows remain visible).

---

## Conventions

- Standalone components, `ChangeDetectionStrategy.OnPush`, signals for state.
- Strong typing over the JSON shape (optional/nullable where the data is).
- Component selector prefix: `app-` (or `wt-` if mimicking Seqera closely).
- Structure:
  ```
  src/app/core/        models, runs.service, derived metrics, needs-attention
  src/app/features/runs/{runs-page,health-bar,runs-table,run-drawer}
  src/app/shared/      status-pill, task-bar, skeleton, kpi-card…
  src/styles/          _tokens.scss, _theme.scss, _motion.scss
  ```
- Accessibility is a first-class requirement, not a pass at the end: keyboard
  reachability (↑/↓ between runs, Esc closes drawer), focus management, semantic
  markup, `aria-sort`/`aria-pressed`, AA contrast.

## Scope (time-boxed)

**Build:** health bar + filters, risk-sorted table, drawer (Overview in full),
the four states, accessibility, both routes, README.

**Defer (note in README):** live streaming/auto-refresh, virtual scrolling,
Config/Inputs/Outputs/Containers tabs, run comparison, real history, role-based views.

## Evaluation criteria (weight each equally)

1. Information design — health readable at a glance; failed vs succeeded vs running legible.
2. Component & code structure — clear boundaries, typing, non-brittle data handling.
3. States — loading / empty / failed handled with intent.
4. Interaction & polish — microinteractions, transitions, responsive, detail.
5. Accessibility — keyboard, focus, semantics, contrast.

The README's reasoning is half the assessment: explain interaction and component choices.