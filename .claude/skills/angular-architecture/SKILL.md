---
name: angular-architecture
description: Code structure rules for this Angular app — container/presentational split, atomic components, signals, data normalization and pure functions. Use when creating any component, service, type, or deciding where logic lives.
---

# Angular architecture & code structure

This directly targets the "Component & code structure" criterion: clear component
boundaries, reasonable typing, data handling that isn't brittle. Follow on every file.

## The #1 rule: container vs presentational

- **One container per feature** (the *page*, e.g. `RunsPageComponent`): holds state,
  injects services, orchestrates. It is the only component that knows where data
  comes from.
- **Everything else is presentational ("dumb")**: receives data via `input()`, emits
  via `output()`, **injects no data services**, has no side effects. Pure render.
- Benefits: testable, reusable, obvious boundaries. This is what reviewers look for.

## Atomic component map (build small, compose up)

- Atoms: `status-pill`, `task-bar`, `kpi-card`, `skeleton`, `copy-button`.
- Molecules: `filter-bar`, `run-row`.
- Organisms: `health-bar`, `runs-table`, `run-drawer`.
- Page: `runs-page` (the single container).

Single Responsibility per component. If a component does two things, split it.

## Modern Angular only

- **Standalone components** (no NgModules). `ChangeDetectionStrategy.OnPush` everywhere.
- **Signals** for all state: `signal()`, `computed()`, `effect()` (sparingly).
- **Signal inputs/outputs**: `input.required<Run>()`, `output<Run>()`. No `@Input`/`@Output` decorators.
- `inject()` over constructor injection.
- New control flow: `@if`, `@for (... ; track item.id)`, `@switch`. Always `track`.
- `providedIn: 'root'` services.

## Data handling that isn't brittle (the key move)

- **Normalize once at the service boundary.** `RunsService` fetches raw JSON and maps
  it through an adapter into a clean domain model where nullables are resolved and
  derived fields are precomputed. Components consume the clean model — no `?.` sprawl,
  no defensive logic scattered across templates.

  ```ts
  // raw (messy) -> domain (clean)
  interface RunVM {
    id: string; name: string; pipeline: string;
    status: RunStatus; needsAttention: boolean;
    durationMs: number | null; durationLabel: string;  // "13m 4s" | "—"
    cost: number | null; costLabel: string;
    tasks: TaskBreakdown | null;   // null = "No task data available"
    error: { process?: string; cause?: string; raw?: string } | null;
    // ...only what the UI needs
  }
  ```

- **Derivations are pure functions** in `core/` (functional style, no side effects):
  `durationFmt`, `costFmt`, `needsAttention`, `taskBreakdown`, `pctFromCounts`,
  `sortByRisk`. Each independently unit-testable.
- **Never trust precomputed fields** (e.g. `failedPct` can be null) — derive from counts.
- **Immutability**: treat data as `readonly`; derive, don't mutate. Filtering/sorting
  returns new arrays.

## Where logic lives

- Filtering, sorting, KPI counts = `computed()` signals in the container, fed by pure
  functions. **No logic in templates** beyond simple display.
- View state (selected run, active filter, search term) = signals in the container (or
  a small signal-based store service if it grows).
- Formatting = pure functions or pipes, not inline template expressions.

## Typing

- Strong interfaces (see `runs-data-contract` skill). No `any`. `unknown` at the JSON
  edge, narrowed by the adapter.
- Discriminated union for `RunStatus`. `readonly` fields and arrays where possible.
- Prefer explicit return types on exported functions.

## KISS / DRY / YAGNI / SRP — with judgment

- KISS/YAGNI: build the table this app needs, not a generic configurable grid.
- DRY: each derivation lives in exactly one pure function.
- SRP: one reason to change per file. Components render; services fetch; functions derive.
- Composition over inheritance. Small files over clever ones.

## Testing (proves "not brittle")

Few tests, high value. Use the default **Jasmine + Karma** (don't switch to Jest for a
short exercise). Don't chase 100% coverage or test Material internals. Prioritise:

**A. Pure functions (`core/`) — highest ROI:**
- `durationFmt`: `784042` -> "13m 4s"; `7615` -> "8s"; **`null` -> "—"**.
- `costFmt`: `0.03` -> "$0.03"; **`null` -> "—"**.
- `pctFromCounts`: derives correct %; all-zero counts -> **0, not `NaN`** (divide-by-zero).
- `needsAttention`: one case per signal — FAILED (true), SUCCEEDED with `failedCount>0`
  (true), `retries>0` (true), low efficiency (true), clean run (false).
- `sortByRisk`: failed first, cancelled last, most-recent within a group.
- `taskBreakdown`: from `tasks`; **fallback to `load.*` when tasks absent**; cancelled -> `null`.

**B. Adapter (raw -> RunVM) on the REAL edge cases — what scores most:**
- `tender_shockley` (cancelled, no tasks/duration/start) -> `durationLabel "—"`,
  `tasks: null`, **does not throw**.
- `scruffy_colden` (failed, `errorMessage`/`exitStatus` null) -> honest `error`/null,
  **no crash**.
- `failedPct: null` with `failedCount>0` -> derived pct correct.
- Run missing `manifest`/`metrics`/`cost` -> maps without throwing.

**C. Component tests (few, targeted):**
- `run-drawer`: failed WITH error -> error section first; failed WITHOUT `errorMessage`
  -> generic message, **no crash**.
- `kpi-card`/`health-bar`: clicking a filterable card emits the filter; **Total runs and
  Total cost do NOT emit** (not interactive).
- `runs-table`/`run-row`: renders status as icon+text; renders the edge-case row
  ("No task data"); selecting a row emits `output`.
- Empty state: filter with no matches -> empty component with "Clear filters".

**D. Page-level state test:**
- Applying the "Failed" filter leaves **only** failed runs visible (lock the
  active-filter/visible-rows consistency).

Tests are part of the deliverable's credibility — and explain the strategy (why the
edge cases) in the README.