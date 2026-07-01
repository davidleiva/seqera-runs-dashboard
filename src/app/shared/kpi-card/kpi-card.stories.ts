import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { KpiCardComponent } from './kpi-card.component';
import {
  attentionCard,
  costCard,
  failedCard,
  runningCard,
  succeededCard,
  totalRunsCard,
} from './kpi-card.fixtures';

const meta: Meta<KpiCardComponent> = {
  title: 'Atoms/KpiCard',
  component: KpiCardComponent,
  tags: ['autodocs'],
  args: {
    activate: fn(),
  },
  decorators: [
    componentWrapperDecorator((story) => `<div style="width:180px;padding:20px">${story}</div>`),
  ],
};

export default meta;
type Story = StoryObj<KpiCardComponent>;

export const Neutral: Story = { args: totalRunsCard };
export const Succeeded: Story = { args: succeededCard };
export const FailedPressed: Story = { args: failedCard };
export const Running: Story = { args: runningCard };
export const NeedsAttention: Story = { args: attentionCard };
export const Cost: Story = { args: costCard };

export const HoverFocus: Story = {
  args: { ...succeededCard, activate: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    const card = canvas.getByRole('button', { name: /succeeded/i });
    await expect(card).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.activate).toHaveBeenCalledOnce();
  },
};
