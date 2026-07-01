import type { Meta, StoryObj } from '@storybook/angular';
import { RunIdentityComponent } from './run-identity.component';

const meta: Meta<RunIdentityComponent> = {
  title: 'Atoms/RunIdentity',
  component: RunIdentityComponent,
  tags: ['autodocs'],
  argTypes: {
    attentionLabel: { control: 'text' },
  },
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<RunIdentityComponent>;

export const Default: Story = {
  args: {
    name: 'rnaseq_community-showcase_20260622_ccc9e30675f0468',
    pipeline: 'nf-core/rnaseq',
    attentionLabel: null,
  },
};

export const NeedsAttention: Story = {
  args: {
    name: 'serene_albattani',
    pipeline: 'nf-core/rnaseq',
    attentionLabel: 'Succeeded, but 1 task failed · 1 retry',
  },
};

export const LongName: Story = {
  args: {
    name: 'viralrecon-illumina_community-showcase_20260626_5816618021e0482-extra-long-run-name-for-truncation',
    pipeline: 'nf-core/viralrecon',
    attentionLabel: null,
  },
  parameters: { layout: 'padded' },
  decorators: [() => ({ styles: ['div { max-width: 280px; }'] })],
};
