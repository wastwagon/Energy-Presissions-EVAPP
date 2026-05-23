-- Production hotfix: columns referenced by current API entities (safe to re-run).
-- Apply on cleanmotion.energyprecisions.com PostgreSQL if Super Admin APIs return 500.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS wallet_reserved_amount DECIMAL(10, 2) NULL;

ALTER TABLE charge_points
  ADD COLUMN IF NOT EXISTS cellular_provider VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS cellular_apn VARCHAR(128) NULL;

ALTER TABLE tariffs
  ADD COLUMN IF NOT EXISTS vendor_id INTEGER NULL REFERENCES vendors(id) ON DELETE SET NULL;

-- Normalize currency to GHS (see 27-platform-currency-ghs.sql for full migration)
UPDATE transactions SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';
UPDATE charge_points SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';
UPDATE tariffs SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';
UPDATE invoices SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';
UPDATE payments SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';
UPDATE users SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';
