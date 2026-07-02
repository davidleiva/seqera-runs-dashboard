import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { TaskBreakdown } from '../../core/models';

@Component({
  selector: 'app-task-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (breakdown(); as b) {
      <!-- role="img" forbids focusable descendants, so once the failed segment is a
           real <button> (interactive()) the wrapper switches to role="group" instead. -->
      <div class="task-bar__segments"
           [attr.role]="interactive() ? 'group' : 'img'"
           [attr.aria-label]="summaryText()"
           [title]="summaryText()">
        @if (b.succeeded > 0) {
          <div class="task-bar__seg task-bar__seg--succeeded"
               [style.flex]="b.succeeded"></div>
        }
        @if ((b.running ?? 0) > 0) {
          <div class="task-bar__seg task-bar__seg--running"
               [style.flex]="b.running"></div>
        }
        @if (b.cached > 0) {
          <div class="task-bar__seg task-bar__seg--cached"
               [style.flex]="b.cached"></div>
        }
        @if (b.aborted > 0) {
          <div class="task-bar__seg task-bar__seg--aborted"
               [style.flex]="b.aborted"></div>
        }
        @if (b.failed > 0) {
          @if (interactive()) {
            <button
              type="button"
              class="task-bar__seg task-bar__seg--failed task-bar__seg--interactive"
              [style.flex]="b.failed"
              [attr.aria-label]="failedSegmentLabel()"
              (click)="failedClick.emit()"
            ></button>
          } @else {
            <div class="task-bar__seg task-bar__seg--failed" [style.flex]="b.failed"></div>
          }
        }
      </div>
      <span class="task-bar__count" aria-hidden="true">{{ b.total }}</span>
    } @else {
      <span class="task-bar__empty">No task data</span>
    }
  `,
  styleUrl: './task-bar.component.scss',
  host: { class: 'task-bar' },
})
export class TaskBarComponent {
  readonly breakdown = input<TaskBreakdown | null>(null);
  /** Makes the failed segment a real `<button>` — set only where there's somewhere for it to lead. */
  readonly interactive = input(false);
  readonly failedClick = output<void>();

  protected readonly failedSegmentLabel = computed(() => {
    const failed = this.breakdown()?.failed ?? 0;
    return `${failed} failed ${failed === 1 ? 'task' : 'tasks'}: view details`;
  });

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
