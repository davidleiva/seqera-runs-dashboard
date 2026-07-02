# Spec: `run-row` + atoms (Storybook)

Build bottom-up (atoms first, then the `run-row` molecule). Every component is
**presentational**: `input()` in, `output()` out, `OnPush`, no service injection
(see `angular-architecture` skill). Every variant below maps to a **real dataset
state** — no invented data. Use the `storybook-stories` skill for the CSF pattern.

The list is a **semantic table**: `<table>` with `<th scope="col">` + `aria-sort`,
and each row is `<tr app-run-row [run]="vm" [selected]="..." (select)="...">`.

---

## Component tree

```
run-row  (molecule = <tr>)
├── status-pill        (atom)
├── run-identity       (atom)   name + pipeline + optional "needs attention" tag
├── user-cell          (atom)   avatar + userName | "—"
├── time-cell          (atom)   submitted, formatted
├── duration-label     (atom)   "13m 4s" | "—"
├── task-bar           (atom)   segmented bar + counts | "No task data"
├── cost-label         (atom)   "$0.03" | "—"
├── retries-cell       (atom)   number
├── executor-pill      (atom)   awsbatch | local
└── select-affordance  (atom)   chevron + selected/focus state
```

---

## Stories per component

### atom: `status-pill`
Input: `status: RunStatus`, optional `exitLabel?: string`.
Stories: **Succeeded**, **Failed** (`exit 0`), **Running**, **Submitted**, **Cancelled**.
A11y: icon + text (never colour alone); text colour uses the darkened token.

### atom: `task-bar`
Input: `breakdown: TaskBreakdown | null`.
Stories: **AllSucceeded** (50/50), **WithFailures** (47/1/2 of 50), **AllCached**,
**RunningPartial** (showcase), **NoData** (`null` → renders "No task data").

### atom: `executor-pill`
Stories: **AwsBatch**, **Local**.

### atom: `run-identity`
Stories: **Default**, **NeedsAttention** (tag visible), **LongName** (ellipsis/truncation).

### atom: `duration-label` / `cost-label`
Stories: **WithValue**, **Null** ("—"). (Can be one story file with both args.)

### atom: `user-cell`
Stories: **WithUser**, **NoUser** (`null` → "—").

### molecule: `run-row`
Inputs: `run: RunVM`, `selected: boolean`. Output: `select`.
Stories (each uses a fixture below):
1. **Failed** — `failedViralrecon`
2. **FailedSelected** — `failedViralrecon`, `selected: true`
3. **Succeeded** — `succeededRnaseq`
4. **SucceededNeedsAttention** — `succeededWithFailedTask`
5. **Running** — `runningShowcase` (progress visible)
6. **Submitted** — `submittedQueued`
7. **Cancelled** — `cancelledNoData` (duration "—", task-bar "No task data")
8. **FailedDegraded** — `failedNoMessage` (no error text, exit "—")
9. **Skeleton** — loading variant (own input or a `skeleton-row` atom)
10. **LongName** — `succeededRnaseq` with a very long `name`
11. Interaction: **HoverFocus** (document `:hover` / `:focus-visible`; verify Tab + Enter emits `select`)

Wrap row stories in a `<table><tbody>…</tbody></table>` decorator so the `<tr>`
renders correctly and A11y addon sees valid table semantics.

---

## Fixtures (`run-row` consumes the clean `RunVM`, not raw JSON)

Place in `src/app/features/runs/run-row/run-row.fixtures.ts`. Shapes follow the
`RunVM` from the `runs-data-contract` skill. Values are derived from the real dataset.

```ts
import { RunVM } from '../../../core/models';

export const failedViralrecon: RunVM = {
  id: 'r-viralrecon-0626',
  name: 'viralrecon-illumina_community-showcase_20260626_5816618021e0482',
  pipeline: 'nf-core/viralrecon',
  status: 'FAILED',
  needsAttention: true,
  user: 'adamtalbot',
  submittedLabel: 'Jun 26, 2026 · 14:58',
  durationMs: 431094, durationLabel: '7m 11s',
  cost: 0.01, costLabel: '$0.01',
  retries: 1,
  executor: 'awsbatch',
  exitStatus: 0,                      // failure with a success exit code
  tasks: { total: 50, succeeded: 47, failed: 1, aborted: 2, cached: 0 },
  error: {
    process: 'ABACAS',
    cause: 'Host EC2 (instance i-09ab3974cb8bc0021) terminated.',
    raw: "Error executing process > 'NFCORE_VIRALRECON:…:ABACAS (SAMPLE1_PE)'\nCaused by:\n  Host EC2 instance terminated.",
  },
};

export const succeededRnaseq: RunVM = {
  id: 'r-rnaseq-cc', name: 'rnaseq_community-showcase_20260622_ccc9e30675f0468',
  pipeline: 'nf-core/rnaseq', status: 'SUCCEEDED', needsAttention: false,
  user: 'adamtalbot', submittedLabel: 'Jun 22, 2026 · 14:54',
  durationMs: 884718, durationLabel: '14m 44s', cost: 0.05, costLabel: '$0.05',
  retries: 0, executor: 'awsbatch', exitStatus: 0,
  tasks: { total: 50, succeeded: 50, failed: 0, aborted: 0, cached: 0 },
  error: null,
};

export const succeededWithFailedTask: RunVM = {   // SUCCEEDED but needs attention
  id: 'r-serene', name: 'serene_albattani', pipeline: 'nf-core/rnaseq',
  status: 'SUCCEEDED', needsAttention: true,       // 1 failed task + 1 retry
  user: 'deekshapm05', submittedLabel: 'Jun 24, 2026 · 10:50',
  durationMs: 784042, durationLabel: '13m 4s', cost: 0.03, costLabel: '$0.03',
  retries: 1, executor: 'awsbatch', exitStatus: 0,
  tasks: { total: 50, succeeded: 49, failed: 1, aborted: 0, cached: 0 },
  error: null,
};

export const cancelledNoData: RunVM = {            // edge case
  id: 'r-tender', name: 'tender_shockley', pipeline: 'nf-core/rnaseq',
  status: 'CANCELLED', needsAttention: false,
  user: 'alex.smith', submittedLabel: 'Jun 22, 2026 · 12:50',
  durationMs: null, durationLabel: '—', cost: null, costLabel: '—',
  retries: 0, executor: 'local', exitStatus: null,
  tasks: null,                                     // → task-bar shows "No task data"
  error: null,
};

export const failedNoMessage: RunVM = {            // edge case: failed, no error text
  id: 'r-scruffy', name: 'scruffy_colden', pipeline: 'nextflow-io/rnaseq-nf',
  status: 'FAILED', needsAttention: true,
  user: 'john.doe', submittedLabel: 'Jun 21, 2026 · 09:11',
  durationMs: 7615, durationLabel: '8s', cost: null, costLabel: '—',
  retries: 0, executor: 'local', exitStatus: null,
  tasks: null,
  error: null,                                     // no errorMessage → generic state
};

export const runningShowcase: RunVM = {            // showcase only
  id: 'r-sick', name: 'sick_wozniak', pipeline: 'nf-core/viralrecon',
  status: 'RUNNING', needsAttention: false,
  user: 'dev-intern', submittedLabel: 'Jun 30, 2026 · 14:33',
  durationMs: null, durationLabel: 'running', cost: null, costLabel: 'est. $0.10',
  retries: 0, executor: 'awsbatch', exitStatus: null,
  tasks: { total: 50, succeeded: 20, failed: 0, aborted: 0, cached: 0, running: 4 },
  error: null,
};

export const submittedQueued: RunVM = {
  id: 'r-sub', name: 'gloomy_edison', pipeline: 'nf-core/viralrecon',
  status: 'SUBMITTED', needsAttention: false,
  user: 'ycbkqin', submittedLabel: 'Jun 30, 2026 · 15:02',
  durationMs: null, durationLabel: '—', cost: null, costLabel: '—',
  retries: 0, executor: 'awsbatch', exitStatus: null,
  tasks: null, error: null,
};
```

> If the final `RunVM`/`TaskBreakdown` field names differ, treat these as the
> intended shape and adjust the fixtures to match the real model — do not change
> the model to fit the fixtures.

---

## Notes

- `addon-a11y` is enabled — keep every story passing (contrast, roles, name).
- Stories double as visual documentation of the **states** criterion: a reviewer can
  see failed / running / cancelled / degraded / loading at a glance.
- Build order: atoms (+stories) → `run-row` (+stories) → `runs-table` organism.