import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { HealthBarComponent } from './health-bar.component';
import { kpisAttentionOnly, kpisEmpty, kpisHealthy, kpisSample } from './health-bar.fixtures';

const meta: Meta<HealthBarComponent> = {
  title: 'Organisms/HealthBar',
  component: HealthBarComponent,
  tags: ['autodocs'],
  args: {
    activeStatus: null,
    filter: fn(),
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="padding:24px;background:#f8f9fa">${story}</div>`,
    ),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<HealthBarComponent>;

export const Healthy: Story = { args: { kpis: kpisHealthy } };
export const WithFailures: Story = {
  args: { kpis: kpisSample, activeStatus: 'FAILED' },
};
export const AttentionOnly: Story = { args: { kpis: kpisAttentionOnly } };
export const Empty: Story = { args: { kpis: kpisEmpty } };

export const ToggleFilter: Story = {
  args: { kpis: kpisSample, activeStatus: 'FAILED', filter: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /failed/i }));
    await expect(args.filter).toHaveBeenCalledWith(null);
  },
};
