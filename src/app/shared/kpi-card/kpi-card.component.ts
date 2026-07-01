import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { RunStatus } from '../../core/models';

export type KpiTone = 'neutral' | 'ok' | 'fail' | 'run' | 'attention' | 'cost';

/**
 * Temporary compatibility contract for the existing shared health bar.
 * New consumers should use the individual presentational inputs.
 */
export interface KpiCardConfig {
  label: string;
  value: string | number;
  icon: string;
  cssClass: string;
  filterStatus: RunStatus | null;
}

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (resolvedInteractive()) {
      <button
        type="button"
        [class]="'kpi-card kpi-card--' + resolvedTone()"
        [class.kpi-card--pressed]="resolvedPressed()"
        [attr.aria-pressed]="resolvedPressed()"
        (click)="onActivate()"
      >
        <span class="kpi-card__topline">
          <span class="kpi-card__tone" aria-hidden="true"></span>
          <span class="kpi-card__label">{{ resolvedLabel() }}</span>
          @if (badge()) {
            <span class="kpi-card__badge" aria-hidden="true">!</span>
          }
        </span>
        <span class="kpi-card__value">{{ resolvedValue() }}</span>
        @if (resolvedSub()) {
          <span class="kpi-card__sub">{{ resolvedSub() }}</span>
        }
      </button>
    } @else {
      <div [class]="'kpi-card kpi-card--display kpi-card--' + resolvedTone()">
        <span class="kpi-card__topline">
          <span class="kpi-card__tone" aria-hidden="true"></span>
          <span class="kpi-card__label">{{ resolvedLabel() }}</span>
          @if (badge()) {
            <span class="kpi-card__badge" aria-hidden="true">!</span>
          }
        </span>
        <span class="kpi-card__value">{{ resolvedValue() }}</span>
        @if (resolvedSub()) {
          <span class="kpi-card__sub">{{ resolvedSub() }}</span>
        }
      </div>
    }
  `,
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  readonly label = input<string>('');
  readonly value = input<string>('');
  readonly sub = input<string>('');
  readonly tone = input<KpiTone>('neutral');
  readonly interactive = input<boolean>(false);
  readonly pressed = input<boolean>(false);
  readonly badge = input<boolean>(false);
  readonly activate = output<void>();

  // Compatibility inputs/outputs for the pre-existing shared health bar.
  readonly config = input<KpiCardConfig | null>(null);
  readonly active = input<boolean>(false);
  readonly filter = output<RunStatus | null>();

  protected readonly resolvedLabel = computed(() => this.config()?.label ?? this.label());
  protected readonly resolvedValue = computed(() => String(this.config()?.value ?? this.value()));
  protected readonly resolvedSub = computed(() => this.sub());
  protected readonly resolvedInteractive = computed(() => {
    const legacyConfig = this.config();
    return legacyConfig ? legacyConfig.filterStatus !== null : this.interactive();
  });
  protected readonly resolvedPressed = computed(() => this.active() || this.pressed());
  protected readonly resolvedTone = computed<KpiTone>(() => {
    const legacyTone = this.config()?.cssClass;
    if (!legacyTone) return this.tone();
    const tones: Record<string, KpiTone> = {
      success: 'ok',
      failed: 'fail',
      running: 'run',
      warning: 'attention',
      cost: 'cost',
      cancel: 'neutral',
      neutral: 'neutral',
    };
    return tones[legacyTone] ?? 'neutral';
  });

  protected onActivate(): void {
    this.activate.emit();

    const status = this.config()?.filterStatus;
    if (status) this.filter.emit(this.resolvedPressed() ? null : status);
  }
}
