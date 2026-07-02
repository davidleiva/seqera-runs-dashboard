# Spec: production audit — code + accessibility

Goal: verify the app is production-grade and meets the exercise's scoring, especially
criterion 2 (component & code structure). The author must NOT audit their own code —
run this as an **independent reviewer** (a separate Claude Code instance/worktree or a
review subagent). Output a plain-language report `AUDIT.md` (David can't read .ts), then
fix criticals/majors and re-verify.

## How to run

1. Read the codebase read-only first; do not fix while auditing.
2. Produce `AUDIT.md`: findings grouped by **severity** (Critical / Major / Minor), each with:
   file(s), a **plain-language** explanation of the issue and why it matters, and the fix.
3. Fix all Critical + Major. List Minor as recommendations.
4. Re-run the verification commands; confirm green. Update `AUDIT.md` with the final state.

Optionally use the `engineering:code-review` skill for the diff-level pass.

---

## A. Criterion 2 — component & code structure (primary focus)

**Boundaries**
- List every component and classify **container vs presentational**.
- Exactly one smart container per feature (`runs-page` / `runs-page-v2`). Every other
  component must: take `input()`, emit `output()`, be `OnPush`, and **inject NO data
  services**. Flag any presentational component that injects a service or holds business
  logic, or any logic living in a template.
- Verify single responsibility: one reason to change per file; no god-components.

**Typing**
- No `any`. `unknown` only at the JSON boundary, narrowed in the adapter.
- `RunStatus` is a discriminated/union type; models (`RunVM`, `RunDetailVM`, `SummaryVM`,
  `SortState`, `SummaryLens`) match the data shape; nullable fields typed as nullable.
- Explicit return types on exported functions. `readonly` where data is immutable.
- No non-null assertions (`!`) masking real nullability. `strict` mode on in tsconfig.

**Data handling isn't brittle**
- A single normalization point (`toRunVM`/`toRunDetailVM`): raw → clean; nulls resolved;
  labels/flags precomputed. Components never touch raw fields or scatter `?.` everywhere.
- Percentages derived from counts, never read from `*Pct`.
- Defensive on missing `manifest`/`metrics`/`tasks`/`cost`/`executors`/`userName`.
- No crash on the real edge cases: cancelled-no-tasks, failed-no-message (`errorMessage`/
  `exitStatus` null), `exitStatus: 0` on a failed run. Confirm with the adapter tests.
- Immutability: filtering/sorting/paginating returns new arrays; no mutation of source.

## B. Angular production best practices

- Standalone components + `ChangeDetectionStrategy.OnPush` everywhere; signals for state;
  `computed()` for derived; minimal `effect()` (and NO signal writes inside effects).
- `inject()` over constructor DI. New control flow (`@if`/`@for`/`@switch`) with **`track`**
  on every `@for`.
- No business logic or expensive function calls in templates (use `computed`/pipes).
- **No subscription leaks**: prefer signals/`async`; any manual `subscribe` uses
  `takeUntilDestroyed` or is cleaned up. No leftover timers/listeners.
- `run-row` selector is `tr[app-run-row]` (valid table semantics); table header + rows
  share one column model; sticky header uses a single scroll container.
- Pagination: page state in container; reset-to-0 in handlers (not effect); clamp;
  summary decoupled (counts over the full set).
- No dead code, commented-out blocks, `console.log`, TODOs left dangling, unused imports.
- Consistent naming and file structure; SCSS uses tokens (no hardcoded hex outside
  `_tokens.scss`).
- Routing: additive v2 routes intact; consider `loadComponent` lazy routes if it helps the
  initial bundle (note, don't force).

## C. Other languages / assets

- `runs.json` / `runs.showcase.json`: valid JSON, correct raw schema, no secrets/PII.
- Fixtures/generators: typed, plausible, edge cases preserved.
- No secrets committed; `.gitignore` sane; no stray large files.

## D. Accessibility (criterion 5) — quick pass here, deep in Storybook a11y addon

- Keyboard: rows reachable + selectable (Enter), ↑/↓ move focus, Esc closes drawer, focus
  trap in drawer, focus restored on close. Sort headers and lenses are real `<button>`s.
- Semantics: landmarks (nav/header/section), table uses `th scope` + `aria-sort`, status is
  icon+text (never colour-only), the segmented bar has a text alternative/`aria-label`.
- Contrast: status text uses the darkened AA variants; focus rings visible (`:focus-visible`).
- `prefers-reduced-motion` respected across animations/drawer.
- `@storybook/addon-a11y` green on all stories.

## E. Verification commands (must pass)

```bash
npx tsc --noEmit                 # strict type check, zero errors
ng lint                          # zero lint errors (add eslint if missing)
ng build --configuration production   # builds, no warnings; note bundle size
npm test -- --watch=false        # unit tests pass (adapter/pure fns/container)
npm run build-storybook          # stories build; a11y addon reviewed
```

Report the production bundle size and flag anything unexpectedly large.

---

## Output

`AUDIT.md` at repo root:
- Executive summary in plain language: is it production-ready? does it meet criterion 2?
- Findings by severity with file + plain explanation + fix + status (fixed / recommended).
- Final verification results (commands green, bundle size, a11y).

Write it so a non-Angular reader (David) can trust the verdict without reading `.ts`.
