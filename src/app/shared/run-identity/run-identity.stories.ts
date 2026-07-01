import type { Meta, StoryObj } from '@storybook/angular';
import { RunIdentityComponent } from './run-identity.component';

const meta: Meta<RunIdentityComponent> = {
  title: 'Atoms/RunIdentity',
  component: RunIdentityComponent,
  tags: ['autodocs'],
  argTypes: {
    needsAttention: { control: 'boolean' },
  },
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<RunIdentityComponent>;

export const Default: Story = {
  args: {
    name: 'rnaseq_community-showcase_20260622_ccc9e30675f0468',
    pipeline: 'nf-core/rnaseq',
    needsAttention: false,
  },
};

export const NeedsAttention: Story = {
  args: {
    name: 'serene_albattani',
    pipeline: 'nf-core/rnaseq',
    needsAttention: true,
  },
};

export const LongName: Story = {
  args: {
    name: 'viralrecon-illumina_community-showcase_20260626_5816618021e0482-extra-long-run-name-for-truncation',
    pipeline: 'nf-core/viralrecon',
    needsAttention: false,
  },
  parameters: { layout: 'padded' },
  decorators: [() => ({ styles: ['div { max-width: 280px; }'] })],
};
