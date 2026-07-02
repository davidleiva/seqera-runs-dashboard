import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import type { RunStatus, RunVM, SortState } from '../../../core/models';
import { applyFilters, matchesInsightFilter } from '../../../core/derive/filter.utils';
import { sortRuns } from '../../../core/derive/sort.utils';
import { buildSummaryVM } from '../../../core/derive/summary.utils';
import type { RunDetailVM } from '../run-drawer/run-drawer.models';
import type { SummaryLens } from '../runs-summary/runs-summary.models';
import { PreviewShellComponent } from './preview-shell.component';
import { RunsSummaryComponent } from '../runs-summary/runs-summary.component';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { RunsTableComponent } from '../runs-table/runs-table.component';
import { RunDrawerComponent } from '../run-drawer/run-drawer.component';
import { FULL_PREVIEW_FIXTURE } from './runs-page-preview.fixtures';

/**
 * Story-only rehearsal of the real `runs-page` wiring: composes the shell,
 * `runs-summary`, `filter-bar`, `runs-table` and `run-drawer` over local
 * signals + fixtures — no RunsService, no HTTP, no layout wrapper component
 * (matches `runs-page`, which composes those pieces directly). Swap
 * `FULL_PREVIEW_FIXTURE` for `RunsService.runs()` and the wiring below
 * carries straight over to the real page.
 */
@Component({
  selector: 'app-runs-page-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PreviewShellComponent,
    RunsSummaryComponent,
    FilterBarComponent,
    RunsTableComponent,
    RunDrawerComponent,
  ],
  template: `
    <app-preview-shell (refresh)="onRefresh()">
      <div class="preview-content">
        <div class="content">
          <div class="preview-header">
            <div>
              <h1>Runs</h1>
              <p>Extended demo data</p>
            </div>
          </div>

          <div class="summary-container" #summaryContainer>
            <app-runs-summary
              [summary]="summary()"
              [activeLens]="activeLens()"
              (lens)="onLens($event)"
            />
          </div>

          <div class="filters-container">
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

          <div class="table-container">
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
        </div>

        <app-run-drawer [run]="selectedRun()" (close)="onDrawerClose()" />
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

  private readonly summaryContainer = viewChild<ElementRef<HTMLElement>>('summaryContainer');
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  // Scoped to this component's own host — sets `--summary-sticky-h` so
  // `.filters-container`'s sticky `top` (see the .scss) clears
  // `.summary-container`'s actual rendered height instead of a guess.
  constructor() {
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
  }

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
