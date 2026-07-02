import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { RunsSummaryV3Component } from './runs-summary-v3.component';
import {
  summaryEmpty,
  summaryHealthy,
  summarySample,
  summaryShowcase,
  summarySingleRun,
} from './runs-summary-v2.fixtures';

const meta: Meta<RunsSummaryV3Component> = {
  title: 'Organisms/RunsSummary/V3',
  component: RunsSummaryV3Component,
  tags: ['autodocs'],
  args: {
    activeLens: null,
    lens: fn(),
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="padding:24px;background:#f8f9fa">${story}</div>`,
    ),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<RunsSummaryV3Component>;

export const Showcase: Story = { args: { summary: summaryShowcase } };
export const Sample: Story = { args: { summary: summarySample } };
export const Healthy: Story = { args: { summary: summaryHealthy } };
export const SingleRun: Story = { args: { summary: summarySingleRun } };
export const Empty: Story = { args: { summary: summaryEmpty } };

export const StatusLensActive: Story = {
  name: 'Status lens active — Failed segment full, others dimmed',
  args: { summary: summaryShowcase, activeLens: { kind: 'status', status: 'FAILED' } },
};

export const AttentionLensActive: Story = {
  name: 'Attention lens active — whole bar dimmed',
  args: { summary: summaryShowcase, activeLens: { kind: 'attention' } },
};

export const HeadlineFilters: Story = {
  args: { summary: summaryShowcase, lens: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /need your attention/i }));
    await expect(args.lens).toHaveBeenCalledWith({ kind: 'attention' });
  },
};

export const SegmentFilters: Story = {
  args: { summary: summaryShowcase, lens: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Failed: 3 of 20' }));
    await expect(args.lens).toHaveBeenCalledWith({ kind: 'status', status: 'FAILED' });
  },
};

export const InsightFilters: Story = {
  args: { summary: summaryShowcase, lens: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /ABACAS/i }));
    await expect(args.lens).toHaveBeenCalledWith({ kind: 'insight', insight: summaryShowcase.insight });
  },
};

export const ToggleClears: Story = {
  args: {
    summary: summaryShowcase,
    activeLens: { kind: 'status', status: 'FAILED' },
    lens: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Failed: 3 of 20' }));
    await expect(args.lens).toHaveBeenCalledWith(null);
  },
};
