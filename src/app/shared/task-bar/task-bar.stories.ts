import type { Meta, StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TaskBarComponent } from './task-bar.component';

const meta: Meta<TaskBarComponent> = {
  title: 'Atoms/TaskBar',
  component: TaskBarComponent,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<TaskBarComponent>;

export const AllSucceeded: Story = {
  args: {
    breakdown: { total: 50, succeeded: 50, failed: 0, aborted: 0, cached: 0 },
  },
};

export const WithFailures: Story = {
  args: {
    breakdown: { total: 50, succeeded: 47, failed: 1, aborted: 2, cached: 0 },
  },
};

export const AllCached: Story = {
  args: {
    breakdown: { total: 50, succeeded: 0, failed: 0, aborted: 0, cached: 50 },
  },
};

export const RunningPartial: Story = {
  args: {
    breakdown: { total: 50, succeeded: 20, failed: 0, aborted: 0, cached: 0, running: 4 },
  },
};

export const NoData: Story = {
  args: { breakdown: null },
};

export const InteractiveFailedSegment: Story = {
  name: 'Interaction: clicking the failed segment emits failedClick',
  args: {
    breakdown: { total: 50, succeeded: 47, failed: 1, aborted: 2, cached: 0 },
    interactive: true,
    failedClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const segment = canvas.getByRole('button', { name: /1 failed task: view details/i });
    await userEvent.click(segment);
    await expect(args.failedClick).toHaveBeenCalledOnce();
  },
};
