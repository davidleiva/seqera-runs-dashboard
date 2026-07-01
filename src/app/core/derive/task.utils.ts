import type { RawRun } from '../models/raw-run.model';
import type { TaskBreakdown } from '../models/run.model';

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
