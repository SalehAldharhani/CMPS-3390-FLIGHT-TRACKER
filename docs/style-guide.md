# Style Guide / UI Design Document

> **Owner:** JASD3EP. The values below are starting points; replace with the real design system as it lands. Every value must be a CSS variable in the token section at the top of `src/styles/app.css` — do not hardcode hex codes or pixel values further down the file.

## Design direction

The app uses a clean black-and-white theme — white background, near-black text, black accent. This keeps the UI legible and professional, like a printed boarding pass or a modern airport display.

- **Background:** pure white.
- **Surfaces:** light grays for cards and panels — no color tinting.
- **Accent:** near-black (`#111111`) — used on CTAs and active elements.
- **Status colors:** kept functional (green / amber / red / blue) because flight status must be readable at a glance. These are the only non-neutral colors in the palette.

**No gradients. No shadows heavier than a light drop. No decorative color.**

---

## Color tokens

| Token                   | Value                 | Usage                          |
| ----------------------- | --------------------- | ------------------------------ |
| `--color-bg`            | `#ffffff`             | Page background                |
| `--color-bg-elevated`   | `#f5f5f5`             | Cards, panels                  |
| `--color-bg-sunken`     | `#ebebeb`             | Insets, map well               |
| `--color-border`        | `#d0d0d0`             | Default borders                |
| `--color-border-soft`   | `#e8e8e8`             | Subtle dividers                |
| `--color-text`          | `#0a0a0a`             | Primary text                   |
| `--color-text-muted`    | `#555555`             | Secondary text                 |
| `--color-text-faint`    | `#999999`             | Captions, timestamps           |
| `--color-accent`        | `#111111`             | CTAs, active highlights        |
| `--color-accent-soft`   | `rgba(17,17,17,0.08)` | Focus rings                    |
| `--color-accent-text`   | `#ffffff`             | Text on accent (black) buttons |
| `--color-status-ontime` | `#16a34a`             | "En route", "Landed"           |
| `--color-status-delay`  | `#ca8a04`             | "Delayed"                      |
| `--color-status-cancel` | `#dc2626`             | "Cancelled", errors            |
| `--color-status-board`  | `#2563eb`             | "Scheduled", "Boarding"        |

Contrast: every text-on-surface combination should hit ≥ 4.5:1. The white background + near-black text passes comfortably.

---

## Typography

The skeleton uses system fonts as placeholders. **Replace these.**

| Token            | Default (placeholder) | Suggested production fonts                            |
| ---------------- | --------------------- | ----------------------------------------------------- |
| `--font-display` | system-ui             | "Fraunces", "Geist", "Space Grotesk", "Manrope"       |
| `--font-body`    | system-ui             | Same as display, or a refined sans like "Inter Tight" |
| `--font-mono`    | ui-monospace          | "JetBrains Mono", "IBM Plex Mono", "Geist Mono"       |

Mono is used for flight numbers, IATA codes, and timestamps — anything that should _feel_ like a flight board.

### Type scale

| Token       | Size     | Use                             |
| ----------- | -------- | ------------------------------- |
| `--fs-xs`   | 0.75rem  | Eyebrows, captions              |
| `--fs-sm`   | 0.875rem | Body small, helper text         |
| `--fs-base` | 1rem     | Default body                    |
| `--fs-lg`   | 1.125rem | Lede paragraphs                 |
| `--fs-xl`   | 1.5rem   | Card headings                   |
| `--fs-2xl`  | 2.25rem  | Section headings                |
| `--fs-3xl`  | 3.5rem   | Hero titles, big flight numbers |

Weights: regular (400), medium (500), bold (700).

Letter-spacing: tighten display text (`-0.02em`); loosen mono uppercase (`+0.05em`).

---

## Spacing

8px grid (with a 4px half-step) via `--sp-*` tokens. No arbitrary pixel values inside components.

```
--sp-1: 4px      --sp-5: 24px
--sp-2: 8px      --sp-6: 32px
--sp-3: 12px     --sp-8: 48px
--sp-4: 16px     --sp-10: 64px
```

## Radii

```
--radius-sm: 6px      tags, small inputs
--radius-md: 12px     cards, weather panels
--radius-lg: 20px     hero cards, map well
--radius-pill: 999px  buttons, search bar, status badges
```

## Motion

Three durations, two easings. That's it.

| Token           | Value                            | Use                        |
| --------------- | -------------------------------- | -------------------------- |
| `--dur-fast`    | 150ms                            | Hover, focus rings         |
| `--dur-med`     | 300ms                            | Page transitions           |
| `--dur-slow`    | 600ms                            | Progress bars, big reveals |
| `--ease-out`    | `cubic-bezier(0.16, 1, 0.3, 1)`  | Most things                |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Symmetric transitions      |

Reduce motion if `prefers-reduced-motion` is set (TODO in `app.css`).

---

## Component patterns

### Button hierarchy

1. **Primary** — solid accent background, dark text, pill shape. Used at most once per view.
2. **Secondary** — bordered, transparent background. Hover changes border color.
3. **Ghost / link** — text only, accent on hover.

### Status badges

Pill-shaped, uppercase, with letter-spacing. Background is the status color at 18% opacity, text is the full status color.

### Cards

- Elevated background, subtle border, 20px radius.
- 24px padding (`--sp-5`).
- Slight lift on hover (`translateY(-2px)`).
- Status-colored left border on weather cards (3px) communicates impact at a glance.

### Forms

- Pill-shaped input + button container.
- Focus ring is a 4px halo using `--color-accent-soft`.
- Errors live below the field in `--color-status-cancel`.

---

## Layout

- Max content width: 1200px (`--max-content-width`).
- Sticky header height: 64px (`--header-height`).
- App main padding: 32px vertical, 24px horizontal.
- Breakpoint at 640px for collapsing 2-col → 1-col grids.

---

## Accessibility checklist

- [x] All buttons have visible focus states.
- [x] Status is communicated by both color and text.
- [x] Form errors use `aria-invalid` + `aria-describedby` + `role="alert"`.
- [x] Visually-hidden labels exist for icon-only controls (`.sr-only`).
- [ ] `prefers-reduced-motion` honored (TODO).
- [ ] Color contrast audit pass (TODO once final palette is chosen).

---

## What to NOT do

- Do not use Inter, Roboto, Arial, or system fonts in production.
- Do not introduce new colors outside the token section of `app.css`.
- Do not write inline styles in JSX (add styles to `app.css` instead).
- Do not paste hex codes into components.
- Do not stack 4+ shadows on a single element. Pick one.
- Do not use emoji as decorative icons in production (the placeholder ✈ in the header is a TODO).
