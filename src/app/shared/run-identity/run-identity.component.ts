import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-run-identity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="identity">
      <div class="identity__name-row">
        <span class="identity__name" [title]="name()">{{ name() }}</span>
        @if (needsAttention()) {
          <span class="identity__tag" aria-label="Needs attention">
            <span class="material-icons identity__tag-icon" aria-hidden="true">warning</span>
            Needs attention
          </span>
        }
      </div>
      <span class="identity__pipeline">{{ pipeline() }}</span>
    </div>
  `,
  styleUrl: './run-identity.component.scss',
  host: { class: 'run-identity-host' },
})
export class RunIdentityComponent {
  readonly name = input.required<string>();
  readonly pipeline = input.required<string>();
  readonly needsAttention = input<boolean>(false);
}
