-- Vendor Migration Script
-- This script adds vendor_id columns to existing tables and migrates data

-- Add vendor_id to charge_points table
ALTER TABLE charge_points
ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE DEFAULT 1;

-- Add vendor_id to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE DEFAULT 1;

-- Update existing records to default vendor (id=1)
UPDATE charge_points SET vendor_id = 1 WHERE vendor_id IS NULL;
UPDATE users SET vendor_id = 1 WHERE vendor_id IS NULL;

-- Make vendor_id NOT NULL after migration
ALTER TABLE charge_points
ALTER COLUMN vendor_id SET NOT NULL;

ALTER TABLE users
ALTER COLUMN vendor_id SET NOT NULL;

-- Add indexes for vendor filtering
CREATE INDEX IF NOT EXISTS idx_charge_points_vendor_id ON charge_points(vendor_id);
CREATE INDEX IF NOT EXISTS idx_users_vendor_id ON users(vendor_id);

-- Add vendor_id to transactions (via charge_point relationship, but add direct index for performance)
-- Note: Transactions get vendorId via chargePoint.vendorId, but we can add a computed column or index
-- For now, we'll rely on JOINs, but add a comment for future optimization
COMMENT ON TABLE transactions IS 'Transactions are vendor-scoped via charge_points.vendor_id.';

-- Add vendor_id to tariffs (for vendor-specific pricing)
ALTER TABLE tariffs
ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE DEFAULT 1;

UPDATE tariffs SET vendor_id = 1 WHERE vendor_id IS NULL;
ALTER TABLE tariffs ALTER COLUMN vendor_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tariffs_vendor_id ON tariffs(vendor_id);

-- Add vendor_id to invoices (via transaction relationship, but add for direct filtering)
-- Note: Invoices get vendorId via transaction.chargePoint.vendorId, but we can denormalize for performance
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE;

-- Update invoices to get vendor_id from transactions
UPDATE invoices i
SET vendor_id = (
    SELECT cp.vendor_id
    FROM transactions t
    JOIN charge_points cp ON t.charge_point_id = cp.charge_point_id
    WHERE t.id = i.transaction_id
)
WHERE i.vendor_id IS NULL;

-- Set default for any remaining NULLs
UPDATE invoices SET vendor_id = 1 WHERE vendor_id IS NULL;
ALTER TABLE invoices ALTER COLUMN vendor_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);

-- Add vendor_id to payments (via invoice relationship)
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE;

-- Payments link to transactions (not invoices); get vendor via transaction -> charge_point
UPDATE payments p
SET vendor_id = (
    SELECT cp.vendor_id
    FROM transactions t
    JOIN charge_points cp ON t.charge_point_id = cp.charge_point_id
    WHERE t.transaction_id = p.transaction_id
)
WHERE p.vendor_id IS NULL;

UPDATE payments SET vendor_id = 1 WHERE vendor_id IS NULL;
ALTER TABLE payments ALTER COLUMN vendor_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_vendor_id ON payments(vendor_id);

-- Comments
COMMENT ON COLUMN charge_points.vendor_id IS 'Vendor that owns this charge point.';
COMMENT ON COLUMN users.vendor_id IS 'Vendor that this user belongs to.';
COMMENT ON COLUMN tariffs.vendor_id IS 'Vendor-specific pricing tariff.';
COMMENT ON COLUMN invoices.vendor_id IS 'Vendor that owns this invoice (denormalized for performance).';
COMMENT ON COLUMN payments.vendor_id IS 'Vendor that owns this payment (denormalized for performance).';

