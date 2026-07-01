import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, map } from 'rxjs';
import { RunsService } from './core/runs.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">

      <!-- ─── Sidebar ─────────────────────────────────────────────────── -->
      <nav class="sidebar" aria-label="Main navigation">

        <div class="sidebar__logo">
          <!-- Seqera wordmark -->
          <svg width="116" height="22" viewBox="0 0 116 22" fill="none" aria-label="Seqera" role="img">
            <rect width="22" height="22" rx="5" fill="#4256E7"/>
            <path d="M4 11c0-3.866 3.134-7 7-7 1.933 0 3.683.783 4.95 2.05L14.12 7.88A4.95 4.95 0 0011 6.5C8.515 6.5 6.5 8.515 6.5 11s2.015 4.5 4.5 4.5c1.369 0 2.597-.557 3.485-1.45l1.83 1.83C14.683 17.217 12.933 18 11 18c-3.866 0-7-3.134-7-7z" fill="white"/>
            <text x="28" y="16" fill="white" font-family="Inter, sans-serif" font-weight="700" font-size="14" letter-spacing="-0.3">seqera</text>
          </svg>
        </div>

        <div class="sidebar__workspace">
          <span class="material-icons sidebar__workspace-icon" aria-hidden="true">corporate_fare</span>
          <span class="sidebar__workspace-name">personal</span>
          <span class="material-icons sidebar__workspace-caret" aria-hidden="true">expand_more</span>
        </div>

        <ul class="sidebar__nav" role="list" aria-label="Pipelines">
          <li class="sidebar__group-label" aria-hidden="true">Pipelines</li>
          <li>
            <a class="sidebar__link sidebar__link--disabled" aria-disabled="true"
               tabindex="-1">
              <span class="material-icons" aria-hidden="true">rocket_launch</span>
              <span>Launchpad</span>
            </a>
          </li>
          <li>
            <a routerLink="/showcase" routerLinkActive="sidebar__link--active"
               class="sidebar__link" aria-current="page">
              <span class="material-icons" aria-hidden="true">view_list</span>
              <span>Runs</span>
            </a>
          </li>
          <li>
            <a class="sidebar__link sidebar__link--disabled" aria-disabled="true"
               tabindex="-1">
              <span class="material-icons" aria-hidden="true">bolt</span>
              <span>Actions</span>
            </a>
          </li>
        </ul>

        <ul class="sidebar__nav" role="list" aria-label="Compute">
          <li class="sidebar__group-label" aria-hidden="true">Compute</li>
          <li>
            <a class="sidebar__link sidebar__link--disabled" aria-disabled="true"
               tabindex="-1">
              <span class="material-icons" aria-hidden="true">memory</span>
              <span>Compute Envs</span>
            </a>
          </li>
        </ul>

        <ul class="sidebar__nav" role="list" aria-label="Data">
          <li class="sidebar__group-label" aria-hidden="true">Data</li>
          <li>
            <a class="sidebar__link sidebar__link--disabled" aria-disabled="true"
               tabindex="-1">
              <span class="material-icons" aria-hidden="true">storage</span>
              <span>Data Studios</span>
            </a>
          </li>
        </ul>

        <div class="sidebar__footer">
          <div class="sidebar__user" aria-label="Signed in as david">
            <span class="sidebar__avatar" aria-hidden="true">D</span>
            <span class="sidebar__username">david</span>
          </div>
        </div>

      </nav>

      <!-- ─── Main area: header + content ─────────────────────────────── -->
      <div class="main-area">

        <header class="topbar" role="banner">
          <div class="topbar__left">
            <nav aria-label="Breadcrumb" class="topbar__breadcrumb">
              <span class="topbar__breadcrumb-item topbar__breadcrumb-item--muted">Pipelines</span>
              <span class="material-icons topbar__breadcrumb-sep" aria-hidden="true">chevron_right</span>
              <span class="topbar__breadcrumb-item">Runs</span>
            </nav>
          </div>

          <div class="topbar__right">
            <!-- Route badge -->
            @if (service.scenario() === 'sample') {
              <span class="topbar__badge topbar__badge--sample" role="status" aria-live="polite">
                <span class="material-icons" aria-hidden="true">science</span>
                Sample dataset
                @if (service.runs().length > 0) {
                  · {{ service.runs().length }} runs
                }
              </span>
            } @else if (service.scenario() === 'showcase') {
              <span class="topbar__badge topbar__badge--showcase" role="status">
                <span class="material-icons" aria-hidden="true">auto_awesome</span>
                Extended demo data
              </span>
            }

            @if (updatedLabel()) {
              <span class="topbar__updated" aria-live="polite">
                <span class="material-icons" aria-hidden="true">schedule</span>
                {{ updatedLabel() }}
              </span>
            }

            <button
              class="topbar__refresh"
              type="button"
              aria-label="Refresh runs"
              [class.topbar__refresh--spinning]="service.loadStatus() === 'loading'"
              (click)="refresh()"
            >
              <span class="material-icons" aria-hidden="true">refresh</span>
            </button>
          </div>
        </header>

        <main class="main-content" id="main-content">
          <router-outlet />
        </main>

      </div>
    </div>
  `,
  styleUrl: './app.scss',
})
export class App {
  protected readonly service = inject(RunsService);

  // Tick every 30 s so the "Updated X ago" label stays fresh
  private readonly now = toSignal(interval(30_000).pipe(map(() => new Date())), {
    initialValue: new Date(),
  });

  protected readonly updatedLabel = computed(() => {
    const loaded = this.service.lastLoadedAt();
    if (!loaded) return '';
    const diffMs = this.now().getTime() - loaded.getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return 'just now';
    if (mins === 1) return '1m ago';
    return `${mins}m ago`;
  });

  protected refresh(): void {
    const scenario = this.service.scenario();
    if (scenario) this.service.load(scenario);
  }
}
