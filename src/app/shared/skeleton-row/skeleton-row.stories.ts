import type { Meta, StoryObj } from '@storybook/angular';
import { SkeletonRowComponent } from './skeleton-row.component';

const tableDecorator = (story: () => object) => {
  const s = story() as { template: string; [key: string]: unknown };
  return {
    ...s,
    template: `<table style="width:100%;border-collapse:collapse"><tbody>${s.template}</tbody></table>`,
  };
};

const meta: Meta<SkeletonRowComponent> = {
  title: 'Atoms/SkeletonRow',
  component: SkeletonRowComponent,
  tags: ['autodocs'],
  decorators: [tableDecorator],
};
export default meta;

type Story = StoryObj<SkeletonRowComponent>;

export const Default: Story = {};

export const MultipleRows: Story = {
  decorators: [],
  render: () => ({
    props: {},
    template: `
      <table style="width:100%;border-collapse:collapse">
        <tbody>
          <tr app-skeleton-row></tr>
          <tr app-skeleton-row></tr>
          <tr app-skeleton-row></tr>
        </tbody>
      </table>
    `,
    imports: [SkeletonRowComponent],
  }),
  name: 'Multiple rows (loading list)',
};
