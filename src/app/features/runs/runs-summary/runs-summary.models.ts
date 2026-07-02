import type { RunStatus } from '../../../core/models';

export interface SummaryInsight {
  kind: 'recurring-error' | 'executor-failures' | 'high-cost';
  label: string;
  count: number;
  filter?: { status?: RunStatus; process?: string; executor?: string };
}

export interface RunsSummaryVM {
  total: number;
  counts: Record<RunStatus, number>;
  needsAttention: number;
  successRatePct: number;
  totalCostLabel: string;
  insight: SummaryInsight | null;
}
