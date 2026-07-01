import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { RunVM } from '../../../core/models';
import { StatusPillComponent } from '../../../shared/status-pill/status-pill.component';
import { TaskBarComponent } from '../../../shared/task-bar/task-bar.component';
import { ExecutorPillComponent } from '../../../shared/executor-pill/executor-pill.component';
import { RunIdentityComponent } from '../../../shared/run-identity/run-identity.component';
import { DurationLabelComponent } from '../../../shared/duration-label/duration-label.component';
import { CostLabelComponent } from '../../../shared/cost-label/cost-label.component';
import { UserCellComponent } from '../../../shared/user-cell/user-cell.component';

@Component({
  selector: '[app-run-row]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StatusPillComponent,
    TaskBarComponent,
    ExecutorPillComponent,
    RunIdentityComponent,
    DurationLabelComponent,
    CostLabelComponent,
    UserCellComponent,
  ],
  template: `
    <td class="run-row__cell run-row__cell--status">
      <app-status-pill
        [status]="run().status"
        [exitLabel]="exitLabel()" />
    </td>
    <td class="run-row__cell run-row__cell--identity">
      <app-run-identity
        [name]="run().name"
        [pipeline]="run().pipeline"
        [needsAttention]="run().needsAttention" />
    </td>
    <td class="run-row__cell run-row__cell--user">
      <app-user-cell [user]="run().user" />
    </td>
    <td class="run-row__cell run-row__cell--time">
      <span class="run-row__time">{{ run().submittedLabel }}</span>
    </td>
    <td class="run-row__cell run-row__cell--duration">
      <app-duration-label
        [durationMs]="run().durationMs"
        [label]="run().durationLabel" />
    </td>
    <td class="run-row__cell run-row__cell--tasks">
      <app-task-bar [breakdown]="run().tasks" />
    </td>
    <td class="run-row__cell run-row__cell--cost">
      <app-cost-label
        [cost]="run().cost"
        [label]="run().costLabel" />
    </td>
    <td class="run-row__cell run-row__cell--retries">
      <span class="run-row__retries" [class.run-row__retries--nonzero]="run().retries > 0">
        {{ run().retries }}
      </span>
    </td>
    <td class="run-row__cell run-row__cell--executor">
      <app-executor-pill [executor]="run().executor" />
    </td>
    <td class="run-row__cell run-row__cell--action" aria-hidden="true">
      <span class="material-icons run-row__chevron">chevron_right</span>
    </td>
  `,
  styleUrl: './run-row.component.scss',
  host: {
    class: 'run-row',
    '[class.run-row--selected]': 'selected()',
    '[class.run-row--failed]': 'isFailed()',
    '[class.run-row--running]': 'isRunning()',
    '[class.run-row--succeeded]': 'isSucceeded()',
    '[class.run-row--cancelled]': 'isCancelled()',
    '[class.run-row--submitted]': 'isSubmitted()',
    '[attr.aria-selected]': 'selected()',
    '[tabindex]': '0',
    role: 'row',
    '(click)': 'onSelect()',
    '(keydown.enter)': 'onSelect()',
    '(keydown.space)': 'onSelectSpace($event)',
  },
})
export class RunRowComponent {
  readonly run = input.required<RunVM>();
  readonly selected = input<boolean>(false);
  readonly select = output<string>();

  protected readonly exitLabel = computed(() => {
    const r = this.run();
    if (r.status !== 'FAILED') return null;
    return r.exitStatus !== null ? String(r.exitStatus) : null;
  });

  protected readonly isFailed    = computed(() => this.run().status === 'FAILED');
  protected readonly isRunning   = computed(() => this.run().status === 'RUNNING');
  protected readonly isSucceeded = computed(() => this.run().status === 'SUCCEEDED');
  protected readonly isCancelled = computed(() => this.run().status === 'CANCELLED');
  protected readonly isSubmitted = computed(() => this.run().status === 'SUBMITTED');

  onSelect(): void {
    this.select.emit(this.run().id);
  }

  onSelectSpace(event: Event): void {
    event.preventDefault();
    this.select.emit(this.run().id);
  }
}
