import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { RunStatus } from '../../../core/models';
import { STATUS_LABELS, STATUS_OPTIONS } from './filter-bar.models';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="filter-bar" aria-label="Filter runs">
      <div class="filter-bar__controls">
        <div class="search-field">
          <label class="field-label" for="run-filter-search">Search</label>
          <span class="search-field__control">
            <span class="material-icons search-field__icon" aria-hidden="true">search</span>
            <input
              id="run-filter-search"
              type="search"
              placeholder="Search runs, pipelines, users…"
              [value]="search()"
              (input)="onSearchInput($event)"
            />
            @if (search()) {
              <button
                class="clear-input"
                type="button"
                aria-label="Clear search"
                (click)="searchChange.emit('')"
              >
                <span class="material-icons" aria-hidden="true">close</span>
              </button>
            }
          </span>
        </div>

        <div class="select-field">
          <label class="field-label" for="run-filter-status">Status</label>
          <span class="select-field__control">
            <select
              id="run-filter-status"
              [value]="status() ?? ''"
              (change)="onStatusSelect($event)"
            >
              @for (option of statusOptions; track option.label) {
                <option [value]="option.value ?? ''">{{ option.label }}</option>
              }
            </select>
            <span class="material-icons" aria-hidden="true">expand_more</span>
          </span>
        </div>

        <div class="select-field">
          <label class="field-label" for="run-filter-executor">Executor</label>
          <span class="select-field__control">
            <select
              id="run-filter-executor"
              [value]="executor() ?? ''"
              (change)="onExecutorSelect($event)"
            >
              <option value="">All executors</option>
              @for (option of executors(); track option) {
                <option [value]="option">{{ option }}</option>
              }
            </select>
            <span class="material-icons" aria-hidden="true">expand_more</span>
          </span>
        </div>
      </div>

      @if (hasActiveFilters()) {
        <div class="active-filters">
          <span class="active-filters__label">Active filters</span>
          <div class="chip-set" role="list" aria-label="Active filters">
            @if (search()) {
              <span class="chip" role="listitem">
                <span>Search: “{{ search() }}”</span>
                <button
                  type="button"
                  aria-label="Remove search filter"
                  (click)="searchChange.emit('')"
                >
                  <span class="material-icons" aria-hidden="true">close</span>
                </button>
              </span>
            }
            @if (status(); as activeStatus) {
              <span class="chip" role="listitem">
                <span>Status: {{ statusLabels[activeStatus] }}</span>
                <button
                  type="button"
                  aria-label="Remove status filter"
                  (click)="statusChange.emit(null)"
                >
                  <span class="material-icons" aria-hidden="true">close</span>
                </button>
              </span>
            }
            @if (executor(); as activeExecutor) {
              <span class="chip" role="listitem">
                <span>Executor: {{ activeExecutor }}</span>
                <button
                  type="button"
                  aria-label="Remove executor filter"
                  (click)="executorChange.emit(null)"
                >
                  <span class="material-icons" aria-hidden="true">close</span>
                </button>
              </span>
            }
          </div>
          <button class="clear-all" type="button" (click)="clearAll.emit()">Clear all</button>
        </div>
      }
    </section>
  `,
  styleUrl: './filter-bar.component.scss',
})
export class FilterBarComponent {
  readonly search = input<string>('');
  readonly status = input<RunStatus | null>(null);
  readonly executor = input<string | null>(null);
  readonly executors = input<string[]>([]);

  readonly searchChange = output<string>();
  readonly statusChange = output<RunStatus | null>();
  readonly executorChange = output<string | null>();
  readonly clearAll = output<void>();

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly hasActiveFilters = computed(
    () => this.search().length > 0 || this.status() !== null || this.executor() !== null,
  );

  protected onSearchInput(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }

  protected onStatusSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusChange.emit(value ? (value as RunStatus) : null);
  }

  protected onExecutorSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.executorChange.emit(value || null);
  }
}
