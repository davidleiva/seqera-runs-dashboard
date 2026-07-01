import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { RunRowComponent } from './run-row.component';
import { SkeletonRowComponent } from '../../../shared/skeleton-row/skeleton-row.component';
import {
  failedViralrecon,
  succeededRnaseq,
  succeededWithFailedTask,
  cancelledNoData,
  failedNoMessage,
  runningShowcase,
  submittedQueued,
} from './run-row.fixtures';

const tableDecorator = (story: () => object) => {
  const s = story() as { template: string; [key: string]: unknown };
  return {
    ...s,
    template: `<table class="runs-table" style="width:100%;border-collapse:collapse"><tbody>${s.template}</tbody></table>`,
  };
};

const meta: Meta<RunRowComponent> = {
  title: 'Molecules/RunRow',
  component: RunRowComponent,
  tags: ['autodocs'],
  decorators: [tableDecorator],
  args: { select: fn() },
  argTypes: {
    selected: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<RunRowComponent>;

export const Failed: Story = {
  args: { run: failedViralrecon, selected: false },
};

export const FailedSelected: Story = {
  args: { run: failedViralrecon, selected: true },
};

export const Succeeded: Story = {
  args: { run: succeededRnaseq, selected: false },
};

export const SucceededNeedsAttention: Story = {
  args: { run: succeededWithFailedTask, selected: false },
};

export const Running: Story = {
  args: { run: runningShowcase, selected: false },
};

export const Submitted: Story = {
  args: { run: submittedQueued, selected: false },
};

export const Cancelled: Story = {
  args: { run: cancelledNoData, selected: false },
};

export const FailedDegraded: Story = {
  args: { run: failedNoMessage, selected: false },
  name: 'Failed (no error message)',
};

export const LongName: Story = {
  args: {
    run: {
      ...succeededRnaseq,
      name: 'rnaseq-community-showcase-very-long-run-name-that-should-truncate-gracefully-20260622',
    },
    selected: false,
  },
};

export const Skeleton: Story = {
  decorators: [],
  render: () => ({
    props: {},
    template: `
      <table class="runs-table" style="width:100%;border-collapse:collapse">
        <tbody>
          <tr app-skeleton-row></tr>
          <tr app-skeleton-row></tr>
          <tr app-skeleton-row></tr>
        </tbody>
      </table>
    `,
    imports: [SkeletonRowComponent],
  }),
  name: 'Skeleton (loading)',
};
