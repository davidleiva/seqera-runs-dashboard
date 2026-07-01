import type { Meta, StoryObj } from '@storybook/angular';
import { StatusPillComponent } from './status-pill.component';

const meta: Meta<StatusPillComponent> = {
  title: 'Atoms/StatusPill',
  component: StatusPillComponent,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['SUCCEEDED', 'FAILED', 'RUNNING', 'SUBMITTED', 'CANCELLED'],
    },
    exitLabel: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<StatusPillComponent>;

export const Succeeded: Story = { args: { status: 'SUCCEEDED' } };

export const Failed: Story = { args: { status: 'FAILED', exitLabel: '0' } };

export const Running: Story = { args: { status: 'RUNNING' } };

export const Submitted: Story = { args: { status: 'SUBMITTED' } };

export const Cancelled: Story = { args: { status: 'CANCELLED' } };
