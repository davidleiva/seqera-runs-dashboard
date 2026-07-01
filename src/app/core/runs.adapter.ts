import type { RawRun } from './models/raw-run.model';
import type { RunError, RunStatus, RunVM } from './models/run.model';
import type { RunDetailVM } from '../features/runs/run-drawer/run-drawer.models';
import { costFmt, durationFmt, formatSubmitted } from './derive/format.utils';
import { attentionLabel, needsAttention } from './derive/attention.utils';
import { taskBreakdown } from './derive/task.utils';

const VALID_STATUSES: ReadonlySet<string> = new Set([
  'SUCCEEDED', 'FAILED', 'CANCELLED', 'RUNNING', 'SUBMITTED',
]);

function parseStatus(raw: string): RunStatus {
  return VALID_STATUSES.has(raw) ? (raw as RunStatus) : 'CANCELLED';
}

function parseCausedBy(msg: string): { process?: string; cause?: string } {
  const processMatch = msg.match(/Error executing process > '([^'(]+?)(?:\s*\([^)]*\))?'/);
  const causeMatch = msg.match(/Caused by:\s*\n\s*(.+)/);
  return {
    process: processMatch?.[1]?.trim(),
    cause: causeMatch?.[1]?.trim(),
  };
}

function parseError(raw: RawRun): RunError | null {
  if (raw.status !== 'FAILED') return null;
  // Honest: null errorMessage on a FAILED run → no invented cause (scruffy_colden case)
  if (!raw.errorMessage) return null;
  const { process, cause } = parseCausedBy(raw.errorMessage);
  return { process, cause, raw: raw.errorMessage };
}

function memoryLabel(bytes: number): string {
  if (bytes === 0) return '—';
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

export function toRunVM(raw: RawRun): RunVM {
  const status = parseStatus(raw.status);
  const cost = raw.load.cost ?? null;
  const executors = raw.load.executors;
  const executor = executors && executors.length > 0 ? executors[0] : null;
  const error = parseError(raw);

  return {
    id: raw.id,
    name: raw.runName,
    pipeline: raw.projectName,
    status,
    needsAttention: needsAttention(raw),
    attentionLabel: attentionLabel(raw, status, error),
    user: raw.userName,
    submittedAt: new Date(raw.submit),
    submittedLabel: formatSubmitted(raw.submit),
    durationMs: raw.duration,
    durationLabel: durationFmt(raw.duration),
    cost,
    costLabel: costFmt(cost),
    retries: raw.load.retries,
    executor,
    exitStatus: raw.exitStatus,
    tasks: taskBreakdown(raw),
    error,
    sessionId: raw.sessionId,
    commitId: raw.commitId,
    workDir: raw.workDir,
    commandLine: raw.commandLine,
    profile: raw.profile,
    startedLabel: raw.start ? formatSubmitted(raw.start) : '—',
    completedLabel: raw.complete ? formatSubmitted(raw.complete) : '—',
    cpuEfficiency: raw.load.cpuEfficiency,
    memoryEfficiency: raw.load.memoryEfficiency,
  };
}

export function toRunDetailVM(raw: RawRun): RunDetailVM {
  const vm = toRunVM(raw);

  const hasResources =
    raw.load.cpuEfficiency > 0 || raw.load.peakCpus > 0 || raw.load.peakMemory > 0;

  const resources = hasResources
    ? {
        cpuEfficiencyPct: Math.round(raw.load.cpuEfficiency * 10) / 10,
        peakCpus: raw.load.peakCpus,
        memoryPeakLabel: memoryLabel(raw.load.peakMemory),
      }
    : null;

  // Only processes with a valid cpu sub-object contribute to topProcesses.
  // cpu, mem, time can all be null in real Nextflow data — skip rather than crash.
  const topProcesses = (raw.metrics ?? [])
    .filter(m => m != null && m.cpu != null)
    .map(m => ({
      name: m.process.split(':').at(-1) ?? m.process,
      valuePct: Math.round(m.cpu!.mean),
    }))
    .sort((a, b) => b.valuePct - a.valuePct)
    .slice(0, 5);

  return { ...vm, resources, topProcesses };
}
