import type { Meta, StoryObj } from '@storybook/angular';
import { UserCellComponent } from './user-cell.component';

const meta: Meta<UserCellComponent> = {
  title: 'Atoms/UserCell',
  component: UserCellComponent,
  tags: ['autodocs'],
  argTypes: { user: { control: 'text' } },
};
export default meta;

type Story = StoryObj<UserCellComponent>;

export const WithUser: Story = { args: { user: 'adamtalbot' } };

export const NoUser: Story = { args: { user: null } };
