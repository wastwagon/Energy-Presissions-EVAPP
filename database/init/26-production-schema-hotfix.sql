-- Production hotfix: columns referenced by current API entities (safe to re-run).
-- Apply on cleanmotion.energyprecisions.com PostgreSQL if Super Admin APIs return 500.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS wallet_reserved_amount DECIMAL(10, 2) NULL;

ALTER TABLE charge_points
  ADD COLUMN IF NOT EXISTS cellular_provider VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS cellular_apn VARCHAR(128) NULL;

ALTER TABLE tariffs
  ADD COLUMN IF NOT EXISTS vendor_id INTEGER NULL REFERENCES vendors(id) ON DELETE SET NULL;
