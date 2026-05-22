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
9. Enter detail with motion enabled: light **push-in** on enter; with `prefers-reduced-motion: reduce`, no push animation.
10. **Billing** invoices and sessions: load more on phone.
11. **Stations map** (`xs`): tap sheet drag handle — height cycles **peek → half → full**.
12. **Pull-to-refresh** on wallet, history, stations (top of scroll). With reduced motion, PTR should not run.

## Cross-cutting

13. Skip link → `#main-content` lands in main content.
14. Frosted AppBar + customer bottom nav over scrolling content.
15. Large-title customer page: scroll until compact title appears in AppBar.
16. List taps give **light haptic** where WebViewGold bridge is configured (`WEBVIEW_HAPTICS.md`).
17. Auth/legal pages: SF stack typography; light chrome on login and legal routes.

## WebViewGold smoke

18. Build wrapped app; open customer home, stations map, wallet, one staff route if applicable.
19. Safe areas: bottom nav and notched devices — no content under home indicator.

## Not in this gate (optional / later)

- Dark mode theme
- Finger-drag map sheet (only tap-to-cycle snap today)
- Native haptics without WebViewGold config
- Customer **pop** animation on back (push-in on enter only)
