import type { RunVM, RunStatus, KpiStats } from '../models';

export interface FilterParams {
  search: string;
  status: RunStatus | null;
  executor: string | null;
}

export function applyFilters<T extends RunVM>(runs: T[], params: FilterParams): T[] {
  let result = runs;

  const q = params.search.trim().toLowerCase();
  if (q) {
    result = result.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.pipeline.toLowerCase().includes(q) ||
        (r.user?.toLowerCase().includes(q) ?? false),
    );
  }

  if (params.status) {
    result = result.filter(r => r.status === params.status);
  }

  if (params.executor) {
    result = result.filter(r => r.executor === params.executor);
  }

  return result;
}

export function summarize(runs: RunVM[]): KpiStats {
  const counts: Record<RunStatus, number> = {
    FAILED: 0,
    SUCCEEDED: 0,
    RUNNING: 0,
    SUBMITTED: 0,
    CANCELLED: 0,
  };
  let needsAttention = 0;
  let totalCost = 0;

  for (const run of runs) {
    counts[run.status]++;
    if (run.needsAttention) needsAttention++;
    totalCost += run.cost ?? 0;
  }

  return { ...counts, needsAttention, total: runs.length, totalCost };
}
