import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Loading placeholder for `RunsSummaryComponent` — same card footprint (verdict
 * row, status bar + legend, insight chip) so nothing reflows when real data lands.
 * Shown for the ~loading window driven by `RunsService.loadStatus()`, alongside
 * the table's skeleton rows; never a substitute for the real "no runs" empty state.
 */
@Component({
  selector: 'app-runs-summary-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="runs-summary-skeleton">
      <div class="runs-summary-skeleton__verdict">
        <span class="shimmer shimmer--headline"></span>
        <span class="shimmer shimmer--meta"></span>
      </div>

      <div class="runs-summary-skeleton__bar-row">
        <span class="shimmer shimmer--bar"></span>
        <ul class="runs-summary-skeleton__legend">
          @for (w of legendWidths; track $index) {
            <li>
              <span class="shimmer shimmer--dot"></span>
              <span class="shimmer shimmer--legend" [style.width.px]="w"></span>
            </li>
          }
        </ul>
      </div>

      <span class="shimmer shimmer--insight"></span>
    </div>
  `,
  styleUrl: './runs-summary-skeleton.component.scss',
  host: {
    class: 'runs-summary-skeleton-host',
    role: 'status',
    'aria-live': 'polite',
    'aria-label': 'Loading run summary',
  },
})
export class RunsSummarySkeletonComponent {
  protected readonly legendWidths = [64, 74, 82, 78, 68];
}
