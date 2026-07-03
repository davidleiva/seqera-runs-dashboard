import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
import { isAiCopilotDemoEligible } from '../../../core/derive/ai-copilot.utils';
import { StatusPillComponent } from '../../../shared/status-pill/status-pill.component';
import { TaskBarComponent } from '../../../shared/task-bar/task-bar.component';
import { ABACAS_AI_DEMO_RESPONSE } from '../run-drawer/ai-demo.fixture';
import type { RunDetailVM } from '../run-drawer/run-drawer.models';

type DrawerTab = 'Overview' | 'Tasks' | 'Metrics' | 'Config' | 'Logs';
type CopyTarget = 'error' | 'workDir' | 'command' | 'taskWorkDir' | 'taskScript';

@Component({
  selector: 'app-run-drawer',
  standalone: true,
  imports: [MatDrawerContainer, MatDrawer, MatDrawerContent, StatusPillComponent, TaskBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-drawer-container class="run-drawer" [hasBackdrop]="true" (backdropClick)="requestClose()">
      <mat-drawer-content class="run-drawer__content"></mat-drawer-content>

      <mat-drawer
        class="run-drawer__panel"
        mode="over"
        position="end"
        autoFocus="first-heading"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="displayRun() ? 'run-drawer-title' : null"
        [opened]="isOpen()"
        (openedChange)="onOpenedChange($event)"
        (closed)="onClosed()"
      >
        @if (displayRun(); as selectedRun) {
          <header class="drawer__header">
            <div class="drawer__identity">
              <h2 id="run-drawer-title" [title]="selectedRun.name">{{ selectedRun.name }}</h2>
              <div class="drawer__context">
                <app-status-pill
                  [status]="selectedRun.status"
                  [exitLabel]="
                    selectedRun.exitStatus === null ? null : selectedRun.exitStatus.toString()
                  "
                />
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
                        @if (selectedRun.error?.process; as process) {
                          <span>· process {{ process }}</span>
                        }
                      </h3>
                      @if (selectedRun.error?.cause; as cause) {
                        <p class="error-cause">{{ cause }}</p>
                      } @else {
                        <p>This run failed but reported no error message.</p>
                      }

                      @if (selectedRun.knownIssue; as issue) {
                        <div class="known-issue">
                          <p class="known-issue__lead"><strong>Suggested next steps</strong></p>
                          <ul class="known-issue__steps">
                            @for (step of issue.steps; track step) {
                              <li>{{ step }}</li>
                            }
                          </ul>
                        </div>
                      }

                      <div class="result-card__actions">
                        <button
                          class="button button--disabled"
                          type="button"
                          disabled
                          title="Retrying isn't wired up in this demo. It would resubmit the run to a real compute backend."
                        >
                          <span class="material-icons" aria-hidden="true">replay</span>
                          Retry run (coming soon)
                        </button>
                        <button
                          class="button"
                          [class.button--disabled]="!aiDemoEligible()"
                          [class.button--ai]="aiDemoEligible()"
                          type="button"
                          [disabled]="!aiDemoEligible()"
                          [attr.aria-expanded]="aiDemoEligible() ? aiDemoRevealed() : null"
                          [attr.aria-controls]="aiDemoEligible() ? 'ai-demo-panel' : null"
                          [attr.title]="
                            aiDemoEligible() ? null : 'Coming soon: live inference is not wired up yet'
                          "
                          (click)="toggleAiDemo()"
                        >
                          ✨ {{ aiDemoRevealed() ? 'Hide AI explanation' : 'Explain with AI' }}
                        </button>
                      </div>

                      <div
                        class="result-card__actions result-card__actions--secondary"
                        role="group"
                        aria-label="More actions"
                      >
                        @if (copyableError()) {
                          <button class="button button--ghost" type="button" (click)="copyError()">
                            <span class="material-icons" aria-hidden="true">
                              {{ copiedTarget() === 'error' ? 'check' : 'content_copy' }}
                            </span>
                            {{ copiedTarget() === 'error' ? 'Copied!' : 'Copy' }}
                          </button>
                        }
                        <button class="button button--ghost" type="button" (click)="copyCommand()">
                          <span class="material-icons" aria-hidden="true">
                            {{ copiedTarget() === 'command' ? 'check' : 'content_copy' }}
                          </span>
                          {{ copiedTarget() === 'command' ? 'Copied!' : 'Copy command' }}
                        </button>
                        @if (selectedRun.workDir !== '—') {
                          <button class="button button--ghost" type="button" (click)="copyWorkDir()">
                            <span class="material-icons" aria-hidden="true">
                              {{ copiedTarget() === 'workDir' ? 'check' : 'content_copy' }}
                            </span>
                            {{ copiedTarget() === 'workDir' ? 'Copied!' : 'Copy work dir' }}
                          </button>
                        }
                        @if (copyableError()) {
                          <button
                            class="button button--ghost"
                            type="button"
                            aria-controls="raw-log-panel"
                            [attr.aria-expanded]="showFullLog()"
                            (click)="toggleFullLog()"
                          >
                            <span class="material-icons" aria-hidden="true">subject</span>
                            {{ showFullLog() ? 'Hide full log' : 'View full log' }}
                          </button>
                        }
                        @if (selectedRun.failedTask) {
                          <button class="button button--ghost" type="button" (click)="inspectFailedTask()">
                            <span class="material-icons" aria-hidden="true">search</span>
                            Inspect failed task
                          </button>
                        }
                      </div>

                      @if (showFullLog()) {
                        <pre id="raw-log-panel" class="raw-log">{{ selectedRun.error?.raw }}</pre>
                      }

                      @if (aiDemoEligible() && aiDemoRevealed()) {
                        <div id="ai-demo-panel" class="ai-demo" role="note" aria-label="AI-generated explanation (demo only, not live inference)">
                          <span class="ai-demo__badge">AI · demo</span>
                          <p>{{ aiDemoResponse.explanation }}</p>
                        </div>
                      }
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
                    <app-task-bar
                      class="task-overview__bar"
                      [breakdown]="tasks"
                      [interactive]="!!selectedRun.failedTask"
                      (failedClick)="inspectFailedTask()"
                    />
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

                @if (selectedRun.failedTask; as failedTask) {
                  <section
                    class="section failed-task"
                    id="failed-task-callout"
                    tabindex="-1"
                    aria-labelledby="failed-task-heading"
                    [class.failed-task--highlight]="failedTaskHighlighted()"
                  >
                    <h3 id="failed-task-heading">Failed task</h3>
                    <dl class="metadata-grid">
                      <div>
                        <dt>Process</dt>
                        <dd>{{ failedTask.process }}</dd>
                      </div>
                      <div>
                        <dt>Exit code</dt>
                        <dd>{{ failedTask.exit }}</dd>
                      </div>
                      <div class="metadata-grid__wide">
                        <dt>Work directory</dt>
                        <dd class="copy-value">
                          <span [title]="failedTask.workDir">{{ failedTask.workDir }}</span>
                        </dd>
                      </div>
                    </dl>
                    <div class="result-card__actions">
                      <button class="button" type="button" (click)="copyTaskWorkDir()">
                        <span class="material-icons" aria-hidden="true">
                          {{ copiedTarget() === 'taskWorkDir' ? 'check' : 'content_copy' }}
                        </span>
                        {{ copiedTarget() === 'taskWorkDir' ? 'Copied!' : 'Copy task work dir' }}
                      </button>
                      @if (failedTask.script) {
                        <button class="button" type="button" (click)="copyTaskScript()">
                          <span class="material-icons" aria-hidden="true">
                            {{ copiedTarget() === 'taskScript' ? 'check' : 'content_copy' }}
                          </span>
                          {{ copiedTarget() === 'taskScript' ? 'Copied!' : 'Copy task command' }}
                        </button>
                      }
                      <button
                        class="button"
                        [class.button--disabled]="!aiDemoEligible()"
                        [class.button--ai]="aiDemoEligible()"
                        type="button"
                        [disabled]="!aiDemoEligible()"
                        [attr.aria-expanded]="aiDemoEligible() ? aiDemoRevealed() : null"
                        [attr.aria-controls]="aiDemoEligible() ? 'ai-demo-panel' : null"
                        [attr.title]="
                          aiDemoEligible() ? null : 'Coming soon: live inference is not wired up yet'
                        "
                        (click)="toggleAiDemo()"
                      >
                        ✨ {{ aiDemoRevealed() ? 'Hide AI explanation' : 'Explain with AI' }}
                      </button>
                    </div>
                  </section>
                }

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
        }
      </mat-drawer>
    </mat-drawer-container>
  `,
  styleUrl: './run-drawer.component.scss',
  host: {
    class: 'run-drawer-host',
    // MatDrawer's own Escape handling listens on the drawer element itself,
    // so it only fires once focus has actually moved inside — which only
    // happens once the open transition finishes. Pressing Escape right after
    // opening (before that transition completes) would otherwise do nothing.
    // A document-level listener closes reliably regardless of where focus is.
    '(document:keydown.escape)': 'onDocumentEscape()',
  },
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
  protected readonly showFullLog = signal(false);
  protected readonly aiDemoRevealed = signal(false);
  protected readonly failedTaskHighlighted = signal(false);
  protected readonly aiDemoResponse = ABACAS_AI_DEMO_RESPONSE;

  // Kept mounted through MatDrawer's own close transition — `(closed)` (fired
  // once that transition finishes) is what actually clears it via `.set(null)`,
  // so content doesn't vanish mid-slide the way an `@if (run(); ...)` would.
  protected readonly displayRun = linkedSignal<RunDetailVM | null, RunDetailVM | null>({
    source: this.run,
    computation: (incoming, previous) => incoming ?? previous?.value ?? null,
  });
  protected readonly isOpen = computed(() => this.run() !== null);

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;
  private highlightTimer: ReturnType<typeof setTimeout> | null = null;

  /** Only a real parsed error is copyable — never falls back to the launch command. */
  protected readonly copyableError = computed(() => this.displayRun()?.error?.raw ?? '');

  /** Narrow, honest gate for the Tier-3 AI demo — see `isAiCopilotDemoEligible`. */
  protected readonly aiDemoEligible = computed(() =>
    isAiCopilotDemoEligible(this.displayRun()?.error ?? null),
  );

  protected readonly attentionSummary = computed(() => {
    const selectedRun = this.displayRun();
    const failed = selectedRun?.tasks?.failed ?? 0;
    const retries = selectedRun?.retries ?? 0;
    const details: string[] = [];
    if (failed) details.push(`${failed} ${failed === 1 ? 'task' : 'tasks'} failed`);
    if (retries) details.push(`${retries} ${retries === 1 ? 'retry' : 'retries'}`);
    return details.length ? details.join(', ') : 'This run needs attention';
  });

  protected readonly runningSummary = computed(() => {
    const tasks = this.displayRun()?.tasks;
    if (!tasks) return 'Waiting for task data.';
    return `${tasks.succeeded} succeeded · ${tasks.running ?? 0} running of ${tasks.total} tasks`;
  });

  constructor() {
    // MatDrawer owns open/close animation, backdrop, focus-trap, Esc and
    // reduced-motion; `displayRun` (a linkedSignal) keeps the last run mounted
    // while it plays the exit transition.
    this.destroyRef.onDestroy(() => {
      if (this.copyTimer) clearTimeout(this.copyTimer);
      if (this.highlightTimer) clearTimeout(this.highlightTimer);
    });
  }

  /**
   * MatDrawer reports its own `opened` transitions here. Note this is NOT a
   * reliable close signal for the backdrop: `[opened]` is bound one-way to
   * `isOpen()`, so the moment the backdrop toggles the drawer shut, the next CD
   * cycle re-applies `opened=true` (the `run` input hasn't changed yet). By the
   * time the close animation's `openedChange` fires, `this.opened` reads `true`
   * again and the close is swallowed. Backdrop close is therefore wired straight
   * to `requestClose()` via `(backdropClick)`; this handler stays as a backstop.
   */
  protected onOpenedChange(opened: boolean): void {
    if (!opened) this.close.emit();
  }

  /** Fires once the close transition finishes — safe to unmount content now. */
  protected onClosed(): void {
    this.displayRun.set(null);
    this.activeTab.set('Overview');
    this.showFullLog.set(false);
    this.aiDemoRevealed.set(false);
    this.failedTaskHighlighted.set(false);
  }

  protected requestClose(): void {
    this.close.emit();
  }

  /** Backstop for MatDrawer's focus-dependent Escape handling — see the host listener above. */
  protected onDocumentEscape(): void {
    if (this.isOpen()) this.requestClose();
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
    const targetIndex = nextIndex;
    this.activeTab.set(this.tabs[targetIndex]);
    const tabList = event.currentTarget as HTMLElement;
    queueMicrotask(() => {
      tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]')[targetIndex]?.focus();
    });
  }

  protected copyError(): void {
    const value = this.copyableError();
    if (value) this.copy(value, 'error');
  }

  protected copyWorkDir(): void {
    const value = this.displayRun()?.workDir;
    if (value && value !== '—') this.copy(value, 'workDir');
  }

  protected copyCommand(): void {
    const value = this.displayRun()?.commandLine;
    if (value) this.copy(value, 'command');
  }

  protected copyTaskWorkDir(): void {
    const value = this.displayRun()?.failedTask?.workDir;
    if (value) this.copy(value, 'taskWorkDir');
  }

  protected copyTaskScript(): void {
    const value = this.displayRun()?.failedTask?.script;
    if (value) this.copy(value, 'taskScript');
  }

  protected toggleFullLog(): void {
    this.showFullLog.update(shown => !shown);
  }

  protected toggleAiDemo(): void {
    if (!this.aiDemoEligible()) return;
    this.aiDemoRevealed.update(revealed => !revealed);
    if (this.aiDemoRevealed()) {
      queueMicrotask(() =>
        this.document
          .getElementById('ai-demo-panel')
          ?.scrollIntoView({ behavior: this.scrollBehavior(), block: 'center' }),
      );
    }
  }

  /** Jumps to the failed-task callout and briefly highlights it — the red segment's target. */
  protected inspectFailedTask(): void {
    const el = this.document.getElementById('failed-task-callout');
    if (!el) return;

    el.scrollIntoView({ behavior: this.scrollBehavior(), block: 'center' });
    el.focus({ preventScroll: true });

    this.failedTaskHighlighted.set(true);
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
    this.highlightTimer = setTimeout(() => this.failedTaskHighlighted.set(false), 1200);
  }

  private scrollBehavior(): ScrollBehavior {
    const reducedMotion = this.document.defaultView?.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    return reducedMotion ? 'auto' : 'smooth';
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
