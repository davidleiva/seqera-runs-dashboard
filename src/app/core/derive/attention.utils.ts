import type { RawRun } from '../models/raw-run.model';

export function needsAttention(raw: RawRun): boolean {
  const { status, load, stats } = raw;

  // All failed runs need attention
  if (status === 'FAILED') return true;

  // SUCCEEDED with any failed task
  if (status === 'SUCCEEDED') {
    if (stats.failedCount > 0) return true;
    if (raw.tasks?.some(t => t.status === 'FAILED')) return true;
  }

  // Any retries indicate something went wrong mid-run
  if (load.retries > 0) return true;

  // Very low CPU efficiency on completed runs (memory efficiency is routinely <10% in
  // Nextflow due to over-provisioning — not a meaningful signal)
  if (status === 'SUCCEEDED' || status === 'RUNNING') {
    if (load.cpuEfficiency > 0 && load.cpuEfficiency < 20) return true;
  }

  return false;
}
