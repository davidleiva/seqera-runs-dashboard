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

    // Hint = what to do only. No invented cause sentence in this block.
    await expect(canvas.getByText(/Suggested next steps/i)).toBeVisible();
    await expect(canvas.getByText('Retry the run')).toBeVisible();
    await expect(canvas.queryByText(/this looks like/i)).toBeNull();

    // "Copy work dir" replaces the old "Open work dir" — it copies, it doesn't navigate.
    await expect(canvas.getByRole('button', { name: 'Copy work dir' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: /open work dir/i })).toBeNull();

    // AI is collapsed by default and labelled plainly, without repeating "error".
    // Scoped to the error card: the failed-task callout has its own "Explain with
    // AI" entry point into the same panel, so the unscoped query would be ambiguous.
    const errorCard = canvasElement.querySelector<HTMLElement>('.result-card--failed');
    const explainButton = within(errorCard!).getByRole('button', { name: /explain with ai/i });
    await expect(explainButton).toBeEnabled();
    await expect(explainButton).toHaveAttribute('aria-expanded', 'false');

    // Clicking the red segment scrolls to and focuses the failed-task callout.
    const segment = canvas.getByRole('button', { name: /1 failed task: view details/i });
    await userEvent.click(segment);
    const callout = canvasElement.querySelector<HTMLElement>('#failed-task-callout');
    await waitFor(() => expect(document.activeElement).toBe(callout));
    await expect(canvas.getByRole('heading', { name: 'Failed task' })).toBeVisible();

    // The AI demo is clearly labelled, never presented as live inference, and
    // explains the "why" without repeating the hint's "what to do" steps.
    await userEvent.click(explainButton);
    await expect(canvas.getByText('AI · demo')).toBeVisible();
    const aiPanel = canvasElement.querySelector<HTMLElement>('#ai-demo-panel');
    await expect(aiPanel).not.toBeNull();
    await expect(aiPanel!.textContent).not.toMatch(/retry the run/i);
    await expect(aiPanel!.textContent).not.toMatch(/retry error strategy/i);
  },
};

export const FailedNoMatch: Story = {
  name: 'Failed — no known-issue pattern matched',
  args: { run: failedNoMatchDetail },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Honest degrade: no invented cause, no AI demo for an ineligible run.
    await expect(canvas.queryByText(/Suggested next steps/i)).toBeNull();
    const errorCard = canvasElement.querySelector<HTMLElement>('.result-card--failed');
    await expect(
      within(errorCard!).getByRole('button', { name: /explain with ai/i }),
    ).toBeDisabled();

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
