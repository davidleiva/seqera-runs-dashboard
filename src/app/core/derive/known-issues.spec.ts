import { detectKnownIssue } from './known-issues';

describe('detectKnownIssue', () => {
  it('returns null for null errorMessage — never invents a cause', () => {
    expect(detectKnownIssue(null)).toBeNull();
  });

  it('returns null when no pattern matches', () => {
    expect(detectKnownIssue('Process requirement exceeds available instance size.')).toBeNull();
  });

  it('matches a spot-interruption message', () => {
    const issue = detectKnownIssue('Host EC2 (instance i-0abc) terminated.');
    expect(issue?.cause).toContain('reclaimed');
    expect(issue?.steps.length).toBeGreaterThan(0);
  });

  it('matches an out-of-memory message', () => {
    expect(detectKnownIssue('Process killed — exitStatus 137')).not.toBeNull();
    expect(detectKnownIssue('OOMKilled')).not.toBeNull();
    expect(detectKnownIssue('java.lang.OutOfMemoryError')).not.toBeNull();
  });

  it('matches a disk-space message', () => {
    expect(detectKnownIssue('No space left on device')).not.toBeNull();
  });

  it('matches a signal-termination exit code', () => {
    expect(detectKnownIssue('Command error: exitStatus 143')).not.toBeNull();
  });

  it('returns the same object identity for a given match (pure, no side effects)', () => {
    const a = detectKnownIssue('Host EC2 instance terminated.');
    const b = detectKnownIssue('Host EC2 instance terminated.');
    expect(a).toEqual(b);
  });
});
