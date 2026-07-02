import type { FailedTaskDetail, RunVM } from '../../../core/models';
import type { KnownIssue } from '../../../core/derive/known-issues';

export interface RunDetailVM extends RunVM {
  resources: {
    cpuEfficiencyPct: number;
    peakCpus: number;
    memoryPeakLabel: string;
  } | null;
  topProcesses: {
    name: string;
    valuePct: number;
  }[];
  /** Deterministic, curated hint parsed from the raw error text — null when nothing matched. */
  knownIssue: KnownIssue | null;
  /** The failed task's own detail, read from `tasks[]` — null when there's no per-task data. */
  failedTask: FailedTaskDetail | null;
}
