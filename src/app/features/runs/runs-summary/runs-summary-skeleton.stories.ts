import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { RunsSummarySkeletonComponent } from './runs-summary-skeleton.component';

const meta: Meta<RunsSummarySkeletonComponent> = {
  title: 'Organisms/RunsSummary/V3 Skeleton',
  component: RunsSummarySkeletonComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="padding:24px;background:#f8f9fa">${story}</div>`,
    ),
  ],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<RunsSummarySkeletonComponent>;

export const Skeleton: Story = {};
