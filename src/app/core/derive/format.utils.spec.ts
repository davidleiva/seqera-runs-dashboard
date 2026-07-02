import { costFmt, durationFmt, pctFromCounts, shortProcessName } from './format.utils';

describe('durationFmt', () => {
  it('formats ms to minutes and seconds', () => {
    expect(durationFmt(784042)).toBe('13m 4s');
  });

  it('formats short durations under a minute', () => {
    expect(durationFmt(7615)).toBe('8s');
  });

  it('formats exactly 60 seconds', () => {
    expect(durationFmt(60000)).toBe('1m 0s');
  });

  it('formats hours when >= 60 minutes', () => {
    expect(durationFmt(3661000)).toBe('1h 1m');
  });

  it('returns em-dash for null', () => {
    expect(durationFmt(null)).toBe('—');
  });

  it('returns 0s for zero ms', () => {
    expect(durationFmt(0)).toBe('0s');
  });
});

describe('costFmt', () => {
  it('formats cost to 2 decimal places with dollar sign', () => {
    expect(costFmt(0.0281236222)).toBe('$0.03');
  });

  it('formats small cost below 0.01 to 3 decimal places', () => {
    expect(costFmt(0.003021444)).toBe('$0.003');
  });

  it('formats zero cost', () => {
    expect(costFmt(0)).toBe('$0.00');
  });

  it('returns em-dash for null', () => {
    expect(costFmt(null)).toBe('—');
  });
});

describe('pctFromCounts', () => {
  it('calculates percentage correctly', () => {
    expect(pctFromCounts(1, 4)).toBe(25);
  });

  it('returns 0 when total is 0 — no NaN', () => {
    expect(pctFromCounts(0, 0)).toBe(0);
    expect(Number.isNaN(pctFromCounts(0, 0))).toBe(false);
  });

  it('returns 100 when all tasks succeeded', () => {
    expect(pctFromCounts(50, 50)).toBe(100);
  });

  it('handles partial counts', () => {
    expect(pctFromCounts(2, 88)).toBeCloseTo(2.27, 1);
  });
});

describe('shortProcessName', () => {
  it('returns the leaf segment of a colon-qualified process id', () => {
    expect(shortProcessName('NFCORE_VIRALRECON:ILLUMINA:ASSEMBLY_UNICYCLER:UNICYCLER')).toBe(
      'UNICYCLER',
    );
  });

  it('returns the value unchanged when there is no colon', () => {
    expect(shortProcessName('FASTQC')).toBe('FASTQC');
  });
});
