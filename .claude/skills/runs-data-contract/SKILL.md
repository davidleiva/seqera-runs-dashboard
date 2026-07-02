---
name: runs-data-contract
description: TypeScript data model, edge cases and derived metrics for the Seqera runs.json dataset. Use when typing run data, parsing the dataset, computing stats, or handling missing/failed run data.
---

# Runs data contract

The dataset is `{ "runs": Run[] }`. The real `runs.json` has **7 runs** with
deliberately messy data. Type defensively and derive values — do not trust
pre-computed percentages or assume fields exist.

## Model (type optional/nullable exactly where the data is)

```ts
type RunStatus = 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'RUNNING' | 'SUBMITTED';

interface Run {
  id: string;
  runName: string;
  projectName: string;            // e.g. "nf-core/rnaseq"
  repository: string;
  revision: string;
  commitId: string;
  sessionId: string;
  commandLine: string;
  status: RunStatus;
  userName: string | null;
  submit: string;                 // ISO
  start: string | null;           // null if never started (e.g. cancelled)
  complete: string | null;
  duration: number | null;        // ms; null when not applicable
  success: boolean;
  exitStatus: number | null;      // can be null; can be 0 even on FAILED
  errorMessage: string | null;    // can be null even on FAILED
  resume: boolean;
  container: string | null;
  containerEngine: string | null;
  workDir: string;
  launchDir: string;
  profile: string;
  nextflow?: { version: string; build: string; timestamp: string };
  manifest?: { name: string; description?: string; ... };   // may be absent
  stats: Stats;
  load: Load;
  metrics?: ProcessMetric[];      // may be absent
  tasks?: Task[];                 // may be absent (cancelled / early failure)
}

interface Stats {
  succeedCount: number; succeedPct: number | null; succeedDuration: number;
  failedCount: number;  failedPct: number | null;   // OFTEN null — derive instead
  cachedCount: number;  cachedPct: number | null;
  ignoredCount: number; ignoredPct: number | null;
  computeTimeFmt: string | null;
}

interface Load {                  // per-run resource roll-up
  cpus: number; cpuTime: number; cpuLoad: number; cpuEfficiency: number;
  memoryReq: number; memoryRss: number; memoryEfficiency: number;
  readBytes: number; writeBytes: number;
  cost: number | null;            // USD; null when unknown
  peakCpus: number; peakTasks: number; peakMemory: number;
  pending: number; submitted: number; running: number;   // live counters (0 here)
  succeeded: number; failed: number; cached: number; aborted: number;
  retries: number;
  executors: string[] | null;     // e.g. ["awsbatch"], ["local"]
}

interface Task {
  taskId: number; name: string; process: string;
  status: 'COMPLETED' | 'FAILED' | 'ABORTED' | 'RUNNING' | string;
  exit: number; duration: number; realtime: number;
  pcpu: number; pmem: number; memory: number; cpus: number;
  cost?: number; machineType?: string; container?: string; /* ...many more */
}

interface ProcessMetric {         // per-process quartiles, for the drawer
  process: string;
  cpu: { min: number; q1: number; q2: number; q3: number; max: number; mean: number; /* +labels */ };
  cpuUsage: {...}; mem: {...}; vmem: {...}; time: {...}; reads: {...}; writes: {...};
}
```

## Edge cases that MUST be handled (real rows)

- `tender_shockley` — CANCELLED: no `tasks`, no `metrics`, `duration` null, `start`
  null. Show "No task data available", duration "—". Never compute over null.
- `scruffy_colden` — FAILED: `errorMessage` null AND `exitStatus` null, no tasks/cost.
  Drawer must render a failed state **without** an error string — honest generic
  message, do not invent a cause.
- Failed `viralrecon` run: `exitStatus: 0` (failure with success code). Trust
  `status`, not just the exit code, to decide health.
- `failedPct: null` while a task failed → **derive percentages from counts**, never
  read `*Pct` directly.
- `manifest` / `metrics` / `tasks` / `cost` / `userName` / `executors` may be missing
  or null → optional chaining + per-section fallbacks. The UI degrades by section.

## Derived helpers (put in core)

- `durationFmt(ms | null)` → "13m 4s" / "8s" / "—".
- Percentages from `stats` counts: `pct = count / (succeed+failed+cached+ignored)`.
- `taskBreakdown(run)` from `tasks` status counts (COMPLETED/FAILED/ABORTED/…), with a
  `tasks`-absent fallback to `load.succeeded/failed/...`.
- `costFmt(n | null)` → "$0.03" / "—".

## needs-attention rule (clear signals only)

A run "needs attention" when any of:
- it FAILED, OR
- `status === 'SUCCEEDED'` but it has any failed task (`stats.failedCount > 0` or a
  FAILED task), OR
- `load.retries > 0`, OR
- efficiency very low (e.g. `load.cpuEfficiency < 20` or `memoryEfficiency < 10`).

Do **not** flag on guessed duration/cost anomalies — too brittle to defend.

## /sample vs /showcase

- `/sample` uses `runs.json` verbatim. Keep its 7 runs and their real numbers
  (e.g. 50 tasks, not inflated). Keep the edge cases intact.
- `/showcase` uses an amplified but schema-valid dataset: more runs, one live RUNNING
  run with partial progress, and enough runs across dates to aggregate real per-day
  trend sparklines. Never fake a "+12% vs 7d" without computing it from the data.