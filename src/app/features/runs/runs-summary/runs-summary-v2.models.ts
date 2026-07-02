import type { RunStatus } from '../../../core/models';

export interface SummaryInsight {
  kind: 'recurring-error' | 'executor-failures' | 'high-cost';
  label: string;
  count: number;
  filter: { status?: RunStatus; process?: string; executor?: string };
}

export type SummaryLens =
  | { kind: 'status'; status: RunStatus }
  | { kind: 'attention' }
  | { kind: 'insight'; insight: SummaryInsight };

export interface RunsSummaryVM {
  total: number;
  counts: Record<RunStatus, number>;
  /** Subset of SUCCEEDED that needs attention. `needsAttention` is derived from this, never stored. */
  succeededWithIssues: number;
  successRatePct: number;
  totalCostLabel: string;
  insight: SummaryInsight | null;
}
