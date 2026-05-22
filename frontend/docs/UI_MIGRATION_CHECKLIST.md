# UI migration checklist (mobile-first / iOS-native)

Use when touching a screen after the design-system rollout.

## Tokens & theme

- [x] Colors/spacing/radius come from MUI `theme` or `theme/iosMobileTokens.ts` / `theme/jampackShell.ts` — no stray hex for page surfaces.
- [x] Primary actions and icon targets meet **44×44px** minimum on `xs` (`IOS_TOUCH_TARGET_PX`, `premiumIconButtonTouchSx`, compact CTAs).
- [x] Layout uses **safe-area** where fixed bars exist (`env(safe-area-inset-*)`).

## Navigation

- [x] Primary nav matches role (bottom bar / drawer / header) and has an accessible name.
- [x] Current route is exposed (`aria-current="page"` where applicable).

## Content

- [x] Page title is an `h1` (e.g. `LivePageHeader` or `Typography component="h1"`).
- [x] Loading / empty / error states are present and announced where needed (`role="status"` / `aria-live`).

## Responsive

- [x] `xs` layout is the default; `sm`/`md` enhance without horizontal overflow.
- [x] Wide tables use `TableContainer` + horizontal scroll.

## Motion & a11y

- [x] Meaningful motion respects `prefers-reduced-motion` (global baseline in `createAppTheme` `MuiCssBaseline`; sheets use non-swipe `Drawer` when reduced).
- [x] Focus visible outline is visible for keyboard users (`Button` / `IconButton` overrides).

## iOS-native patterns (customer)

- [x] Lists use `GroupedListSection` / `GroupedListRow` on `xs`–`md`; tables at `lg+` where needed.
- [x] Page headers use `LivePageHeader` with `titleVariant="large"` on primary customer screens (including `/stations`).
- [x] Modals on mobile use `AdaptiveSheet` (bottom sheet) instead of centered `Dialog`.
- [x] Destructive list actions: `SwipeableGroupedListRow` on mobile where appropriate.
- [x] Pull-to-refresh: page registers `useCustomerPullRefresh` in customer layout scroll region.
- [x] Large title scroll: `LivePageHeader` `titleVariant="large"` registers compact AppBar title on mobile.
- [x] Detail screens use `GroupedDetailRow` on mobile (`CustomerTransactionDetailPage`, `StationDetailPage`, etc.).
- [x] Shared surfaces (`premiumPanelCardSx`, `premiumEmptyStatePaperSx`, `premiumInteractiveCardSx`) use theme tokens (light shell only).

## Phase 13 — leftovers & map sheet

- [x] `/support` (`SupportPage`) — `authPageBodySx` / `authPageLinkSx` parity with Terms & Privacy.
- [x] Login — `LegalAuthNotice` with `includeAppleDisclosure` below Sign in with Apple.
- [x] Stations map bottom sheet on `xs` — `StationSheetListItem` grouped rows; `sm+` keeps premium cards.
- [x] In-app Help — FAQ haptics + SF body typography on answers.

## Premium polish (Phase 12)

- [x] `authPageBodySx`, `authPageLinkSx`, `authDividerSx`, `sheetTitleTypographySx` — SF system stack on auth/legal/sheet copy.
- [x] `premiumInteractiveCardSx` — station list cards (theme borders, press feedback, reduced-motion safe).
- [x] `AdaptiveSheet` — frosted sheet, `usePrefersReducedMotion` → static bottom `Drawer`; timed transitions otherwise.
- [x] Sheet body copy uses `authPageBodySx` (not raw `DialogContentText`).
- [x] Station card CTAs: haptics + theme-aware `premiumInteractiveCardSx`.

## Safe mobile polish (2026-05)

- [x] Form inputs use **16px** on `xs` (`authFormFieldSx`) to avoid iOS zoom.
- [x] Customer AppBar **back** via `useCustomerNavBack` on detail routes; menu hidden while back is active.
- [x] Mobile lists use **Load more** (`MobileListLoadMore`) instead of `Pagination` below `md`.
- [x] **Pull-to-refresh** hides duplicate header Refresh button on mobile when a handler is registered.
- [x] App bar menu rows use `premiumMenuItemSx` (44px).
- [x] Stations sheet: single scroll owner on `xs` (no nested list scroll).
- [x] Profile compact header row; Help FAQ 44px tap rows.
- [x] `apple-mobile-web-app-capable` + `apple-touch-icon` in `index.html`.

## Safe mobile polish — phase 2 (2026-05)

- [x] SuperAdmin app bar menu rows use `premiumMenuItemSx` (44px).
- [x] Staff drawer `MenuItem` rows use `iosGroupedListRowSx`; hover slide only on fine pointers.
- [x] `GroupedExpandableRow` for Help FAQ (replaces MUI Accordion).
- [x] Wallet mobile list: `MobileListLoadMore` for ledger history.
- [x] Top-up screen: `useCustomerNavBack` → wallet.
- [x] Transaction detail: hide redundant “Back to history” row when AppBar back is shown (`md` down).

## Safe mobile polish — phase 3 (2026-05)

- [x] Bottom tab bar hidden while `navBack` is active (stack-style detail screens).
- [x] Theme-wide `MuiOutlinedInput` uses 16px text on `xs` (iOS zoom guard for fields without `authFormFieldSx`).
- [x] Wallet desktop table: `Pagination` for ledger pages (`md+`).
- [x] Admin user search: full-width field with `authFormFieldSx` (no `size="small"`).
- [x] Customer app drawer list hover limited to fine pointers.

## Safe mobile polish — phase 4 (2026-05)

- [x] `staffFilterFieldSx` / `staffFilterFormControlSx` for admin/ops/superadmin search and filter inputs (no `size="small"` zoom trap).
- [x] Staff filter fields applied across payments, users, wallets, devices, connection logs, reservations, local auth, smart charging.

## Safe mobile polish — phase 5 (2026-05)

- [x] Ops/admin/superadmin **Sessions** list: `MobileListLoadMore` on mobile + `Pagination` on desktop for “All sessions” tab (20 per page).
- [x] WebViewGold haptics setup notes: `frontend/docs/WEBVIEW_HAPTICS.md`.

## Safe mobile polish — phase 6 (2026-05)

- [x] **Admin payments** — grouped list + load more / desktop pagination.
- [x] **Connection logs** — grouped list + load more / desktop pagination.
- [x] **Users, vendors, wallets, devices, reservations, security logs** — grouped lists below `md`.
- [x] **Wallet admin** — transaction load more + desktop pagination per selected user.
- [x] **Billing invoices** tab — grouped list on mobile.
- [x] **SuperAdmin settings** — inline edit fields without `size="small"` (16px on `xs`).

## Safe mobile polish — phase 7 (2026-05)

- [x] **Customer stack push** — `CustomerStackTransition` animates detail routes when `navBack` is active (`MainLayout` + `CustomerDashboardLayout`).
- [x] **Billing** — invoices and sessions tabs: load more on mobile, pagination on desktop (20 per page).
- [x] **Ops dashboard** — charge points grouped list on mobile.
- [x] **Devices** — recent errors tab grouped list on mobile.

## Safe mobile polish — phase 8 (2026-05)

- [x] **Charge point detail** — connectors, active sessions, firmware/diagnostics jobs as grouped lists on mobile; firmware form fields without `size="small"`.
- [x] **Transaction detail (ops)** — meter values grouped list on mobile.
- [x] **Admin tariffs** — grouped list on mobile (tap row → edit dialog).
- [x] **Stations map sheet** — tap drag handle cycles peek / half / full height on `xs` (superseded: list-first layout with map below cards).

## Safe mobile polish — phase 9 (2026-05)

- [x] **`SettingsCategoryPanel`** — reusable grouped settings list + inline edit panel on mobile; desktop table unchanged.
- [x] **SuperAdmin settings** — OCPP, notification, and Paystack tabs use `SettingsCategoryPanel`; tariffs tab grouped list on mobile (tap → edit dialog).
- [x] **Devices connection logs dialog** — grouped event rows on mobile instead of wide table.

## Optional polish — phase 10 (2026-05)

- [x] **Customer stack pop** — `CustomerStackTransition` slides parent in from the left on history `POP` (push-in on forward unchanged).
- [x] **Stations map sheet drag** — pointer drag on sheet handle resizes list; release snaps to peek / half / full (tap still cycles).
- [x] **Staff ops detail AppBar back** — `useStaffNavBack` on charge point + transaction detail; inline Back hidden below `md`.

## Staff dashboards — Apple chrome & tables (2026-05)

See rollout plan: [`STAFF_DASHBOARD_UI_PLAN.md`](./STAFF_DASHBOARD_UI_PLAN.md).

- [x] **Staff frosted AppBar** — `staffFrostedAppBarSx` on admin + superadmin layouts.
- [x] **Staff home large title** — `StaffDashboardHomeView` uses `titleVariant="large"` + mobile Refresh.
- [x] **Devices desktop table** — 5 columns (device, connection, OCPP, location, actions); shared `DevicesPage`.
- [x] **Users desktop table** — consolidated user + account columns.
- [x] **Payments / vendors / connection logs desktop tables** — consolidated columns on `md+`.
- [x] **Vendor settings grouped layout** — iOS section cards + `LivePageHeader`.
- [x] **Staff large-title AppBar scroll** — `StaffPageChrome` + compact title in `StaffToolbarLeading`.
- [x] **Staff pull-to-refresh** — `StaffScrollProviders` on admin / superadmin layouts.

## Stations page — list-first layout (2026-05)

- [x] **List before map** — search + station cards first; map section below for spatial context (Uber/Bolt-style).
- [x] **Desktop customer nav** — menu shortcut cards below AppBar (`lg+`), not inline header tabs.
- [x] **Stations a11y** — labeled search form, live result announcements, semantic station list, map show/hide with `aria-expanded`, selected card state, keyboard map hint.

## Out of scope (decided)

- [x] **Dark mode** — not planned; app stays **light-only** (WebViewGold chrome, map sheet, auth/legal).
- [ ] **Admin settings tables** — no key/value settings tables in admin portal today (`SettingsCategoryPanel` only needed if added).

## Verification (manual)

See step-by-step scenarios in [`MOBILE_QA.md`](./MOBILE_QA.md).

- [ ] Staff pages on phone width: search/filter inputs do not zoom on focus.
- [ ] Admin/superadmin Sessions → All sessions: load more on phone, pagination on desktop.
- [ ] WebViewGold: configure haptic bridge per `WEBVIEW_HAPTICS.md` (optional).
- [ ] Admin payments, connection logs, wallet (selected user): load more on phone; pagination on desktop.
- [ ] Users, vendors, devices, reservations: readable grouped rows on phone (no horizontal table scroll).

- [ ] Detail screens (transaction, station, top-up): tab bar hidden; AppBar back returns to parent; push-in on forward and pop-in on back (reduced-motion off).
- [ ] Ops charge point / session detail: AppBar back on phone; no duplicate Back row below `md`.
- [ ] Billing tabs: load more on phone for invoices and sessions.
- [ ] Charge point detail: connector actions and session stop work on grouped rows.
- [ ] Tariffs: tap row opens edit on phone.
- [ ] Stations map: drag handle cycles sheet height (peek → half → full); drag handle resizes sheet while held.
- [ ] SuperAdmin settings: grouped OCPP/notification/Paystack rows + inline edit on phone; tariffs tap → edit.
- [ ] Devices connection logs dialog: grouped events on phone.

- [ ] iPhone-class width (375–430px) smoke test in browser or WebViewGold.
- [ ] Landmarks: skip link → main content (`#main-content` / `APP_MAIN_CONTENT_ID`).
- [ ] Frosted AppBar + tab bar visible over scroll content.
- [ ] Pull down at top of wallet/history/stations to refresh.
- [ ] Scroll a large-title page: AppBar shows compact page title after large title leaves view.
- [ ] Login / legal pages use light chrome consistently.
- [ ] Stations map sheet + app menu drawer match light palette.
- [ ] List rows, toggles, refresh, and drawer nav give light haptic feedback on tap.
- [ ] Auth titles and body use SF system stack (`authPageTitleSx` / `authPageBodySx`).
- [ ] Stations detail sheet → “Full station details” opens `/stations/:id`.
- [ ] `MainLayout` customer routes: frosted bar, compact title, pull-to-refresh, customer bottom nav.
- [ ] Pull-to-refresh disabled when `prefers-reduced-motion: reduce`.
- [ ] With reduced motion on: bottom sheets open without swipe; no card hover lift.
