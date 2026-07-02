import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { RunsSummaryComponent } from './runs-summary.component';
import {
  summaryEmpty,
  summaryHealthy,
  summarySample,
  summaryShowcase,
  summarySingleRun,
} from './runs-summary.fixtures';

const meta: Meta<RunsSummaryComponent> = {
  title: 'Organisms/RunsSummary',
  component: RunsSummaryComponent,
  tags: ['autodocs'],
  args: {
    activeStatus: null,
    filter: fn(),
    selectInsight: fn(),
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="padding:24px;background:#f8f9fa">${story}</div>`,
    ),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<RunsSummaryComponent>;

export const Showcase: Story = { args: { summary: summaryShowcase } };
export const Sample: Story = { args: { summary: summarySample } };
export const Healthy: Story = { args: { summary: summaryHealthy } };
export const SingleRun: Story = { args: { summary: summarySingleRun } };
export const Empty: Story = { args: { summary: summaryEmpty } };

export const FilterFromSegment: Story = {
  args: { summary: summaryShowcase, filter: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Failed 3' }));
    await expect(args.filter).toHaveBeenCalledWith('FAILED');
  },
};

export const InsightClick: Story = {
  args: { summary: summaryShowcase, selectInsight: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /ABACAS/i }));
    await expect(args.selectInsight).toHaveBeenCalledWith(summaryShowcase.insight);
  },
};
