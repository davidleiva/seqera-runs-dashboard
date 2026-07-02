---
name: seqera-design-tokens
description: Seqera UI design tokens and accessibility rules for colour, typography, spacing and the Angular Material theme. Use when building or styling any component, choosing a colour, or checking contrast.
---

# Seqera design tokens & a11y rules

Tokens taken from the real Seqera Platform build. Apply these on every component.
Define them as CSS custom properties in `src/styles/_tokens.scss` and reference the
variables — never hard-code raw hex in components.

## Colour

**Brand / primary**
- `--c-primary: #4256E7;` (indigo). White text on it = AA OK. Use for selected
  states, links, focus rings, primary actions.
- The Seqera logo green is fine in the logo only — do NOT use it for interactive state.

**Surfaces**
- `--c-bg: #F8F9FA;` page background · `--c-surface: #FFFFFF;` cards
- `--c-border: #E4E9EF;` · `--c-text: #0B1F33;` · `--c-text-muted: #6B7A8C;`

**Status — CRITICAL a11y rule.** The Bootstrap semantics fail AA as small text on
white. Use the **fill/border** version for chips/bars/icons and the **darkened text**
version for any small text or label. Always pair status with an **icon + text label**,
never colour alone.

| Status    | Fill (bg/bar/icon) | Text on white (AA)         | Soft bg / border      |
|-----------|--------------------|----------------------------|-----------------------|
| Success   | `#198754`          | `--c-ok-text: #15803D`     | `#E9F7EE` / `#BCE6C8` |
| Failed    | `#DC3545`          | `--c-fail-text: #B91C1C`   | `#FDEBEB` / `#F3C7C7` |
| Running   | `#2563EB`          | `--c-run-text: #1D4ED8`    | `#E9F0FE` / `#C5D8FB` |
| Attention | `#D97706`          | `--c-warn-text: #B45309`   | `#FEF4E6` / `#F3DCB0` |
| Cancelled | `#64748B`          | `--c-cancel-text: #475569` | `#EEF1F5` / `#DBE1E9` |

- **Never** use `#FFC107` (Bootstrap warning) as text — contrast ~1.6:1. Use `#B45309`.
- Cost/metrics accent: `--c-accent-violet: #8B5CF6` (bars only, with value as text).
- Target **WCAG AA**: >=4.5:1 for normal text, >=3:1 for large/UI. Focus ring uses
  `--c-primary` at >=3:1 against its background.

## Typography

- Sans: **Inter Variable** (`@fontsource-variable/inter`). Mono: **JetBrains Mono
  Variable** (`@fontsource-variable/jetbrains-mono`). Icons: **Material Icons**
  (`material-icons`). Self-host all three; do not call Google Fonts.
- Root 16px. Body `0.9rem` (14.4px). Secondary/caption `0.8rem` (12.8px) — floor for
  meaningful text; never smaller. Headings: h1 1.8rem, h2 1.575rem, h3 1.35rem,
  h4 1.125rem, h5 1rem. Line-height 1.4–1.5 body, 1.2 headings.
- **Always** apply `font-variant-numeric: tabular-nums` to durations, costs, counts,
  task numbers and any tabular figure, so they align and don't jitter on update.

## Spacing, radius, elevation

- 4 / 8px spacing scale. Gaps and paddings are multiples of 4.
- `--radius: 4px` (matches Material/Seqera). Pills can use a larger radius.
- Borders: 1px solid `--c-border`. Prefer borders + subtle shadow over heavy elevation.

## Angular Material theme

- `ng add @angular/material` -> custom theme. Override the M3 theme so primary maps to
  `#4256E7`, the font is Inter, density is comfortable. Keep Material's accessible
  primitives (mat-table, mat-sidenav/drawer, mat-form-field, mat-chips, mat-paginator,
  mat-menu) but restyle to these tokens via the `--mat-*` variables / `mat.theme`.
- Status colours are app tokens, not Material palettes — apply via the table above.