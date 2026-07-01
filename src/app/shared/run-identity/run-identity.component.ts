import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-run-identity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="identity">
      <div class="identity__name-row">
        <span class="identity__name" [title]="name()">{{ name() }}</span>
        @if (attentionLabel()) {
          <span
            class="material-icons identity__marker"
            role="img"
            [attr.aria-label]="attentionLabel()"
            [title]="attentionLabel()"
          >warning</span>
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
  /** Reason for the marker, e.g. "Succeeded, but 1 task failed". Null/absent = no marker (incl. FAILED rows, where the red status already signals attention). */
  readonly attentionLabel = input<string | null>(null);
}
