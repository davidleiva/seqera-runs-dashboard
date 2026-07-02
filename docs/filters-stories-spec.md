# Spec: filters — `health-bar` + `filter-bar` (Storybook)

> Self-contained for a second agent (e.g. Codex) that does NOT load the Claude Code
> skills. Token / a11y / motion rules are inlined. Read `CLAUDE.md` for context.
> Built in **Storybook with fixtures**; does NOT depend on the data layer.

These are the filtering UI. **They only emit intent — they do not filter anything.**
The actual filtering/sorting lives in the `runs-page` container (built separately by
the other agent) and in pure functions in `core/`. Do not implement filter logic here.

## Scope & boundaries (avoid collisions with the parallel data-layer work)

- Work ONLY in: `src/app/shared/kpi-card/`, `src/app/features/runs/health-bar/`,
  `src/app/features/runs/filter-bar/`.
- **Do NOT touch** `core/models`, `runs.service`, routing, `app.config`, or `runs-page`.
- Define the small types you need (`KpiSummary`, `FilterOption`) **locally** in these
  folders. Do not edit shared models. (The container will reconcile/promote later.)
- `RunStatus` already exists in `core/models`
  (`'SUCCEEDED'|'FAILED'|'CANCELLED'|'RUNNING'|'SUBMITTED'`). Import it read-only; if an
  import cycle is a problem, mirror the union locally and leave a `// TODO: import from core`.

---

## atom: `kpi-card`

```ts
@Component({ selector: 'app-kpi-card', standalone: true, changeDetection: OnPush })
class KpiCardComponent {
  label = input.required<string>();      // "Failed"
  value = input.required<string>();      // "2"  (already formatted; cost is "$0.13")
  sub = input<string>('');               // "29%" or "retries · failed tasks"
  tone = input<'neutral'|'ok'|'fail'|'run'|'attention'|'cost'>('neutral');
  interactive = input<boolean>(false);   // false => display-only (Total runs, Total cost)
  pressed = input<boolean>(false);       // selected/active filter
  badge = input<boolean>(false);         // small red "!" (e.g. attention > 0)
  activate = output<void>();             // only when interactive
}
```

- Interactive cards render as a `<button>` with `aria-pressed`, hover lift (1–2px),
  selected ring in `#4256E7`, `:focus-visible` ring. Click/Enter/Space → `activate`.
- **Non-interactive cards (Total runs, Total cost) must NOT look or behave clickable**
  (render as a `<div>`, no hover lift, no pointer cursor, no `activate`).
- Tone maps to the status colour (icon/dot uses fill; text uses darkened variant).

Stories: **Neutral (Total runs)**, **Succeeded**, **Failed (pressed)**,
**Running**, **NeedsAttention (badge)**, **Cost (non-interactive)**, **Hover/Focus**.

## organism: `health-bar`

```ts
class HealthBarComponent {
  kpis = input.required<KpiSummary>();        // counts + cost + attention (see fixture)
  activeStatus = input<RunStatus | null>(null);
  filter = output<RunStatus | null>();         // toggling a pressed card emits null (clear)
}
interface KpiSummary {
  total: number; succeeded: number; failed: number; running: number;
  submitted: number; cancelled: number; needsAttention: number; totalCostLabel: string;
}
```

- Renders 6 `kpi-card`s: Total runs (neutral, non-interactive), Succeeded, Failed,
  Running, Needs attention (badge when > 0), Total cost (cost, non-interactive).
- Radio behaviour: clicking a card emits its status; clicking the active card again
  emits `null` (clears). Only one active at a time.
- Above the cards, a conditional **criticality headline**: if `failed + needsAttention
  > 0`, an amber line "{n} runs need your attention"; otherwise nothing (calm).

Stories: **Healthy** (all green, no headline), **WithFailures** (Failed pressed +
headline), **AttentionOnly**, **Empty** (all zeros).

## molecule: `filter-bar`

```ts
class FilterBarComponent {
  search = input<string>('');
  status = input<RunStatus | null>(null);
  executor = input<string | null>(null);
  executors = input<string[]>([]);             // options, e.g. ['awsbatch','local']
  searchChange = output<string>();             // emit raw on each keystroke; container debounces
  statusChange = output<RunStatus | null>();
  executorChange = output<string | null>();
  clearAll = output<void>();
}
```

- A search input (with clear ✕), a `Status` dropdown (the long tail: All / each status),
  an `Executor` dropdown, **removable active-filter chips**, and a "Clear all" when any
  filter is active.
- Emit raw search value per keystroke — **do not debounce here** (the container does).
- Chips reflect active `status`/`executor`/`search`; the chip ✕ emits the corresponding
  `*Change(null)` / clears search.
- Use Angular Material `mat-select`, `mat-form-field`, `mat-chip-set` if convenient —
  they bring accessible behaviour; restyle to the tokens below.

Stories: **NoFilters**, **WithSearch**, **WithStatusChip**, **WithMultipleChips**,
**AllActive (Clear all visible)**.

---

## Inlined rules (no skills available to this agent)

- **Status colours — icon + text, never colour alone.** Darkened text variants for AA on
  white: success `#15803D`, failed `#B91C1C`, running `#1D4ED8`, attention `#B45309`,
  cancelled `#475569`. Fills/dots may use `#198754 / #DC3545 / #2563EB / #D97706 /
  #64748B`. **Never `#FFC107` as text.** Primary / links / focus ring / selected = `#4256E7`.
- Surfaces: bg `#F8F9FA`, cards `#FFFFFF`, border `1px #E4E9EF`, radius `4px`.
- Font Inter; `font-variant-numeric: tabular-nums` on every figure. Spacing on 4/8px.
- **Motion**: hover lift and selection use ~120–180ms ease-out. Respect
  `@media (prefers-reduced-motion: reduce)` (make transitions instant).
- A11y: interactive cards are `<button>` with `aria-pressed`; dropdowns and chips keyboard
  reachable; visible `:focus-visible` rings; keep `addon-a11y` green on every story.

## Fixtures (`*.fixtures.ts` in the respective folders)

```ts
export const kpisSample: KpiSummary = {
  total: 7, succeeded: 4, failed: 2, running: 0, submitted: 0, cancelled: 1,
  needsAttention: 3, totalCostLabel: '$0.13',
};
export const kpisHealthy: KpiSummary = {
  total: 12, succeeded: 12, failed: 0, running: 0, submitted: 0, cancelled: 0,
  needsAttention: 0, totalCostLabel: '$0.41',
};
export const executorOptions = ['awsbatch', 'local'];
```

> Keep all values plausible and matching the dataset; if real type names differ later,
> adjust fixtures to the model, not the other way round.