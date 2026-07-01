import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { RunStatus } from '../../../core/models';
import { KpiCardComponent, type KpiTone } from '../../../shared/kpi-card/kpi-card.component';
import type { KpiSummary } from './health-bar.models';

interface HealthCard {
  label: string;
  value: string;
  sub: string;
  tone: KpiTone;
  status: RunStatus | null;
  badge?: boolean;
}

@Component({
  selector: 'app-health-bar',
  standalone: true,
  imports: [KpiCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="health-bar" aria-label="Run health overview">
      @if (attentionCount() > 0) {
        <p class="health-bar__headline" role="status" aria-live="polite">
          <span class="material-icons" aria-hidden="true">warning_amber</span>
          {{ attentionCount() }}
          {{ attentionCount() === 1 ? 'run needs' : 'runs need' }} your attention
        </p>
      }

      <div class="health-bar__cards" role="list">
        @for (card of cards(); track card.label) {
          <div role="listitem">
            <app-kpi-card
              [label]="card.label"
              [value]="card.value"
              [sub]="card.sub"
              [tone]="card.tone"
              [interactive]="card.status !== null"
              [pressed]="card.status !== null && activeStatus() === card.status"
              [badge]="card.badge ?? false"
              (activate)="activate(card.status)"
            />
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './health-bar.component.scss',
})
export class HealthBarComponent {
  readonly kpis = input.required<KpiSummary>();
  readonly activeStatus = input<RunStatus | null>(null);
  readonly filter = output<RunStatus | null>();

  protected readonly attentionCount = computed(
    () => this.kpis().failed + this.kpis().needsAttention,
  );

  protected readonly cards = computed<HealthCard[]>(() => {
    const kpis = this.kpis();
    const percentage = (value: number): string =>
      kpis.total > 0 ? `${Math.round((value / kpis.total) * 100)}% of runs` : 'No runs';

    return [
      {
        label: 'Total runs',
        value: String(kpis.total),
        sub: 'All workflow runs',
        tone: 'neutral',
        status: null,
      },
      {
        label: 'Succeeded',
        value: String(kpis.succeeded),
        sub: percentage(kpis.succeeded),
        tone: 'ok',
        status: 'SUCCEEDED',
      },
      {
        label: 'Failed',
        value: String(kpis.failed),
        sub: percentage(kpis.failed),
        tone: 'fail',
        status: 'FAILED',
      },
      {
        label: 'Running',
        value: String(kpis.running),
        sub: kpis.running > 0 ? 'Live now' : 'None active',
        tone: 'run',
        status: 'RUNNING',
      },
      {
        label: 'Needs attention',
        value: String(kpis.needsAttention),
        sub: 'Retries · failed tasks',
        tone: 'attention',
        status: null,
        badge: kpis.needsAttention > 0,
      },
      {
        label: 'Total cost',
        value: kpis.totalCostLabel,
        sub: 'Across all runs',
        tone: 'cost',
        status: null,
      },
    ];
  });

  protected activate(status: RunStatus | null): void {
    if (status === null) return;
    this.filter.emit(this.activeStatus() === status ? null : status);
  }
}
