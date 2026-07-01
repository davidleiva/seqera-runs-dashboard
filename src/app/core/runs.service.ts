import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { timer, switchMap } from 'rxjs';
import type { RawRun } from './models/raw-run.model';
import type { RunDetailVM } from '../features/runs/run-drawer/run-drawer.models';
import { toRunDetailVM } from './runs.adapter';

@Injectable({ providedIn: 'root' })
export class RunsService {
  private readonly http = inject(HttpClient);

  readonly runs = signal<RunDetailVM[]>([]);
  readonly loadStatus = signal<'loading' | 'ready' | 'error'>('loading');
  readonly scenario = signal<'sample' | 'showcase' | null>(null);
  readonly lastLoadedAt = signal<Date | null>(null);

  load(scenario: 'sample' | 'showcase'): void {
    this.scenario.set(scenario);
    this.loadStatus.set('loading');
    this.runs.set([]);

    const url =
      scenario === 'sample' ? 'runs.json' : 'runs.showcase.json';

    // ~600 ms delay so the skeleton shimmer is visible
    timer(600)
      .pipe(switchMap(() => this.http.get<{ runs: unknown[] }>(url)))
      .subscribe({
        next: data => {
          try {
            const vms = (data.runs ?? []).map(r => toRunDetailVM(r as RawRun));
            this.runs.set(vms);
            this.loadStatus.set('ready');
            this.lastLoadedAt.set(new Date());
          } catch (e) { console.error('adapter failed', e); this.loadStatus.set('error'); }
        },
        error: (e) => { console.error('fetch failed', e); this.loadStatus.set('error'); },
      });
  }
}
