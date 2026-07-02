import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnInit,
  signal,
} from '@angular/core';
import type { RunStatus, RunVM, SortState } from '../../../core/models';
import { applyFilters } from '../../../core/derive/filter.utils';
import { sortRuns } from '../../../core/derive/sort.utils';
import { costFmt } from '../../../core/derive/format.utils';
import type { RunDetailVM } from '../run-drawer/run-drawer.models';
import type { RunsSummaryVM, SummaryInsight, SummaryLens } from '../runs-summary/runs-summary-v2.models';
import { PreviewShellComponent } from './preview-shell.component';
import { RunsLayoutComponent } from '../runs-layout/runs-layout.component';
import { RunsSummaryV3Component } from '../runs-summary/runs-summary-v3.component';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { RunsTableComponent } from '../runs-table/runs-table.component';
import { RunDrawerMaterialComponent } from '../run-drawer-material/run-drawer-material.component';
import { FULL_PREVIEW_FIXTURE } from './runs-page-preview.fixtures';

function matchesInsightFilter(run: RunVM, filter: SummaryInsight['filter']): boolean {
  if (filter.status && run.status !== filter.status) return false;
  if (filter.process && run.error?.process !== filter.process) return false;
  if (filter.executor && run.executor !== filter.executor) return false;
  return true;
}

/** Recurring-failure pattern across FAILED runs — a stand-in for the future core `detectPatterns`. */
function detectInsight(runs: RunDetailVM[]): SummaryInsight | null {
  const byProcess = new Map<string, number>();
  for (const run of runs) {
    const process = run.status === 'FAILED' ? run.error?.process : undefined;
    if (process) byProcess.set(process, (byProcess.get(process) ?? 0) + 1);
  }

  let topProcess: string | null = null;
  let topCount = 0;
  for (const [process, count] of byProcess) {
    if (count > topCount) {
      topProcess = process;
      topCount = count;
    }
  }
  if (!topProcess || topCount < 2) return null;

  return {
    kind: 'recurring-error',
    count: topCount,
    label: `${topCount} runs failed on the same process (${topProcess})`,
    filter: { status: 'FAILED', process: topProcess },
  };
}

function buildSummaryVM(runs: RunDetailVM[]): RunsSummaryVM {
  const counts: Record<RunStatus, number> = {
    FAILED: 0,
    RUNNING: 0,
    SUBMITTED: 0,
    SUCCEEDED: 0,
    CANCELLED: 0,
  };
  let succeededWithIssues = 0;
  let totalCost = 0;

  for (const run of runs) {
    counts[run.status]++;
    if (run.status === 'SUCCEEDED' && run.needsAttention) succeededWithIssues++;
    totalCost += run.cost ?? 0;
  }

  const total = runs.length;
  return {
    total,
    counts,
    succeededWithIssues,
    successRatePct: total > 0 ? Math.round((counts.SUCCEEDED / total) * 100) : 0,
    totalCostLabel: costFmt(totalCost),
    insight: detectInsight(runs),
  };
}

/**
 * Story-only rehearsal of the real `runs-page` wiring: composes the shell,
 * `runs-layout`, `runs-summary` (v3), `filter-bar`, `runs-table` (row refinement v2)
 * and `run-drawer-material` over local signals + fixtures — no RunsService, no HTTP.
 * Swap `FULL_PREVIEW_FIXTURE` for `RunsService.runs()` and the wiring below carries
 * straight over to the real page.
 */
@Component({
  selector: 'app-runs-page-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PreviewShellComponent,
    RunsLayoutComponent,
    RunsSummaryV3Component,
    FilterBarComponent,
    RunsTableComponent,
    RunDrawerMaterialComponent,
  ],
  template: `
    <app-preview-shell (refresh)="onRefresh()">
      <div class="preview-content">
        <app-runs-layout>
          <div header class="preview-header">
            <div>
              <h1>Runs</h1>
              <p>Extended demo data</p>
            </div>
          </div>

          <div summary>
            <app-runs-summary-v3
              [summary]="summary()"
              [activeLens]="activeLens()"
              (lens)="onLens($event)"
            />
          </div>

          <div filters>
            <app-filter-bar
              [search]="search()"
              [status]="status()"
              [executor]="executor()"
              [executors]="executorOptions()"
              (searchChange)="search.set($event)"
              (statusChange)="onStatusChange($event)"
              (executorChange)="executor.set($event)"
              (clearAll)="onClearFilters()"
            />
          </div>

          <div table>
            <app-runs-table
              [runs]="visibleRuns()"
              [total]="visibleRuns().length"
              [selectedId]="selectedId()"
              [sort]="sort()"
              (select)="onRowSelect($event)"
              (sortChange)="sort.set($event)"
              (clearFilters)="onClearFilters()"
            />
          </div>
        </app-runs-layout>

        <app-run-drawer-material [run]="selectedRun()" (close)="onDrawerClose()" />
      </div>
    </app-preview-shell>
  `,
  styleUrl: './runs-page-preview.component.scss',
})
export class RunsPagePreviewComponent implements OnInit {
  /** Lets a story open on a preset run/lens without simulating the clicks that reach it. */
  readonly initialSelectedId = input<string | null>(null);
  readonly initialLens = input<SummaryLens | null>(null);

  private readonly all = signal<RunDetailVM[]>(FULL_PREVIEW_FIXTURE);

  protected readonly search = signal('');
  protected readonly status = signal<RunStatus | null>(null);
  protected readonly executor = signal<string | null>(null);
  protected readonly sort = signal<SortState>({ key: 'risk', dir: 'desc' });

  protected readonly activeLens = signal<SummaryLens | null>(null);
  protected readonly selectedId = signal<string | null>(null);

  // Seeded in ngOnInit, not a field initializer or the constructor — signal
  // inputs read at either of those points still observe their default value,
  // not a template-bound one; ngOnInit is the first point that's guaranteed
  // to see it.
  ngOnInit(): void {
    this.activeLens.set(this.initialLens());
    this.selectedId.set(this.initialSelectedId());
  }

  protected readonly executorOptions = computed<string[]>(() => {
    const seen = new Set<string>();
    for (const run of this.all()) {
      if (run.executor) seen.add(run.executor);
    }
    return Array.from(seen).sort();
  });

  // Summary reads over ALL runs — filtering the table never changes the overall
  // health picture, only which rows are currently shown.
  protected readonly summary = computed(() => buildSummaryVM(this.all()));

  protected readonly visibleRuns = computed(() => {
    const base = applyFilters(this.all(), {
      search: this.search(),
      status: this.status(),
      executor: this.executor(),
    });

    const lens = this.activeLens();
    const filtered =
      lens?.kind === 'attention'
        ? base.filter(run => run.needsAttention)
        : lens?.kind === 'insight'
          ? base.filter(run => matchesInsightFilter(run, lens.insight.filter))
          : base; // status lens is already applied above via the shared `status` signal

    return sortRuns(filtered, this.sort());
  });

  protected readonly selectedRun = computed<RunDetailVM | null>(
    () => this.all().find(run => run.id === this.selectedId()) ?? null,
  );

  /** Single source of truth: a status lens and the filter-bar status dropdown drive the same signal. */
  protected onLens(next: SummaryLens | null): void {
    this.activeLens.set(next);
    this.status.set(next?.kind === 'status' ? next.status : null);
  }

  protected onStatusChange(status: RunStatus | null): void {
    this.status.set(status);
    this.activeLens.set(status ? { kind: 'status', status } : null);
  }

  protected onRowSelect(run: RunVM): void {
    this.selectedId.set(run.id);
  }

  protected onDrawerClose(): void {
    this.selectedId.set(null);
  }

  protected onClearFilters(): void {
    this.search.set('');
    this.status.set(null);
    this.executor.set(null);
    this.activeLens.set(null);
  }

  protected onRefresh(): void {
    // Demo-only: the preview has no data layer to refresh.
  }
}
