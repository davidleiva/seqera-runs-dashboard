import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: '[app-skeleton-row]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <td class="skel-cell skel-cell--status"><span class="shimmer shimmer--pill"></span></td>
    <td class="skel-cell skel-cell--identity">
      <span class="shimmer shimmer--name"></span>
      <span class="shimmer shimmer--pipeline"></span>
    </td>
    <td class="skel-cell"><span class="shimmer shimmer--user"></span></td>
    <td class="skel-cell"><span class="shimmer shimmer--text"></span></td>
    <td class="skel-cell"><span class="shimmer shimmer--text"></span></td>
    <td class="skel-cell skel-cell--bar"><span class="shimmer shimmer--bar"></span></td>
    <td class="skel-cell"><span class="shimmer shimmer--text"></span></td>
    <td class="skel-cell"><span class="shimmer shimmer--text shimmer--short"></span></td>
    <td class="skel-cell"><span class="shimmer shimmer--pill shimmer--exec"></span></td>
    <td class="skel-cell skel-cell--action"></td>
  `,
  styleUrl: './skeleton-row.component.scss',
  host: {
    class: 'run-row skeleton-row',
    'aria-hidden': 'true',
    'aria-label': 'Loading run',
  },
})
export class SkeletonRowComponent {}
