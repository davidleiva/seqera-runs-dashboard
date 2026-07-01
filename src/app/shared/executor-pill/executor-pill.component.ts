import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface ExecutorConfig {
  label: string;
  icon: string;
  cssClass: string;
}

const EXECUTOR_CONFIG: Record<string, ExecutorConfig> = {
  awsbatch: { label: 'AWS Batch', icon: 'cloud',    cssClass: 'executor--aws' },
  local:    { label: 'Local',     icon: 'computer', cssClass: 'executor--local' },
};

const FALLBACK: ExecutorConfig = { label: 'Unknown', icon: 'help_outline', cssClass: 'executor--unknown' };

@Component({
  selector: 'app-executor-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="executor" [class]="config().cssClass">
      <span class="material-icons executor__icon" aria-hidden="true">{{ config().icon }}</span>
      <span class="executor__label">{{ config().label }}</span>
    </span>
  `,
  styleUrl: './executor-pill.component.scss',
  host: { class: 'executor-pill-host' },
})
export class ExecutorPillComponent {
  readonly executor = input<string | null>(null);

  protected readonly config = computed(() => {
    const e = this.executor();
    return e ? (EXECUTOR_CONFIG[e.toLowerCase()] ?? FALLBACK) : FALLBACK;
  });
}
