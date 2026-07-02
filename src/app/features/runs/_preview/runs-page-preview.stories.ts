import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { RunsPagePreviewComponent } from './runs-page-preview.component';
import { failedViralreconDetail } from '../run-drawer/run-drawer.fixtures';

const meta: Meta<RunsPagePreviewComponent> = {
  title: 'Pages/RunsPagePreview',
  component: RunsPagePreviewComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<div style="height:900px">${story}</div>`),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<RunsPagePreviewComponent>;

// ─── State stories ────────────────────────────────────────────────────────────

export const FullLayout: Story = {
  name: 'FullLayout — no run selected',
};

export const DrawerOpen: Story = {
  name: 'DrawerOpen — failed ABACAS run, error-first',
  args: { initialSelectedId: failedViralreconDetail.id },
};

export const Filtered: Story = {
  name: 'Filtered — attention lens, table + bar reflect it',
  args: { initialLens: { kind: 'attention' } },
};

export const Narrow: Story = {
  name: 'Narrow (~800px)',
  decorators: [
    componentWrapperDecorator((story) => `<div style="width:800px;height:900px">${story}</div>`),
  ],
};

// ─── Interaction ──────────────────────────────────────────────────────────────

export const RowOpensDrawer: Story = {
  name: 'Interaction: Row click opens the drawer',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getAllByRole('row')[1]; // [0] is the table's header row
    await userEvent.click(row);
    await waitFor(() => expect(canvas.getByRole('dialog')).toBeVisible());
  },
};

export const LensFilters: Story = {
  name: 'Interaction: Failed lens filters the table + shows a chip',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Failed 3' }));

    // Table narrows to only FAILED rows (3, per the fixture).
    await waitFor(() => expect(canvas.getAllByRole('row')).toHaveLength(4)); // header + 3

    // Single source of truth: filter-bar's own chip reflects the same status.
    await expect(canvas.getByText('Status: Failed')).toBeVisible();

    // And the bar itself shows the Failed segment as the active one.
    await expect(canvas.getByRole('button', { name: 'Failed: 3 of 20' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
};

export const EscCloses: Story = {
  name: 'Interaction: Esc closes the drawer',
  args: { initialSelectedId: failedViralreconDetail.id },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('dialog')).toBeVisible();

    await userEvent.keyboard('{Escape}');

    // MatDrawer unmounts the content only once its own close transition ends.
    await waitFor(() =>
      expect(
        canvas.queryByRole('heading', { name: failedViralreconDetail.name }),
      ).not.toBeInTheDocument(),
    );
  },
};
