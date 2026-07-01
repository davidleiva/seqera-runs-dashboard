import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { RunsService } from '../../../core/runs.service';
import { RunsPageComponent } from './runs-page.component';
import type { RunDetailVM } from '../run-drawer/run-drawer.models';

// ─── Fixture factories ─────────────────────────────────────────────────────

function makeRun(overrides: Partial<RunDetailVM> = {}): RunDetailVM {
  return {
    id: 'id',
    name: 'run',
    pipeline: 'nf-core/test',
    status: 'SUCCEEDED',
    needsAttention: false,
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
    resources: null,
    topProcesses: [],
    ...overrides,
  };
}

const failedRun = makeRun({ id: 'f1', status: 'FAILED', needsAttention: true });
const succeededRun = makeRun({ id: 's1', status: 'SUCCEEDED' });
const runningRun = makeRun({ id: 'r1', status: 'RUNNING' });

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

  // Access component internals by bracket notation
  const component = fixture.componentInstance as RunsPageComponent & {
    statusFilter: ReturnType<typeof signal<'FAILED' | 'SUCCEEDED' | 'RUNNING' | 'SUBMITTED' | 'CANCELLED' | null>>;
    visibleRuns: () => RunDetailVM[];
    selectedId: ReturnType<typeof signal<string | null>>;
    selectedRun: () => RunDetailVM | null;
    onSelect: (run: RunDetailVM) => void;
    onDrawerClose: () => void;
    resetFilters: () => void;
  };

  return { fixture, component };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('RunsPageComponent — container tests', () => {

  describe('filter consistency: statusFilter drives visibleRuns', () => {
    it('shows all runs with no filter active', () => {
      const { component } = setup();
      expect(component['visibleRuns']().length).toBe(3);
    });

    it('applying FAILED status leaves only failed runs in visibleRuns', () => {
      const { component } = setup();

      component['statusFilter'].set('FAILED');

      const visible = component['visibleRuns']();
      expect(visible.length).toBe(1);
      expect(visible[0].status).toBe('FAILED');
      expect(visible[0].id).toBe('f1');
    });

    it('clearing the filter restores all runs', () => {
      const { component } = setup();

      component['statusFilter'].set('FAILED');
      expect(component['visibleRuns']().length).toBe(1);

      component['resetFilters']();
      expect(component['visibleRuns']().length).toBe(3);
    });

    it('SUCCEEDED filter returns only succeeded runs', () => {
      const { component } = setup();
      component['statusFilter'].set('SUCCEEDED');
      const visible = component['visibleRuns']();
      expect(visible.every(r => r.status === 'SUCCEEDED')).toBe(true);
    });
  });

  describe('selection: selecting a run sets selectedRun; close clears it', () => {
    it('selectedRun is null initially', () => {
      const { component } = setup();
      expect(component['selectedRun']()).toBeNull();
    });

    it('onSelect(run) sets selectedRun to that run', () => {
      const { component } = setup();

      component['onSelect'](failedRun);

      const selected = component['selectedRun']();
      expect(selected).not.toBeNull();
      expect(selected!.id).toBe('f1');
      expect(selected!.status).toBe('FAILED');
    });

    it('onDrawerClose() clears selectedRun', () => {
      const { component } = setup();

      component['onSelect'](succeededRun);
      expect(component['selectedRun']()).not.toBeNull();

      component['onDrawerClose']();
      expect(component['selectedRun']()).toBeNull();
    });

    it('selecting another run while drawer is open swaps to the new run', () => {
      const { component } = setup();

      component['onSelect'](failedRun);
      expect(component['selectedRun']()?.id).toBe('f1');

      component['onSelect'](runningRun);
      expect(component['selectedRun']()?.id).toBe('r1');
    });
  });
});
