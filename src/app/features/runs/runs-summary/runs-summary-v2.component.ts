import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { RunStatus } from '../../../core/models';
import type { RunsSummaryVM, SummaryLens } from './runs-summary-v2.models';

interface StatusSegment {
  status: RunStatus;
  label: string;
  count: number;
  fill: string;
  /** % of this segment's width covered by the succeeded-with-issues hatch (SUCCEEDED only). */
  hatchPct: number;
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
  CANCELLED: 'var(--c-cancel-2)',
};

@Component({
  selector: 'app-runs-summary-v2',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="runs-summary" aria-label="Run health summary">
      <div class="runs-summary__verdict">
        @if (hasAttention()) {
          <span class="runs-summary__headline-wrap">
            <button
              type="button"
              class="runs-summary__headline runs-summary__headline--attention"
              [class.runs-summary__headline--active]="isAttentionActive()"
              [attr.aria-pressed]="isAttentionActive()"
              aria-describedby="runs-summary-v2-tooltip"
              (click)="emitLens({ kind: 'attention' })"
            >
              <span class="material-icons" aria-hidden="true">warning_amber</span>
              <span>{{ headlineText() }}</span>
            </button>
            <span id="runs-summary-v2-tooltip" role="tooltip" class="runs-summary__tooltip">
              {{ tooltipText() }}
            </span>
          </span>
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
              [attr.aria-label]="segmentAriaLabel(seg)"
              (click)="emitLens({ kind: 'status', status: seg.status })"
            >
              @if (seg.hatchPct > 0) {
                <span class="runs-summary__hatch" aria-hidden="true" [style.width.%]="seg.hatchPct"></span>
              }
            </button>
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
                (click)="emitLens({ kind: 'status', status: seg.status })"
              >
                <span class="runs-summary__dot" [style.background]="seg.fill" aria-hidden="true"></span>
                {{ seg.label }} {{ seg.count }}
              </button>
            </li>
          }
          @if (hasAttention()) {
            <li class="runs-summary__legend-note">
              <span aria-hidden="true">▨</span>
              {{ needsAttention() }} need attention
            </li>
          }
        </ul>
      </div>

      @if (summary().insight) {
        <button
          type="button"
          class="runs-summary__insight"
          [class.runs-summary__insight--active]="isInsightActive()"
          [attr.aria-pressed]="isInsightActive()"
          (click)="emitLens({ kind: 'insight', insight: summary().insight! })"
        >
          <span class="material-icons" aria-hidden="true">insights</span>
          <span>{{ summary().insight!.label }}</span>
        </button>
      }
    </section>
  `,
  styleUrl: './runs-summary-v2.component.scss',
})
export class RunsSummaryV2Component {
  readonly summary = input.required<RunsSummaryVM>();
  readonly activeLens = input<SummaryLens | null>(null);
  readonly lens = output<SummaryLens | null>();

  protected readonly needsAttention = computed(
    () => this.summary().counts.FAILED + this.summary().succeededWithIssues,
  );

  protected readonly hasAttention = computed(() => this.needsAttention() > 0);

  protected readonly activeStatus = computed<RunStatus | null>(() => {
    const active = this.activeLens();
    return active?.kind === 'status' ? active.status : null;
  });

  protected readonly isAttentionActive = computed(() => this.activeLens()?.kind === 'attention');
  protected readonly isInsightActive = computed(() => this.activeLens()?.kind === 'insight');

  protected readonly headlineText = computed(() => {
    const summary = this.summary();
    if (summary.total === 0) return 'No runs yet';
    if (this.hasAttention()) {
      const count = this.needsAttention();
      return `${count} ${count === 1 ? 'run needs' : 'runs need'} your attention`;
    }
    return `All runs healthy · ${summary.successRatePct}% succeeded`;
  });

  protected readonly tooltipText = computed(() => {
    const summary = this.summary();
    return `${summary.counts.FAILED} failed + ${summary.succeededWithIssues} succeeded with issues`;
  });

  protected readonly segments = computed<StatusSegment[]>(() => {
    const { counts, succeededWithIssues } = this.summary();
    return STATUS_ORDER.map((status) => {
      const count = counts[status] ?? 0;
      return {
        status,
        label: STATUS_LABEL[status],
        count,
        fill: STATUS_FILL[status],
        hatchPct: status === 'SUCCEEDED' && count > 0 ? (succeededWithIssues / count) * 100 : 0,
      };
    }).filter((segment) => segment.count > 0);
  });

  protected readonly barAriaLabel = computed(() => {
    const summary = this.summary();
    if (summary.total === 0) return 'No runs yet';
    const parts = this.segments().map((seg) => {
      if (seg.status === 'SUCCEEDED' && summary.succeededWithIssues > 0) {
        return `${seg.count} succeeded (${summary.succeededWithIssues} need attention)`;
      }
      return `${seg.count} ${seg.label.toLowerCase()}`;
    });
    return `${summary.total} runs: ${parts.join(', ')}`;
  });

  protected segmentAriaLabel(seg: StatusSegment): string {
    const summary = this.summary();
    if (seg.status === 'SUCCEEDED' && summary.succeededWithIssues > 0) {
      return `${seg.label}: ${seg.count} of ${summary.total} (${summary.succeededWithIssues} with issues)`;
    }
    return `${seg.label}: ${seg.count} of ${summary.total}`;
  }

  protected emitLens(next: SummaryLens): void {
    this.lens.emit(this.isSameLens(next) ? null : next);
  }

  private isSameLens(next: SummaryLens): boolean {
    const active = this.activeLens();
    if (!active || active.kind !== next.kind) return false;
    if (active.kind === 'status' && next.kind === 'status') return active.status === next.status;
    if (active.kind === 'insight' && next.kind === 'insight') return active.insight === next.insight;
    return active.kind === 'attention';
  }
}
