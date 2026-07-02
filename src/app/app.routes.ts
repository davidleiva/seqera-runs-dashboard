import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'showcase', pathMatch: 'full' },
  {
    path: 'sample',
    loadComponent: () =>
      import('./features/runs/runs-page/runs-page.component').then(m => m.RunsPageComponent),
    data: { scenario: 'sample' },
  },
  {
    path: 'showcase',
    loadComponent: () =>
      import('./features/runs/runs-page/runs-page.component').then(m => m.RunsPageComponent),
    data: { scenario: 'showcase' },
  },
  {
    path: 'v2/sample',
    loadComponent: () =>
      import('./features/runs/runs-page-v2/runs-page-v2.component').then(m => m.RunsPageV2Component),
    data: { scenario: 'sample' },
  },
  {
    path: 'v2/showcase',
    loadComponent: () =>
      import('./features/runs/runs-page-v2/runs-page-v2.component').then(m => m.RunsPageV2Component),
    data: { scenario: 'showcase' },
  },
  { path: '**', redirectTo: 'showcase' },
];
