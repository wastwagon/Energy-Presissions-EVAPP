# Staff dashboards — Apple-style UI review & rollout plan

Admin (`/admin`), vendor portal (`/vendor`), and Super Admin (`/superadmin`) share layouts and many ops pages. Customer mobile polish (phases 1–10) is largely done; this doc tracks **staff** gaps and a **safe** rollout order.

## Current state (good)

| Area | Status |
|------|--------|
| Mobile grouped lists (`GroupedListSection` / `GroupedListRow`) | Most list pages below `md` |
| Load more + desktop pagination | Sessions, payments, connection logs, wallets, billing tabs |
| Staff filters 16px (`staffFilterFieldSx`) | Applied on filter-heavy pages |
| `SettingsCategoryPanel` | Super Admin settings (OCPP, notifications, Paystack) |
| Shared ops pages | `DevicesPage`, ops dashboards, session detail — one implementation per route prefix |
| Home dashboards | `StaffDashboardHomeView` — metrics only, **no duplicate nav card grid** (nav stays in drawer / bottom bar) |
| Manual QA | See `UI_MIGRATION_CHECKLIST.md` → Verification (manual) |

## Gaps vs native Apple-style UI

| Gap | Risk | Phase |
|-----|------|-------|
| Staff AppBar uses solid `jampackAppBarSx`, not frosted material | Low | **1** — `staffFrostedAppBarSx` on layouts |
| Dashboard home uses compact `LivePageHeader`, not large title on phone | Low | **1** — `titleVariant="large"` + staff chrome context (optional) |
| Desktop tables overcrowded (devices 11 cols, users 9, payments 8) | Low | **1–2** — column merge (detail pages keep full data) |
| Vendor settings page is legacy form layout, not grouped settings | Medium | **2** — `GroupedListSection` + panels |
| Staff stack transition / AppBar back on all detail routes | Medium | **3** — extend `useStaffNavBack` like customer |
| Pull-to-refresh on staff scroll regions | Medium | **3** — optional; keep toolbar Refresh where needed |
| Super Admin vs Admin duplicate **menu labels** (two dashboards, analytics names) | N/A | Intentional role scope — do not merge routes |

## Duplication policy (avoid re-adding clutter)

**Keep separate (not duplicates):**

- **Dashboard** vs **Operations Dashboard** — summary metrics vs live ops KPIs. Admin drawer Dashboard is `/admin/dashboard`; `/vendor` is the portal entry (bottom nav Home), not a second drawer item.
- **Device Management** (list) vs **Connection Logs** (global log stream) vs per-device logs dialog — different scopes.
- **Admin** `/vendor` home vs `/vendor/settings` vs **Super Admin** `/superadmin/vendor` — portal home + settings vs network-side vendor profile.
- **Analytics** (admin vendor scope) vs **System Analytics** (super admin).

**Do not add:**

- Customer-style desktop nav **card grids** under staff AppBars (drawer + bottom nav are canonical).
- Second Refresh control on mobile if PTR is added without `showToolbarRefreshOnMobile`.

**Shared code (already correct):**

- `DevicesPage` for admin + superadmin device routes.
- `StaffDashboardHomeView` for admin, vendor, and superadmin home.

## Desktop table streamlining (phase 1 targets)

| Page | Before | After (desktop `md+`) |
|------|--------|------------------------|
| Devices (`DevicesPage`) | 11 columns | **Device** · **Connection** · **OCPP** · **Location** · **Actions** |
| Users (`UserManagementPage`) | 9 columns | **User** · **Phone** · **Account** · **Balance** · **Actions** |
| Payments (`AdminPaymentsPage`) | 8 columns | **Payment** · **User** · **Amount** · **Method** · **Status** · **Date** |
| Vendors (`VendorManagementPage`) | 7 columns | **Vendor** · **Status** · **Created** · **Actions** |

Mobile grouped rows unchanged (already scannable).

## Safe implementation phases

### Phase 1 (this rollout)

- [x] `theme/staffChrome.ts` + frosted AppBar on `AdminDashboardLayout` / `SuperAdminDashboardLayout`
- [x] `StaffDashboardHomeView` — `titleVariant="large"` on home
- [x] `DevicesPage` — streamlined desktop table
- [x] `UserManagementPage` — streamlined desktop table

### Phase 2

- [x] Payments, vendors, connection logs desktop columns
- [x] `VendorSettingsPage` grouped settings layout
- [ ] Ops / billing list pages audit (sessions already grouped on mobile; billing uses tabs)

### Phase 3

- [x] `StaffPageChrome` large-title scroll + compact AppBar title (mirror customer)
- [x] Staff pull-to-refresh on admin / superadmin / vendor main scroll
- [x] Large titles + mobile Refresh on primary ops/finance pages
- [x] Bottom nav hidden while `navBack` is active (stack detail)
- [ ] Tick staff items in `UI_MIGRATION_CHECKLIST.md` verification (manual)

## Verification

After each phase, at **375–430px** and **1280px**:

1. Drawer + bottom nav (admin / superadmin / vendor prefix).
2. Devices list: mobile rows tap through; desktop table scrolls horizontally only if needed.
3. No duplicate shortcut rows on dashboard home.
4. Filter inputs do not trigger iOS zoom.
