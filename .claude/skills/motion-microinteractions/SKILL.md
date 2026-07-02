---
name: motion-microinteractions
description: Motion system and microinteraction rules for the dashboard — timing tokens, list/route transitions, KPI count-ups and reduced-motion. Use when adding any animation, transition or microinteraction.
---

# Motion & microinteractions

Goal: a polished, "shipping product" feel — without gimmicks. Motion must
**communicate state change, not decorate**. When in doubt, don't animate.

## Principles

- Animate only meaningful changes: filter → reorder, select → drawer,
  loading → loaded, value update.
- Short and consistent: **120–250ms**, ease-out for enters, ease-in for exits.
  Reuse one timing/easing scale everywhere (consistency reads as "designed").
- **Respect `prefers-reduced-motion: reduce`** everywhere — disable/disolve
  transforms, keep instant state changes. This is also an accessibility win.
- No parallax, no bouncy springs on everything, no long durations, no animating
  on every render.

## Tokens (`src/styles/_motion.scss`)

```scss
:root {
  --motion-fast: 120ms;
  --motion-base: 180ms;
  --motion-slow: 240ms;
  --ease-out: cubic-bezier(.2, .8, .2, 1);
  --ease-in:  cubic-bezier(.4, 0, 1, 1);
}
@media (prefers-reduced-motion: reduce) {
  :root { --motion-fast: 0ms; --motion-base: 0ms; --motion-slow: 0ms; }
  * { animation: none !important; transition: none !important; }
}
```

## Stack (on top of Angular Material)

1. **`@formkit/auto-animate`** — highest ROI. Apply to the runs list container so
   rows animate on filter/sort/reorder/remove. One directive, near-zero code.
   Guard with reduced-motion (auto-animate respects it, but verify).
2. **Native View Transitions API** via Angular router `withViewTransitions()` — use
   for `/sample` ↔ `/showcase` and ideally a shared-element feel when opening the
   drawer from the selected row.
3. **Motion One (`motion`)** — only for `/showcase` KPI cards: a subtle **count-up**
   of the number and a **draw-in** of the sparkline on load. Fine springs, no bounce.

## Specific microinteractions

- **Drawer**: slide-in from right (`transform: translateX`), `--motion-base`,
  ease-out; Esc closes; focus moves into the drawer on open and returns to the
  triggering row on close.
- **KPI card**: hover lift (1–2px) + shadow; selected ring; press feedback.
- **Status `Running`**: subtle pulse on the dot only (not the whole row).
- **Copy button** (error/command): swap icon to a check + "Copied!" for ~1.2s.
- **Skeleton**: shimmer gradient for loading rows (not a centered spinner).
- **Live demo only** (`/showcase`): the running run's progress bar advances and the
  "Updated Xs ago" label refreshes — clearly a demo, never in `/sample`.
- **Rows / KPIs / tabs**: clear `:focus-visible` rings using `--c-primary`.

Keep everything subtle. Two flawless transitions beat ten effects.