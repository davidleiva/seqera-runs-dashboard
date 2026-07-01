import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { RunStatus } from '../../core/models';

interface PillConfig {
  icon: string;
  label: string;
  cssClass: string;
}

const STATUS_CONFIG: Record<RunStatus, PillConfig> = {
  SUCCEEDED: { icon: 'check_circle', label: 'Succeeded', cssClass: 'pill--succeeded' },
  FAILED:    { icon: 'cancel',       label: 'Failed',    cssClass: 'pill--failed' },
  RUNNING:   { icon: 'sync',         label: 'Running',   cssClass: 'pill--running' },
  SUBMITTED: { icon: 'schedule',     label: 'Submitted', cssClass: 'pill--submitted' },
  CANCELLED: { icon: 'block',        label: 'Cancelled', cssClass: 'pill--cancelled' },
};

@Component({
  selector: 'app-status-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="pill" [class]="config().cssClass">
      <span class="material-icons pill__icon" aria-hidden="true">{{ config().icon }}</span>
      <span class="pill__label">{{ config().label }}</span>
      @if (exitLabel()) {
        <span class="pill__exit">· exit&nbsp;{{ exitLabel() }}</span>
      }
    </span>
  `,
  styleUrl: './status-pill.component.scss',
  host: { class: 'status-pill-host' },
})
export class StatusPillComponent {
  readonly status = input.required<RunStatus>();
  readonly exitLabel = input<string | null>(null);

  protected readonly config = computed(() => STATUS_CONFIG[this.status()]);
}
