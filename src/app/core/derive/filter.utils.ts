import type { RunVM, RunStatus } from '../models';
import type { SummaryInsight } from '../../features/runs/runs-summary/runs-summary.models';

export interface FilterParams {
  search: string;
  status: RunStatus | null;
  executor: string | null;
}

/** Whether `run` matches the recurring-failure pattern an insight lens filters to. */
export function matchesInsightFilter(run: RunVM, filter: SummaryInsight['filter']): boolean {
  if (filter.status && run.status !== filter.status) return false;
  if (filter.process && run.error?.process !== filter.process) return false;
  if (filter.executor && run.executor !== filter.executor) return false;
  return true;
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
