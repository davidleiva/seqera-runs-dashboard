import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-duration-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="duration-label" [class.duration-label--empty]="!durationMs()">{{ label() }}</span>`,
  styles: [`
    :host { display: inline; }
    .duration-label {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      &--empty { color: var(--c-text-muted); }
    }
  `],
})
export class DurationLabelComponent {
  readonly durationMs = input<number | null>(null);
  readonly label = input.required<string>();
}
