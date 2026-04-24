# Design Tokens

Source of truth for visual design. Mirrored in `app/globals.css` as CSS custom
properties and exposed to Tailwind v4 via `@theme`.

## Typography

- `--font-sans`: `"Geist", system-ui, sans-serif`
- `--font-mono`: `"Geist Mono", ui-monospace, monospace`
- Type scale (px): 12 / 14 / 16 / 18 / 24 / 32 / 48 / 64
- Geist only. No Inter, Roboto, or Google Fonts fallbacks.

## Color

### Light (default)

| Token       | Value      |
| ----------- | ---------- |
| `--bg`      | `#FAFAFA`  |
| `--fg`      | `#0F0F0F`  |
| `--muted`   | `#6B6B6B`  |
| `--border`  | `#E5E5E5`  |
| `--accent`  | `#FF5C00`  |
| `--accent-fg` | `#FFFFFF` |

### Dark (`prefers-color-scheme: dark`)

| Token       | Value      |
| ----------- | ---------- |
| `--bg`      | `#0A0A0A`  |
| `--fg`      | `#F5F5F5`  |
| `--muted`   | `#888888`  |
| `--border`  | `#1F1F1F`  |
| `--accent`  | `#FF5C00`  |
| `--accent-fg` | `#0A0A0A` |

WCAG AA verified: `#0F0F0F` on `#FAFAFA` = 18.7:1.

## Spacing

Scale (px): 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96. Max content width: 720px.

## Radius

- `4px` — chips
- `6px` — inputs, cards
- `8px` — buttons, input-zone

## Motion

- `150ms ease-out` — UI micro-interactions (hover, chip toggle)
- `300ms ease-out` — layout transitions (card fade-in stagger)
- Respect `prefers-reduced-motion`.

## Focus

2px outline in `var(--accent)` with 2px offset. Use `:focus-visible` only.

## Touch targets

Minimum 44px on mobile (`<768px`).
