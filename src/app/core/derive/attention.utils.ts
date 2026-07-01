import type { RawRun } from '../models/raw-run.model';
import type { RunStatus } from '../models/run.model';

/**
 * Non-FAILED attention signals only, in display order. FAILED is handled separately by
 * `needsAttention`/`attentionLabel` since the red status already communicates it — no
 * reason string needed there.
 */
export function attentionReasons(raw: RawRun): string[] {
  const { status, load, stats } = raw;
  const reasons: string[] = [];

  // SUCCEEDED with any failed task
  if (status === 'SUCCEEDED') {
    const failedTasks = stats.failedCount > 0
      ? stats.failedCount
      : (raw.tasks?.filter(t => t.status === 'FAILED').length ?? 0);
    if (failedTasks > 0) reasons.push(`${failedTasks} task${failedTasks === 1 ? '' : 's'} failed`);
  }

  // Any retries indicate something went wrong mid-run
  if (load.retries > 0) reasons.push(`${load.retries} retr${load.retries === 1 ? 'y' : 'ies'}`);

  // Very low CPU efficiency on completed runs (memory efficiency is routinely <10% in
  // Nextflow due to over-provisioning — not a meaningful signal)
  if (status === 'SUCCEEDED' || status === 'RUNNING') {
    if (load.cpuEfficiency > 0 && load.cpuEfficiency < 20) {
      reasons.push(`low CPU efficiency (${Math.round(load.cpuEfficiency)}%)`);
    }
  }

  return reasons;
}

export function needsAttention(raw: RawRun): boolean {
  return raw.status === 'FAILED' || attentionReasons(raw).length > 0;
}

const STATUS_VERB: Record<RunStatus, string> = {
  SUCCEEDED: 'Succeeded',
  FAILED: 'Failed',
  RUNNING: 'Running',
  SUBMITTED: 'Submitted',
  CANCELLED: 'Cancelled',
};

/** Tooltip text for the row's attention marker. Null on FAILED — no marker is shown there. */
export function attentionLabel(raw: RawRun, status: RunStatus): string | null {
  if (status === 'FAILED') return null;
  const reasons = attentionReasons(raw);
  if (reasons.length === 0) return null;
  return `${STATUS_VERB[status]}, but ${reasons.join(' · ')}`;
}
