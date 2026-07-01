import type { KpiSummary } from './health-bar.models';

export const kpisSample: KpiSummary = {
  total: 7,
  succeeded: 4,
  failed: 2,
  running: 0,
  submitted: 0,
  cancelled: 1,
  needsAttention: 3,
  totalCostLabel: '$0.13',
};

export const kpisHealthy: KpiSummary = {
  total: 12,
  succeeded: 12,
  failed: 0,
  running: 0,
  submitted: 0,
  cancelled: 0,
  needsAttention: 0,
  totalCostLabel: '$0.41',
};

export const kpisAttentionOnly: KpiSummary = {
  total: 8,
  succeeded: 7,
  failed: 0,
  running: 1,
  submitted: 0,
  cancelled: 0,
  needsAttention: 1,
  totalCostLabel: '$0.29',
};

export const kpisEmpty: KpiSummary = {
  total: 0,
  succeeded: 0,
  failed: 0,
  running: 0,
  submitted: 0,
  cancelled: 0,
  needsAttention: 0,
  totalCostLabel: '$0.00',
};
