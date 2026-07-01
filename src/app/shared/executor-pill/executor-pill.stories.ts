import type { Meta, StoryObj } from '@storybook/angular';
import { ExecutorPillComponent } from './executor-pill.component';

const meta: Meta<ExecutorPillComponent> = {
  title: 'Atoms/ExecutorPill',
  component: ExecutorPillComponent,
  tags: ['autodocs'],
  argTypes: {
    executor: { control: 'select', options: ['awsbatch', 'local', null] },
  },
};
export default meta;

type Story = StoryObj<ExecutorPillComponent>;

export const AwsBatch: Story = { args: { executor: 'awsbatch' } };

export const Local: Story = { args: { executor: 'local' } };
