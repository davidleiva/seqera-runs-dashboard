import type { Meta, StoryObj } from '@storybook/angular';
import { DurationLabelComponent } from './duration-label.component';

const meta: Meta<DurationLabelComponent> = {
  title: 'Atoms/DurationLabel',
  component: DurationLabelComponent,
  tags: ['autodocs'],
  argTypes: { durationMs: { control: 'number' }, label: { control: 'text' } },
};
export default meta;

type Story = StoryObj<DurationLabelComponent>;

export const WithValue: Story = { args: { durationMs: 784042, label: '13m 4s' } };

export const Null: Story = { args: { durationMs: null, label: '—' } };
