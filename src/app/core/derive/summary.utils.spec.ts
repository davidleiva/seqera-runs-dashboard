import type { RunVM } from '../models/run.model';
import { buildSummaryVM, detectPatterns } from './summary.utils';

function makeVM(overrides: Partial<RunVM> = {}): RunVM {
  return {
    id: 'id',
    name: 'run',
    pipeline: 'nf-core/test',
    status: 'SUCCEEDED',
    needsAttention: false,
    attentionLabel: null,
    user: 'test',
    submittedAt: new Date('2026-06-01T10:00:00Z'),
    submittedLabel: 'Jun 1 · 10:00',
    durationMs: 60000,
    durationLabel: '1m 0s',
    cost: 0.05,
    costLabel: '$0.05',
    retries: 0,
    executor: 'awsbatch',
    exitStatus: 0,
    tasks: null,
    error: null,
    sessionId: 'sess',
    commitId: null,
    workDir: '/work',
    commandLine: 'nextflow run ...',
    profile: 'test',
    startedLabel: 'Jun 1 · 10:03',
    completedLabel: 'Jun 1 · 11:03',
    cpuEfficiency: 65,
    memoryEfficiency: 5,
    ...overrides,
  };
}

describe('detectPatterns', () => {
  it('is null when no FAILED runs share a process', () => {
    const runs = [
      makeVM({ id: 'f1', status: 'FAILED', error: { process: 'ABACAS' } }),
      makeVM({ id: 'f2', status: 'FAILED', error: { process: 'SPADES' } }),
    ];
    expect(detectPatterns(runs)).toBeNull();
  });

  it('is null when only one FAILED run has a given process', () => {
    const runs = [makeVM({ id: 'f1', status: 'FAILED', error: { process: 'ABACAS' } })];
    expect(detectPatterns(runs)).toBeNull();
  });

  it('is null when there are no FAILED runs at all', () => {
    const runs = [makeVM({ id: 's1', status: 'SUCCEEDED' }), makeVM({ id: 'c1', status: 'CANCELLED' })];
    expect(detectPatterns(runs)).toBeNull();
  });

  it('finds a recurring process across >=2 FAILED runs', () => {
    const runs = [
      makeVM({ id: 'f1', status: 'FAILED', error: { process: 'ABACAS' } }),
      makeVM({ id: 'f2', status: 'FAILED', error: { process: 'ABACAS' } }),
      makeVM({ id: 's1', status: 'SUCCEEDED' }),
    ];
    expect(detectPatterns(runs)).toEqual({
      kind: 'recurring-error',
      count: 2,
      label: '2 runs failed on the same process (ABACAS)',
      filter: { status: 'FAILED', process: 'ABACAS' },
    });
  });

  it('picks the process with the highest count when several recur', () => {
    const runs = [
      makeVM({ id: 'f1', status: 'FAILED', error: { process: 'ABACAS' } }),
      makeVM({ id: 'f2', status: 'FAILED', error: { process: 'ABACAS' } }),
      makeVM({ id: 'f3', status: 'FAILED', error: { process: 'SPADES' } }),
      makeVM({ id: 'f4', status: 'FAILED', error: { process: 'SPADES' } }),
      makeVM({ id: 'f5', status: 'FAILED', error: { process: 'SPADES' } }),
    ];
    const insight = detectPatterns(runs);
    expect(insight?.count).toBe(3);
    expect(insight?.filter.process).toBe('SPADES');
  });

  it('ignores a matching process on a non-FAILED run — never invents a pattern from success', () => {
    // Same process appearing on a SUCCEEDED run does not count toward the pattern.
    const runs = [
      makeVM({ id: 'f1', status: 'FAILED', error: { process: 'ABACAS' } }),
      makeVM({ id: 's1', status: 'SUCCEEDED', error: null }),
    ];
    expect(detectPatterns(runs)).toBeNull();
  });

  it('ignores FAILED runs with no parsed process (honest, no invented cause)', () => {
    const runs = [
      makeVM({ id: 'f1', status: 'FAILED', error: null }),
      makeVM({ id: 'f2', status: 'FAILED', error: {} }),
    ];
    expect(detectPatterns(runs)).toBeNull();
  });
});

describe('buildSummaryVM', () => {
  it('counts each status', () => {
    const runs = [
      makeVM({ id: 'f1', status: 'FAILED' }),
      makeVM({ id: 'r1', status: 'RUNNING' }),
      makeVM({ id: 'sub1', status: 'SUBMITTED' }),
      makeVM({ id: 's1', status: 'SUCCEEDED' }),
      makeVM({ id: 's2', status: 'SUCCEEDED' }),
      makeVM({ id: 'c1', status: 'CANCELLED' }),
    ];
    const vm = buildSummaryVM(runs);
    expect(vm.total).toBe(6);
    expect(vm.counts).toEqual({ FAILED: 1, RUNNING: 1, SUBMITTED: 1, SUCCEEDED: 2, CANCELLED: 1 });
  });

  it('counts succeededWithIssues only for SUCCEEDED + needsAttention', () => {
    const runs = [
      makeVM({ id: 's1', status: 'SUCCEEDED', needsAttention: false }),
      makeVM({ id: 's2', status: 'SUCCEEDED', needsAttention: true }),
      // needsAttention on a non-SUCCEEDED run must not count here (FAILED carries its own signal).
      makeVM({ id: 'f1', status: 'FAILED', needsAttention: true }),
    ];
    expect(buildSummaryVM(runs).succeededWithIssues).toBe(1);
  });

  it('derives successRatePct, rounded, and 0 (not NaN) for an empty list', () => {
    const runs = [
      makeVM({ id: 's1', status: 'SUCCEEDED' }),
      makeVM({ id: 's2', status: 'SUCCEEDED' }),
      makeVM({ id: 'f1', status: 'FAILED' }),
    ];
    expect(buildSummaryVM(runs).successRatePct).toBe(67);
    expect(buildSummaryVM([]).successRatePct).toBe(0);
  });

  it('sums cost across runs (nulls as 0) and formats it', () => {
    const runs = [
      makeVM({ id: 'a', cost: 0.01 }),
      makeVM({ id: 'b', cost: 0.02 }),
      makeVM({ id: 'c', cost: null }),
    ];
    expect(buildSummaryVM(runs).totalCostLabel).toBe('$0.03');
  });

  it('is empty-safe: zero runs -> zero counts, 0%, "$0.00", no insight', () => {
    const vm = buildSummaryVM([]);
    expect(vm.total).toBe(0);
    expect(vm.counts).toEqual({ FAILED: 0, RUNNING: 0, SUBMITTED: 0, SUCCEEDED: 0, CANCELLED: 0 });
    expect(vm.succeededWithIssues).toBe(0);
    expect(vm.totalCostLabel).toBe('$0.00');
    expect(vm.insight).toBeNull();
  });

  it('surfaces the same insight detectPatterns would compute', () => {
    const runs = [
      makeVM({ id: 'f1', status: 'FAILED', error: { process: 'ABACAS' } }),
      makeVM({ id: 'f2', status: 'FAILED', error: { process: 'ABACAS' } }),
    ];
    expect(buildSummaryVM(runs).insight).toEqual(detectPatterns(runs));
  });
});
