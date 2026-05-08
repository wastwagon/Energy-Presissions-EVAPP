# Dashboard UX QA (regression guide)

Run these checks after changes to `theme/`, `layouts/`, or `components/dashboard/`.

## Breakpoints

| Route (example)           | `xs` (375px) | `sm` (600px+) |
| ------------------------- | ------------ | ------------- |
| `/` (logged-in home)      | ☐            | ☐             |
| `/user/...` Charging hub  | ☐            | ☐             |
| Admin dashboard           | ☐            | ☐             |
| Super Admin dashboard     | ☐            | ☐             |
| Operations dashboard      | ☐            | ☐             |
| Operations → Sessions     | ☐            | ☐             |
| Operations → Devices      | ☐            | ☐             |
| Admin / Super reports     | ☐            | ☐             |
| Super Admin analytics     | ☐            | ☐             |

## Behaviors

1. **Initial load**: Dashboards plus staff **Sessions**, **Devices**, **Reports**, and **Analytics** routes show skeleton placeholders (not a blank flash or lone full-page spinner).
2. **Fixed header + scroll**: Content does not sit under the app bar; first focusable content is reachable.
3. **Bottom nav**: Bar stays docked at the bottom; scroll is confined to the main column (not the whole window).
4. **KPI tiles**: Tappable admin/super-admin cards respond to Enter/Space; ops stat tiles are non-interactive.
5. **Reduced motion**: Enable “Reduce motion” in OS settings — transitions should be negligible.

## Automated / future

- Add Playwright or Chromatic snapshots for the routes above at `xs` and `sm` when a visual pipeline is introduced.
