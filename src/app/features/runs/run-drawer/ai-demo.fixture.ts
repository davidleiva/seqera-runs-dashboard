export interface AiDemoResponse {
  /** The plain-language "why" only — never repeats the hint's imperative steps. */
  explanation: string;
}

/**
 * Canned response for the ABACAS scenario — makes the AI-copilot concept
 * visible without live inference. Always shown behind the "AI · demo" badge;
 * see `isAiCopilotDemoEligible` for the (narrow, honest) gate and the
 * README's AI-copilot section for the real vision this stands in for.
 *
 * Deliberately says nothing about what to do — "Retry the run" / "add a retry
 * strategy" already live in the deterministic hint (`known-issues.ts`). The
 * hint answers "what do I do"; this answers "why did it happen", so the two
 * never compete for the same job.
 */
export const ABACAS_AI_DEMO_RESPONSE: AiDemoResponse = {
  explanation:
    'This happened because the AWS Spot instance running the ABACAS step was reclaimed by AWS mid-task — a routine cloud interruption, not a bug in the pipeline or in your input data. The process itself never got the chance to run. Worth knowing: Nextflow tracks completed work by hash, so resuming (-resume) picks up right where this one left off instead of redoing everything from scratch.',
};
