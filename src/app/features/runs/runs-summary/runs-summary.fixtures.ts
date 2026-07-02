import type { RunsSummaryVM } from './runs-summary.models';

export const summaryShowcase: RunsSummaryVM = {
  total: 20,
  counts: { FAILED: 3, RUNNING: 1, SUBMITTED: 1, SUCCEEDED: 13, CANCELLED: 2 },
  needsAttention: 5,
  successRatePct: 65,
  totalCostLabel: '$0.49',
  insight: {
    kind: 'recurring-error',
    count: 2,
    label: '2 runs failed on the same process (ABACAS)',
    filter: { status: 'FAILED', process: 'ABACAS' },
  },
};

export const summarySample: RunsSummaryVM = {
  total: 7,
  counts: { FAILED: 2, RUNNING: 0, SUBMITTED: 0, SUCCEEDED: 4, CANCELLED: 1 },
  needsAttention: 3,
  successRatePct: 57,
  totalCostLabel: '$0.13',
  insight: null,
};

export const summaryHealthy: RunsSummaryVM = {
  total: 12,
  counts: { FAILED: 0, RUNNING: 0, SUBMITTED: 0, SUCCEEDED: 12, CANCELLED: 0 },
  needsAttention: 0,
  successRatePct: 100,
  totalCostLabel: '$0.41',
  insight: null,
};

export const summarySingleRun: RunsSummaryVM = {
  total: 1,
  counts: { FAILED: 1, RUNNING: 0, SUBMITTED: 0, SUCCEEDED: 0, CANCELLED: 0 },
  needsAttention: 0,
  successRatePct: 0,
  totalCostLabel: '$0.01',
  insight: null,
};

export const summaryEmpty: RunsSummaryVM = {
  total: 0,
  counts: { FAILED: 0, RUNNING: 0, SUBMITTED: 0, SUCCEEDED: 0, CANCELLED: 0 },
  needsAttention: 0,
  successRatePct: 0,
  totalCostLabel: '$0.00',
  insight: null,
};
