import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import type { RunStatus, RunVM, SortState } from '../../../core/models';
import { applyFilters, matchesInsightFilter } from '../../../core/derive/filter.utils';
import { sortRuns } from '../../../core/derive/sort.utils';
import { buildSummaryVM } from '../../../core/derive/summary.utils';
import { RunsService } from '../../../core/runs.service';
import type { RunDetailVM } from '../run-drawer/run-drawer.models';
import type { SummaryLens } from '../runs-summary/runs-summary.models';
import { RunsSummaryComponent } from '../runs-summary/runs-summary.component';
import { RunsSummarySkeletonComponent } from '../runs-summary/runs-summary-skeleton.component';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { RunDrawerComponent } from '../run-drawer/run-drawer.component';
import { RunsTableComponent } from '../runs-table/runs-table.component';

/**
 * The dashboard's single smart container: owns filter/sort/pagination/selection
 * state and the `RunsService` data layer, composed over `runs-summary` +
 * `filter-bar` + `runs-table` + `run-drawer`.
 *
 * `.content` is a plain flex column owning its own gutter/centering — no
 * separate layout wrapper component. Summary and filters are each
 * `position: sticky` on desktop only; the table owns its own horizontal
 * scrollbar with a JS-faked sticky `<thead>` (`RunsTableComponent`) instead
 * of `.main-content` itself scrolling sideways.
 */
@Component({
  selector: 'app-runs-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RunsSummaryComponent,
    RunsSummarySkeletonComponent,
    FilterBarComponent,
    RunsTableComponent,
    RunDrawerComponent,
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
        <div class="content">
          <div class="page-title">
            <h1>Runs</h1>
          </div>

          <div class="summary-container" [class.is-stuck]="summaryStuck()" #summaryContainer>
            @if (service.loadStatus() === 'loading') {
              <app-runs-summary-skeleton />
            } @else {
              <app-runs-summary
                [summary]="summary()"
                [activeLens]="activeLens()"
                (lens)="onLens($event)"
              />
            }
          </div>

          <div class="filters-container" [class.is-stuck]="filtersStuck()" #filtersContainer>
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

          <div class="table-container">
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
        </div>
      }

      <app-run-drawer [run]="selectedRun()" (close)="onDrawerClose()" />
    </div>
  `,
  styleUrl: './runs-page.component.scss',
})
export class RunsPageComponent {
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

  private readonly runsTable = viewChild(RunsTableComponent);

  private readonly summaryContainer = viewChild<ElementRef<HTMLElement>>('summaryContainer');
  private readonly filtersContainer = viewChild<ElementRef<HTMLElement>>('filtersContainer');
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  /** Square corners while pinned — a rounded card flush against the topbar/another stuck card reads oddly. */
  protected readonly summaryStuck = signal(false);
  protected readonly filtersStuck = signal(false);

  constructor() {
    // Explicit reaction to route changes (not an `effect`) — this writes several
    // signals, which is exactly the kind of side effect `effect()` shouldn't own.
    this.route.data.pipe(takeUntilDestroyed()).subscribe(data => {
      const scenario = (data['scenario'] as 'sample' | 'showcase') ?? 'showcase';
      this.service.load(scenario);
      this.resetFilters();
      this.selectedId.set(null);
    });

    // Real measurement, not a guess — `.filters-container`'s sticky `top`
    // (runs-page.component.scss) needs to clear `.summary-container`'s
    // *actual* rendered height (it changes: the criticality alert only
    // shows when runs need attention; the skeleton's own height may also
    // differ slightly from the real summary's). An `effect` (not a
    // one-time `afterNextRender`): `.summary-container` disappears entirely
    // in the error state, and the topbar's refresh button can take the
    // page from error back to loading back to ready, so the element can
    // come and go over the component's lifetime.
    effect(onCleanup => {
      const summary = this.summaryContainer()?.nativeElement;
      if (!summary) return;

      const observer = new ResizeObserver(() => {
        this.host.nativeElement.style.setProperty(
          '--summary-sticky-h',
          `${summary.getBoundingClientRect().height}px`,
        );
      });
      observer.observe(summary);
      onCleanup(() => observer.disconnect());
    });

    // Whether each sticky card is actually pinned right now (vs. still in
    // normal flow) — read from the CSS itself rather than re-deriving the
    // offset math a third time: a sticky element is "stuck" exactly when
    // its live position has been clamped to its own resolved `top` (offset
    // from `.main-content`'s own top edge, the nearest scrolling
    // ancestor). `top: auto` (mobile, see the .scss) means it's never
    // vertically sticky at all, so it's correctly never "stuck" there.
    effect(onCleanup => {
      const mainContent = document.querySelector<HTMLElement>('.main-content');
      const summary = this.summaryContainer()?.nativeElement;
      const filters = this.filtersContainer()?.nativeElement;
      if (!mainContent || !summary || !filters) {
        this.summaryStuck.set(false);
        this.filtersStuck.set(false);
        return;
      }

      const isStuck = (el: HTMLElement): boolean => {
        const top = parseFloat(getComputedStyle(el).top);
        if (Number.isNaN(top)) return false;
        return el.getBoundingClientRect().top <= mainContent.getBoundingClientRect().top + top;
      };

      const update = () => {
        this.summaryStuck.set(isStuck(summary));
        this.filtersStuck.set(isStuck(filters));
      };

      update();
      mainContent.addEventListener('scroll', update, { passive: true });
      onCleanup(() => mainContent.removeEventListener('scroll', update));
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

  /**
   * Restore keyboard focus to the row that opened the drawer. If that row is
   * gone (filtered/sorted away while the drawer was open), fall back to the
   * first visible row rather than silently dropping focus to `<body>`.
   */
  protected onDrawerClose(): void {
    const closedRunId = this.selectedId();
    this.selectedId.set(null);
    queueMicrotask(() => this.runsTable()?.focusRowOrFallback(closedRunId));
  }

  protected resetFilters(): void {
    this.search.set('');
    this.status.set(null);
    this.executor.set(null);
    this.activeLens.set(null);
    this.pageIndex.set(0);
  }
}
