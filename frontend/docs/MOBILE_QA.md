# Mobile QA gate (WebViewGold / phone browser)

Run on **375–430px** width (or a real device). Check items off in `UI_MIGRATION_CHECKLIST.md` under **Verification (manual)** when done.

## Staff / admin (phone width)

1. Open any staff filter page (payments, users, devices, connection logs). Focus a search field — **no iOS zoom** (text stays 16px).
2. **Sessions → All sessions**: scroll list, tap **Load more**; on desktop width confirm **Pagination** instead.
3. **Payments / connection logs / wallet** (with user selected): load more on phone; pagination on `md+`.
4. **Users, vendors, devices, reservations**: rows are grouped (no horizontal table scroll).
5. **SuperAdmin settings** → System: tap a setting row; edit panel appears below list; save works.
6. **SuperAdmin settings** → Billing: tap tariff row → edit dialog.
7. **Ops devices** → open connection logs on a charge point: grouped events in dialog on phone.

## Customer

8. **Transaction / station / top-up** detail: bottom tab bar **hidden**; AppBar **back** returns to parent.
9. Enter detail with motion enabled: light **push-in** on forward; **pop-in** when AppBar back returns to parent; with `prefers-reduced-motion: reduce`, no animation.
10. **Admin/superadmin ops** charge point or session detail: AppBar **back** on phone; no duplicate Back button in page header below `md`.
11. **Billing** invoices and sessions: load more on phone.
12. **Stations**: cards above map; **Show map** / **Hide map** toggles map (`aria-expanded`); search field has a screen-reader label; selecting a card shows selected state and opens map.
13. **Desktop (`lg+`)**: primary nav is **cards below header**, not tabs in the AppBar.
14. **Pull-to-refresh** on wallet, history, stations (top of scroll). With reduced motion, PTR should not run.

## Cross-cutting

15. Skip link → `#main-content` lands in main content.
16. Frosted AppBar + customer bottom nav over scrolling content.
17. Large-title customer page: scroll until compact title appears in AppBar.
18. List taps give **light haptic** where WebViewGold bridge is configured (`WEBVIEW_HAPTICS.md`).
19. Auth/legal pages: SF stack typography; light chrome on login and legal routes.

## WebViewGold smoke

20. Build wrapped app; open customer home, stations map, wallet, one staff route if applicable.
21. Safe areas: bottom nav and notched devices — no content under home indicator.

## Out of scope

- **Dark mode** — light shell only by product decision.
- Native haptics without WebViewGold config
