export interface KnownIssue {
  cause: string;
  steps: string[];
}

interface KnownIssuePattern {
  match: RegExp;
  issue: KnownIssue;
}

// Curated, deterministic — not inference. Order matters: first match wins.
const KNOWN_ISSUES: readonly KnownIssuePattern[] = [
  {
    match: /Host EC2.*terminated/i,
    issue: {
      cause: 'The compute instance was reclaimed (typical of an AWS spot interruption).',
      steps: ['Retry the run', 'Add a retry error strategy, or use on-demand for this process'],
    },
  },
  {
    match: /OutOfMemory|OOMKilled|exit(?:Status)?\s*137/i,
    issue: {
      cause: 'The process ran out of memory (killed by the OS).',
      steps: ['Increase the memory allocated to this process', 'Check the memory profile in Metrics'],
    },
  },
  {
    match: /No space left on device/i,
    issue: {
      cause: 'The work volume ran out of disk space.',
      steps: ['Increase the disk allocation for this process'],
    },
  },
  {
    match: /exit(?:Status)?\s*143/i,
    issue: {
      cause: 'The process was terminated by a signal (timeout or cancellation).',
      steps: ['Check the time limit / whether the run was cancelled'],
    },
  },
];

/**
 * A small, honest lookup — never a diagnosis invented from nothing. Returns the
 * first pattern that matches the raw error text, or `null` when nothing matches;
 * callers must not fabricate a cause in that case.
 */
export function detectKnownIssue(errorMessage: string | null): KnownIssue | null {
  if (!errorMessage) return null;
  return KNOWN_ISSUES.find(({ match }) => match.test(errorMessage))?.issue ?? null;
}
