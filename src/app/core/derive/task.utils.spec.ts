import type { RawRun } from '../models/raw-run.model';
import { findFailedTask, taskBreakdown } from './task.utils';

function makeRaw(overrides: Partial<RawRun> = {}): RawRun {
  return {
    id: 'test-id',
    runName: 'test_run',
    projectName: 'nf-core/test',
    repository: '',
    revision: '',
    commitId: null,
    sessionId: '',
    commandLine: '',
    status: 'SUCCEEDED',
    userName: null,
    submit: '2026-01-01T00:00:00Z',
    start: null,
    complete: null,
    duration: null,
    success: true,
    exitStatus: null,
    errorMessage: null,
    resume: false,
    container: null,
    containerEngine: null,
    workDir: '',
    launchDir: '',
    profile: '',
    stats: {
      succeedCount: 0, succeedPct: null, succeedDuration: 0,
      failedCount: 0, failedPct: null,
      cachedCount: 0, cachedPct: null,
      ignoredCount: 0, ignoredPct: null,
      computeTimeFmt: null,
    },
    load: {
      cpus: 0, cpuTime: 0, cpuLoad: 0, cpuEfficiency: 0,
      memoryReq: 0, memoryRss: 0, memoryEfficiency: 0,
      readBytes: 0, writeBytes: 0, cost: null,
      peakCpus: 0, peakTasks: 0, peakMemory: 0,
      pending: 0, submitted: 0, running: 0,
      succeeded: 0, failed: 0, cached: 0, aborted: 0,
      retries: 0, executors: null,
    },
    ...overrides,
  } as RawRun;
}

describe('taskBreakdown', () => {
  it('counts COMPLETED as succeeded from tasks array', () => {
    const raw = makeRaw({
      tasks: [
        { taskId: 1, name: 'task_1', process: 'PROC', status: 'COMPLETED', exit: 0, duration: 100, realtime: 100, pcpu: 10, pmem: 5, memory: 1000, cpus: 1, workdir: '' },
        { taskId: 2, name: 'task_2', process: 'PROC', status: 'COMPLETED', exit: 0, duration: 200, realtime: 200, pcpu: 20, pmem: 5, memory: 1000, cpus: 1, workdir: '' },
        { taskId: 3, name: 'task_3', process: 'PROC', status: 'FAILED',    exit: 1, duration: 50,  realtime: 50,  pcpu: 5,  pmem: 5, memory: 1000, cpus: 1, workdir: '' },
      ],
    });
    const result = taskBreakdown(raw);
    expect(result).toEqual({ total: 3, succeeded: 2, failed: 1, aborted: 0, cached: 0 });
  });

  it('falls back to load counters when tasks absent', () => {
    const raw = makeRaw({
      load: {
        ...makeRaw().load,
        succeeded: 47, failed: 2, aborted: 1, cached: 0, running: 0,
      },
    });
    const result = taskBreakdown(raw);
    expect(result).toEqual({ total: 50, succeeded: 47, failed: 2, aborted: 1, cached: 0 });
  });

  it('includes running count in total from load when tasks absent', () => {
    const raw = makeRaw({
      load: { ...makeRaw().load, succeeded: 20, running: 4 },
    });
    const result = taskBreakdown(raw);
    expect(result?.running).toBe(4);
    expect(result?.total).toBe(24);
  });

  it('returns null for tender_shockley — CANCELLED, no tasks, all load zeros', () => {
    const raw = makeRaw({ status: 'CANCELLED', tasks: undefined });
    expect(taskBreakdown(raw)).toBeNull();
  });

  it('returns null for scruffy_colden — FAILED, no tasks, all load zeros', () => {
    const raw = makeRaw({ status: 'FAILED', tasks: undefined });
    expect(taskBreakdown(raw)).toBeNull();
  });

  it('includes running tasks from tasks array for live RUNNING runs', () => {
    const raw = makeRaw({
      status: 'RUNNING',
      tasks: [
        { taskId: 1, name: 't1', process: 'P', status: 'COMPLETED', exit: 0, duration: 100, realtime: 100, pcpu: 10, pmem: 5, memory: 1000, cpus: 1, workdir: '' },
        { taskId: 2, name: 't2', process: 'P', status: 'RUNNING',   exit: 0, duration: 0,   realtime: 0,   pcpu: 50, pmem: 5, memory: 1000, cpus: 1, workdir: '' },
      ],
    });
    const result = taskBreakdown(raw);
    expect(result?.running).toBe(1);
    expect(result?.succeeded).toBe(1);
    expect(result?.total).toBe(2);
  });
});

describe('findFailedTask', () => {
  it('returns null when tasks is absent', () => {
    expect(findFailedTask(makeRaw({ tasks: undefined }))).toBeNull();
  });

  it('returns null when tasks is an empty array', () => {
    expect(findFailedTask(makeRaw({ tasks: [] }))).toBeNull();
  });

  it('returns null when no task failed', () => {
    const raw = makeRaw({
      tasks: [
        { taskId: 1, name: 't1', process: 'P', status: 'COMPLETED', exit: 0, duration: 100, realtime: 100, pcpu: 10, pmem: 5, memory: 1000, cpus: 1, workdir: 's3://x' },
      ],
    });
    expect(findFailedTask(raw)).toBeNull();
  });

  it('prefers the FAILED-status task over ABORTED ones (viralrecon shape)', () => {
    const raw = makeRaw({
      tasks: [
        { taskId: 37, name: 'PIPE:UNICYCLER (S2)', process: 'PIPE:UNICYCLER', status: 'ABORTED', exit: 2147483647, duration: 0, realtime: 0, pcpu: 0, pmem: 0, memory: 0, cpus: 1, workdir: 's3://aborted-1' },
        { taskId: 38, name: 'PIPE:UNICYCLER (S1)', process: 'PIPE:UNICYCLER', status: 'FAILED', exit: 143, duration: 98118, realtime: 70477, pcpu: 0, pmem: 0, memory: 0, cpus: 2, workdir: 's3://failed', script: 'unicycler --threads 2' },
        { taskId: 42, name: 'PIPE:UNICYCLER (S3)', process: 'PIPE:UNICYCLER', status: 'ABORTED', exit: 2147483647, duration: 0, realtime: 0, pcpu: 0, pmem: 0, memory: 0, cpus: 1, workdir: 's3://aborted-2' },
      ],
    });
    const result = findFailedTask(raw);
    expect(result).toEqual({
      name: 'PIPE:UNICYCLER (S1)',
      process: 'UNICYCLER',
      exit: 143,
      workDir: 's3://failed',
      script: 'unicycler --threads 2',
    });
  });

  it('falls back to a non-zero exit when no task has status FAILED', () => {
    const raw = makeRaw({
      tasks: [
        { taskId: 1, name: 't1', process: 'PROC', status: 'CUSTOM_ERROR', exit: 7, duration: 1, realtime: 1, pcpu: 0, pmem: 0, memory: 0, cpus: 1, workdir: 's3://custom' },
      ],
    });
    expect(findFailedTask(raw)?.exit).toBe(7);
  });

  it('maps a missing script to null — never fabricates one', () => {
    const raw = makeRaw({
      tasks: [
        { taskId: 1, name: 't1', process: 'PROC', status: 'FAILED', exit: 1, duration: 1, realtime: 1, pcpu: 0, pmem: 0, memory: 0, cpus: 1, workdir: 's3://x' },
      ],
    });
    expect(findFailedTask(raw)?.script).toBeNull();
  });
});
