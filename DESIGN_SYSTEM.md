# OMEGA FUELS — Design System

## Design Direction
**Professional operational software + clean financial dashboard + industrial utility.**

Priorities: speed, clarity, mobile usability, data readability and consistency.

## Strict UI Rules
- No emojis anywhere in production UI.
- Use one consistent SVG icon library such as Lucide (`lucide-react`).
- Icons communicate function; they are not decoration.
- No unnecessary animation or animated backgrounds.
- Avoid excessive gradients and glassmorphism.
- Avoid oversized rounded cards everywhere.
- Use semantic status colors plus text/icon, not color alone.

## Color System Tokens
### Brand / Primary
`--color-primary`: `#2563EB` (Blue 600)
`--color-primary-hover`: `#1D4ED8` (Blue 700)
`--color-primary-light`: `#DBEAFE` (Blue 100)
`--color-primary-foreground`: `#FFFFFF`

### Light Mode
`--bg-canvas`: `#F6F7FB`
`--bg-surface`: `#FFFFFF`
`--bg-surface-subtle`: `#F1F3F8`
`--border-subtle`: `#E5E7EB`
`--text-primary`: `#18181B`
`--text-secondary`: `#6B7280`
`--text-muted`: `#9CA3AF`

### Dark Mode
`--bg-canvas`: `#0F172A`
`--bg-surface`: `#111827`
`--bg-surface-subtle`: `#1F2937`
`--border-subtle`: `#273449`
`--text-primary`: `#F8FAFC`
`--text-secondary`: `#94A3B8`
`--text-muted`: `#64748B`

### Status Tokens
- Success: Green (`#16A34A` / bg `#DCFCE7` / dark bg `#14532D`)
- Warning: Amber (`#D97706` / bg `#FEF3C7` / dark bg `#78350F`)
- Danger: Red (`#DC2626` / bg `#FEE2E2` / dark bg `#7F1D1D`)
- Info: Blue (`#2563EB` / bg `#DBEAFE` / dark bg `#1E3A8A`)

## Typography
Clean Sans-Serif font stack: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`.
- Page heading: 24–32px, font-weight 700
- Section heading: 18–22px, font-weight 600
- Large metric: 28–36px, font-weight 700
- Card title: 14–16px, font-weight 600
- Body text: 14–16px, font-weight 400
- Metadata / Label: 12–13px, font-weight 500

## Spacing & Radius
Spacing scale: `4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px`.
Radius scale:
- Small / Controls: `8px - 10px`
- Medium / Cards: `12px - 14px`
- Large / Modals: `16px - 20px`

## Touch Target & Accessibility
- Minimum touch target: 44px on mobile devices.
- Clear numeric input formats for currency and litres.
- High contrast compliant color tokens for both themes.
