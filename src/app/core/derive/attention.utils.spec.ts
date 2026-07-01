import type { RawRun } from '../models/raw-run.model';
import { needsAttention } from './attention.utils';

function makeRaw(overrides: Partial<RawRun> = {}): RawRun {
  return {
    id: 'id',
    runName: 'run',
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
    exitStatus: 0,
    errorMessage: null,
    resume: false,
    container: null,
    containerEngine: null,
    workDir: '',
    launchDir: '',
    profile: '',
    stats: {
      succeedCount: 50, succeedPct: 100, succeedDuration: 0,
      failedCount: 0, failedPct: null,
      cachedCount: 0, cachedPct: null,
      ignoredCount: 0, ignoredPct: null,
      computeTimeFmt: null,
    },
    load: {
      cpus: 0, cpuTime: 0, cpuLoad: 0, cpuEfficiency: 65,
      memoryReq: 0, memoryRss: 0, memoryEfficiency: 5,
      readBytes: 0, writeBytes: 0, cost: 0.03,
      peakCpus: 0, peakTasks: 0, peakMemory: 0,
      pending: 0, submitted: 0, running: 0,
      succeeded: 50, failed: 0, cached: 0, aborted: 0,
      retries: 0, executors: ['awsbatch'],
    },
    ...overrides,
  } as RawRun;
}

describe('needsAttention', () => {
  it('returns true for FAILED status', () => {
    expect(needsAttention(makeRaw({ status: 'FAILED' }))).toBe(true);
  });

  it('returns true for SUCCEEDED with failedCount > 0 (viralrecon exitStatus:0 case)', () => {
    const raw = makeRaw({
      status: 'SUCCEEDED',
      stats: { ...makeRaw().stats, failedCount: 1 },
    });
    expect(needsAttention(raw)).toBe(true);
  });

  it('returns true for SUCCEEDED with FAILED task in tasks array', () => {
    const raw = makeRaw({
      status: 'SUCCEEDED',
      tasks: [
        { taskId: 1, name: 't1', process: 'P', status: 'COMPLETED', exit: 0, duration: 100, realtime: 100, pcpu: 10, pmem: 5, memory: 1000, cpus: 1 },
        { taskId: 2, name: 't2', process: 'P', status: 'FAILED',    exit: 1, duration: 10,  realtime: 10,  pcpu: 10, pmem: 5, memory: 1000, cpus: 1 },
      ],
    });
    expect(needsAttention(raw)).toBe(true);
  });

  it('returns true when retries > 0 (serene_albattani)', () => {
    const raw = makeRaw({ load: { ...makeRaw().load, retries: 1 } });
    expect(needsAttention(raw)).toBe(true);
  });

  it('returns true when cpuEfficiency < 20 on SUCCEEDED', () => {
    const raw = makeRaw({ load: { ...makeRaw().load, cpuEfficiency: 10 } });
    expect(needsAttention(raw)).toBe(true);
  });

  it('returns false for clean SUCCEEDED run', () => {
    expect(needsAttention(makeRaw())).toBe(false);
  });

  it('returns false for CANCELLED (tender_shockley) — 0 efficiency is expected', () => {
    const raw = makeRaw({
      status: 'CANCELLED',
      load: { ...makeRaw().load, cpuEfficiency: 0, memoryEfficiency: 0, retries: 0 },
      stats: { ...makeRaw().stats, failedCount: 0 },
    });
    expect(needsAttention(raw)).toBe(false);
  });

  it('returns false for SUBMITTED — no execution yet', () => {
    const raw = makeRaw({ status: 'SUBMITTED', load: { ...makeRaw().load, cpuEfficiency: 0 } });
    expect(needsAttention(raw)).toBe(false);
  });

  it('returns true for FAILED even with exitStatus 0 (viralrecon edge case)', () => {
    const raw = makeRaw({ status: 'FAILED', exitStatus: 0, errorMessage: null });
    expect(needsAttention(raw)).toBe(true);
  });
});
