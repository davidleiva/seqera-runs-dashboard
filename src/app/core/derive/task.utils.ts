import type { RawRun } from '../models/raw-run.model';
import type { FailedTaskDetail, TaskBreakdown } from '../models/run.model';
import { shortProcessName } from './format.utils';

export function taskBreakdown(raw: RawRun): TaskBreakdown | null {
  // Prefer tasks array when available and non-empty
  if (raw.tasks && raw.tasks.length > 0) {
    let succeeded = 0;
    let failed = 0;
    let aborted = 0;
    let cached = 0;
    let running = 0;

    for (const t of raw.tasks) {
      switch (t.status) {
        case 'COMPLETED': succeeded++; break;
        case 'FAILED':    failed++;    break;
        case 'ABORTED':   aborted++;   break;
        case 'CACHED':    cached++;    break;
        case 'RUNNING':   running++;   break;
        // ignore unknown statuses
      }
    }

    const bd: TaskBreakdown = {
      total: raw.tasks.length,
      succeeded,
      failed,
      aborted,
      cached,
    };
    if (running > 0) bd.running = running;
    return bd;
  }

  // Fallback to load counters
  const { succeeded, failed, aborted, cached, running } = raw.load;
  const total = succeeded + failed + aborted + cached;
  if (total === 0 && running === 0) return null;

  const bd: TaskBreakdown = { total: total + running, succeeded, failed, aborted, cached };
  if (running > 0) bd.running = running;
  return bd;
}

/**
 * The unit of action for a failure: the first task explicitly `status ===
 * 'FAILED'`, falling back to a non-zero `exit` when nothing carries that exact
 * status. Reads `tasks[]` directly rather than trying to reconcile with the
 * run-level error banner — real data can legitimately disagree about *which*
 * process failed (e.g. the viralrecon banner blames ABACAS while the actual
 * FAILED entry in `tasks[]` is UNICYCLER). Degrades to `null` — never
 * fabricates a task — when there's no `tasks[]` at all (cancelled / early
 * failure edge cases, or runs whose failed count only comes from the
 * `load.*` counter fallback in `taskBreakdown`).
 */
export function findFailedTask(raw: RawRun): FailedTaskDetail | null {
  const tasks = raw.tasks;
  if (!tasks || tasks.length === 0) return null;

  const task = tasks.find(t => t.status === 'FAILED') ?? tasks.find(t => t.exit !== 0) ?? null;
  if (!task) return null;

  return {
    name: task.name,
    process: shortProcessName(task.process),
    exit: task.exit,
    workDir: task.workdir,
    script: task.script ?? null,
  };
}
