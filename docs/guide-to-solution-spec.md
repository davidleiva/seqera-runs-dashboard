# Spec: guide-to-solution — hints, failed-task callout & AI copilot

Additive layer that helps the user go from "it failed" → understand → fix. Three honest
tiers: deterministic hints (real), real navigational affordances (real), and an AI copilot
(clearly-marked demo/stub + documented vision). Lives in the drawer; small footprint.

## ⚠ Non-destructive & honest

- Additive to the existing `run-drawer` (and Material drawer). No new page/routes.
- **Never fabricate a diagnosis.** Tier 1 is a curated known-issues lookup (domain
  knowledge, framed as heuristic). Tier 3 (AI) is a mock/stub — real inference is a
  documented future step, not claimed as working.
- Apply skills `seqera-design-tokens`, `angular-architecture`, `runs-data-contract`.

---

## Tier 1 — deterministic known-issue hints (ships, real)

A small lookup mapping an error signature → plain-language cause + suggested next steps.
Pure function in `core/derive/known-issues.ts`, tested.

```ts
interface KnownIssue { cause: string; steps: string[]; }

const KNOWN_ISSUES: { match: RegExp; issue: KnownIssue }[] = [
  { match: /Host EC2.*terminated/i, issue: {
      cause: 'The compute instance was reclaimed — typical of AWS spot interruption.',
      steps: ['Retry the run', 'Add a retry error strategy, or use on-demand for this process'] } },
  { match: /OutOfMemory|OOMKilled|exit(?:Status)?\s*137/i, issue: {
      cause: 'The process ran out of memory (killed by the OS).',
      steps: ['Increase the memory allocated to this process', 'Check the memory profile in Metrics'] } },
  { match: /No space left on device/i, issue: {
      cause: 'The work volume ran out of disk space.',
      steps: ['Increase the disk allocation for this process'] } },
  { match: /exit(?:Status)?\s*143/i, issue: {
      cause: 'The process was terminated by a signal (timeout or cancellation).',
      steps: ['Check the time limit / whether the run was cancelled'] } },
];

export function detectKnownIssue(errorMessage: string | null): KnownIssue | null { /* first match, else null */ }
```

- Render in the error card as a **"Suggested next steps"** block, framed as heuristic:
  *"Based on the error, this looks like: {cause}"* + the steps as a short list.
- If no match → render nothing (do NOT invent). The generic "no error message" case stays.
- Not colour-only; it's text. Keep AA contrast.

## Tier 2 — real navigational affordances (ships, real)

In the error card and the failed-task callout, honest actions (no invention):
- **Copy command** — copies `commandLine` (run) or the failed task's `script`.
- **Open work dir** — copies / links the `workDir` (run) or the task's `workdir`.
- **View full log** — reveals the raw `errorMessage` (or the Logs tab).
- **Inspect failed task** — scrolls to / expands the failed-task callout (below).
- **Retry run** — a stub button (no backend); label it so it's clearly a placeholder, or
  omit if it feels misleading. Document as future.

## Tier 3 — AI copilot (mock/stub + documented vision)

The **"Explain error with AI"** button. Vision (README): AI ingests the full log + config
+ task context and returns (1) a plain-language explanation, (2) most likely cause,
(3) a suggested fix (possibly a config diff), (4) doc links — and generalises the
recurring-error insight beyond the curated Tier-1 patterns.

Now, without live inference:
- For the **showcase** ABACAS run, wire a **canned response** clearly labelled
  **"AI · demo"** (a realistic plain-language explanation + suggested fix) so the concept
  is visible. Keep the mock in a fixture, not presented as live.
- For every other run, the button is **disabled / "coming soon"**.
- Never present the mock as real inference; the README states it's a stubbed demo.

Distinction to make clear in copy: Tier 1 = deterministic, curated hints (real); Tier 3 =
what an AI copilot would generalise to (demo).

## Failed-task callout (the tasks concept, minimal)

The failed **task** is the unit of action. In the drawer overview, when a task failed,
show a small **"Failed task" callout** using per-task data from `tasks[]`:
- the failing **process/name**, its **exit** code, and its **workdir**;
- the Tier-2 affordances (Open work dir, Copy command [the task `script`], Explain).
- Source: find the task with `status === 'FAILED'` (or `exit !== 0`) in `tasks[]`.
- **Degrade gracefully**: if the run has no `tasks` (cancelled / early failure edge cases),
  omit the callout — never fabricate a task.

Also make the **red segment of the task-breakdown bar interactive**: clicking it
reveals / scrolls to the failed-task callout. Connects the existing visual to the action.
The segment becomes a `<button>` with an accessible name ("1 failed task — view details").

## Data sources (from runs-data-contract)

- Run-level: `errorMessage` (parse + Tier-1 match), `commandLine`, `workDir`.
- Task-level: `tasks[].{name, process, status, exit, workdir, script, errorMessage}`.
- All optional/nullable — guard everything; the callout and hints only appear when the
  data exists.

## a11y

- Hints and steps are text (AA contrast); affordances are `<button>`s with clear names;
  the clickable bar segment has an accessible label; the disabled AI button uses
  `disabled` + a tooltip, not colour alone. Copy buttons give "Copied!" feedback.

## Stories

- `run-drawer`: **FailedWithKnownIssue** (ABACAS → shows the hint + failed-task callout +
  AI demo), **FailedNoMatch** (a failed run whose error matches no pattern → affordances
  but no invented hint), **FailedNoTasks** (edge case → no callout, no crash).
- Interaction: clicking the red bar segment reveals the callout; Copy shows "Copied!".
- Keep `addon-a11y` green.

## README notes

- Tier 1 = honest curated guidance; Tier 3 = AI copilot **vision**, shipped as a labelled
  demo (not live) — deliberate, to avoid fabricating diagnoses.
- "Retry run" and live AI are future work (need a backend / inference).