import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { KpiCardComponent, type KpiCardConfig } from '../kpi-card/kpi-card.component';
import type { KpiStats, RunStatus } from '../../core/models';
import { costFmt } from '../../core/derive/format.utils';

@Component({
  selector: 'app-health-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KpiCardComponent],
  template: `
    <section class="health-bar" aria-label="Run health overview">

      @if (kpis().needsAttention > 0) {
        <div class="health-bar__headline health-bar__headline--warn" role="alert" aria-live="polite">
          <span class="material-icons" aria-hidden="true">warning</span>
          {{ kpis().needsAttention }} run{{ kpis().needsAttention > 1 ? 's' : '' }} need your attention
        </div>
      } @else if (kpis().total > 0) {
        <div class="health-bar__headline health-bar__headline--ok">
          <span class="material-icons" aria-hidden="true">check_circle</span>
          All runs healthy
        </div>
      }

      <div class="health-bar__cards" role="list">
        @for (card of cards(); track card.label) {
          <div role="listitem">
            <app-kpi-card
              [config]="card"
              [active]="activeFilter() === card.filterStatus"
              (filter)="filter.emit($event)" />
          </div>
        }
      </div>

      @if (activeFilter()) {
        <div class="health-bar__chip" role="status">
          <span class="material-icons chip__icon" aria-hidden="true">filter_list</span>
          <span>{{ activeLabel() }}</span>
          <button class="chip__clear" (click)="filter.emit(null)" aria-label="Clear filter">
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
        </div>
      }
    </section>
  `,
  styleUrl: './health-bar.component.scss',
})
export class HealthBarComponent {
  readonly kpis = input.required<KpiStats>();
  readonly activeFilter = input<RunStatus | null>(null);
  readonly filter = output<RunStatus | null>();

  protected readonly cards = computed<KpiCardConfig[]>(() => {
    const k = this.kpis();
    return [
      { label: 'Failed',      value: k.FAILED,      icon: 'cancel',        cssClass: 'failed',  filterStatus: 'FAILED' },
      { label: 'Attention',   value: k.needsAttention, icon: 'warning',    cssClass: 'warning', filterStatus: null },
      { label: 'Running',     value: k.RUNNING,     icon: 'sync',          cssClass: 'running', filterStatus: 'RUNNING' },
      { label: 'Submitted',   value: k.SUBMITTED,   icon: 'schedule',      cssClass: 'neutral', filterStatus: 'SUBMITTED' },
      { label: 'Succeeded',   value: k.SUCCEEDED,   icon: 'check_circle',  cssClass: 'success', filterStatus: 'SUCCEEDED' },
      { label: 'Cancelled',   value: k.CANCELLED,   icon: 'block',         cssClass: 'cancel',  filterStatus: 'CANCELLED' },
      { label: 'Total',       value: k.total,        icon: 'grid_view',    cssClass: 'neutral', filterStatus: null },
      { label: 'Total Cost',  value: costFmt(k.totalCost || null), icon: 'payments', cssClass: 'cost', filterStatus: null },
    ];
  });

  protected readonly activeLabel = computed(() => {
    const s = this.activeFilter();
    const map: Partial<Record<RunStatus, string>> = {
      FAILED: 'Failed', RUNNING: 'Running', SUBMITTED: 'Submitted',
      SUCCEEDED: 'Succeeded', CANCELLED: 'Cancelled',
    };
    return s ? map[s] : '';
  });
}
