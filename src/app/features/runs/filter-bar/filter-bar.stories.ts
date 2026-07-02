import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { FilterBarComponent } from './filter-bar.component';
import { executorOptions } from './filter-bar.fixtures';

const meta: Meta<FilterBarComponent> = {
  title: 'Molecules/FilterBar',
  component: FilterBarComponent,
  tags: ['autodocs'],
  args: {
    search: '',
    status: null,
    executor: null,
    executors: executorOptions,
    searchChange: fn(),
    statusChange: fn(),
    executorChange: fn(),
    clearAll: fn(),
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="padding:24px;background:#f8f9fa">${story}</div>`,
    ),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<FilterBarComponent>;

export const NoFilters: Story = {};
export const WithSearch: Story = { args: { search: 'viralrecon' } };
export const WithStatusChip: Story = { args: { status: 'FAILED' } };
export const WithMultipleChips: Story = {
  args: { search: 'community', status: 'SUCCEEDED', executor: 'awsbatch' },
};
export const AllActive: Story = {
  args: {
    search: 'rnaseq',
    status: 'FAILED',
    executor: 'local',
    clearAll: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }));
    await expect(args.clearAll).toHaveBeenCalledOnce();
  },
};
