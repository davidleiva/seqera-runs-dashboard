import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { RunsService } from '../../../core/runs.service';
import { sortRuns } from '../../../core/derive/sort.utils';
import { applyFilters, summarize } from '../../../core/derive/filter.utils';
import { RunsTableComponent } from '../runs-table/runs-table.component';
import { RunDrawerComponent } from '../run-drawer/run-drawer.component';
import { HealthBarComponent } from '../../../shared/health-bar/health-bar.component';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import type { RunVM, RunStatus, SortState } from '../../../core/models';
import type { RunDetailVM } from '../run-drawer/run-drawer.models';

@Component({
  selector: 'app-runs-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RunsTableComponent, RunDrawerComponent, HealthBarComponent, FilterBarComponent],
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

        <!-- KPI health bar (includes criticality headline) -->
        <app-health-bar
          [kpis]="kpis()"
          [activeFilter]="statusFilter()"
          (filter)="statusFilter.set($event)" />

        <!-- Search + status + executor filters + active chips -->
        <div class="page__filterbar">
          <app-filter-bar
            [search]="search()"
            [status]="statusFilter()"
            [executor]="executorFilter()"
            [executors]="executorOptions()"
            (searchChange)="search.set($event)"
            (statusChange)="statusFilter.set($event)"
            (executorChange)="executorFilter.set($event)"
            (clearAll)="resetFilters()" />
        </div>

        <!-- Runs table — owns loading + empty states -->
        <div class="page__table">
          <app-runs-table
            [runs]="visibleRuns()"
            [selectedId]="selectedId()"
            [loading]="service.loadStatus() === 'loading'"
            [sort]="sort()"
            (select)="onSelect($event)"
            (sortChange)="sort.set($event)"
            (clearFilters)="resetFilters()" />
        </div>

      }

      <!-- Detail drawer — stacks over content -->
      <app-run-drawer
        [run]="selectedRun()"
        (close)="onDrawerClose()" />

    </div>
  `,
  styleUrl: './runs-page.component.scss',
})
export class RunsPageComponent {
  protected readonly service = inject(RunsService);
  private readonly route = inject(ActivatedRoute);

  // ─── View state ───────────────────────────────────────────────────────────

  protected readonly search = signal('');
  protected readonly statusFilter = signal<RunStatus | null>(null);
  protected readonly executorFilter = signal<string | null>(null);
  protected readonly sort = signal<SortState>({ key: 'risk', dir: 'desc' });
  protected readonly selectedId = signal<string | null>(null);

  // Debounce raw search signal so typing doesn't recompute on every keystroke
  private readonly searchDebounced = toSignal(
    toObservable(this.search).pipe(debounceTime(150)),
    { initialValue: '' },
  );

  // ─── Routing ──────────────────────────────────────────────────────────────

  private readonly routeData = toSignal(this.route.data);

  protected readonly scenario = computed<'sample' | 'showcase'>(() =>
    (this.routeData()?.['scenario'] as 'sample' | 'showcase') ?? 'showcase',
  );

  constructor() {
    // Reload when the route switches /sample ↔ /showcase
    effect(() => {
      this.service.load(this.scenario());
      this.resetFilters();
      this.selectedId.set(null);
    });
  }

  // ─── Table ref — for keyboard focus-return after drawer closes ────────────

  private readonly table = viewChild(RunsTableComponent);

  // ID of the row that triggered the drawer open; used to restore focus on close
  private lastSelectedId: string | null = null;

  // ─── Derived state (pure functions from core/) ────────────────────────────

  protected readonly visibleRuns = computed(() =>
    sortRuns(
      applyFilters(this.service.runs(), {
        search: this.searchDebounced() ?? '',
        status: this.statusFilter(),
        executor: this.executorFilter(),
      }),
      this.sort(),
    ),
  );

  protected readonly kpis = computed(() => summarize(this.service.runs()));

  protected readonly selectedRun = computed<RunDetailVM | null>(
    () => this.service.runs().find(r => r.id === this.selectedId()) ?? null,
  );

  protected readonly executorOptions = computed<string[]>(() => {
    const seen = new Set<string>();
    for (const run of this.service.runs()) {
      if (run.executor) seen.add(run.executor);
    }
    return Array.from(seen).sort();
  });

  // ─── Event handlers ───────────────────────────────────────────────────────

  protected onSelect(run: RunVM): void {
    this.lastSelectedId = run.id;
    this.selectedId.set(run.id);
  }

  protected onDrawerClose(): void {
    const lastId = this.lastSelectedId;
    this.selectedId.set(null);
    // Return keyboard focus to the row that opened the drawer
    if (lastId) {
      queueMicrotask(() => this.table()?.focusRunById(lastId));
    }
  }

  protected resetFilters(): void {
    this.search.set('');
    this.statusFilter.set(null);
    this.executorFilter.set(null);
  }
}
