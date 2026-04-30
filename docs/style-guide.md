# Style Guide

Black and white theme. Only status colors (green, yellow, red, blue) for flight info.

## Colors

- Background: `--color-bg` (#ffffff)
- Cards/panels: `--color-bg-elevated` (#f5f5f5)
- Main text: `--color-text` (#0a0a0a)
- Secondary text: `--color-text-muted` (#555555)
- Buttons/active: `--color-accent` (#111111)
- On time: `--color-status-ontime` (#16a34a)
- Delayed: `--color-status-delay` (#ca8a04)
- Cancelled: `--color-status-cancel` (#dc2626)
- Boarding/scheduled: `--color-status-board` (#2563eb)

## Fonts

- Use `--font-display`, `--font-body`, `--font-mono` tokens — don't hardcode
- Mono font for flight numbers, codes, and times
- Replace placeholder system fonts before production

## Spacing & Corners

- Use `--sp-*` tokens (8px grid: sp-1=4px, sp-2=8px, sp-4=16px, sp-6=32px...)
- Use `--radius-*` tokens (sm=6px, md=12px, lg=20px, pill=999px)

## Components

- **Buttons:** primary (solid black), secondary (outlined), ghost (text only)
- **Status badges:** pill shape, uppercase, status color background at low opacity
- **Cards:** light bg, border, rounded corners, 24px padding, slight lift on hover
- **Forms:** pill-shaped, focus shows soft halo, errors show in red below field

## Layout

- Max width: 1200px, header: 64px, breaks to 1 column at 640px

## Don'ts

- No hardcoded hex values in components
- No inline styles in JSX — use `app.css`
- No new colors outside the token section in `app.css`
- No gradients, heavy shadows, or decorative colors
