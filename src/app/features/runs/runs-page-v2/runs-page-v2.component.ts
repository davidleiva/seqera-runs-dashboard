import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import type { RunStatus, RunVM, SortState } from '../../../core/models';
import { applyFilters } from '../../../core/derive/filter.utils';
import { sortRuns } from '../../../core/derive/sort.utils';
import { buildSummaryVM } from '../../../core/derive/summary.utils';
import { RunsService } from '../../../core/runs.service';
import type { RunDetailVM } from '../run-drawer/run-drawer.models';
import type { SummaryInsight, SummaryLens } from '../runs-summary/runs-summary-v2.models';
import { RunsLayoutComponent } from '../runs-layout/runs-layout.component';
import { RunsSummaryV3Component } from '../runs-summary/runs-summary-v3.component';
import { RunsSummaryV3SkeletonComponent } from '../runs-summary/runs-summary-v3-skeleton.component';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { RunsTableComponent } from '../runs-table/runs-table.component';
import { RunDrawerMaterialComponent } from '../run-drawer-material/run-drawer-material.component';

function matchesInsightFilter(run: RunVM, filter: SummaryInsight['filter']): boolean {
  if (filter.status && run.status !== filter.status) return false;
  if (filter.process && run.error?.process !== filter.process) return false;
  if (filter.executor && run.executor !== filter.executor) return false;
  return true;
}

/**
 * v2 of the runs page container: same data layer (`RunsService`, `toRunDetailVM`,
 * `applyFilters`/`sortRuns`/`buildSummaryVM`) as the real `runs-page`, composed
 * through the new presentational set instead — `runs-layout` + `runs-summary` (v3)
 * + `filter-bar` + `runs-table` (row refinement v2) + `run-drawer-material`.
 * `runs-page` and its routes are untouched; this is a parallel `/v2/*` route.
 */
@Component({
  selector: 'app-runs-page-v2',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RunsLayoutComponent,
    RunsSummaryV3Component,
    RunsSummaryV3SkeletonComponent,
    FilterBarComponent,
    RunsTableComponent,
    RunDrawerMaterialComponent,
  ],
  template: `
    <div class="page">
      @if (service.loadStatus() === 'error') {
        <div class="page__error" role="alert">
          <span class="material-icons" aria-hidden="true">error_outline</span>
          <div>
            <strong>Failed to load runs</strong>
            <p>Could not fetch the dataset. Check the browser console for details.</p>
          </div>
        </div>
      } @else {
        <app-runs-layout>
          <div header class="page-v2__header">
            <h1>Runs</h1>
            <p>v2 layout — runs-summary, filter-bar and the refined table, same data layer</p>
          </div>

          <div summary>
            @if (service.loadStatus() === 'loading') {
              <app-runs-summary-v3-skeleton />
            } @else {
              <app-runs-summary-v3
                [summary]="summary()"
                [activeLens]="activeLens()"
                (lens)="onLens($event)"
              />
            }
          </div>

          <div filters>
            <app-filter-bar
              [search]="search()"
              [status]="status()"
              [executor]="executor()"
              [executors]="executorOptions()"
              (searchChange)="onSearchChange($event)"
              (statusChange)="onStatusChange($event)"
              (executorChange)="onExecutorChange($event)"
              (clearAll)="resetFilters()"
            />
          </div>

          <div table>
            <app-runs-table
              [runs]="pagedRuns()"
              [total]="total()"
              [pageIndex]="pageIndex()"
              [pageSize]="pageSize()"
              [selectedId]="selectedId()"
              [loading]="service.loadStatus() === 'loading'"
              [sort]="sort()"
              (select)="onRowSelect($event)"
              (sortChange)="onSortChange($event)"
              (pageChange)="onPageChange($event)"
              (clearFilters)="resetFilters()"
            />
          </div>
        </app-runs-layout>
      }

      <app-run-drawer-material [run]="selectedRun()" (close)="onDrawerClose()" />
    </div>
  `,
  styleUrl: './runs-page-v2.component.scss',
})
export class RunsPageV2Component {
  protected readonly service = inject(RunsService);
  private readonly route = inject(ActivatedRoute);

  protected readonly search = signal('');
  protected readonly status = signal<RunStatus | null>(null);
  protected readonly executor = signal<string | null>(null);
  protected readonly sort = signal<SortState>({ key: 'risk', dir: 'desc' });
  protected readonly activeLens = signal<SummaryLens | null>(null);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);

  private readonly routeData = toSignal(this.route.data);
  protected readonly scenario = computed<'sample' | 'showcase'>(
    () => (this.routeData()?.['scenario'] as 'sample' | 'showcase') ?? 'showcase',
  );

  constructor() {
    // Reload when the route switches /v2/sample ↔ /v2/showcase
    effect(() => {
      this.service.load(this.scenario());
      this.resetFilters();
      this.selectedId.set(null);
    });
  }

  protected readonly executorOptions = computed<string[]>(() => {
    const seen = new Set<string>();
    for (const run of this.service.runs()) {
      if (run.executor) seen.add(run.executor);
    }
    return Array.from(seen).sort();
  });

  // Summary reads over ALL loaded runs — filtering the table never changes the
  // overall health picture, only which rows are currently shown.
  protected readonly summary = computed(() => buildSummaryVM(this.service.runs()));

  // Pipeline: filters -> sort -> paginate. `runs-table` only ever sees the
  // final slice + the numbers it needs to render the pager — it never filters,
  // sorts or slices itself.
  protected readonly filteredSorted = computed(() => {
    const base = applyFilters(this.service.runs(), {
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

  protected readonly total = computed(() => this.filteredSorted().length);

  protected readonly pagedRuns = computed(() => {
    const size = this.pageSize();
    const maxPage = Math.max(0, Math.ceil(this.total() / size) - 1);
    const page = Math.min(this.pageIndex(), maxPage); // defensive clamp
    return this.filteredSorted().slice(page * size, page * size + size);
  });

  protected readonly selectedRun = computed<RunDetailVM | null>(
    () => this.service.runs().find(run => run.id === this.selectedId()) ?? null,
  );

  /** Single source of truth: a status lens and the filter-bar status dropdown drive the same signal. */
  protected onLens(next: SummaryLens | null): void {
    this.activeLens.set(next);
    this.status.set(next?.kind === 'status' ? next.status : null);
    this.pageIndex.set(0);
  }

  protected onStatusChange(status: RunStatus | null): void {
    this.status.set(status);
    this.activeLens.set(status ? { kind: 'status', status } : null);
    this.pageIndex.set(0);
  }

  protected onSearchChange(search: string): void {
    this.search.set(search);
    this.pageIndex.set(0);
  }

  protected onExecutorChange(executor: string | null): void {
    this.executor.set(executor);
    this.pageIndex.set(0);
  }

  protected onSortChange(sort: SortState): void {
    this.sort.set(sort);
    this.pageIndex.set(0);
  }

  protected onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  protected onRowSelect(run: RunVM): void {
    this.selectedId.set(run.id);
  }

  protected onDrawerClose(): void {
    this.selectedId.set(null);
  }

  protected resetFilters(): void {
    this.search.set('');
    this.status.set(null);
    this.executor.set(null);
    this.activeLens.set(null);
    this.pageIndex.set(0);
  }
}
