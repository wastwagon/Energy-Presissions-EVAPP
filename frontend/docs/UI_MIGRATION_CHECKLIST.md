# UI migration checklist (mobile-first / iOS-native)

Use when touching a screen after the design-system rollout.

## Tokens & theme

- [ ] Colors/spacing/radius come from MUI `theme` or `theme/iosMobileTokens.ts` / `theme/jampackShell.ts` — no stray hex for page surfaces.
- [ ] Primary actions and icon targets meet **44×44px** minimum on `xs`.
- [ ] Layout uses **safe-area** where fixed bars exist (`env(safe-area-inset-*)`).

## Navigation

- [ ] Primary nav matches role (bottom bar / drawer / header) and has an accessible name.
- [ ] Current route is exposed (`aria-current="page"` where applicable).

## Content

- [ ] Page title is an `h1` (e.g. `LivePageHeader` or `Typography component="h1"`).
- [ ] Loading / empty / error states are present and announced where needed (`role="status"` / `aria-live`).

## Responsive

- [ ] `xs` layout is the default; `sm`/`md` enhance without horizontal overflow.
- [ ] Wide tables use `TableContainer` + horizontal scroll.

## Motion & a11y

- [ ] Meaningful motion respects `prefers-reduced-motion` (global baseline in `theme.ts` `MuiCssBaseline`).
- [ ] Focus visible outline is visible for keyboard users (`Button` / `IconButton` overrides).

## Verification (manual)

- [ ] iPhone-class width (375–430px) smoke test in browser or WebViewGold.
- [ ] Landmarks: skip link → main content (`#main-content` / `APP_MAIN_CONTENT_ID`).
