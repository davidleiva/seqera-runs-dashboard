import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-cost-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="cost-label" [class.cost-label--empty]="cost() === null">{{ label() }}</span>`,
  styles: [`
    :host { display: inline; }
    .cost-label {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      &--empty { color: var(--c-text-muted); }
    }
  `],
})
export class CostLabelComponent {
  readonly cost = input<number | null>(null);
  readonly label = input.required<string>();
}
