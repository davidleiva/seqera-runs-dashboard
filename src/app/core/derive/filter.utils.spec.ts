import type { RunVM } from '../models';
import { applyFilters } from './filter.utils';

function makeRun(overrides: Partial<RunVM> = {}): RunVM {
  return {
    id: 'id',
    name: 'serene_albattani',
    pipeline: 'nf-core/rnaseq',
    status: 'SUCCEEDED',
    needsAttention: false,
    attentionLabel: null,
    user: 'alice',
    submittedAt: new Date('2026-06-01T10:00:00Z'),
    submittedLabel: 'Jun 1 · 10:00',
    durationMs: 60_000,
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
    commandLine: 'nextflow run',
    profile: 'test',
    startedLabel: 'Jun 1 · 10:03',
    completedLabel: 'Jun 1 · 11:03',
    cpuEfficiency: 65,
    memoryEfficiency: 5,
    ...overrides,
  };
}

const failed = makeRun({ id: 'f1', status: 'FAILED', needsAttention: true, executor: 'local' });
const succeeded = makeRun({ id: 's1', status: 'SUCCEEDED', user: 'bob', cost: 0.10 });
const running = makeRun({ id: 'r1', status: 'RUNNING', pipeline: 'nf-core/viralrecon', needsAttention: true });

const ALL = [failed, succeeded, running];

describe('applyFilters', () => {
  it('returns all runs when no filters are active', () => {
    expect(applyFilters(ALL, { search: '', status: null, executor: null })).toHaveLength(3);
  });

  it('filters by search matching run name', () => {
    const result = applyFilters(ALL, { search: 'serene', status: null, executor: null });
    expect(result).toHaveLength(3); // all share name='serene_albattani'
  });

  it('filters by search matching pipeline', () => {
    const result = applyFilters(ALL, { search: 'viralrecon', status: null, executor: null });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r1');
  });

  it('filters by search matching user', () => {
    const result = applyFilters(ALL, { search: 'bob', status: null, executor: null });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
  });

  it('search is case-insensitive', () => {
    const result = applyFilters(ALL, { search: 'BOB', status: null, executor: null });
    expect(result).toHaveLength(1);
  });

  it('filters by status FAILED', () => {
    const result = applyFilters(ALL, { search: '', status: 'FAILED', executor: null });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('f1');
  });

  it('filters by executor', () => {
    const result = applyFilters(ALL, { search: '', status: null, executor: 'local' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('f1');
  });

  it('combines search + status filters', () => {
    const result = applyFilters(ALL, { search: 'viralrecon', status: 'RUNNING', executor: null });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r1');
  });

  it('returns empty array when no runs match', () => {
    const result = applyFilters(ALL, { search: 'nonexistent', status: null, executor: null });
    expect(result).toHaveLength(0);
  });
});
