import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Same user → same colour always, so runs group visually by owner in the table.
const AVATAR_PALETTE: readonly string[] = [
  'var(--c-avatar-1)',
  'var(--c-avatar-2)',
  'var(--c-avatar-3)',
  'var(--c-avatar-4)',
  'var(--c-avatar-5)',
];

function avatarColor(user: string): string {
  let hash = 0;
  for (let i = 0; i < user.length; i++) {
    hash = (hash * 31 + user.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

@Component({
  selector: 'app-user-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (user()) {
      <span class="user-cell">
        <span class="user-cell__avatar" [style.background]="avatarColor()" aria-hidden="true">{{ initial() }}</span>
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
  protected readonly avatarColor = computed(() => {
    const user = this.user();
    return user ? avatarColor(user) : 'var(--c-cancel)';
  });
}
