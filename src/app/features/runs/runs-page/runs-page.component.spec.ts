import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { RunsService } from '../../../core/runs.service';
import { RunsPageComponent } from './runs-page.component';
import type { RunDetailVM } from '../run-drawer/run-drawer.models';
import type { RunStatus, SortState } from '../../../core/models';
import type { RunsSummaryVM, SummaryLens } from '../runs-summary/runs-summary.models';

// The component's sticky-header measuring effects observe real elements via
// `ResizeObserver`, which the test environment doesn't provide — stub it so
// those effects no-op instead of throwing. Not asserted against; only the
// state/signals logic below is under test.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;

// ─── Fixture factories ─────────────────────────────────────────────────────

function makeRun(overrides: Partial<RunDetailVM> = {}): RunDetailVM {
  return {
    id: 'id',
    name: 'run',
    pipeline: 'nf-core/test',
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
    knownIssue: null,
    failedTask: null,
    sessionId: 'sess',
    commitId: null,
    workDir: '/work',
    commandLine: 'nextflow run',
    profile: 'test',
    startedLabel: 'Jun 1 · 10:03',
    completedLabel: 'Jun 1 · 11:03',
    cpuEfficiency: 65,
    memoryEfficiency: 5,
    resources: null,
    topProcesses: [],
    ...overrides,
  };
}

const failedRun = makeRun({ id: 'f1', status: 'FAILED', needsAttention: true, attentionLabel: 'Failed' });
const succeededRun = makeRun({ id: 's1', status: 'SUCCEEDED' });
const runningRun = makeRun({ id: 'r1', status: 'RUNNING' });

// 30 runs, all SUCCEEDED, for pagination-focused tests.
const manyRuns = Array.from({ length: 30 }, (_, i) =>
  makeRun({ id: `m${i}`, name: `run-${i}`, submittedAt: new Date(2026, 5, 1 + i) }),
);

// ─── Setup helper ──────────────────────────────────────────────────────────

function setup(initialRuns: RunDetailVM[] = [failedRun, succeededRun, runningRun]) {
  const runs = signal(initialRuns);
  const mockService = {
    runs,
    loadStatus: signal<'loading' | 'ready' | 'error'>('ready'),
    scenario: signal<'showcase' | 'sample' | null>('showcase'),
    lastLoadedAt: signal<Date | null>(new Date()),
    load: () => {},
  };

  TestBed.configureTestingModule({
    imports: [RunsPageComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
      { provide: RunsService, useValue: mockService },
      { provide: ActivatedRoute, useValue: { data: of({ scenario: 'showcase' }) } },
    ],
  });

  const fixture = TestBed.createComponent(RunsPageComponent);
  fixture.detectChanges();

  const component = fixture.componentInstance as RunsPageComponent & {
    search: ReturnType<typeof signal<string>>;
    status: ReturnType<typeof signal<RunStatus | null>>;
    executor: ReturnType<typeof signal<string | null>>;
    sort: ReturnType<typeof signal<SortState>>;
    activeLens: ReturnType<typeof signal<SummaryLens | null>>;
    selectedId: ReturnType<typeof signal<string | null>>;
    pageIndex: ReturnType<typeof signal<number>>;
    pageSize: ReturnType<typeof signal<number>>;
    filteredSorted: () => RunDetailVM[];
    total: () => number;
    pagedRuns: () => RunDetailVM[];
    summary: () => RunsSummaryVM;
    selectedRun: () => RunDetailVM | null;
    onLens: (lens: SummaryLens | null) => void;
    onStatusChange: (status: RunStatus | null) => void;
    onSearchChange: (search: string) => void;
    onExecutorChange: (executor: string | null) => void;
    onSortChange: (sort: SortState) => void;
    onPageChange: (event: { pageIndex: number; pageSize: number }) => void;
    onRowSelect: (run: RunDetailVM) => void;
    onDrawerClose: () => void;
    resetFilters: () => void;
  };

  return { fixture, component };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('RunsPageComponent — container tests', () => {
  describe('filter consistency: status drives filteredSorted/pagedRuns', () => {
    it('shows all runs with no filter active', () => {
      const { component } = setup();
      expect(component['filteredSorted']().length).toBe(3);
    });

    it('applying FAILED status leaves only failed runs', () => {
      const { component } = setup();
      component['onStatusChange']('FAILED');
      const visible = component['filteredSorted']();
      expect(visible.length).toBe(1);
      expect(visible[0].id).toBe('f1');
    });

    it('clearing filters restores all runs', () => {
      const { component } = setup();
      component['onStatusChange']('FAILED');
      expect(component['filteredSorted']().length).toBe(1);
      component['resetFilters']();
      expect(component['filteredSorted']().length).toBe(3);
    });
  });

  describe('selection: selecting a run sets selectedRun; close clears it', () => {
    it('selectedRun is null initially', () => {
      const { component } = setup();
      expect(component['selectedRun']()).toBeNull();
    });

    it('onRowSelect(run) sets selectedRun to that run', () => {
      const { component } = setup();
      component['onRowSelect'](failedRun);
      expect(component['selectedRun']()?.id).toBe('f1');
    });

    it('onDrawerClose() clears selectedRun', () => {
      const { component } = setup();
      component['onRowSelect'](succeededRun);
      component['onDrawerClose']();
      expect(component['selectedRun']()).toBeNull();
    });
  });

  describe('pagination: slice correctness + defensive clamp', () => {
    it('pagedRuns is the first `pageSize` slice of filteredSorted at pageIndex 0', () => {
      const { component } = setup(manyRuns);
      component['pageSize'].set(10);
      expect(component['total']()).toBe(30);
      expect(component['pagedRuns']().length).toBe(10);
      expect(component['pagedRuns']().map(r => r.id)).toEqual(
        component['filteredSorted']().slice(0, 10).map(r => r.id),
      );
    });

    it('advancing the page returns the next slice', () => {
      const { component } = setup(manyRuns);
      component['pageSize'].set(10);
      component['onPageChange']({ pageIndex: 1, pageSize: 10 });
      expect(component['pagedRuns']().map(r => r.id)).toEqual(
        component['filteredSorted']().slice(10, 20).map(r => r.id),
      );
    });

    it('the last page returns the remainder, not an out-of-bounds empty slice', () => {
      const { component } = setup(manyRuns); // 30 rows
      component['pageSize'].set(10);
      component['onPageChange']({ pageIndex: 2, pageSize: 10 });
      expect(component['pagedRuns']().length).toBe(10);
    });

    it('defensively clamps pageIndex when it outruns the filtered set (e.g. after a filter shrinks it)', () => {
      const { component } = setup(manyRuns);
      component['pageSize'].set(10);
      component['onPageChange']({ pageIndex: 2, pageSize: 10 }); // page 3 of 3, valid for 30 rows

      // Now filter down to just 1 matching run — page 2 would be out of range.
      component['status'].set('CANCELLED'); // none of manyRuns are CANCELLED -> 0 results
      expect(component['total']()).toBe(0);
      expect(component['pagedRuns']()).toEqual([]);
    });

    it('changing pageSize via onPageChange re-slices accordingly', () => {
      const { component } = setup(manyRuns);
      component['onPageChange']({ pageIndex: 0, pageSize: 25 });
      expect(component['pagedRuns']().length).toBe(25);
    });
  });

  describe('reset-to-page-0 on filter/sort/lens changes (explicit in handlers, not an effect)', () => {
    it('onStatusChange resets pageIndex to 0', () => {
      const { component } = setup(manyRuns);
      component['pageIndex'].set(2);
      component['onStatusChange']('SUCCEEDED');
      expect(component['pageIndex']()).toBe(0);
    });

    it('onSearchChange resets pageIndex to 0', () => {
      const { component } = setup(manyRuns);
      component['pageIndex'].set(2);
      component['onSearchChange']('run-1');
      expect(component['pageIndex']()).toBe(0);
    });

    it('onExecutorChange resets pageIndex to 0', () => {
      const { component } = setup(manyRuns);
      component['pageIndex'].set(2);
      component['onExecutorChange']('awsbatch');
      expect(component['pageIndex']()).toBe(0);
    });

    it('onSortChange resets pageIndex to 0', () => {
      const { component } = setup(manyRuns);
      component['pageIndex'].set(2);
      component['onSortChange']({ key: 'cost', dir: 'asc' });
      expect(component['pageIndex']()).toBe(0);
    });

    it('onLens resets pageIndex to 0', () => {
      const { component } = setup(manyRuns);
      component['pageIndex'].set(2);
      component['onLens']({ kind: 'attention' });
      expect(component['pageIndex']()).toBe(0);
    });

    it('resetFilters (clearAll / clearFilters) resets pageIndex to 0', () => {
      const { component } = setup(manyRuns);
      component['pageIndex'].set(2);
      component['resetFilters']();
      expect(component['pageIndex']()).toBe(0);
    });

    it('onPageChange itself does NOT get overridden back to 0 (it is the page nav action)', () => {
      const { component } = setup(manyRuns);
      component['onPageChange']({ pageIndex: 2, pageSize: 10 });
      expect(component['pageIndex']()).toBe(2);
    });
  });

  describe('summary is decoupled from pagination and filters', () => {
    it('summary counts reflect the full run set regardless of the active filter', () => {
      const { component } = setup([failedRun, succeededRun, runningRun]);
      const before = component['summary']();
      expect(before.total).toBe(3);

      component['onStatusChange']('FAILED');
      const after = component['summary']();
      expect(after.total).toBe(3);
      expect(after).toEqual(before);
    });

    it('summary counts do not change when paging', () => {
      const { component } = setup(manyRuns);
      const before = component['summary']();

      component['pageSize'].set(10);
      component['onPageChange']({ pageIndex: 1, pageSize: 10 });

      expect(component['summary']()).toEqual(before);
    });

    it('summary counts do not change when the search term narrows the table', () => {
      const { component } = setup(manyRuns);
      const before = component['summary']();
      component['onSearchChange']('run-1');
      expect(component['filteredSorted']().length).toBeLessThan(manyRuns.length);
      expect(component['summary']()).toEqual(before);
    });
  });
});
