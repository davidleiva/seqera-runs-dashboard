import type { KpiTone } from './kpi-card.component';

export interface KpiCardFixture {
  label: string;
  value: string;
  sub: string;
  tone: KpiTone;
  interactive: boolean;
  pressed: boolean;
  badge: boolean;
}

export const totalRunsCard: KpiCardFixture = {
  label: 'Total runs',
  value: '7',
  sub: 'Sample dataset',
  tone: 'neutral',
  interactive: false,
  pressed: false,
  badge: false,
};

export const succeededCard: KpiCardFixture = {
  label: 'Succeeded',
  value: '4',
  sub: '57% of runs',
  tone: 'ok',
  interactive: true,
  pressed: false,
  badge: false,
};

export const failedCard: KpiCardFixture = {
  label: 'Failed',
  value: '2',
  sub: '29% of runs',
  tone: 'fail',
  interactive: true,
  pressed: true,
  badge: false,
};

export const runningCard: KpiCardFixture = {
  label: 'Running',
  value: '1',
  sub: 'Live now',
  tone: 'run',
  interactive: true,
  pressed: false,
  badge: false,
};

export const attentionCard: KpiCardFixture = {
  label: 'Needs attention',
  value: '3',
  sub: 'Retries · failed tasks',
  tone: 'attention',
  interactive: false,
  pressed: false,
  badge: true,
};

export const costCard: KpiCardFixture = {
  label: 'Total cost',
  value: '$0.13',
  sub: 'Completed runs',
  tone: 'cost',
  interactive: false,
  pressed: false,
  badge: false,
};
