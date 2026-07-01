import type { Meta, StoryObj } from '@storybook/angular';
import { CostLabelComponent } from './cost-label.component';

const meta: Meta<CostLabelComponent> = {
  title: 'Atoms/CostLabel',
  component: CostLabelComponent,
  tags: ['autodocs'],
  argTypes: { cost: { control: 'number' }, label: { control: 'text' } },
};
export default meta;

type Story = StoryObj<CostLabelComponent>;

export const WithValue: Story = { args: { cost: 0.03, label: '$0.03' } };

export const Null: Story = { args: { cost: null, label: '—' } };
