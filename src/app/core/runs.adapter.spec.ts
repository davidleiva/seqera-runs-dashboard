import type { RawProcessMetric, RawRun } from './models/raw-run.model';
import { toRunDetailVM, toRunVM } from './runs.adapter';

// Minimal valid RawRun factory
function makeRaw(overrides: Partial<RawRun> = {}): RawRun {
  return {
    id: 'test-id',
    runName: 'test_run',
    projectName: 'nf-core/test',
    repository: '',
    revision: '1.0',
    commitId: 'abc123',
    sessionId: 'sess-abc',
    commandLine: 'nextflow run ...',
    status: 'SUCCEEDED',
    userName: 'testuser',
    submit: '2026-06-24T10:50:07Z',
    start: '2026-06-24T10:53:08Z',
    complete: '2026-06-24T11:05:03Z',
    duration: 784042,
    success: true,
    exitStatus: 0,
    errorMessage: null,
    resume: false,
    container: null,
    containerEngine: null,
    workDir: 's3://bucket/scratch',
    launchDir: '/',
    profile: 'test',
    stats: {
      succeedCount: 50, succeedPct: 100, succeedDuration: 0,
      failedCount: 0, failedPct: null,
      cachedCount: 0, cachedPct: null,
      ignoredCount: 0, ignoredPct: null,
      computeTimeFmt: null,
    },
    load: {
      cpus: 10, cpuTime: 100, cpuLoad: 65, cpuEfficiency: 65,
      memoryReq: 1000, memoryRss: 50, memoryEfficiency: 5,
      readBytes: 100, writeBytes: 100, cost: 0.03,
      peakCpus: 5, peakTasks: 10, peakMemory: 500,
      pending: 0, submitted: 0, running: 0,
      succeeded: 50, failed: 0, cached: 0, aborted: 0,
      retries: 0, executors: ['awsbatch'],
    },
    ...overrides,
  } as RawRun;
}

describe('toRunVM — happy path', () => {
  it('maps basic fields correctly', () => {
    const vm = toRunVM(makeRaw());
    expect(vm.id).toBe('test-id');
    expect(vm.name).toBe('test_run');
    expect(vm.pipeline).toBe('nf-core/test');
    expect(vm.status).toBe('SUCCEEDED');
    expect(vm.user).toBe('testuser');
    expect(vm.durationMs).toBe(784042);
    expect(vm.durationLabel).toBe('13m 4s');
    expect(vm.cost).toBeCloseTo(0.03);
    expect(vm.costLabel).toBe('$0.03');
    expect(vm.executor).toBe('awsbatch');
  });

  it('sets submittedAt as a Date', () => {
    const vm = toRunVM(makeRaw());
    expect(vm.submittedAt).toBeInstanceOf(Date);
    expect(vm.submittedAt.toISOString()).toBe('2026-06-24T10:50:07.000Z');
  });

  it('derives needsAttention=false for a clean run', () => {
    expect(toRunVM(makeRaw()).needsAttention).toBe(false);
  });
});

describe('toRunVM — tender_shockley edge case (CANCELLED, no tasks, null duration)', () => {
  const raw = makeRaw({
    status: 'CANCELLED',
    duration: null,
    exitStatus: null,
    tasks: undefined,
    metrics: undefined,
    load: {
      ...makeRaw().load,
      cost: null,
      cpuEfficiency: 0,
      memoryEfficiency: 0,
      succeeded: 0, failed: 0, cached: 0, aborted: 0, running: 0,
      retries: 0, executors: null,
    },
  });

  it('does not throw', () => {
    expect(() => toRunVM(raw)).not.toThrow();
  });

  it('sets durationLabel to "—"', () => {
    expect(toRunVM(raw).durationLabel).toBe('—');
  });

  it('sets tasks to null', () => {
    expect(toRunVM(raw).tasks).toBeNull();
  });

  it('sets costLabel to "—"', () => {
    expect(toRunVM(raw).costLabel).toBe('—');
  });

  it('sets executor to null', () => {
    expect(toRunVM(raw).executor).toBeNull();
  });
});

describe('toRunVM — scruffy_colden edge case (FAILED, null errorMessage + exitStatus)', () => {
  const raw = makeRaw({
    status: 'FAILED',
    errorMessage: null,
    exitStatus: null,
    tasks: undefined,
    load: {
      ...makeRaw().load,
      cost: null, succeeded: 0, failed: 0, aborted: 0,
      cpuEfficiency: 0, memoryEfficiency: 0, executors: null,
    },
  });

  it('does not throw', () => {
    expect(() => toRunVM(raw)).not.toThrow();
  });

  it('sets error to null — honest, no invented cause', () => {
    expect(toRunVM(raw).error).toBeNull();
  });

  it('sets needsAttention=true (FAILED always needs attention)', () => {
    expect(toRunVM(raw).needsAttention).toBe(true);
  });
});

describe('toRunVM — viralrecon edge case (FAILED with exitStatus 0)', () => {
  const raw = makeRaw({
    status: 'FAILED',
    exitStatus: 0,
    errorMessage: "Error executing process > 'NFCORE:ABACAS (SAMPLE)'\nCaused by:\n  Host EC2 terminated.",
    load: { ...makeRaw().load, retries: 1 },
  });

  it('trusts status field — status FAILED regardless of exitStatus 0', () => {
    expect(toRunVM(raw).status).toBe('FAILED');
  });

  it('sets exitStatus to 0 (preserves raw value for display)', () => {
    expect(toRunVM(raw).exitStatus).toBe(0);
  });

  it('parses Caused by from errorMessage', () => {
    const vm = toRunVM(raw);
    expect(vm.error?.cause).toBe('Host EC2 terminated.');
  });

  it('parses process name from errorMessage', () => {
    const vm = toRunVM(raw);
    expect(vm.error?.process).toBe('NFCORE:ABACAS');
  });
});

describe('toRunVM — failedPct null with failedCount > 0', () => {
  it('does not read failedPct — uses derived counts instead', () => {
    const raw = makeRaw({
      stats: {
        ...makeRaw().stats,
        failedCount: 2,
        failedPct: null, // explicitly null
      },
      load: { ...makeRaw().load, retries: 0 },
    });
    const vm = toRunVM(raw);
    // needsAttention should be true because failedCount > 0
    expect(vm.needsAttention).toBe(true);
    // adapter should not throw trying to use null failedPct
    expect(() => toRunVM(raw)).not.toThrow();
  });
});

describe('toRunVM — missing optional fields', () => {
  it('handles absent manifest gracefully', () => {
    const raw = makeRaw({ manifest: undefined });
    expect(() => toRunVM(raw)).not.toThrow();
  });

  it('handles null commitId', () => {
    const raw = makeRaw({ commitId: null });
    expect(toRunVM(raw).commitId).toBeNull();
  });
});

describe('toRunDetailVM — defensive metrics parsing', () => {
  // Real Nextflow data: time=null on instant processes, cpu=null on some (e.g. UNICYCLER)
  const nullCpuProcess: RawProcessMetric = {
    process: 'PIPELINE:UNICYCLER',
    cpu: null,
    mem: null,
    time: null,
  };
  const nullTimeProcess: RawProcessMetric = {
    process: 'PIPELINE:SAMTOOLS_INDEX',
    cpu: { min: 10, q1: 20, q2: 30, q3: 40, max: 50, mean: 25 },
    mem: { min: 100, q1: 200, q2: 300, q3: 400, max: 500, mean: 250 },
    time: null, // common in real data
  };
  const goodProcess: RawProcessMetric = {
    process: 'PIPELINE:FASTQC',
    cpu: { min: 5, q1: 10, q2: 20, q3: 30, max: 40, mean: 18 },
    mem: { min: 50, q1: 100, q2: 150, q3: 200, max: 250, mean: 120 },
    time: { min: 1, q1: 2, q2: 3, q3: 4, max: 5, mean: 3 },
  };

  it('does not throw when a process has null cpu, mem and time', () => {
    const raw = makeRaw({ metrics: [nullCpuProcess, nullTimeProcess, goodProcess] });
    expect(() => toRunDetailVM(raw)).not.toThrow();
  });

  it('excludes null-cpu processes from topProcesses', () => {
    const raw = makeRaw({ metrics: [nullCpuProcess, goodProcess] });
    const vm = toRunDetailVM(raw);
    // nullCpuProcess must be skipped; only FASTQC contributes
    expect(vm.topProcesses.length).toBe(1);
    expect(vm.topProcesses[0].name).toBe('FASTQC');
  });

  it('includes process with null time but valid cpu', () => {
    const raw = makeRaw({ metrics: [nullTimeProcess] });
    const vm = toRunDetailVM(raw);
    expect(vm.topProcesses.length).toBe(1);
    expect(vm.topProcesses[0].name).toBe('SAMTOOLS_INDEX');
    expect(vm.topProcesses[0].valuePct).toBe(25);
  });

  it('uses last segment of colon-separated process name', () => {
    const raw = makeRaw({ metrics: [goodProcess] });
    const vm = toRunDetailVM(raw);
    expect(vm.topProcesses[0].name).toBe('FASTQC');
  });

  it('returns empty topProcesses when metrics is absent', () => {
    const raw = makeRaw({ metrics: undefined });
    const vm = toRunDetailVM(raw);
    expect(vm.topProcesses).toHaveLength(0);
  });
});
