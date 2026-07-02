import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { RunStatus } from '../../../core/models';
import type { RunsSummaryVM, SummaryInsight } from './runs-summary.models';

interface StatusSegment {
  status: RunStatus;
  label: string;
  count: number;
  fill: string;
}

const STATUS_ORDER: readonly RunStatus[] = ['FAILED', 'RUNNING', 'SUBMITTED', 'SUCCEEDED', 'CANCELLED'];

const STATUS_LABEL: Record<RunStatus, string> = {
  FAILED: 'Failed',
  RUNNING: 'Running',
  SUBMITTED: 'Submitted',
  SUCCEEDED: 'Succeeded',
  CANCELLED: 'Cancelled',
};

const STATUS_FILL: Record<RunStatus, string> = {
  FAILED: 'var(--c-fail)',
  RUNNING: 'var(--c-run)',
  SUBMITTED: 'var(--c-cancel)',
  SUCCEEDED: 'var(--c-ok)',
  CANCELLED: 'var(--c-cancel)',
};

@Component({
  selector: 'app-runs-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="runs-summary" aria-label="Run health summary">
      <div class="runs-summary__verdict">
        @if (hasAttention()) {
          <button
            type="button"
            class="runs-summary__headline runs-summary__headline--attention"
            (click)="onHeadlineClick()"
          >
            <span class="material-icons" aria-hidden="true">warning_amber</span>
            <span>{{ headlineText() }}</span>
          </button>
        } @else {
          <p class="runs-summary__headline runs-summary__headline--calm">
            <span class="material-icons" aria-hidden="true">check_circle</span>
            <span>{{ headlineText() }}</span>
          </p>
        }
        <p class="runs-summary__meta">Total {{ summary().total }} · {{ summary().totalCostLabel }}</p>
      </div>

      <div class="runs-summary__bar-row">
        <div class="runs-summary__bar" role="group" [attr.aria-label]="barAriaLabel()">
          @if (segments().length === 0) {
            <span class="runs-summary__bar-empty" aria-hidden="true"></span>
          }
          @for (seg of segments(); track seg.status) {
            <button
              type="button"
              class="runs-summary__seg"
              [class.runs-summary__seg--active]="activeStatus() === seg.status"
              [style.flex]="seg.count"
              [style.background]="seg.fill"
              [attr.aria-pressed]="activeStatus() === seg.status"
              [attr.aria-label]="seg.label + ': ' + seg.count + ' of ' + summary().total"
              (click)="toggle(seg.status)"
            ></button>
          }
        </div>

        <ul class="runs-summary__legend">
          @for (seg of segments(); track seg.status) {
            <li>
              <button
                type="button"
                class="runs-summary__legend-item"
                [class.runs-summary__legend-item--active]="activeStatus() === seg.status"
                [attr.aria-pressed]="activeStatus() === seg.status"
                (click)="toggle(seg.status)"
              >
                <span class="runs-summary__dot" [style.background]="seg.fill" aria-hidden="true"></span>
                {{ seg.label }} {{ seg.count }}
              </button>
            </li>
          }
        </ul>
      </div>

      @if (summary().insight) {
        <button type="button" class="runs-summary__insight" (click)="onInsightClick()">
          <span class="material-icons" aria-hidden="true">insights</span>
          <span>{{ summary().insight!.label }}</span>
        </button>
      }
    </section>
  `,
  styleUrl: './runs-summary.component.scss',
})
export class RunsSummaryComponent {
  readonly summary = input.required<RunsSummaryVM>();
  readonly activeStatus = input<RunStatus | null>(null);
  readonly filter = output<RunStatus | null>();
  readonly selectInsight = output<SummaryInsight>();

  protected readonly attentionCount = computed(
    () => this.summary().counts.FAILED + this.summary().needsAttention,
  );

  protected readonly hasAttention = computed(() => this.attentionCount() > 0);

  protected readonly headlineText = computed(() => {
    const summary = this.summary();
    if (summary.total === 0) return 'No runs yet';
    if (this.hasAttention()) {
      const count = this.attentionCount();
      return `${count} ${count === 1 ? 'run needs' : 'runs need'} your attention`;
    }
    return `All runs healthy · ${summary.successRatePct}% succeeded`;
  });

  protected readonly segments = computed<StatusSegment[]>(() => {
    const counts = this.summary().counts;
    return STATUS_ORDER.map((status) => ({
      status,
      label: STATUS_LABEL[status],
      count: counts[status] ?? 0,
      fill: STATUS_FILL[status],
    })).filter((segment) => segment.count > 0);
  });

  protected readonly barAriaLabel = computed(() => {
    const summary = this.summary();
    if (summary.total === 0) return 'No runs yet';
    const parts = this.segments().map((seg) => `${seg.count} ${seg.label.toLowerCase()}`);
    return `${parts.join(', ')} of ${summary.total}`;
  });

  protected toggle(status: RunStatus): void {
    this.filter.emit(this.activeStatus() === status ? null : status);
  }

  protected onHeadlineClick(): void {
    // The `filter` output is RunStatus-only; Failed is the closest filterable
    // subset it can express for the combined failed+needs-attention headline.
    this.toggle('FAILED');
  }

  protected onInsightClick(): void {
    const insight = this.summary().insight;
    if (insight) this.selectInsight.emit(insight);
  }
}
