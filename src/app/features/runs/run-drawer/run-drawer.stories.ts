import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { RunDrawerComponent } from './run-drawer.component';
import {
  cancelledNoDataDetail,
  failedNoMatchDetail,
  failedNoMessageDetail,
  failedViralreconDetail,
  runningShowcaseDetail,
  succeededRnaseqDetail,
  succeededWithFailedTaskDetail,
} from '../run-drawer/run-drawer.fixtures';

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

// ─── Guide to solution — known issues, failed-task callout, AI demo ───────────

export const FailedWithKnownIssue: Story = {
  name: 'Failed — known issue + failed task + AI demo (ABACAS)',
  args: { run: failedViralreconDetail },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Suggested next steps/i)).toBeVisible();
    await expect(canvas.getByRole('button', { name: /explain error with ai/i })).toBeEnabled();

    // Clicking the red segment scrolls to and focuses the failed-task callout.
    const segment = canvas.getByRole('button', { name: /1 failed task: view details/i });
    await userEvent.click(segment);
    const callout = canvasElement.querySelector<HTMLElement>('#failed-task-callout');
    await waitFor(() => expect(document.activeElement).toBe(callout));
    await expect(canvas.getByRole('heading', { name: 'Failed task' })).toBeVisible();

    // The AI demo is clearly labelled, never presented as live inference.
    await userEvent.click(canvas.getByRole('button', { name: /explain error with ai/i }));
    await expect(canvas.getByText('AI · demo')).toBeVisible();
  },
};

export const FailedNoMatch: Story = {
  name: 'Failed — no known-issue pattern matched',
  args: { run: failedNoMatchDetail },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Honest degrade: no invented cause, no AI demo for an ineligible run.
    await expect(canvas.queryByText(/Suggested next steps/i)).toBeNull();
    await expect(canvas.getByRole('button', { name: /explain error with ai/i })).toBeDisabled();

    // The failed-task callout still renders — it's read from tasks[], not the hint lookup.
    await expect(canvas.getByRole('heading', { name: 'Failed task' })).toBeVisible();
  },
};

export const FailedNoTasks: Story = {
  name: 'Failed — no tasks at all (edge case, no callout)',
  args: { run: failedNoMessageDetail },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole('heading', { name: 'Failed task' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: /view details/i })).toBeNull();
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
    await expect(dialog).toHaveAttribute('aria-labelledby', 'run-drawer-title');
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
    // MatDrawer's `autoFocus` only moves focus once the open animation finishes
    // (`openedChange` fires on `_animationEnd`), so focus lands on the heading a
    // few frames after render — assert with a poll rather than synchronously.
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: succeededRnaseqDetail.name })).toHaveFocus(),
    );
  },
};

export const FocusTrap: Story = {
  name: 'Interaction: Tab cycles within the drawer',
  args: { run: failedViralreconDetail },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('.run-drawer__panel');
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
