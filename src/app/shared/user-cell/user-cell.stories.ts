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

export const DeterministicColours: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px">
        <app-user-cell user="adamtalbot" />
        <app-user-cell user="deekshapm05" />
        <app-user-cell user="diya-b" />
        <app-user-cell user="dev-intern" />
        <app-user-cell user="adamtalbot" />
      </div>
    `,
    imports: [UserCellComponent],
  }),
  name: 'Same user → same colour',
};
