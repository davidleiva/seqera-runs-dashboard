export interface KpiSummary {
  total: number;
  succeeded: number;
  failed: number;
  running: number;
  submitted: number;
  cancelled: number;
  needsAttention: number;
  totalCostLabel: string;
}
