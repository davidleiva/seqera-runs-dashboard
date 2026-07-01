import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { TaskBreakdown } from '../../core/models';

@Component({
  selector: 'app-task-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (breakdown()) {
      <div class="task-bar__segments"
           role="img"
           [attr.aria-label]="summaryText()"
           [title]="summaryText()">
        @if (breakdown()!.succeeded > 0) {
          <div class="task-bar__seg task-bar__seg--succeeded"
               [style.flex]="breakdown()!.succeeded"></div>
        }
        @if ((breakdown()!.running ?? 0) > 0) {
          <div class="task-bar__seg task-bar__seg--running"
               [style.flex]="breakdown()!.running"></div>
        }
        @if (breakdown()!.cached > 0) {
          <div class="task-bar__seg task-bar__seg--cached"
               [style.flex]="breakdown()!.cached"></div>
        }
        @if (breakdown()!.aborted > 0) {
          <div class="task-bar__seg task-bar__seg--aborted"
               [style.flex]="breakdown()!.aborted"></div>
        }
        @if (breakdown()!.failed > 0) {
          <div class="task-bar__seg task-bar__seg--failed"
               [style.flex]="breakdown()!.failed"></div>
        }
      </div>
      <span class="task-bar__count" aria-hidden="true">{{ breakdown()!.total }}</span>
    } @else {
      <span class="task-bar__empty">No task data</span>
    }
  `,
  styleUrl: './task-bar.component.scss',
  host: { class: 'task-bar' },
})
export class TaskBarComponent {
  readonly breakdown = input<TaskBreakdown | null>(null);

  /** Same text drives the aria-label and the hover tooltip — one explanation, one source. */
  protected readonly summaryText = computed(() => {
    const b = this.breakdown();
    if (!b) return '';
    const parts: string[] = [];
    if (b.succeeded) parts.push(`${b.succeeded} succeeded`);
    if (b.failed) parts.push(`${b.failed} failed`);
    if (b.aborted) parts.push(`${b.aborted} aborted`);
    if (b.cached) parts.push(`${b.cached} cached`);
    if (b.running) parts.push(`${b.running} running`);
    return `${parts.join(' · ')} of ${b.total}`;
  });
}
