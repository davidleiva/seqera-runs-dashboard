import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-user-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (user()) {
      <span class="user-cell">
        <span class="user-cell__avatar" aria-hidden="true">{{ initial() }}</span>
        <span class="user-cell__name">{{ user() }}</span>
      </span>
    } @else {
      <span class="user-cell__empty" aria-label="No user">—</span>
    }
  `,
  styleUrl: './user-cell.component.scss',
  host: { class: 'user-cell-host' },
})
export class UserCellComponent {
  readonly user = input<string | null>(null);

  protected readonly initial = computed(() => (this.user() ?? '?')[0].toUpperCase());
}
