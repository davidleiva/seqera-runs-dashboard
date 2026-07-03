import type { RunError } from '../models/run.model';

/**
 * The AI copilot is a labelled demo ("AI · demo"), not live inference — see
 * `run-drawer`'s ai-demo panel and the README's AI-copilot section. Scoped to
 * runs whose parsed error names the ABACAS process so the concept is visible
 * without generalising a fabricated diagnosis to every failure. Every other
 * run keeps the "Explain with AI" button disabled.
 */
export function isAiCopilotDemoEligible(error: RunError | null): boolean {
  return error?.process === 'ABACAS';
}
