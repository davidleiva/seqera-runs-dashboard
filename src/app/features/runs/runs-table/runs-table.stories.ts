import type { Meta, StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { RunsTableComponent } from './runs-table.component';
import {
  failedViralrecon,
  succeededRnaseq,
  succeededWithFailedTask,
  cancelledNoData,
  failedNoMessage,
  runningShowcase,
  submittedQueued,
} from '../run-row/run-row.fixtures';

// Risk-sorted: Failed → NeedsAttention → Running → Submitted → Succeeded → Cancelled
const allRuns = [
  failedViralrecon,
  succeededWithFailedTask,
  runningShowcase,
  succeededRnaseq,
  failedNoMessage,
  cancelledNoData,
  submittedQueued,
];

const meta: Meta<RunsTableComponent> = {
  title: 'Organisms/RunsTable',
  component: RunsTableComponent,
  tags: ['autodocs'],
  args: {
    sort: { key: 'risk', dir: 'desc' },
    selectedId: null,
    loading: false,
    select: fn(),
    sortChange: fn(),
    clearFilters: fn(),
  },
  argTypes: {
    loading: { control: 'boolean' },
  },
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<RunsTableComponent>;

// ─── State stories ────────────────────────────────────────────────────────────

export const Populated: Story = {
  args: { runs: allRuns },
};

export const Empty: Story = {
  args: { runs: [] },
};

export const Loading: Story = {
  args: { runs: [], loading: true },
};

export const AllHealthy: Story = {
  args: {
    runs: [succeededRnaseq, { ...succeededRnaseq, id: 'r-2', name: 'eloquent_newton' }],
    sort: { key: 'risk', dir: 'desc' },
  },
};

export const NeedsAttentionHeavy: Story = {
  args: {
    runs: [failedViralrecon, failedNoMessage, succeededWithFailedTask],
    sort: { key: 'risk', dir: 'desc' },
  },
};

export const RowSelected: Story = {
  args: {
    runs: allRuns,
    selectedId: failedViralrecon.id,
  },
};

export const SortByCost: Story = {
  args: {
    runs: [...allRuns].sort((a, b) => (b.cost ?? -Infinity) - (a.cost ?? -Infinity)),
    sort: { key: 'cost', dir: 'desc' },
  },
};

export const SortByDuration: Story = {
  args: {
    runs: [...allRuns].sort((a, b) => (b.durationMs ?? -Infinity) - (a.durationMs ?? -Infinity)),
    sort: { key: 'duration', dir: 'desc' },
  },
};

export const SortByRetries: Story = {
  args: {
    runs: [...allRuns].sort((a, b) => b.retries - a.retries),
    sort: { key: 'retries', dir: 'desc' },
  },
};

export const NumericAlignment: Story = {
  name: 'Right-aligned numeric columns',
  args: {
    runs: [
      { ...succeededRnaseq, id: 'align-1', cost: 0.01, retries: 0 },
      { ...succeededRnaseq, id: 'align-2', cost: 12.5, retries: 3 },
      { ...succeededRnaseq, id: 'align-3', cost: 128.42, retries: 12 },
    ],
    sort: { key: 'cost', dir: 'desc' },
  },
};

// ─── Interaction stories ──────────────────────────────────────────────────────

export const SelectingRun: Story = {
  name: 'Interaction: Select row',
  args: { runs: allRuns, select: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const rows = canvas.getAllByRole('row');
    // rows[0] is the thead row; rows[1] is first data row
    await userEvent.click(rows[1]);
    await expect(args.select).toHaveBeenCalledOnce();
  },
};

export const KeyboardNavigation: Story = {
  name: 'Interaction: Keyboard ↑/↓',
  args: { runs: allRuns },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = canvas.getAllByRole('row').slice(1); // exclude header
    rows[0].focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toBe(rows[1]);
    await userEvent.keyboard('{ArrowUp}');
    await expect(document.activeElement).toBe(rows[0]);
  },
};

export const SortingInteraction: Story = {
  name: 'Interaction: Sort header click',
  args: { runs: allRuns, sortChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const durationBtn = canvas.getByRole('button', { name: /duration/i });
    await userEvent.click(durationBtn);
    await expect(args.sortChange).toHaveBeenCalledWith({ key: 'duration', dir: 'desc' });
  },
};

// ─── Pagination ───────────────────────────────────────────────────────────────

// Cycles the 7 base fixtures to 30 unique-id rows — just needs to be "many", not varied.
const manyRuns = Array.from({ length: 30 }, (_, i) => {
  const base = allRuns[i % allRuns.length];
  return { ...base, id: `${base.id}-${i}`, name: `${base.name}-${i}` };
});

export const ManyRows: Story = {
  name: 'ManyRows (30 rows, pageSize 10 → 3 pages)',
  args: {
    runs: manyRuns.slice(0, 10),
    total: manyRuns.length,
    pageIndex: 0,
    pageSize: 10,
    pageSizeOptions: [10, 25, 50],
  },
};

export const SinglePage: Story = {
  name: 'SinglePage (7 rows — "1–7 of 7", no page nav needed)',
  args: {
    runs: allRuns,
    total: allRuns.length,
  },
};

export const PageSizeChange: Story = {
  name: 'Interaction: Changing page size emits pageChange',
  args: {
    runs: manyRuns.slice(0, 10),
    total: manyRuns.length,
    pageIndex: 0,
    pageSize: 10,
    pageChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox'));
    const overlay = within(document.body);
    await userEvent.click(await overlay.findByRole('option', { name: '25' }));
    await expect(args.pageChange).toHaveBeenCalledWith({ pageIndex: 0, pageSize: 25 });
  },
};

export const PageNavigation: Story = {
  name: 'Interaction: Next page emits pageChange',
  args: {
    runs: manyRuns.slice(0, 10),
    total: manyRuns.length,
    pageIndex: 0,
    pageSize: 10,
    pageChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /next page/i }));
    await expect(args.pageChange).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 10 });
  },
};

export const SortingNewColumns: Story = {
  name: 'Interaction: Sort Run/User/Retries headers',
  args: { runs: allRuns, sortChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /^run/i }));
    await expect(args.sortChange).toHaveBeenLastCalledWith({ key: 'name', dir: 'desc' });

    await userEvent.click(canvas.getByRole('button', { name: /^user/i }));
    await expect(args.sortChange).toHaveBeenLastCalledWith({ key: 'user', dir: 'desc' });

    await userEvent.click(canvas.getByRole('button', { name: /^retries/i }));
    await expect(args.sortChange).toHaveBeenLastCalledWith({ key: 'retries', dir: 'desc' });
  },
};
