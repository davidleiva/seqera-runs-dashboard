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
