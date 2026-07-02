import { isAiCopilotDemoEligible } from './ai-copilot.utils';

describe('isAiCopilotDemoEligible', () => {
  it('returns false for a null error', () => {
    expect(isAiCopilotDemoEligible(null)).toBe(false);
  });

  it('returns false when the parsed process is not ABACAS', () => {
    expect(isAiCopilotDemoEligible({ process: 'BWA_MEM' })).toBe(false);
  });

  it('returns false when no process was parsed at all', () => {
    expect(isAiCopilotDemoEligible({ cause: 'Some unparsed banner error' })).toBe(false);
  });

  it('returns true for the ABACAS demo scenario', () => {
    expect(isAiCopilotDemoEligible({ process: 'ABACAS', cause: 'Host EC2 instance terminated.' })).toBe(
      true,
    );
  });
});
