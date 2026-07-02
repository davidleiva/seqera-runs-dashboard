export interface AiDemoResponse {
  explanation: string;
  suggestedFix: string;
}

/**
 * Canned response for the ABACAS scenario — makes the AI-copilot concept
 * visible without live inference. Always shown behind the "AI · demo" badge;
 * see `isAiCopilotDemoEligible` for the (narrow, honest) gate and the
 * README's AI-copilot section for the real vision this stands in for.
 */
export const ABACAS_AI_DEMO_RESPONSE: AiDemoResponse = {
  explanation:
    'The ABACAS step failed because the AWS Spot instance running it was reclaimed mid-task, a routine cloud interruption, not a bug in the pipeline or the input data.',
  suggestedFix:
    "Retry the run as-is (Nextflow's resume will skip already-completed work), or add a retry error strategy to this process so future Spot interruptions recover automatically instead of failing the run.",
};
