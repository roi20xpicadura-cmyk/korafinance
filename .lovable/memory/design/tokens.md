---
name: Design Tokens
description: Premium fintech design system — Geist fonts, warm whites, shadow-based cards, dark hero card
type: design
---

## Fonts
- Display/body: Geist (loaded from Google Fonts)
- Numbers/mono: Geist Mono
- Never use Inter, Roboto, or system defaults as primary

## Color Philosophy
- Warm white bg (#F7F8F6), near-black text (#0D1412)
- Green used sparingly — only for primary actions and success states
- Cards use box-shadow (not thick borders) for depth
- Dark mode: deep green-blacks (#0C0F0D, #131815)

## Key Utilities
- `.metric-value` — mono font, tabular nums, -0.02em tracking
- `.metric-hero` — 38px, 800 weight, -0.04em tracking
- `.label-upper` — 11px, 600 weight, 0.08em tracking, uppercase
- `.section-title` — 16px, 700 weight, -0.01em tracking
- `.card-surface` — bg-surface, radius-lg, shadow-sm, overflow-hidden
- `.btn-primary` — green bg, green shadow, scale(0.97) on active
- `.btn-ghost` — transparent, sunken bg on hover

## Charts
- No CartesianGrid — clean axes only
- Gradient area fills, not solid
- Premium tooltip with card styling (rounded, shadow-md)
- Axis: 11px, color-text-subtle, no axis/tick lines
