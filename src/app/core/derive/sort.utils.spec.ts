import type { RunVM } from '../models/run.model';
import { sortRuns } from './sort.utils';

function makeVM(overrides: Partial<RunVM> = {}): RunVM {
  return {
    id: 'id',
    name: 'run',
    pipeline: 'nf-core/test',
    status: 'SUCCEEDED',
    needsAttention: false,
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

const failed = makeVM({ id: 'f1', status: 'FAILED', needsAttention: true, submittedAt: new Date('2026-06-24T10:00:00Z') });
const failedOlder = makeVM({ id: 'f2', status: 'FAILED', needsAttention: true, submittedAt: new Date('2026-06-12T10:00:00Z') });
const attention = makeVM({ id: 'a1', status: 'SUCCEEDED', needsAttention: true, submittedAt: new Date('2026-06-23T10:00:00Z') });
const running = makeVM({ id: 'r1', status: 'RUNNING', submittedAt: new Date('2026-06-22T10:00:00Z') });
const submitted = makeVM({ id: 's1', status: 'SUBMITTED', submittedAt: new Date('2026-06-22T09:00:00Z') });
const succeeded = makeVM({ id: 'ok1', status: 'SUCCEEDED', submittedAt: new Date('2026-06-20T10:00:00Z') });
const cancelled = makeVM({ id: 'c1', status: 'CANCELLED', submittedAt: new Date('2026-06-19T10:00:00Z') });

describe('sortRuns — risk sort', () => {
  it('puts FAILED first, CANCELLED last', () => {
    const shuffled = [cancelled, succeeded, running, failed, submitted];
    const result = sortRuns(shuffled, { key: 'risk', dir: 'desc' });
    expect(result[0].status).toBe('FAILED');
    expect(result[result.length - 1].status).toBe('CANCELLED');
  });

  it('orders: Failed → Attention → Running → Submitted → Succeeded → Cancelled', () => {
    const input = [cancelled, succeeded, submitted, running, attention, failed];
    const result = sortRuns(input, { key: 'risk', dir: 'desc' });
    expect(result.map(r => r.id)).toEqual(['f1', 'a1', 'r1', 's1', 'ok1', 'c1']);
  });

  it('sorts most recent first within same risk group', () => {
    const result = sortRuns([failedOlder, failed], { key: 'risk', dir: 'desc' });
    expect(result[0].id).toBe('f1'); // Jun 24 newer than Jun 12
  });
});

describe('sortRuns — duration sort', () => {
  const fast = makeVM({ id: 'fast', durationMs: 10000 });
  const slow = makeVM({ id: 'slow', durationMs: 900000 });
  const noTime = makeVM({ id: 'none', durationMs: null });

  it('sorts ascending puts shortest first, nulls last', () => {
    const result = sortRuns([noTime, slow, fast], { key: 'duration', dir: 'asc' });
    expect(result.map(r => r.id)).toEqual(['fast', 'slow', 'none']);
  });

  it('sorts descending puts longest first, nulls last', () => {
    const result = sortRuns([noTime, fast, slow], { key: 'duration', dir: 'desc' });
    expect(result.map(r => r.id)).toEqual(['slow', 'fast', 'none']);
  });
});

describe('sortRuns — cost sort', () => {
  const cheap = makeVM({ id: 'cheap', cost: 0.01 });
  const expensive = makeVM({ id: 'exp', cost: 0.99 });
  const free = makeVM({ id: 'free', cost: null });

  it('sorts descending puts most expensive first, nulls last', () => {
    const result = sortRuns([free, cheap, expensive], { key: 'cost', dir: 'desc' });
    expect(result.map(r => r.id)).toEqual(['exp', 'cheap', 'free']);
  });
});
