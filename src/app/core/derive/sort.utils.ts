import type { RunVM } from '../models/run.model';
import type { SortState } from '../models/run.model';

function riskScore(run: RunVM): number {
  if (run.status === 'FAILED') return 5;
  if (run.needsAttention) return 4;
  if (run.status === 'RUNNING') return 3;
  if (run.status === 'SUBMITTED') return 2;
  if (run.status === 'SUCCEEDED') return 1;
  return 0; // CANCELLED
}

export function sortRuns(runs: RunVM[], sort: SortState): RunVM[] {
  return [...runs].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;

    switch (sort.key) {
      case 'risk': {
        const scoreDiff = riskScore(b) - riskScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        // Within same risk group: most recent first
        return b.submittedAt.getTime() - a.submittedAt.getTime();
      }
      case 'submitted':
        return dir * (a.submittedAt.getTime() - b.submittedAt.getTime());
      case 'duration':
        if (a.durationMs === null && b.durationMs === null) return 0;
        if (a.durationMs === null) return 1;
        if (b.durationMs === null) return -1;
        return dir * (a.durationMs - b.durationMs);
      case 'cost':
        if (a.cost === null && b.cost === null) return 0;
        if (a.cost === null) return 1;
        if (b.cost === null) return -1;
        return dir * (a.cost - b.cost);
      default:
        return 0;
    }
  });
}
