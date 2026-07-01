export type RunStatus = 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'RUNNING' | 'SUBMITTED';

export type SortKey = 'risk' | 'name' | 'user' | 'submitted' | 'duration' | 'cost' | 'retries';
export type SortDir = 'asc' | 'desc';
export interface SortState {
  key: SortKey;
  dir: SortDir;
}

export interface TaskBreakdown {
  total: number;
  succeeded: number;
  failed: number;
  aborted: number;
  cached: number;
  running?: number;
}

export interface RunError {
  process?: string;
  cause?: string;
  raw?: string;
}

export interface KpiStats {
  FAILED: number;
  SUCCEEDED: number;
  RUNNING: number;
  SUBMITTED: number;
  CANCELLED: number;
  needsAttention: number;
  total: number;
  totalCost: number;
}

export interface RunVM {
  // Identity
  id: string;
  name: string;
  pipeline: string;
  status: RunStatus;
  needsAttention: boolean;
  /** Human-readable reason for the attention marker, e.g. "Succeeded, but 1 task failed · 1 retry". Null on FAILED rows — the red status already signals attention there. */
  attentionLabel: string | null;

  // Table columns
  user: string | null;
  submittedAt: Date;
  submittedLabel: string;
  durationMs: number | null;
  durationLabel: string;
  cost: number | null;
  costLabel: string;
  retries: number;
  executor: string | null;
  exitStatus: number | null;
  tasks: TaskBreakdown | null;
  error: RunError | null;

  // Drawer metadata
  sessionId: string;
  commitId: string | null;
  workDir: string;
  commandLine: string;
  profile: string;
  startedLabel: string;
  completedLabel: string;

  // Drawer resources
  cpuEfficiency: number;
  memoryEfficiency: number;
}
