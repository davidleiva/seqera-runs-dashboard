# Spec: `run-row` / `runs-table` refinement v2

Targeted polish of the EXISTING row + table components (not a new component). These are
intentional edits to `run-row` and `runs-table`. Apply skills `seqera-design-tokens`,
`angular-architecture`, `storybook-stories`.

## How to keep v1 safe

This modifies existing components, so preserve v1 via git rather than duplicate files:
work on a branch/worktree (`feat/row-refinement-v2`) so the current version stays in
history and you can compare. Update the existing stories to reflect the changes; keep the
edge-case stories (cancelled, failed-no-message, long-name).

---

## Changes

### 1. Remove the exit code from the status pill
- The pill shows only the status word ("Failed", "Succeeded", …). **Drop `· exit N`.**
- Reason: exit code is technical detail for the glance, and produces the confusing
  "Failed · exit 0" contradiction. It belongs in the **drawer** metadata, not the row.

### 2. Replace the "Needs attention" text pill with a consistent minimal marker
- Remove the amber text pill. Add a small **attention marker** (amber `#B45309` warning
  glyph / dot) next to the status, using the ONE attention token used elsewhere (bar hatch).
- **Only on non-failed attention runs** (SUCCEEDED-with-issues, retries, low efficiency).
  On FAILED rows the red status already signals attention — no marker.
- **Tooltip explains why**: e.g. "Succeeded, but 1 task failed · 1 retry". This needs the
  row to know the reason(s): add `attentionReasons?: string[]` (or a prebuilt
  `attentionLabel`) to the VM, populated by the adapter. Keep the component dumb — it just
  renders the reason it's given.
- Marker is decorative + has an accessible label (title/aria), never colour-only.

### 3. Alignment
- **Vertical-center every cell** to the row (the Run cell is two lines: title + subtitle).
- **Right-align numeric columns** — Cost and Retries — with `font-variant-numeric:
  tabular-nums`, so magnitudes line up for comparison. Duration stays left but tabular.
  Text columns (Run, User, Executor) left-aligned. Headers align with their cells.
- Reason: text left / numbers right + tabular is the standard for scannable data tables.

### 4. Tasks bar — make it explainable
- Add a **tooltip on the whole bar**: "47 succeeded · 1 failed · 2 aborted of 50" (running
  runs include the running count). One tooltip on the bar, not per-segment (cleaner + a11y).
- The trailing number is the **total task count**; keep it, it reads as the total.
- Give the bar an `aria-label` with the same breakdown text (not colour-only).
- Empty/`null` → "No task data" (unchanged).

### 5. User avatar
- Either: keep a small initial avatar with a **deterministic per-user colour** (same user →
  same colour, so runs group visually by owner), OR drop the avatar and show the username
  text only. Pick one. **Do not** use a random/unique colour per row — that adds noise
  without the scanning benefit.

### 6. Sortable columns (expand)
- Make sortable: **Run** (alphabetical), **User**, **Submitted**, **Duration**, **Cost**,
  **Retries**, and **Status** (by risk rank). Each supports a real question: slowest
  (Duration), priciest (Cost), most unstable (Retries), mine (User), find one (Run).
- Leave **Executor** and **Tasks** non-sortable (low value / ambiguous key).
- Default sort stays **risk** desc. Headers carry `aria-sort`; clicking cycles asc/desc.

### 7. Interactivity — one primary target per row
- Interactive: the **whole row** (click/Enter → open drawer) and the **sort headers**. Only.
- Display-only (NOT clickable): status pill, attention marker, avatar, tasks bar, retries,
  executor. Filtering happens from the summary/filter-bar, not from cells.
- Reason: nested click targets inside a clickable row create ambiguous hit areas and a11y
  problems. Keep one clear action per row.

---

## Stories to update / add

- Update `run-row` stories so the pill has no exit code and attention shows as the marker
  (with tooltip) only on the non-failed attention fixtures.
- `runs-table`: add/verify sort stories for the new sortable columns (e.g. **SortByDuration**,
  **SortByRetries**), and a story showing right-aligned numeric columns.
- Keep all existing edge-case stories. `addon-a11y` green throughout (marker label, bar
  aria-label, header `aria-sort`, contrast).

## Adapter note

Populate `attentionReasons` (or `attentionLabel`) in `toRunVM` from the same signals that
set `needsAttention` (failed task count, retries, low efficiency), so the row tooltip has a
concrete reason to show.