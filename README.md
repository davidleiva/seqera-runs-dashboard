# Seqera Runs Dashboard

A pipeline run status dashboard: one screen to read the health of your workflow runs at a
glance, drill into any run, and understand *why* something failed and *what to do next*.

> **Live demo:** _<add deployed link>_ · **Walkthrough:** _<add screen recording>_

## TL;DR

A **triage tool**, not a table: glance at run health, click a lens to scope, open a run to
see **why it failed and what to do next**. A focused slice, reasoned end-to-end — the full
story is below, but the keys are:

- **Reads health in one second.** A glance layer with real hierarchy (verdict + status bar +
  detected pattern), where every number is a clickable lens into the list — so *"which
  ones?"* is always one click away.
- **Product judgment, not raw status.** A derived, explainable *needs-attention* signal
  surfaces the non-obvious problems (a "succeeded" run that retried or wasted resources),
  not just the red ones.
- **Guides toward the solution — honestly.** Known-error hints, the failed *task* as the
  unit of action, and an *AI copilot* vision shown as a labelled demo (we never fabricate a
  diagnosis).
- **The messy data is the point.** The sample's real edge cases (failed-with-no-message,
  cancelled-with-no-data, failure with a "success" exit code) are handled with intent — a
  single normalization layer and tested pure functions keep it non-brittle.
- **Structured & accessible.** One smart container, everything else presentational; strict
  typing; an independent **code audit** and an **axe accessibility audit**, both re-verified
  green.
- **How a design engineer ships fast without losing rigor.** Research-first, reusable
  skills, docs-as-specs, and AI tooling directed deliberately — the judgment is the author's,
  the AI executed.

## Run it

```bash
npm install
npm start            # ng serve → http://localhost:4200
```

Routes:

- **`/sample`** — the provided `runs.json`, untouched (7 runs), including its messy real
  edge cases. This is the honest baseline.
- **`/showcase`** — an amplified, schema-valid dataset (~50 runs, a live *Running* run,
  dates spread out) so the design can be seen at scale. **The showcase data is
  synthetic** — see "A note on honesty" below.

Other useful commands:

```bash
npm run storybook        # component library (atoms → organisms), every state as a story
npm run test-storybook   # axe accessibility checks across all stories
npm test                 # unit tests (adapter, pure functions, containers)
```

Stack: **Angular (standalone, signals, OnPush) + Angular Material + SCSS**, Storybook for
the component library. Data is static (no backend).

---

## 1. What we built

The screen is a **master–detail view** built around three ideas.

**A glance layer that reads health in one second.** Instead of a flat grid of equal
numbers, a summary block with real hierarchy: an actionable headline
("*8 runs need your attention · 3 failed + 5 succeeded with issues*"), a single segmented
status bar showing the whole distribution, and a detected-pattern insight
("*2 runs failed on the same process*"). Every element is a **lens**: click it and the
table filters to exactly those runs — so "which ones?" is always one click away.

**A dense, risk-sorted table.** Failures first, then runs that need attention, then the
rest. Status is always **colour + icon + text** (never colour alone). Each row answers one
triage question per column (what · health · who · when · how long · how healthy inside ·
cost · retries · where). Details that don't belong in a glance live in the drawer.

**A detail drawer that leads with the answer.** For a failure, the drawer opens
**error-first**: the parsed cause, then metadata, task breakdown, and cost/resources —
inverted pyramid, because that's why you opened it.

**Guiding toward the solution — honestly.** Where the error matches a known pattern (e.g.
"*Host EC2 instance terminated*" → spot interruption), we surface a plain-language cause
and suggested next steps. We connect the failure to its **failed task** (the real unit of
action) with affordances to open its work dir or copy its command. And an *"Explain with
AI"* affordance signals where an AI copilot fits — shown as a labelled demo, not claimed as
live (see honesty note).

**The small-big decisions.** A few choices that carry more weight than they look:
*needs-attention* is a derived, opinionated signal (a succeeded run with a failed task or
retries still deserves a look) — surfaced with a consistent marker and always explainable.
KPI/summary items filter but never duplicate the status dropdown (they express lenses the
dropdown can't: attention, error-pattern). The status pill leads the row but yields to the
run name in the drawer header. Summary counts are decoupled from filters and pagination —
they reflect the whole workspace, always.

## 2. Why we built it this way

The user is a **scientist or platform admin monitoring hundreds of runs**. Their
job-to-be-done isn't "read every run" — it's **triage**: *is anything wrong, how bad, which
ones, and what do I do about it?* Every decision above serves that flow:

- **Glance → scope → act.** Health verdict → click a lens to scope → open the run → see the
  cause and the next step. The dashboard takes a stance ("look here") rather than dumping
  neutral data.
- **Product judgment over raw status.** Anyone can show `status = failed`. Surfacing the
  *non-obvious* problems (a green run that retried, wasted efficiency) is where domain
  understanding shows.
- **Designed for the real, live product.** Running/Submitted states, pagination and the
  detail tabs exist because a monitoring tool needs them — even though the sample data
  doesn't exercise all of them.

Throughout: standard UX/product practice — clear hierarchy, honest affordances, reversible
non-destructive filtering, and accessibility treated as a first-class requirement, not a
final pass.

## 3. How it maps to the brief

| Criterion | Where it shows up |
|---|---|
| **Information design** | The glance layer + risk sort; failed/succeeded/running legible instantly via colour+icon+text; the "N need attention" verdict with an inline breakdown. |
| **Component & code structure** | One smart container; everything else presentational (`input()`/`output()`, `OnPush`). A single JSON→domain adapter; derivations as pure, tested functions. Verified by an independent code audit. |
| **States** | Loading (skeleton, not spinner), empty (with "clear filters"), failed (error-first drawer), and a global parse-error fallback — plus the dataset's real degraded cases. |
| **Interaction & polish** | Master-detail with a Material drawer (animation, focus-trap, Esc), auto-animated list on filter/sort, sticky header, keyboard row navigation, count-ups. Reduced-motion respected. |
| **Accessibility** | Keyboard reachable, focus managed and restored, semantic table + landmarks, AA contrast (tokens tuned to pass), axe green across all stories. |

Minimum bar met: health at a glance, per-run detail, and loading / empty / failed handled
with intent.

## 4. How we built it

A **double-diamond** shape, executed with AI tooling directed deliberately — which is how
a modern design engineer prototypes fast without losing rigor.

1. **Discover** — read the brief and the *actual* dataset (its shape, and crucially its
   messy edge cases: a cancelled run with no data, a failed run with no error message, a
   failure with a "success" exit code), and studied the real Seqera product to match its
   design language (Angular Material, Inter, the `#4256E7` brand).
2. **Define** — converged on the triage job-to-be-done and the master-detail + glance
   concept, comparing multiple AI-generated concept explorations to pressure-test the
   direction before committing.
3. **Develop** — a structured production pipeline: reusable **skills** (design tokens +
   a11y, data contract, motion, Angular architecture, Storybook patterns) and
   **docs-as-specs** per component, built bottom-up (atoms → organisms → page) in Storybook
   with real-shaped fixtures, then wired to data.
4. **Deliver** — an **independent code audit** (strict typing, boundaries, non-brittle data
   handling — it caught real bugs and a duplicate-implementation to consolidate) and an
   **accessibility audit** (axe on every story + a keyboard pass), both re-verified green.

## 5. What we left out, and why

Deliberately deferred to keep a focused, well-built slice:

- **Multi-select filters** — single status + executor + search composes well; multi-select
  is the classic "with more time."
- **Favourite / bulk row actions** — outside the monitoring/triage job; add persistence and
  compete with the row's primary click.
- **Full interactive task drill-down** — the failed-task callout covers the high-value 80%.
- **Live streaming / auto-refresh** and **row virtualisation** — pagination is enough at
  this scale; virtualisation is the next step for tens of thousands of runs.

### A note on honesty

- **`/sample` is the real data, untouched** — including the ugly cases, which are where
  robust data handling is proven. **`/showcase` is synthetic** (schema-valid) to exercise
  states the 7-run sample lacks (live runs, scale, trends).
- The **AI "Explain error"** is a **labelled demo**, not live inference — real AI (log
  summarisation, cause + fix suggestion) is documented as future work; we don't fabricate
  diagnoses.
- **"Retry run"** is a placeholder (no backend).
- One accessibility flag (`aria-hidden-focus` on Angular CDK's focus-trap anchors) is a
  known framework false-positive, excluded from the axe scan with justification rather than
  hidden.
```