import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { RunDrawerComponent } from './run-drawer.component';
import {
  cancelledNoDataDetail,
  failedNoMessageDetail,
  failedViralreconDetail,
  runningShowcaseDetail,
  succeededRnaseqDetail,
  succeededWithFailedTaskDetail,
} from './run-drawer.fixtures';

const meta: Meta<RunDrawerComponent> = {
  title: 'Organisms/RunDrawer',
  component: RunDrawerComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator(
      (story) => `
        <div style="position:relative;height:760px;overflow:hidden;background:#f8f9fa">
          ${story}
        </div>
      `,
    ),
  ],
  args: {
    close: fn(),
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<RunDrawerComponent>;

export const FailedWithError: Story = {
  args: { run: failedViralreconDetail },
};

export const SucceededHealthy: Story = {
  args: { run: succeededRnaseqDetail },
};

export const SucceededNeedsAttention: Story = {
  args: { run: succeededWithFailedTaskDetail },
};

export const FailedNoMessage: Story = {
  args: { run: failedNoMessageDetail },
};

export const CancelledNoData: Story = {
  args: { run: cancelledNoDataDetail },
};

export const Running: Story = {
  args: { run: runningShowcaseDetail },
};

export const Tabs: Story = {
  args: { run: succeededRnaseqDetail },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'Logs' }));
    await expect(canvas.getByRole('heading', { name: 'Logs' })).toBeVisible();
    await expect(canvas.getByText('Logs details will appear here.')).toBeVisible();
  },
};

export const ClosesOnEsc: Story = {
  args: { run: failedViralreconDetail, close: fn() },
  play: async ({ args }) => {
    await userEvent.keyboard('{Escape}');
    await expect(args.close).toHaveBeenCalledOnce();
  },
};

export const Copy: Story = {
  args: { run: failedViralreconDetail },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Copy' }));
    await expect(canvas.getByRole('button', { name: 'Copied!' })).toBeVisible();
  },
};

export const FocusOnOpen: Story = {
  args: { run: succeededRnaseqDetail },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Close run details' })).toHaveFocus();
  },
};
