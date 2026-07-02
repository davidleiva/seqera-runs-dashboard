---
name: storybook-stories
description: Storybook CSF patterns and fixture conventions for this Angular app. Use when creating or editing any .stories.ts file or component fixtures for Storybook.
---

# Storybook stories pattern

Stack: Storybook 10 + `@storybook/angular`, with `addon-a11y` and `addon-docs`.
Stories document the **states** of presentational components and must all pass a11y.

## Rules

- One `*.stories.ts` per component, colocated with the component.
- Components under test are **presentational** (`input()`/`output()`, `OnPush`,
  no service injection). If a story needs data, pass a **fixture**, never a service.
- Fixtures are typed with the domain model (`RunVM`, `TaskBreakdown`) and **derived
  from the real dataset**, including edge cases. Colocate as `*.fixtures.ts`.
- Every variant must map to a real state — no invented data.
- Keep the a11y addon green: icon + text (not colour alone), valid roles, accessible
  names, AA contrast.
- Use `argTypes` controls for enums (e.g. status) so reviewers can flip variants.
- For components that render a `<tr>`, wrap in a table decorator so semantics are valid.

## CSF template (Angular)

```ts
import type { Meta, StoryObj } from '@storybook/angular';
import { StatusPillComponent } from './status-pill.component';

const meta: Meta<StatusPillComponent> = {
  title: 'Atoms/StatusPill',
  component: StatusPillComponent,
  tags: ['autodocs'],
  argTypes: {
    status: { control: 'select',
      options: ['SUCCEEDED', 'FAILED', 'RUNNING', 'SUBMITTED', 'CANCELLED'] },
  },
};
export default meta;
type Story = StoryObj<StatusPillComponent>;

export const Succeeded: Story = { args: { status: 'SUCCEEDED' } };
export const Failed: Story = { args: { status: 'FAILED', exitLabel: 'exit 0' } };
export const Running: Story = { args: { status: 'RUNNING' } };
export const Cancelled: Story = { args: { status: 'CANCELLED' } };
```

## Table-row decorator (for `<tr app-run-row>`)

```ts
import { moduleMetadata } from '@storybook/angular';
import { failedViralrecon, cancelledNoData } from './run-row.fixtures';

const meta: Meta<RunRowComponent> = {
  title: 'Molecules/RunRow',
  component: RunRowComponent,
  decorators: [
    (story) => ({
      template: `<table class="runs-table"><tbody>${'${story}'}</tbody></table>`,
    }),
  ],
};
export default meta;
type Story = StoryObj<RunRowComponent>;

export const Failed: Story = { args: { run: failedViralrecon } };
export const FailedSelected: Story = { args: { run: failedViralrecon, selected: true } };
export const Cancelled: Story = { args: { run: cancelledNoData } };
```

(Use the framework's actual story-composition helper for the decorator template;
the point is: render the row inside a real `<table><tbody>`.)

## Interaction / a11y stories

- Add a play function (or document in docs) verifying keyboard: Tab focuses the row,
  Enter/Space emits `select`. Esc behaviour belongs to the drawer, not the row.
- Include a loading **Skeleton** story for components that have a loading state.

## Workflow

Build bottom-up: atom + its stories → molecule + its stories → organism. Run the
a11y addon on each before moving up. Stories are the visual proof of the "States"
and "Accessibility" criteria.