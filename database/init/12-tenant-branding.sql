-- Tenant Branding Schema Enhancement
-- Adds white-labeling fields for receipts and invoices

-- Add branding columns to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(512),
ADD COLUMN IF NOT EXISTS receipt_footer_text TEXT,
ADD COLUMN IF NOT EXISTS receipt_header_text TEXT,
ADD COLUMN IF NOT EXISTS support_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS support_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);

-- Update default tenant with sample branding
UPDATE tenants
SET
    business_name = COALESCE(business_name, name),
    support_email = COALESCE(support_email, contact_email),
    support_phone = COALESCE(support_phone, contact_phone),
    receipt_header_text = COALESCE(receipt_header_text, 'Thank you for charging with us!'),
    receipt_footer_text = COALESCE(receipt_footer_text, 'For support, please contact us at ' || COALESCE(contact_email, 'support@evcharging.com'))
WHERE id = 1;

-- Comments
COMMENT ON COLUMN tenants.business_name IS 'Official business name for receipts and invoices';
COMMENT ON COLUMN tenants.business_registration_number IS 'Business registration number';
COMMENT ON COLUMN tenants.tax_id IS 'Tax identification number';
COMMENT ON COLUMN tenants.logo_url IS 'URL to tenant logo for receipts';
COMMENT ON COLUMN tenants.receipt_footer_text IS 'Custom footer text for receipts';
COMMENT ON COLUMN tenants.receipt_header_text IS 'Custom header text for receipts';
COMMENT ON COLUMN tenants.support_email IS 'Support email for receipts';
COMMENT ON COLUMN tenants.support_phone IS 'Support phone for receipts';
COMMENT ON COLUMN tenants.website_url IS 'Website URL for receipts';



