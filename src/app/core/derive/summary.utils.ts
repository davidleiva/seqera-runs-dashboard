import type { RunStatus, RunVM } from '../models';
import type { RunsSummaryVM, SummaryInsight } from '../../features/runs/runs-summary/runs-summary.models';
import { costFmt } from './format.utils';

/**
 * Recurring-failure pattern across FAILED runs — the differentiator tier of the
 * summary. Only looks at FAILED runs' parsed error process; never guesses from
 * duration/cost. Ties are broken by first-seen order (Map insertion order).
 */
export function detectPatterns(runs: RunVM[]): SummaryInsight | null {
  const byProcess = new Map<string, number>();
  for (const run of runs) {
    const process = run.status === 'FAILED' ? run.error?.process : undefined;
    if (process) byProcess.set(process, (byProcess.get(process) ?? 0) + 1);
  }

  let topProcess: string | null = null;
  let topCount = 0;
  for (const [process, count] of byProcess) {
    if (count > topCount) {
      topProcess = process;
      topCount = count;
    }
  }
  if (!topProcess || topCount < 2) return null;

  return {
    kind: 'recurring-error',
    count: topCount,
    label: `${topCount} runs failed on the same process (${topProcess})`,
    filter: { status: 'FAILED', process: topProcess },
  };
}

/** `needsAttention` is derived, never stored: `counts.FAILED + succeededWithIssues`. */
export function buildSummaryVM(runs: RunVM[]): RunsSummaryVM {
  const counts: Record<RunStatus, number> = {
    FAILED: 0,
    RUNNING: 0,
    SUBMITTED: 0,
    SUCCEEDED: 0,
    CANCELLED: 0,
  };
  let succeededWithIssues = 0;
  let totalCost = 0;

  for (const run of runs) {
    counts[run.status]++;
    if (run.status === 'SUCCEEDED' && run.needsAttention) succeededWithIssues++;
    totalCost += run.cost ?? 0;
  }

  const total = runs.length;
  return {
    total,
    counts,
    succeededWithIssues,
    successRatePct: total > 0 ? Math.round((counts.SUCCEEDED / total) * 100) : 0,
    totalCostLabel: costFmt(totalCost),
    insight: detectPatterns(runs),
  };
}
