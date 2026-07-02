# Spec: `runs-layout` — fixed content nesting (Storybook)

Fixes the "card-in-card" problem: today the summary sits in one zone, then a grey zone
wraps a filter card AND a table card (boxes inside boxes with competing backgrounds). This
defines the corrected container structure as a NEW presentational layout component we can
see in a story before touching `runs-page`.

## ⚠ Non-destructive

- NEW component `src/app/features/runs/runs-layout/` (`app-runs-layout`), presentational,
  content-projection slots. **Do NOT modify `runs-page`** yet. The story composes the
  existing presentational components into it with fixtures.
- Apply skills `seqera-design-tokens`, `angular-architecture`, `storybook-stories`.

## The corrected structure

One page background. Two sibling surfaces (summary card, list panel) separated by
whitespace — never nested, never a grey zone wrapping cards. The filter bar is the list
panel's header, not its own card.

```
.runs-page            (page bg #F8F9FA, horizontal gutter, max-width, vertical gap)
├── header slot       (title "Runs" + subtitle · right: badge / updated / refresh)   [on bg]
├── summary slot      (a single subtle white card — the runs-summary)                 [card]
└── .runs-panel       (ONE white card: border 1px #E4E9EF, radius 4px, overflow hidden)
    ├── .runs-panel__toolbar   → filters slot (filter-bar)   [panel header, divider below]
    └── .runs-panel__body      → table slot (runs-table / states)
```

Template (content projection):

```html
<div class="runs-page">
  <header class="runs-page__header"><ng-content select="[header]"></ng-content></header>
  <section class="runs-page__summary"><ng-content select="[summary]"></ng-content></section>
  <section class="runs-panel">
    <div class="runs-panel__toolbar"><ng-content select="[filters]"></ng-content></div>
    <div class="runs-panel__body"><ng-content select="[table]"></ng-content></div>
  </section>
</div>
```

## Layout rules (SCSS)

- `.runs-page`: `background: #F8F9FA;` horizontal padding = the gutter (e.g. 24px), optional
  `max-width` with auto margins, `display:flex; flex-direction:column; gap: 16–20px`.
- **Gutters consistent**: header, summary card and list panel share the SAME left/right
  edges. No element hangs with dead trailing space. Summary card width == panel width.
- **Summary card** and **`.runs-panel`** are the only two surfaces: white, 1px `#E4E9EF`
  border, radius 4px, subtle shadow. Siblings with whitespace between — NOT nested, NO
  wrapping grey zone.
- **`.runs-panel__toolbar`**: the filter-bar lives here as the panel header, with a
  `border-bottom: 1px #E4E9EF` separating it from the table. It is NOT its own card.
- **`.runs-panel__body`**: holds the table (or loading/empty/error states). The table's
  own header row sits directly under the toolbar divider — no extra padding creating a
  visible inner box.
- Spacing on the 4/8 scale. One background, two cards, clear whitespace rhythm.

## Responsive

- Gutter shrinks on narrow widths; cards go edge-to-edge (smaller side padding).
- The toolbar (filter-bar) wraps its controls; the panel never introduces a nested scroll
  box other than the table's own horizontal overflow on very narrow widths.

## a11y / semantics

- `header` is a real `<header>`; the list panel is a `<section>` with an accessible name
  (e.g. `aria-label="Runs"`). Landmark structure stays clean (no redundant nesting).

## Story

Compose the corrected layout with the existing presentational components + fixtures so the
nesting is visible without the data layer:

- `Default` — header + `runs-summary` (fixture) in the summary slot + `filter-bar` in the
  filters slot + `runs-table` (populated fixture) in the table slot. This is the money shot:
  one bg, two clean cards, filter-bar as panel header, aligned gutters.
- `Loading` — table slot shows skeleton rows (panel + toolbar still visible).
- `Empty` — table slot shows the empty state inside the panel.
- `Narrow` — a viewport/story param at ~700px to verify gutters + wrapping.

Keep `addon-a11y` green (landmarks, headings, contrast). Do not restyle the child
components here — `runs-layout` only owns the container structure, backgrounds, gutters and
the toolbar divider; the children keep their own styles.

---

## Later (not now)

`runs-page` adopts `runs-layout`: projects its header, `<app-runs-summary>`,
`<app-filter-bar>` and `<app-runs-table>` into the slots. The current ad-hoc zones/cards are
then removed. Not part of this task — we just want to SEE the fixed layout in a story first.