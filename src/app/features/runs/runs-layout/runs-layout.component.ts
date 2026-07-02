import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Pure container shell: one page background, the summary and the list panel as sibling
 * cards, the filter bar as the panel's toolbar (not its own card). Owns structure,
 * backgrounds, gutters and the toolbar divider only — projected content keeps its own
 * styles (see runs-layout-spec.md).
 */
@Component({
  selector: 'app-runs-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="runs-page">
      <header class="runs-page__header">
        <ng-content select="[header]" />
      </header>

      <section class="runs-page__summary">
        <ng-content select="[summary]" />
      </section>

      <section class="runs-panel" aria-label="Runs">
        <div class="runs-panel__toolbar">
          <ng-content select="[filters]" />
        </div>
        <div class="runs-panel__body">
          <ng-content select="[table]" />
        </div>
      </section>
    </div>
  `,
  styleUrl: './runs-layout.component.scss',
  host: { class: 'runs-layout-host' },
})
export class RunsLayoutComponent {}
