import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { RunsSummaryV2Component } from './runs-summary-v2.component';
import {
  summaryEmpty,
  summaryHealthy,
  summarySample,
  summaryShowcase,
  summarySingleRun,
} from './runs-summary-v2.fixtures';

const meta: Meta<RunsSummaryV2Component> = {
  title: 'Organisms/RunsSummary/V2',
  component: RunsSummaryV2Component,
  tags: ['autodocs'],
  args: {
    activeLens: null,
    lens: fn(),
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="padding:24px 24px 64px;background:#f8f9fa">${story}</div>`,
    ),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<RunsSummaryV2Component>;

export const Showcase: Story = { args: { summary: summaryShowcase } };
export const Sample: Story = { args: { summary: summarySample } };
export const Healthy: Story = { args: { summary: summaryHealthy } };
export const SingleRun: Story = { args: { summary: summarySingleRun } };
export const Empty: Story = { args: { summary: summaryEmpty } };

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

export const HeadlineTooltip: Story = {
  args: { summary: summaryShowcase },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const headline = canvas.getByRole('button', { name: /need your attention/i });
    const tooltip = canvas.getByRole('tooltip', { hidden: true });
    await expect(tooltip).not.toBeVisible();
    await userEvent.hover(headline);
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveTextContent('3 failed + 5 succeeded with issues');
  },
};

export const ActiveLensHighlight: Story = {
  args: { summary: summaryShowcase, activeLens: { kind: 'status', status: 'FAILED' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Failed: 3 of 20' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(canvas.getByRole('button', { name: 'Failed 3' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
};
