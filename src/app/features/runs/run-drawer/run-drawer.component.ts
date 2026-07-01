import { A11yModule } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { StatusPillComponent } from '../../../shared/status-pill/status-pill.component';
import { TaskBarComponent } from '../../../shared/task-bar/task-bar.component';
import type { RunDetailVM } from './run-drawer.models';

type DrawerTab = 'Overview' | 'Tasks' | 'Metrics' | 'Config' | 'Logs';
type CopyTarget = 'error' | 'workDir';

@Component({
  selector: 'app-run-drawer',
  standalone: true,
  imports: [A11yModule, StatusPillComponent, TaskBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (run(); as selectedRun) {
      <div class="scrim" aria-hidden="true"></div>
      <aside
        class="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="run-drawer-title"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
      >
        <header class="drawer__header">
          <div class="drawer__status">
            <app-status-pill
              [status]="selectedRun.status"
              [exitLabel]="
                selectedRun.exitStatus === null ? null : selectedRun.exitStatus.toString()
              "
            />
          </div>

          <div class="drawer__identity">
            <h2 id="run-drawer-title" [title]="selectedRun.name">{{ selectedRun.name }}</h2>
            <div class="drawer__context">
              <span>{{ selectedRun.pipeline }}</span>
              @if (selectedRun.executor) {
                <span class="tag">{{ selectedRun.executor }}</span>
              }
            </div>
          </div>

          <div class="drawer__actions">
            <button class="icon-button" type="button" aria-label="Star run">
              <span class="material-icons" aria-hidden="true">star_border</span>
            </button>
            <button class="icon-button" type="button" aria-label="More run actions">
              <span class="material-icons" aria-hidden="true">more_vert</span>
            </button>
            <button
              #closeButton
              class="icon-button icon-button--close"
              type="button"
              aria-label="Close run details"
              (click)="requestClose()"
            >
              <span class="material-icons" aria-hidden="true">close</span>
            </button>
          </div>
        </header>

        <div
          class="tabs"
          role="tablist"
          aria-label="Run detail sections"
          (keydown)="onTabKeydown($event)"
        >
          @for (tab of tabs; track tab) {
            <button
              class="tabs__tab"
              type="button"
              role="tab"
              [id]="'run-tab-' + tab.toLowerCase()"
              [attr.aria-selected]="activeTab() === tab"
              aria-controls="run-drawer-panel"
              [tabIndex]="activeTab() === tab ? 0 : -1"
              (click)="selectTab(tab)"
            >
              {{ tab }}
            </button>
          }
        </div>

        <div
          class="drawer__body"
          role="tabpanel"
          id="run-drawer-panel"
          [attr.aria-labelledby]="'run-tab-' + activeTab().toLowerCase()"
          tabindex="0"
        >
          @if (activeTab() === 'Overview') {
            <div class="overview">
              @if (selectedRun.status === 'FAILED') {
                <section class="result-card result-card--failed" aria-labelledby="error-heading">
                  <div class="result-card__icon" aria-hidden="true">
                    <span class="material-icons">error</span>
                  </div>
                  <div class="result-card__content">
                    <h3 id="error-heading">
                      Error
                      @if (selectedRun.error?.process) {
                        <span>· process {{ selectedRun.error?.process }}</span>
                      }
                    </h3>
                    @if (selectedRun.error?.cause; as cause) {
                      <p class="error-cause">{{ cause }}</p>
                    } @else {
                      <p>This run failed but reported no error message.</p>
                    }
                    <div class="result-card__actions">
                      @if (copyableError()) {
                        <button
                          class="button button--secondary"
                          type="button"
                          (click)="copyError()"
                        >
                          <span class="material-icons" aria-hidden="true">
                            {{ copiedTarget() === 'error' ? 'check' : 'content_copy' }}
                          </span>
                          {{ copiedTarget() === 'error' ? 'Copied!' : 'Copy' }}
                        </button>
                      }
                      <button class="button button--disabled" type="button" disabled>
                        ✨ Explain error (AI) — coming soon
                      </button>
                    </div>
                  </div>
                </section>
              } @else if (selectedRun.status === 'SUCCEEDED') {
                <section
                  class="result-card result-card--succeeded"
                  aria-label="Run completed successfully"
                >
                  <div class="result-card__icon" aria-hidden="true">
                    <span class="material-icons">check_circle</span>
                  </div>
                  <div class="result-card__content">
                    <h3>Run completed successfully</h3>
                    <p>All workflow stages completed in {{ selectedRun.durationLabel }}.</p>
                    @if (selectedRun.needsAttention) {
                      <p class="attention-note">
                        <span class="material-icons" aria-hidden="true">warning_amber</span>
                        {{ attentionSummary() }}
                      </p>
                    }
                  </div>
                </section>
              } @else if (selectedRun.status === 'RUNNING') {
                <section class="result-card result-card--running" aria-label="Run in progress">
                  <div class="result-card__icon" aria-hidden="true">
                    <span class="material-icons">sync</span>
                  </div>
                  <div class="result-card__content">
                    <h3>Run in progress</h3>
                    <p>{{ runningSummary() }}</p>
                  </div>
                </section>
              }

              <section class="section" aria-labelledby="metadata-heading">
                <h3 id="metadata-heading">Metadata</h3>
                <dl class="metadata-grid">
                  <div>
                    <dt>User</dt>
                    <dd>{{ selectedRun.user ?? '—' }}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{{ selectedRun.submittedLabel }}</dd>
                  </div>
                  <div>
                    <dt>Started</dt>
                    <dd>{{ selectedRun.startedLabel }}</dd>
                  </div>
                  <div>
                    <dt>Completed</dt>
                    <dd>{{ selectedRun.completedLabel }}</dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{{ selectedRun.durationLabel }}</dd>
                  </div>
                  <div>
                    <dt>Exit status</dt>
                    <dd>{{ selectedRun.exitStatus ?? '—' }}</dd>
                  </div>
                  <div class="metadata-grid__wide">
                    <dt>Work directory</dt>
                    <dd class="copy-value">
                      <span [title]="selectedRun.workDir">{{ selectedRun.workDir }}</span>
                      @if (selectedRun.workDir !== '—') {
                        <button
                          class="copy-icon"
                          type="button"
                          [attr.aria-label]="
                            copiedTarget() === 'workDir'
                              ? 'Work directory copied'
                              : 'Copy work directory'
                          "
                          (click)="copyWorkDir()"
                        >
                          <span class="material-icons" aria-hidden="true">
                            {{ copiedTarget() === 'workDir' ? 'check' : 'content_copy' }}
                          </span>
                        </button>
                      }
                    </dd>
                  </div>
                </dl>
              </section>

              <section class="section" aria-labelledby="tasks-heading">
                <h3 id="tasks-heading">
                  {{ selectedRun.status === 'RUNNING' ? 'Task progress' : 'Task breakdown' }}
                </h3>
                @if (selectedRun.tasks; as tasks) {
                  <app-task-bar class="task-overview__bar" [breakdown]="tasks" />
                  <dl class="task-stats">
                    <div>
                      <dt>Succeeded</dt>
                      <dd class="stat stat--succeeded">{{ tasks.succeeded }}</dd>
                    </div>
                    @if (selectedRun.status === 'RUNNING') {
                      <div>
                        <dt>Running</dt>
                        <dd class="stat stat--running">{{ tasks.running ?? 0 }}</dd>
                      </div>
                    }
                    <div>
                      <dt>Failed</dt>
                      <dd class="stat stat--failed">{{ tasks.failed }}</dd>
                    </div>
                    <div>
                      <dt>Aborted</dt>
                      <dd class="stat stat--aborted">{{ tasks.aborted }}</dd>
                    </div>
                    <div>
                      <dt>Cached</dt>
                      <dd class="stat">{{ tasks.cached }}</dd>
                    </div>
                  </dl>
                } @else {
                  <p class="empty-note">No task data available</p>
                }
              </section>

              @if (selectedRun.cost !== null || selectedRun.resources) {
                <section class="section" aria-labelledby="resources-heading">
                  <h3 id="resources-heading">Cost &amp; resources</h3>
                  <dl class="resource-stats">
                    <div>
                      <dt>
                        {{ selectedRun.status === 'RUNNING' ? 'Estimated cost' : 'Total cost' }}
                      </dt>
                      <dd>{{ selectedRun.costLabel }}</dd>
                    </div>
                    @if (selectedRun.resources; as resources) {
                      <div>
                        <dt>CPU efficiency</dt>
                        <dd>{{ resources.cpuEfficiencyPct }}%</dd>
                      </div>
                      <div>
                        <dt>Peak CPUs</dt>
                        <dd>{{ resources.peakCpus }}</dd>
                      </div>
                      <div>
                        <dt>Memory peak</dt>
                        <dd>{{ resources.memoryPeakLabel }}</dd>
                      </div>
                    }
                  </dl>
                </section>
              }

              @if (selectedRun.topProcesses.length > 0) {
                <section class="section" aria-labelledby="processes-heading">
                  <h3 id="processes-heading">Top resource usage by process</h3>
                  <div class="process-list">
                    @for (process of selectedRun.topProcesses.slice(0, 3); track process.name) {
                      <div class="process">
                        <span class="process__name">{{ process.name }}</span>
                        <div
                          class="process__track"
                          role="img"
                          [attr.aria-label]="
                            process.name + ': ' + process.valuePct + '% resource usage'
                          "
                        >
                          <span class="process__fill" [style.width.%]="process.valuePct"></span>
                        </div>
                        <span class="process__value">{{ process.valuePct }}%</span>
                      </div>
                    }
                  </div>
                </section>
              }
            </div>
          } @else {
            <div class="placeholder">
              <span class="material-icons placeholder__icon" aria-hidden="true">{{
                placeholderIcon()
              }}</span>
              <h3>{{ activeTab() }}</h3>
              <p>{{ activeTab() }} details will appear here.</p>
            </div>
          }
        </div>
      </aside>
    }
  `,
  styleUrl: './run-drawer.component.scss',
  host: { class: 'run-drawer-host' },
})
export class RunDrawerComponent {
  readonly run = input<RunDetailVM | null>(null);
  readonly close = output<void>();

  protected readonly tabs: readonly DrawerTab[] = [
    'Overview',
    'Tasks',
    'Metrics',
    'Config',
    'Logs',
  ];
  protected readonly activeTab = signal<DrawerTab>('Overview');
  protected readonly copiedTarget = signal<CopyTarget | null>(null);

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private previouslyOpen = false;
  private opener: HTMLElement | null = null;
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly copyableError = computed(() => {
    const selectedRun = this.run();
    return selectedRun?.error?.raw ?? selectedRun?.commandLine ?? '';
  });

  protected readonly attentionSummary = computed(() => {
    const selectedRun = this.run();
    const failed = selectedRun?.tasks?.failed ?? 0;
    const retries = selectedRun?.retries ?? 0;
    const details: string[] = [];
    if (failed) details.push(`${failed} ${failed === 1 ? 'task' : 'tasks'} failed`);
    if (retries) details.push(`${retries} ${retries === 1 ? 'retry' : 'retries'}`);
    return details.length ? details.join(', ') : 'This run needs attention';
  });

  protected readonly runningSummary = computed(() => {
    const tasks = this.run()?.tasks;
    if (!tasks) return 'Waiting for task data.';
    return `${tasks.succeeded} succeeded · ${tasks.running ?? 0} running of ${tasks.total} tasks`;
  });

  constructor() {
    effect(() => {
      const isOpen = this.run() !== null;
      if (isOpen && !this.previouslyOpen) {
        this.opener =
          this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
        queueMicrotask(() => this.closeButton()?.nativeElement.focus());
      } else if (!isOpen && this.previouslyOpen) {
        queueMicrotask(() => this.opener?.focus());
        this.activeTab.set('Overview');
      }
      this.previouslyOpen = isOpen;
    });

    this.destroyRef.onDestroy(() => {
      if (this.copyTimer) clearTimeout(this.copyTimer);
      this.opener?.focus();
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.run()) this.requestClose();
  }

  protected requestClose(): void {
    this.close.emit();
  }

  protected selectTab(tab: DrawerTab): void {
    this.activeTab.set(tab);
  }

  protected onTabKeydown(event: KeyboardEvent): void {
    const currentIndex = this.tabs.indexOf(this.activeTab());
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % this.tabs.length;
    if (event.key === 'ArrowLeft')
      nextIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = this.tabs.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    this.activeTab.set(this.tabs[nextIndex]);
    const tabList = event.currentTarget as HTMLElement;
    queueMicrotask(() => {
      tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex!]?.focus();
    });
  }

  protected copyError(): void {
    const value = this.copyableError();
    if (value) this.copy(value, 'error');
  }

  protected copyWorkDir(): void {
    const value = this.run()?.workDir;
    if (value && value !== '—') this.copy(value, 'workDir');
  }

  protected placeholderIcon(): string {
    const icons: Record<Exclude<DrawerTab, 'Overview'>, string> = {
      Tasks: 'checklist',
      Metrics: 'query_stats',
      Config: 'tune',
      Logs: 'subject',
    };
    const tab = this.activeTab();
    return tab === 'Overview' ? 'info' : icons[tab];
  }

  private copy(value: string, target: CopyTarget): void {
    this.copiedTarget.set(target);
    void this.document.defaultView?.navigator.clipboard?.writeText(value).catch(() => undefined);

    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copiedTarget.set(null), 1200);
  }
}
