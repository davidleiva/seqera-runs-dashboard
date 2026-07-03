import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import autoAnimate from '@formkit/auto-animate';
import { MatPaginator, type PageEvent } from '@angular/material/paginator';
import type { RunVM, SortKey, SortState } from '../../../core/models';
import { RunRowComponent } from '../run-row/run-row.component';
import { SkeletonRowComponent } from '../../../shared/skeleton-row/skeleton-row.component';

interface ColumnMeta {
  key: SortKey | null;
  label: string;
  cellClass: string;
}

const COLUMNS: readonly ColumnMeta[] = [
  { key: 'risk', label: 'Status', cellClass: 'col-status' },
  { key: 'name', label: 'Run', cellClass: 'col-identity' },
  { key: 'user', label: 'User', cellClass: 'col-user' },
  { key: 'submitted', label: 'Submitted', cellClass: 'col-time' },
  { key: 'duration', label: 'Duration', cellClass: 'col-duration' },
  { key: null, label: 'Tasks', cellClass: 'col-tasks' },
  { key: 'cost', label: 'Cost', cellClass: 'col-cost' },
  { key: 'retries', label: 'Retries', cellClass: 'col-retries' },
  { key: null, label: 'Executor', cellClass: 'col-executor' },
  { key: null, label: '', cellClass: 'col-action' },
];

/**
 * Dense, risk-sorted runs table. Renders the already-filtered/sorted/paged
 * slice handed to it by `runs-page` — this component never filters, sorts or
 * slices on its own. Notable implementation details:
 *
 * - `.table-horizontal-scroll-container` owns its *own* `overflow-x: auto`
 *   (a real native scrollbar, own touch/wheel physics) instead of leaving
 *   the table to overflow up into `.main-content`. The trade-off: per the CSS
 *   overflow spec, declaring `overflow-x` on a box forces its `overflow-y` to
 *   also compute as non-`visible`, which would hijack `position: sticky`'s
 *   reference frame for anything inside it away from `.main-content` — so
 *   the real `<thead>` here is deliberately *not* `position: sticky` (it
 *   just scrolls away with the rest of the table).
 * - `.sticky-header-clone` fakes the same visual result: plain flex `div`s
 *   (not real table markup, so no table-cell-sticky quirks), `position:
 *   fixed`, toggled and positioned from TS once `.main-content`'s scroll
 *   would otherwise carry the real header above the stuck summary/filters
 *   bars (or above the topbar on mobile, where summary/filters aren't
 *   sticky at all). Column widths are measured from the real `<th>`
 *   elements (not guessed), and its horizontal position is synced to the
 *   real container's own `scrollLeft` via a CSS transform.
 * - The clone's columns are real, clickable sort buttons (not just static
 *   labels) so sorting still works while the header is "stuck" — a mouse
 *   click on the clone calls the exact same `onSort()` as the real header.
 *   It stays `aria-hidden` throughout, though: the real (still-present,
 *   just visually covered) header is what screen readers and keyboard
 *   navigation interact with. A keyboard user tabbing to a real sort button
 *   while the clone is showing may cause the browser to scroll it into
 *   view — an accepted trade-off of faking sticky via a clone instead of
 *   real `position: sticky`.
 */
@Component({
  selector: 'app-runs-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RunRowComponent, SkeletonRowComponent, MatPaginator],
  template: `
    @if (stuck()) {
      <div
        class="sticky-header-clone"
        [style.top.px]="cloneTop()"
        [style.left.px]="cloneLeft()"
        [style.width.px]="cloneWidth()"
        [style.height.px]="cloneHeight()"
        aria-hidden="true"
      >
        <div class="sticky-header-clone__inner" [style.transform]="cloneTransform()">
          @for (col of columns; track $index; let i = $index) {
            <div
              class="sticky-header-clone__cell"
              [class.sticky-header-clone__cell--right]="col.cellClass === 'col-cost' || col.cellClass === 'col-retries'"
              [style.width.px]="colWidths()[i]"
            >
              @if (col.key; as key) {
                <button
                  type="button"
                  class="sort-btn"
                  tabindex="-1"
                  [class.sort-btn--active]="sort().key === key"
                  (click)="onSort(key)"
                >
                  {{ col.label }}
                  <span class="material-icons sort-icon" aria-hidden="true">{{ sortMeta()[key].icon }}</span>
                </button>
              } @else {
                <span>{{ col.label }}</span>
              }
            </div>
          }
        </div>
      </div>
    }

    @if (!loading() && runs().length === 0) {
      <div class="empty-state" role="status">
        <span class="material-icons empty-state__icon" aria-hidden="true">inbox</span>
        <p class="empty-state__message">No runs match the current filters.</p>
        <button class="empty-state__clear" (click)="clearFilters.emit()">
          Clear filters
        </button>
      </div>
    } @else {
      <div class="table-horizontal-scroll-container" #scrollContainer>
        <table class="runs-table" role="grid" aria-label="Pipeline runs" aria-rowcount="-1">
          <thead>
            <tr role="row" #headerRow>
              <th scope="col" role="columnheader" class="col-status"
                  [attr.aria-sort]="sortMeta().risk.attr">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'risk'"
                        (click)="onSort('risk')">
                  Status
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortMeta().risk.icon }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-identity"
                  [attr.aria-sort]="sortMeta().name.attr">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'name'"
                        (click)="onSort('name')">
                  Run
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortMeta().name.icon }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-user"
                  [attr.aria-sort]="sortMeta().user.attr">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'user'"
                        (click)="onSort('user')">
                  User
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortMeta().user.icon }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-time"
                  [attr.aria-sort]="sortMeta().submitted.attr">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'submitted'"
                        (click)="onSort('submitted')">
                  Submitted
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortMeta().submitted.icon }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-duration"
                  [attr.aria-sort]="sortMeta().duration.attr">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'duration'"
                        (click)="onSort('duration')">
                  Duration
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortMeta().duration.icon }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-tasks">Tasks</th>
              <th scope="col" role="columnheader" class="col-cost"
                  [attr.aria-sort]="sortMeta().cost.attr">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'cost'"
                        (click)="onSort('cost')">
                  Cost
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortMeta().cost.icon }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-retries"
                  [attr.aria-sort]="sortMeta().retries.attr">
                <button class="sort-btn" [class.sort-btn--active]="sort().key === 'retries'"
                        (click)="onSort('retries')">
                  Retries
                  <span class="material-icons sort-icon" aria-hidden="true">
                    {{ sortMeta().retries.icon }}
                  </span>
                </button>
              </th>
              <th scope="col" role="columnheader" class="col-executor">Executor</th>
              <th scope="col" role="columnheader" class="col-action" aria-label="Details"><span class="visually-hidden">Details</span></th>
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
                    [active]="run.id === activeRowId()"
                    (select)="onRowSelect(run)"
                    (focused)="onRowFocused($event)">
                </tr>
              }
            </tbody>
          }
        </table>
      </div>

      <div class="table-pagination-container">
        @if (showPager()) {
          <mat-paginator
            aria-label="Runs pagination"
            [length]="effectiveTotal()"
            [pageIndex]="pageIndex()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="pageSizeOptions()"
            [disabled]="loading()"
            (page)="onPageEvent($event)"
          />
        } @else {
          <!-- A single page of results is dead chrome — page nav with nowhere
               to go. The total stays visible either way, just as plain text. -->
          <div class="table-row-count" role="status">
            {{ effectiveTotal() }} {{ effectiveTotal() === 1 ? 'run' : 'runs' }}
          </div>
        }
      </div>
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

  protected readonly columns = COLUMNS;

  /**
   * Falls back to `runs().length` when a caller doesn't pass `total` — so
   * the pager reads "1–N of N" instead of a broken "0 of 0".
   */
  protected readonly effectiveTotal = computed(() => this.total() || this.runs().length);

  /** Pager is dead chrome with nowhere to go once everything fits on one page. */
  protected readonly showPager = computed(() => this.effectiveTotal() > this.pageSize());

  protected readonly skeletonRows = Array(6).fill(null);

  private readonly tbody = viewChild<ElementRef<HTMLElement>>('tbody');

  /** Roving tabindex position — only this row is a Tab stop; arrow keys move it. */
  private readonly focusedRowId = signal<string | null>(null);
  protected readonly activeRowId = computed<string | null>(() => {
    const runs = this.runs();
    if (runs.length === 0) return null;
    const focused = this.focusedRowId();
    if (focused && runs.some(r => r.id === focused)) return focused;
    const selected = this.selectedId();
    if (selected && runs.some(r => r.id === selected)) return selected;
    return runs[0].id;
  });

  private static readonly SORT_KEYS: readonly SortKey[] = [
    'risk', 'name', 'user', 'submitted', 'duration', 'cost', 'retries',
  ];

  /** One computed instead of a method call per header cell per change-detection pass. */
  protected readonly sortMeta = computed(() => {
    const { key, dir } = this.sort();
    const entries = RunsTableComponent.SORT_KEYS.map(k => {
      const isActive = key === k;
      return [
        k,
        {
          attr: (!isActive ? 'none' : dir === 'asc' ? 'ascending' : 'descending') as
            | 'ascending'
            | 'descending'
            | 'none',
          icon: !isActive ? 'unfold_more' : dir === 'asc' ? 'arrow_upward' : 'arrow_downward',
        },
      ] as const;
    });
    return Object.fromEntries(entries) as Record<SortKey, { attr: 'ascending' | 'descending' | 'none'; icon: string }>;
  });

  // ─── Fake sticky header ─────────────────────────────────────────────────────

  private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  private readonly headerRow = viewChild<ElementRef<HTMLElement>>('headerRow');

  protected readonly stuck = signal(false);
  protected readonly colWidths = signal<number[]>([]);
  protected readonly cloneLeft = signal(0);
  protected readonly cloneWidth = signal(0);
  protected readonly cloneHeight = signal(0);
  /** Wherever the sticky boundary above the table currently is — see the effect below. */
  protected readonly cloneTop = signal(0);
  private readonly scrollLeftPx = signal(0);

  protected readonly cloneTransform = () => `translateX(${-this.scrollLeftPx()}px)`;

  constructor() {
    effect(() => {
      const el = this.tbody()?.nativeElement;
      if (el) autoAnimate(el);
    });

    // An `effect` (not a one-time `afterNextRender`), because `scrollContainer`/
    // `headerRow` can come and go at runtime — e.g. filtering down to zero
    // results swaps the whole table out for the empty state, then back again
    // once filters are cleared. Re-running on every change keeps the
    // listeners attached to the *current* real elements instead of stale
    // ones from before an empty-state round-trip.
    effect(onCleanup => {
      const container = this.scrollContainer()?.nativeElement;
      const row = this.headerRow()?.nativeElement;
      const mainContent = document.querySelector<HTMLElement>('.main-content');
      const filters = document.querySelector<HTMLElement>('.filters-container');
      if (!container || !row || !mainContent || !filters) {
        this.stuck.set(false);
        return;
      }

      // `.filters-container` is real `position: sticky` on desktop (see
      // runs-page.component.scss) — its own bounding rect is then always
      // correct, so reading it live is a more robust reference for where
      // the clone belongs than precomputing a static threshold. But on
      // mobile filters isn't sticky at all (only this table's header stays
      // pinned there) — its bounding rect just scrolls away like normal
      // content, maintaining a constant offset from the header forever, so
      // using it alone would mean `stuck` could never become true on
      // mobile. `.main-content`'s own top (the topbar's bottom edge) is the
      // floor for the header's clamp point in that case — `Math.max` picks
      // whichever of the two is actually further down the page, which
      // naturally resolves to filters' stuck position on desktop and to
      // `.main-content`'s top on mobile, without asking which breakpoint is
      // active.
      const stickyBoundary = () =>
        Math.max(mainContent.getBoundingClientRect().top, filters.getBoundingClientRect().bottom);

      const measure = () => {
        const rect = container.getBoundingClientRect();
        this.cloneLeft.set(rect.left);
        this.cloneWidth.set(rect.width);
        this.cloneHeight.set(row.getBoundingClientRect().height);
        this.colWidths.set(Array.from(row.children).map(cell => cell.getBoundingClientRect().width));
        this.cloneTop.set(stickyBoundary());
      };

      const updateStuck = () => {
        this.stuck.set(row.getBoundingClientRect().top <= stickyBoundary());
      };

      const onMainContentScroll = () => {
        updateStuck();
        measure(); // horizontal scroll of the page also moves the container
      };
      const onContainerScroll = () => {
        this.scrollLeftPx.set(container.scrollLeft);
      };

      measure();
      updateStuck();

      mainContent.addEventListener('scroll', onMainContentScroll, { passive: true });
      container.addEventListener('scroll', onContainerScroll, { passive: true });

      const resizeObserver = new ResizeObserver(() => measure());
      resizeObserver.observe(container);

      onCleanup(() => {
        mainContent.removeEventListener('scroll', onMainContentScroll);
        container.removeEventListener('scroll', onContainerScroll);
        resizeObserver.disconnect();
      });
    });
  }

  protected onSort(key: SortKey): void {
    const current = this.sort();
    const dir = current.key === key && current.dir === 'desc' ? 'asc' : 'desc';
    this.sortChange.emit({ key, dir });
  }

  protected onRowSelect(run: RunVM): void {
    this.select.emit(run);
  }

  /** Tab traversal (not just arrow keys) also updates the roving tabindex position. */
  protected onRowFocused(id: string): void {
    this.focusedRowId.set(id);
  }

  protected onPageEvent(event: PageEvent): void {
    this.pageChange.emit({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }

  /**
   * Called by the page container to restore keyboard focus once the drawer
   * closes. Tries the row that was open first (the common case, including
   * after a re-sort — rows are tracked by id so the same DOM node is reused);
   * falls back to the first visible row so focus never silently drops to
   * `<body>` if that row was filtered away while the drawer was open.
   */
  focusRowOrFallback(id: string | null): void {
    const tbodyEl = this.tbody()?.nativeElement;
    if (!tbodyEl) return;
    const row = id ? tbodyEl.querySelector<HTMLElement>(`[data-run-id="${id}"]`) : null;
    (row ?? tbodyEl.querySelector<HTMLElement>('[app-run-row]'))?.focus();
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
