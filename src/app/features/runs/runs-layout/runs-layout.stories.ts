import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { RunsLayoutComponent } from './runs-layout.component';
import { RunsSummaryV3Component } from '../runs-summary/runs-summary-v3.component';
import { summaryEmpty, summaryShowcase } from '../runs-summary/runs-summary-v2.fixtures';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { executorOptions } from '../filter-bar/filter-bar.fixtures';
import { RunsTableComponent } from '../runs-table/runs-table.component';
import {
  cancelledNoData,
  failedNoMessage,
  failedViralrecon,
  runningShowcase,
  submittedQueued,
  succeededRnaseq,
  succeededWithFailedTask,
} from '../run-row/run-row.fixtures';

// Risk-sorted, same shape as runs-table's own Populated story.
const allRuns = [
  failedViralrecon,
  succeededWithFailedTask,
  runningShowcase,
  succeededRnaseq,
  failedNoMessage,
  cancelledNoData,
  submittedQueued,
];

const HEADER_TEMPLATE = `
  <div header style="display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <div>
      <h1 style="margin:0;font-size:1.35rem;font-weight:650;color:var(--c-text)">Runs</h1>
      <p style="margin:2px 0 0;font-size:0.85rem;color:var(--c-text-muted)">Extended demo data</p>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="font-size:0.78rem;font-weight:600;color:var(--c-text-muted);padding:4px 10px;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-pill)">
        Showcase dataset · 20 runs
      </span>
      <span style="font-size:0.78rem;color:var(--c-text-muted)">Updated 12s ago</span>
      <button type="button" aria-label="Refresh runs" style="display:inline-grid;place-items:center;width:32px;height:32px;padding:0;color:var(--c-text-muted);background:none;border:1px solid var(--c-border);border-radius:var(--radius);cursor:pointer">
        <span class="material-icons" aria-hidden="true" style="font-size:18px">refresh</span>
      </button>
    </div>
  </div>
`;

const meta: Meta<RunsLayoutComponent> = {
  title: 'Organisms/RunsLayout',
  component: RunsLayoutComponent,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<RunsLayoutComponent>;

// ─── Default — the money shot: one bg, two clean cards, filter-bar as ─────────
// panel header, aligned gutters. ─────────────────────────────────────────────

export const Default: Story = {
  render: () => ({
    props: {
      summary: summaryShowcase,
      executors: executorOptions,
      runs: allRuns,
    },
    template: `
      <app-runs-layout>
        ${HEADER_TEMPLATE}
        <div summary>
          <app-runs-summary-v3 [summary]="summary"></app-runs-summary-v3>
        </div>
        <div filters>
          <app-filter-bar [executors]="executors"></app-filter-bar>
        </div>
        <div table>
          <app-runs-table [runs]="runs" [total]="runs.length"></app-runs-table>
        </div>
      </app-runs-layout>
    `,
    moduleMetadata: {
      imports: [RunsLayoutComponent, RunsSummaryV3Component, FilterBarComponent, RunsTableComponent],
    },
  }),
};

export const Loading: Story = {
  name: 'Loading (panel + toolbar still visible)',
  render: () => ({
    props: {
      summary: summaryShowcase,
      executors: executorOptions,
    },
    template: `
      <app-runs-layout>
        ${HEADER_TEMPLATE}
        <div summary>
          <app-runs-summary-v3 [summary]="summary"></app-runs-summary-v3>
        </div>
        <div filters>
          <app-filter-bar [executors]="executors"></app-filter-bar>
        </div>
        <div table>
          <app-runs-table [runs]="[]" [loading]="true"></app-runs-table>
        </div>
      </app-runs-layout>
    `,
    moduleMetadata: {
      imports: [RunsLayoutComponent, RunsSummaryV3Component, FilterBarComponent, RunsTableComponent],
    },
  }),
};

export const Empty: Story = {
  name: 'Empty (empty state inside the panel)',
  render: () => ({
    props: {
      summary: summaryEmpty,
      executors: executorOptions,
    },
    template: `
      <app-runs-layout>
        ${HEADER_TEMPLATE}
        <div summary>
          <app-runs-summary-v3 [summary]="summary"></app-runs-summary-v3>
        </div>
        <div filters>
          <app-filter-bar [executors]="executors"></app-filter-bar>
        </div>
        <div table>
          <app-runs-table [runs]="[]"></app-runs-table>
        </div>
      </app-runs-layout>
    `,
    moduleMetadata: {
      imports: [RunsLayoutComponent, RunsSummaryV3Component, FilterBarComponent, RunsTableComponent],
    },
  }),
};

export const Narrow: Story = {
  name: 'Narrow (~700px — gutters + toolbar wrapping)',
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="width:700px;border:1px dashed #c8d1dc">${story}</div>`,
    ),
  ],
  render: () => ({
    props: {
      summary: summaryShowcase,
      executors: executorOptions,
      runs: allRuns,
    },
    template: `
      <app-runs-layout>
        ${HEADER_TEMPLATE}
        <div summary>
          <app-runs-summary-v3 [summary]="summary"></app-runs-summary-v3>
        </div>
        <div filters>
          <app-filter-bar [executors]="executors"></app-filter-bar>
        </div>
        <div table>
          <app-runs-table [runs]="runs" [total]="runs.length"></app-runs-table>
        </div>
      </app-runs-layout>
    `,
    moduleMetadata: {
      imports: [RunsLayoutComponent, RunsSummaryV3Component, FilterBarComponent, RunsTableComponent],
    },
  }),
};
