# Spec: `run-drawer` organism (Storybook)

> Self-contained for a second agent (e.g. Codex) that does NOT load the Claude Code
> skills. The must-know token / motion / a11y rules are inlined below. Read `CLAUDE.md`
> for project context. This component is built in **Storybook with fixtures** and does
> not depend on the data layer.

The detail panel that slides in when a run is selected. **Presentational**: receives
the selected run via `input()`, emits `close`, injects no services, `OnPush`, standalone.

---

## Component contract

```ts
@Component({ selector: 'app-run-drawer', standalone: true,
            changeDetection: ChangeDetectionStrategy.OnPush })
class RunDrawerComponent {
  run = input<RunDetailVM | null>(null);   // null => panel not shown
  close = output<void>();                    // X button or Esc
}
```

- Open/closed is derived from `run` being non-null (or wrap with `[open]` in the app).
- No data fetching, no router — pure render from the input.

## Layout — inverted pyramid (most urgent first)

1. **Header**: status badge (colour + icon + text) · run name (truncates) · pipeline +
   tags · actions (star, kebab) · **close (X)**.
2. **Tabs**: `Overview` (build in full) · `Tasks` · `Metrics` · `Config` · `Logs`
   (lighter / stubbed — a placeholder panel is fine).
3. **Overview body** depends on status:

   **FAILED (with error):**
   1. **Error card first** — soft-red card: "Error · process {name}", the parsed
      `Caused by:` cause, a **Copy** button (copies the raw error/command), and a
      **disabled** "✨ Explain error (AI) — coming soon" stub.
   2. **Metadata**: user, submitted, started, completed, duration, exit status, work dir (copy).
   3. **Task breakdown**: segmented bar + Succeeded / Failed / Aborted / Cached counts.
   4. **Cost & resources**: total cost, CPU efficiency %, peak CPUs, memory peak.
   5. **Top resource usage by process**: 3 rows (process · bar · % ), from metrics.

   **SUCCEEDED:** replace the error card with a calm success summary line; sections 2–5
   identical. If `needsAttention`, show a subtle attention note (e.g. "1 task failed,
   1 retry") — don't hide it.

   **FAILED with no error (`failedNoMessage`):** render the failed state with an
   **honest generic message** ("This run failed but reported no error message."), exit
   "—". Do NOT invent a cause. Sections that have no data are omitted or show placeholders.

   **CANCELLED / no tasks (`cancelledNoData`):** degrade per section — "No task data
   available", duration "—", no cost/resources. Never compute over null. No crash.

   **RUNNING:** show a progress summary (succeeded/running of total) instead of a final
   task breakdown; cost may be an estimate.

## Behaviour, motion & a11y (inlined — no skills available to the second agent)

- **Slide-in** from the right: `transform: translateX(100%) -> 0`, **180ms**,
  ease-out `cubic-bezier(.2,.8,.2,1)`. Fade the scrim if used.
- **Respect reduced motion**: under `@media (prefers-reduced-motion: reduce)` make it
  instant (no transform/transition).
- **Keyboard**: `Esc` emits `close`. On open, move focus into the drawer (the close
  button or heading); on close, return focus to the element that opened it. Trap focus
  while open. `role="dialog"`, `aria-labelledby` = the run-name heading.
- **Copy button**: on click, copy + swap to a check with "Copied!" for ~1.2s.
- **Status colours — icon + text, never colour alone.** Use the darkened text variants
  for AA on white: success text `#15803D`, failed `#B91C1C`, running `#1D4ED8`,
  attention `#B45309`, cancelled `#475569`. Fills/borders may use `#198754 / #DC3545 /
  #2563EB / #D97706 / #64748B`. Never `#FFC107` as text. Primary/links/focus = `#4256E7`.
- Spacing on a 4/8px scale; radius 4px; font Inter, tabular-nums on all figures.

## Fixtures

The drawer needs more fields than the row. Define `RunDetailVM` extending the row VM:

```ts
interface RunDetailVM extends RunVM {
  startedLabel: string;        // "Jun 26, 2026 · 14:58:55" | "—"
  completedLabel: string;
  workDir: string;
  resources: {                 // null when unavailable
    cpuEfficiencyPct: number; peakCpus: number; memoryPeakLabel: string;
  } | null;
  topProcesses: { name: string; valuePct: number }[];   // [] when no metrics
  commandLine?: string;        // for the Copy button
}
```

Extend the existing `run-row.fixtures.ts` (or add `run-drawer.fixtures.ts`) with detail
fields. Example for the failed run:

```ts
export const failedViralreconDetail: RunDetailVM = {
  ...failedViralrecon,
  startedLabel: 'Jun 26, 2026 · 14:58:55',
  completedLabel: 'Jun 26, 2026 · 15:06:06',
  workDir: 's3://nf-tower-bucket/viralrecon-illumina/work-20260626/22/6ff7d2…',
  resources: { cpuEfficiencyPct: 66, peakCpus: 58, memoryPeakLabel: '222 GB' },
  topProcesses: [
    { name: 'SPADES', valuePct: 78 },
    { name: 'BWA_MEM_ALIGN', valuePct: 42 },
    { name: 'SAMTOOLS_SORT', valuePct: 34 },
  ],
};
```

Provide detail fixtures for: `failedViralreconDetail`, `succeededRnaseqDetail`,
`succeededWithFailedTaskDetail`, `failedNoMessageDetail` (resources null, topProcesses
[]), `cancelledNoDataDetail` (resources null, tasks null), `runningShowcaseDetail`.
> If the real `RunDetailVM` field names differ later, adjust fixtures to the model — not
> the model to the fixtures.

## Stories

Wrap in a fixed-height container so the slide-in panel renders fully.

1. **FailedWithError** — `failedViralreconDetail` (the headline case, error-first).
2. **SucceededHealthy** — `succeededRnaseqDetail`.
3. **SucceededNeedsAttention** — `succeededWithFailedTaskDetail`.
4. **FailedNoMessage** — `failedNoMessageDetail` (generic honest message, no cause).
5. **CancelledNoData** — `cancelledNoDataDetail` (degraded sections, "—").
6. **Running** — `runningShowcaseDetail` (progress summary).
7. **Tabs** — show a non-Overview tab (e.g. Logs) rendering its placeholder.

Interaction (play functions):
- **Closes on Esc** — pressing Esc emits `close`.
- **Copy** — clicking Copy shows "Copied!".
- **FocusOnOpen** — focus lands inside the drawer.

Keep `addon-a11y` green on every story (dialog role + label, focus order, contrast,
icon+text status).