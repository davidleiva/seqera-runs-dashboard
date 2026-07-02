import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { RunsSummaryV3SkeletonComponent } from './runs-summary-v3-skeleton.component';

const meta: Meta<RunsSummaryV3SkeletonComponent> = {
  title: 'Organisms/RunsSummary/V3 Skeleton',
  component: RunsSummaryV3SkeletonComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="padding:24px;background:#f8f9fa">${story}</div>`,
    ),
  ],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<RunsSummaryV3SkeletonComponent>;

export const Skeleton: Story = {};
