-- Tenant Management Schema
-- This script creates the tenant tables and adds tenant support to the system

-- Create tenant_status enum
DO $$ BEGIN
    CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE, -- For white-label portals (e.g., "tenant1.evcharging.com")
    status tenant_status DEFAULT 'active',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    metadata JSONB, -- Additional tenant-specific configuration
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tenant Disablements table (audit trail)
CREATE TABLE IF NOT EXISTS tenant_disablements (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status tenant_status NOT NULL, -- The status that was set
    reason TEXT, -- Reason for status change
    effective_at TIMESTAMP DEFAULT NOW(), -- When the status change took effect
    by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Super Admin who made the change
    lifted_at TIMESTAMP, -- When the status was lifted (if applicable)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenant_disablements_tenant_id ON tenant_disablements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_disablements_effective_at ON tenant_disablements(effective_at);

-- Trigger to update updated_at column
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default tenant (for backward compatibility)
INSERT INTO tenants (id, name, domain, status)
VALUES (1, 'Default Tenant', 'default', 'active')
ON CONFLICT (id) DO NOTHING;

-- Comments
COMMENT ON TABLE tenants IS 'Multi-tenant support: Each tenant represents a separate organization/white-label instance.';
COMMENT ON TABLE tenant_disablements IS 'Audit trail for tenant status changes (active, suspended, disabled).';
COMMENT ON COLUMN tenants.domain IS 'Custom domain for white-label portals (e.g., "tenant1.evcharging.com").';
COMMENT ON COLUMN tenants.status IS 'Tenant status: active (normal operation), suspended (read-only), disabled (hard cutoff).';
COMMENT ON COLUMN tenant_disablements.reason IS 'Reason for status change (e.g., "Payment overdue", "Violation of terms").';
COMMENT ON COLUMN tenant_disablements.lifted_at IS 'Timestamp when the status was lifted (set back to active).';



