-- Tenant Migration Script
-- This script adds tenant_id columns to existing tables and migrates data

-- Add tenant_id to charge_points table
ALTER TABLE charge_points
ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE DEFAULT 1;

-- Add tenant_id to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE DEFAULT 1;

-- Update existing records to default tenant (id=1)
UPDATE charge_points SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL after migration
ALTER TABLE charge_points
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE users
ALTER COLUMN tenant_id SET NOT NULL;

-- Add indexes for tenant filtering
CREATE INDEX IF NOT EXISTS idx_charge_points_tenant_id ON charge_points(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- Add tenant_id to transactions (via charge_point relationship, but add direct index for performance)
-- Note: Transactions get tenantId via chargePoint.tenantId, but we can add a computed column or index
-- For now, we'll rely on JOINs, but add a comment for future optimization
COMMENT ON TABLE transactions IS 'Transactions are tenant-scoped via charge_points.tenant_id.';

-- Add tenant_id to tariffs (for tenant-specific pricing)
ALTER TABLE tariffs
ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE DEFAULT 1;

UPDATE tariffs SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE tariffs ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tariffs_tenant_id ON tariffs(tenant_id);

-- Add tenant_id to invoices (via transaction relationship, but add for direct filtering)
-- Note: Invoices get tenantId via transaction.chargePoint.tenantId, but we can denormalize for performance
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE;

-- Update invoices to get tenant_id from transactions
UPDATE invoices i
SET tenant_id = (
    SELECT cp.tenant_id
    FROM transactions t
    JOIN charge_points cp ON t.charge_point_id = cp.charge_point_id
    WHERE t.id = i.transaction_id
)
WHERE i.tenant_id IS NULL;

-- Set default for any remaining NULLs
UPDATE invoices SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE invoices ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);

-- Add tenant_id to payments (via invoice relationship)
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE;

UPDATE payments p
SET tenant_id = (
    SELECT i.tenant_id
    FROM invoices i
    WHERE i.id = p.invoice_id
)
WHERE p.tenant_id IS NULL;

UPDATE payments SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE payments ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);

-- Comments
COMMENT ON COLUMN charge_points.tenant_id IS 'Tenant that owns this charge point.';
COMMENT ON COLUMN users.tenant_id IS 'Tenant that this user belongs to.';
COMMENT ON COLUMN tariffs.tenant_id IS 'Tenant-specific pricing tariff.';
COMMENT ON COLUMN invoices.tenant_id IS 'Tenant that owns this invoice (denormalized for performance).';
COMMENT ON COLUMN payments.tenant_id IS 'Tenant that owns this payment (denormalized for performance).';



