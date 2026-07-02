import type { RunStatus } from '../../../core/models';

export interface FilterOption<T extends string> {
  value: T | null;
  label: string;
}

export const STATUS_OPTIONS: readonly FilterOption<RunStatus>[] = [
  { value: null, label: 'All statuses' },
  { value: 'SUCCEEDED', label: 'Succeeded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const STATUS_LABELS: Record<RunStatus, string> = {
  SUCCEEDED: 'Succeeded',
  FAILED: 'Failed',
  RUNNING: 'Running',
  SUBMITTED: 'Submitted',
  CANCELLED: 'Cancelled',
};
