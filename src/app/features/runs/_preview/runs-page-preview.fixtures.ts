import { costFmt, durationFmt, formatSubmitted } from '../../../core/derive/format.utils';
import type { RunDetailVM } from '../run-drawer/run-drawer.models';
import {
  cancelledNoDataDetail,
  failedNoMessageDetail,
  failedViralreconDetail,
  runningShowcaseDetail,
  succeededRnaseqDetail,
  succeededWithFailedTaskDetail,
} from '../run-drawer/run-drawer.fixtures';

const BASE: Pick<
  RunDetailVM,
  'sessionId' | 'commitId' | 'workDir' | 'commandLine' | 'profile' | 'resources' | 'topProcesses'
> = {
  sessionId: '3c1f7e2a-9b4d-4e8a-8c2f-1a5e6d7b8c9d',
  commitId: '4a8e2c1',
  workDir: 's3://nf-tower-bucket/scratch/preview',
  commandLine: "nextflow run 'https://github.com/nf-core/rnaseq' -r 3.22.1 -profile test",
  profile: 'test',
  resources: null,
  topProcesses: [],
};

interface NewFixtureInput {
  id: string;
  name: string;
  pipeline: string;
  status: RunDetailVM['status'];
  user: string | null;
  submittedIso: string;
  startedIso: string | null;
  completedIso: string | null;
  durationMs: number | null;
  cost: number | null;
  retries: number;
  executor: string | null;
  exitStatus: number | null;
  tasks: RunDetailVM['tasks'];
  error: RunDetailVM['error'];
  needsAttention: boolean;
  attentionLabel: string | null;
  cpuEfficiency: number;
  memoryEfficiency: number;
  resources?: RunDetailVM['resources'];
  topProcesses?: RunDetailVM['topProcesses'];
}

function makeFixture(input: NewFixtureInput): RunDetailVM {
  return {
    ...BASE,
    id: input.id,
    name: input.name,
    pipeline: input.pipeline,
    status: input.status,
    needsAttention: input.needsAttention,
    attentionLabel: input.attentionLabel,
    user: input.user,
    submittedAt: new Date(input.submittedIso),
    submittedLabel: formatSubmitted(input.submittedIso),
    durationMs: input.durationMs,
    durationLabel: durationFmt(input.durationMs),
    cost: input.cost,
    costLabel: costFmt(input.cost),
    retries: input.retries,
    executor: input.executor,
    exitStatus: input.exitStatus,
    tasks: input.tasks,
    error: input.error,
    startedLabel: input.startedIso ? formatSubmitted(input.startedIso) : '—',
    completedLabel: input.completedIso ? formatSubmitted(input.completedIso) : '—',
    cpuEfficiency: input.cpuEfficiency,
    memoryEfficiency: input.memoryEfficiency,
    resources: input.resources ?? BASE.resources,
    topProcesses: input.topProcesses ?? BASE.topProcesses,
  };
}

// ─── New fixtures padding the reused drawer fixtures up to ~20 ────────────────
// Two FAILED runs share process ABACAS so `detectInsight` below has a real
// pattern to surface ("2 runs failed on the same process (ABACAS)").

const failedAbacas2 = makeFixture({
  id: 'r-prev-f2',
  name: 'stoic_curie',
  pipeline: 'nf-core/viralrecon',
  status: 'FAILED',
  user: 'diya-b',
  submittedIso: '2026-06-27T09:12:00Z',
  startedIso: '2026-06-27T09:12:20Z',
  completedIso: '2026-06-27T09:15:50Z',
  durationMs: 210_000,
  cost: 0.02,
  retries: 0,
  executor: 'awsbatch',
  exitStatus: 1,
  tasks: { total: 40, succeeded: 38, failed: 1, aborted: 1, cached: 0 },
  error: {
    process: 'ABACAS',
    cause: 'Host EC2 instance terminated.',
    raw: "Error executing process > 'NFCORE_VIRALRECON:…:ABACAS (SAMPLE2_PE)'\nCaused by:\n  Host EC2 instance terminated.",
  },
  needsAttention: true,
  attentionLabel: 'Failed in process ABACAS',
  cpuEfficiency: 60,
  memoryEfficiency: 40,
  resources: { cpuEfficiencyPct: 60, peakCpus: 20, memoryPeakLabel: '40 GB' },
  topProcesses: [{ name: 'ABACAS', valuePct: 70 }],
});

const submitted2 = makeFixture({
  id: 'r-prev-sub2',
  name: 'placid_shaw',
  pipeline: 'nf-core/rnaseq',
  status: 'SUBMITTED',
  user: 'ycbkqin',
  submittedIso: '2026-06-30T15:40:00Z',
  startedIso: null,
  completedIso: null,
  durationMs: null,
  cost: null,
  retries: 0,
  executor: 'awsbatch',
  exitStatus: null,
  tasks: null,
  error: null,
  needsAttention: false,
  attentionLabel: null,
  cpuEfficiency: 0,
  memoryEfficiency: 0,
});

const succeededWithIssues = [
  makeFixture({
    id: 'r-prev-s1',
    name: 'brave_hopper',
    pipeline: 'nf-core/rnaseq',
    status: 'SUCCEEDED',
    user: 'adamtalbot',
    submittedIso: '2026-06-25T08:20:00Z',
    startedIso: '2026-06-25T08:20:30Z',
    completedIso: '2026-06-25T08:42:10Z',
    durationMs: 1_300_000,
    cost: 0.04,
    retries: 0,
    executor: 'awsbatch',
    exitStatus: 0,
    tasks: { total: 45, succeeded: 44, failed: 1, aborted: 0, cached: 0 },
    error: null,
    needsAttention: true,
    attentionLabel: 'Succeeded, but 1 task failed',
    cpuEfficiency: 70,
    memoryEfficiency: 55,
  }),
  makeFixture({
    id: 'r-prev-s2',
    name: 'gentle_liskov',
    pipeline: 'nf-core/viralrecon',
    status: 'SUCCEEDED',
    user: 'deekshapm05',
    submittedIso: '2026-06-24T13:05:00Z',
    startedIso: '2026-06-24T13:05:25Z',
    completedIso: '2026-06-24T13:28:00Z',
    durationMs: 1_355_000,
    cost: 0.06,
    retries: 2,
    executor: 'awsbatch',
    exitStatus: 0,
    tasks: { total: 42, succeeded: 42, failed: 0, aborted: 0, cached: 0 },
    error: null,
    needsAttention: true,
    attentionLabel: 'Succeeded, but 2 retries',
    cpuEfficiency: 68,
    memoryEfficiency: 50,
  }),
  makeFixture({
    id: 'r-prev-s3',
    name: 'quiet_turing',
    pipeline: 'nf-core/rnaseq',
    status: 'SUCCEEDED',
    user: 'john.doe',
    submittedIso: '2026-06-23T11:00:00Z',
    startedIso: '2026-06-23T11:00:20Z',
    completedIso: '2026-06-23T11:35:00Z',
    durationMs: 2_080_000,
    cost: 0.08,
    retries: 0,
    executor: 'local',
    exitStatus: 0,
    tasks: { total: 50, succeeded: 50, failed: 0, aborted: 0, cached: 0 },
    error: null,
    needsAttention: true,
    attentionLabel: 'Succeeded, but low CPU efficiency (15%)',
    cpuEfficiency: 15,
    memoryEfficiency: 30,
  }),
  makeFixture({
    id: 'r-prev-s4',
    name: 'calm_lovelace',
    pipeline: 'nf-core/rnaseq',
    status: 'SUCCEEDED',
    user: 'alex.smith',
    submittedIso: '2026-06-22T09:45:00Z',
    startedIso: '2026-06-22T09:45:15Z',
    completedIso: '2026-06-22T10:02:00Z',
    durationMs: 1_005_000,
    cost: 0.03,
    retries: 1,
    executor: 'awsbatch',
    exitStatus: 0,
    tasks: { total: 38, succeeded: 37, failed: 1, aborted: 0, cached: 0 },
    error: null,
    needsAttention: true,
    attentionLabel: 'Succeeded, but 1 task failed · 1 retry',
    cpuEfficiency: 72,
    memoryEfficiency: 61,
  }),
];

const succeededClean = [
  ['r-prev-c1', 'swift_curie', 'nf-core/rnaseq', 'awsbatch', 82],
  ['r-prev-c2', 'bold_franklin', 'nf-core/viralrecon', 'awsbatch', 75],
  ['r-prev-c3', 'keen_darwin', 'nf-core/rnaseq', 'local', 90],
  ['r-prev-c4', 'sunny_pascal', 'nf-core/rnaseq', 'awsbatch', 68],
  ['r-prev-c5', 'warm_euler', 'nf-core/viralrecon', 'awsbatch', 77],
  ['r-prev-c6', 'proud_noether', 'nf-core/rnaseq', 'local', 85],
  ['r-prev-c7', 'still_galileo', 'nf-core/rnaseq', 'awsbatch', 79],
].map(([id, name, pipeline, executor, cpuEfficiency], i) =>
  makeFixture({
    id: id as string,
    name: name as string,
    pipeline: pipeline as string,
    status: 'SUCCEEDED',
    user: ['adamtalbot', 'deekshapm05', 'diya-b', 'dev-intern', 'john.doe'][i % 5],
    submittedIso: `2026-06-${18 + i}T10:${10 + i}:00Z`,
    startedIso: `2026-06-${18 + i}T10:${11 + i}:00Z`,
    completedIso: `2026-06-${18 + i}T10:${30 + i}:00Z`,
    durationMs: 900_000 + i * 60_000,
    cost: 0.02 + i * 0.01,
    retries: 0,
    executor: executor as string,
    exitStatus: 0,
    tasks: { total: 40 + i, succeeded: 40 + i, failed: 0, aborted: 0, cached: 0 },
    error: null,
    needsAttention: false,
    attentionLabel: null,
    cpuEfficiency: cpuEfficiency as number,
    memoryEfficiency: 50 + i,
  }),
);

const cancelled2 = makeFixture({
  id: 'r-prev-cancel2',
  name: 'faded_hopper',
  pipeline: 'nf-core/rnaseq',
  status: 'CANCELLED',
  user: 'alex.smith',
  submittedIso: '2026-06-21T16:00:00Z',
  startedIso: '2026-06-21T16:00:10Z',
  completedIso: null,
  durationMs: 45_000,
  cost: 0.001,
  retries: 0,
  executor: 'awsbatch',
  exitStatus: null,
  tasks: null,
  error: null,
  needsAttention: false,
  attentionLabel: null,
  cpuEfficiency: 0,
  memoryEfficiency: 0,
});

/**
 * ~20 RunDetailVM, showcase-scale: FAILED 3 (2 sharing process ABACAS) · RUNNING 1 ·
 * SUBMITTED 1 · SUCCEEDED 13 (5 needing attention) · CANCELLED 2 (one with no task
 * data at all). Reuses the real drawer fixtures — including the honest edge cases
 * (cancelled/no-data, failed/no-message) — and pads the rest with new ones.
 */
export const FULL_PREVIEW_FIXTURE: RunDetailVM[] = [
  failedViralreconDetail, // FAILED · process ABACAS
  failedAbacas2, // FAILED · process ABACAS (pairs with the above for the insight)
  failedNoMessageDetail, // FAILED · no error message (edge case)
  runningShowcaseDetail, // RUNNING
  submitted2, // SUBMITTED
  succeededRnaseqDetail, // SUCCEEDED · clean
  succeededWithFailedTaskDetail, // SUCCEEDED · needs attention
  ...succeededWithIssues, // SUCCEEDED · needs attention ×4
  ...succeededClean, // SUCCEEDED · clean ×7
  cancelledNoDataDetail, // CANCELLED · no task data at all (edge case)
  cancelled2, // CANCELLED
];
