import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { RunDrawerMaterialComponent } from './run-drawer-material.component';
import {
  cancelledNoDataDetail,
  failedNoMessageDetail,
  failedViralreconDetail,
  runningShowcaseDetail,
  succeededRnaseqDetail,
  succeededWithFailedTaskDetail,
} from '../run-drawer/run-drawer.fixtures';

const meta: Meta<RunDrawerMaterialComponent> = {
  title: 'Organisms/RunDrawerMaterial',
  component: RunDrawerMaterialComponent,
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
type Story = StoryObj<RunDrawerMaterialComponent>;

// ─── State stories — same overview content/fixtures as `run-drawer` ───────────

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

// ─── Interaction — MatDrawer-provided behaviour (open, Esc, backdrop, focus-trap) ─

export const Open: Story = {
  name: 'Interaction: Opens as a labelled dialog',
  args: { run: failedViralreconDetail },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-labelledby', 'run-drawer-material-title');
  },
};

export const ClosesOnEsc: Story = {
  name: 'Interaction: Esc closes',
  args: { run: failedViralreconDetail, close: fn() },
  play: async ({ args }) => {
    await userEvent.keyboard('{Escape}');
    await expect(args.close).toHaveBeenCalledOnce();
  },
};

export const ClosesOnBackdropClick: Story = {
  name: 'Interaction: Backdrop click closes',
  args: { run: failedViralreconDetail, close: fn() },
  play: async ({ canvasElement, args }) => {
    const backdrop = canvasElement.querySelector<HTMLElement>('.mat-drawer-backdrop');
    if (!backdrop) throw new Error('Expected MatDrawerContainer to render a backdrop');
    await userEvent.click(backdrop);
    await expect(args.close).toHaveBeenCalledOnce();
  },
};

export const FocusOnOpen: Story = {
  name: 'Interaction: Focus lands on the title on open',
  args: { run: succeededRnaseqDetail },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: succeededRnaseqDetail.name })).toHaveFocus();
  },
};

export const FocusTrap: Story = {
  name: 'Interaction: Tab cycles within the drawer',
  args: { run: failedViralreconDetail },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('.run-drawer-material__panel');
    // More tabs than there are focusable elements in the panel — if the trap
    // didn't hold, focus would escape to the document body by now.
    for (let i = 0; i < 15; i++) {
      await userEvent.tab();
    }
    await expect(panel?.contains(document.activeElement)).toBe(true);
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
