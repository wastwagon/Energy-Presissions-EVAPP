-- Vendor Management Schema
-- This script creates the vendor tables and adds vendor support to the system

-- Create vendor_status enum
DO $$ BEGIN
    CREATE TYPE vendor_status AS ENUM ('active', 'suspended', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE, -- URL-friendly identifier
    domain VARCHAR(255) UNIQUE, -- For white-label portals (e.g., "vendor1.evcharging.com")
    status vendor_status DEFAULT 'active',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    business_name VARCHAR(255),
    business_registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    logo_url VARCHAR(512),
    receipt_footer_text TEXT,
    receipt_header_text TEXT,
    support_email VARCHAR(255),
    support_phone VARCHAR(20),
    website_url VARCHAR(255),
    metadata JSONB, -- Additional vendor-specific configuration
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendor Disablements table (audit trail)
CREATE TABLE IF NOT EXISTS vendor_disablements (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    status vendor_status NOT NULL, -- The status that was set
    reason TEXT, -- Reason for status change
    effective_at TIMESTAMP DEFAULT NOW(), -- When the status change took effect
    by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Super Admin who made the change
    lifted_at TIMESTAMP, -- When the status was lifted (if applicable)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_domain ON vendors(domain);
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendor_disablements_vendor_id ON vendor_disablements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_disablements_effective_at ON vendor_disablements(effective_at);

-- Trigger to update updated_at column
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default vendor (for backward compatibility)
INSERT INTO vendors (id, name, slug, domain, status)
VALUES (1, 'Default Vendor', 'default', 'default', 'active')
ON CONFLICT (id) DO NOTHING;

-- Comments
COMMENT ON TABLE vendors IS 'Multi-vendor support: Each vendor represents a separate organization/white-label instance for commercial billing.';
COMMENT ON TABLE vendor_disablements IS 'Audit trail for vendor status changes (active, suspended, disabled).';
COMMENT ON COLUMN vendors.domain IS 'Custom domain for white-label portals (e.g., "vendor1.evcharging.com").';
COMMENT ON COLUMN vendors.slug IS 'URL-friendly identifier for the vendor.';
COMMENT ON COLUMN vendors.status IS 'Vendor status: active (normal operation), suspended (read-only), disabled (hard cutoff).';
COMMENT ON COLUMN vendor_disablements.reason IS 'Reason for status change (e.g., "Payment overdue", "Violation of terms").';
COMMENT ON COLUMN vendor_disablements.lifted_at IS 'Timestamp when the status was lifted (set back to active).';

