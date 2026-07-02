import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y } from 'axe-playwright';

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    // Angular CDK's focus-trap wraps trapped regions (e.g. the RunDrawer) in two
    // anchor <div>s that are BOTH `aria-hidden="true"` AND `tabindex="0"` — by
    // design, they catch Tab at the region's edges to bounce focus back inside.
    // axe's `aria-hidden-focus` rule flags them as "focusable element inside an
    // aria-hidden subtree", which is a false positive: they hold no content and
    // exist solely to steer focus. We exclude only these specific CDK nodes from
    // the scanned node set — the rule itself stays enabled everywhere else.
    await checkA11y(
      page,
      { include: ['#storybook-root'], exclude: ['.cdk-focus-trap-anchor'] },
      {
        detailedReport: true,
        detailedReportOptions: { html: true },
      },
    );
  },
};
export default config;