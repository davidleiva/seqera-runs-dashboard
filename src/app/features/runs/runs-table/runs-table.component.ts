import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import autoAnimate from '@formkit/auto-animate';
import { MatPaginator, type PageEvent } from '@angular/material/paginator';
import type { RunVM, SortKey, SortState } from '../../../core/models';
import { RunRowComponent } from '../run-row/run-row.component';
import { SkeletonRowComponent } from '../../../shared/skeleton-row/skeleton-row.component';

@Component({
  selector: 'app-runs-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RunRowComponent, SkeletonRowComponent, MatPaginator],
  template: `
    @if (!loading() && runs().length === 0) {
      <div class="empty-state" role="status">
        <span class="material-icons empty-state__icon" aria-hidden="true">inbox</span>
        <p class="empty-state__message">No runs match the current filters.</p>
        <button class="empty-state__clear" (click)="clearFilters.emit()">
          Clear filters
        </button>
      </div>
    } @else {
      <div class="runs-table-wrap">
        <table class="runs-table" role="grid" aria-label="Pipeline runs" aria-rowcount="-1">
          <thead>
            <tr role="row">
              <th scope="col" role="columnheader" class="col-status"
                  [attr.aria-sort]="sortAttr('risk')">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'risk'"
                        (click)="onSort('risk')">
                  Status
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortIcon('risk') }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-identity"
                  [attr.aria-sort]="sortAttr('name')">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'name'"
                        (click)="onSort('name')">
                  Run
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortIcon('name') }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-user"
                  [attr.aria-sort]="sortAttr('user')">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'user'"
                        (click)="onSort('user')">
                  User
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortIcon('user') }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-time"
                  [attr.aria-sort]="sortAttr('submitted')">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'submitted'"
                        (click)="onSort('submitted')">
                  Submitted
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortIcon('submitted') }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-duration"
                  [attr.aria-sort]="sortAttr('duration')">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'duration'"
                        (click)="onSort('duration')">
                  Duration
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortIcon('duration') }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-tasks">Tasks</th>
              <th scope="col" role="columnheader" class="col-cost"
                  [attr.aria-sort]="sortAttr('cost')">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'cost'"
                        (click)="onSort('cost')">
                  Cost
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortIcon('cost') }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-retries"
                  [attr.aria-sort]="sortAttr('retries')">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'retries'"
                        (click)="onSort('retries')">
                  Retries
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortIcon('retries') }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-executor">Executor</th>
              <th scope="col" role="columnheader" class="col-action" aria-label="Details"></th>
            </tr>
          </thead>

          @if (loading()) {
            <tbody role="rowgroup">
              @for (_ of skeletonRows; track $index) {
                <tr app-skeleton-row></tr>
              }
            </tbody>
          } @else {
            <tbody #tbody role="rowgroup" (keydown)="onTbodyKeydown($event)">
              @for (run of runs(); track run.id) {
                <tr app-run-row
                    [attr.data-run-id]="run.id"
                    [run]="run"
                    [selected]="run.id === selectedId()"
                    (select)="onRowSelect(run)">
                </tr>
              }
            </tbody>
          }
        </table>
      </div>

      <mat-paginator
        aria-label="Runs pagination"
        [length]="effectiveTotal()"
        [pageIndex]="pageIndex()"
        [pageSize]="pageSize()"
        [pageSizeOptions]="pageSizeOptions()"
        [disabled]="loading()"
        (page)="onPageEvent($event)"
      />
    }
  `,
  styleUrl: './runs-table.component.scss',
  host: { class: 'runs-table-host' },
})
export class RunsTableComponent {
  /** The already-paged slice — this component never filters, sorts or slices. */
  readonly runs = input.required<RunVM[]>();
  readonly selectedId = input<string | null>(null);
  readonly loading = input<boolean>(false);
  readonly sort = input<SortState>({ key: 'risk', dir: 'desc' });

  /** Total rows in the filtered+sorted set (for the pager, not `runs().length`). */
  readonly total = input<number>(0);
  readonly pageIndex = input<number>(0);
  readonly pageSize = input<number>(25);
  readonly pageSizeOptions = input<number[]>([10, 25, 50]);

  readonly select = output<RunVM>();
  readonly sortChange = output<SortState>();
  readonly clearFilters = output<void>();
  readonly pageChange = output<{ pageIndex: number; pageSize: number }>();

  /**
   * Falls back to `runs().length` when a caller doesn't pass `total` (e.g. the
   * real, unpaginated `runs-page` still binds only `runs`) — so the pager reads
   * "1–N of N" instead of a broken "0 of 0" while a real page's rows are showing.
   */
  protected readonly effectiveTotal = computed(() => this.total() || this.runs().length);

  protected readonly skeletonRows = Array(6).fill(null);

  private readonly tbody = viewChild<ElementRef<HTMLElement>>('tbody');

  constructor() {
    effect(() => {
      const el = this.tbody()?.nativeElement;
      if (el) autoAnimate(el);
    });
  }

  protected sortAttr(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (this.sort().key !== key) return 'none';
    return this.sort().dir === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIcon(key: SortKey): string {
    if (this.sort().key !== key) return 'unfold_more';
    return this.sort().dir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  protected onSort(key: SortKey): void {
    const current = this.sort();
    const dir = current.key === key && current.dir === 'desc' ? 'asc' : 'desc';
    this.sortChange.emit({ key, dir });
  }

  protected onRowSelect(run: RunVM): void {
    this.select.emit(run);
  }

  protected onPageEvent(event: PageEvent): void {
    this.pageChange.emit({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }

  /** Called by the page container to restore keyboard focus after drawer closes. */
  focusRunById(id: string): void {
    const row = this.tbody()?.nativeElement.querySelector<HTMLElement>(`[data-run-id="${id}"]`);
    row?.focus();
  }

  protected onTbodyKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const tbody = event.currentTarget as HTMLElement;
    const rows = Array.from(tbody.querySelectorAll<HTMLElement>('[app-run-row]'));
    const idx = rows.indexOf(document.activeElement as HTMLElement);
    if (idx === -1) return;
    const next = event.key === 'ArrowDown' ? rows[idx + 1] : rows[idx - 1];
    next?.focus();
  }
}
