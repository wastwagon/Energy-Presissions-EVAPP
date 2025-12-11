-- CMS Settings for Frontend Management
-- This script creates tables for managing frontend content, branding, and system settings

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    category VARCHAR(100) NOT NULL, -- 'branding', 'billing', 'ocpp', 'payment', 'notification', 'general'
    description TEXT,
    data_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    is_public BOOLEAN DEFAULT FALSE, -- Whether this setting can be accessed by frontend
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CMS Content Table (for managing frontend content)
CREATE TABLE IF NOT EXISTS cms_content (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255),
    content TEXT,
    content_type VARCHAR(50) NOT NULL, -- 'text', 'html', 'markdown', 'image', 'file'
    section VARCHAR(100), -- 'homepage', 'about', 'footer', 'header', etc.
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE, -- NULL for global content
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB, -- Additional metadata (e.g., image dimensions, file size, etc.)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Branding Assets Table
CREATE TABLE IF NOT EXISTS branding_assets (
    id SERIAL PRIMARY KEY,
    asset_type VARCHAR(50) NOT NULL, -- 'logo', 'favicon', 'banner', 'background', 'icon'
    file_path TEXT NOT NULL, -- Path to file in MinIO/S3
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE, -- NULL for global branding
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_cms_content_section ON cms_content(section);
CREATE INDEX IF NOT EXISTS idx_cms_content_vendor ON cms_content(vendor_id);
CREATE INDEX IF NOT EXISTS idx_branding_assets_type ON branding_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_branding_assets_vendor ON branding_assets(vendor_id);

-- Triggers
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_content_updated_at BEFORE UPDATE ON cms_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branding_assets_updated_at BEFORE UPDATE ON branding_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (key, value, category, description, data_type, is_public) VALUES
    ('system_name', 'EV Charging Billing System', 'branding', 'System name displayed in frontend', 'string', TRUE),
    ('system_description', 'Manage your EV charging operations and billing', 'branding', 'System description', 'string', TRUE),
    ('default_currency', 'GHS', 'billing', 'Default currency for billing', 'string', FALSE),
    ('tax_rate', '0', 'billing', 'Default tax rate (percentage)', 'number', FALSE),
    ('invoice_prefix', 'INV', 'billing', 'Prefix for invoice numbers', 'string', FALSE),
    ('heartbeat_interval', '300', 'ocpp', 'Default heartbeat interval in seconds', 'number', FALSE),
    ('meter_value_interval', '60', 'ocpp', 'Default meter value sampling interval in seconds', 'number', FALSE),
    ('connection_timeout', '30', 'ocpp', 'Connection timeout in seconds', 'number', FALSE),
    ('paystack_enabled', 'true', 'payment', 'Enable Paystack payment gateway', 'boolean', FALSE),
    ('paystack_public_key', '', 'payment', 'Paystack public key', 'string', FALSE),
    ('paystack_secret_key', '', 'payment', 'Paystack secret key', 'string', FALSE),
    ('email_enabled', 'false', 'notification', 'Enable email notifications', 'boolean', FALSE),
    ('smtp_host', '', 'notification', 'SMTP server host', 'string', FALSE),
    ('smtp_port', '587', 'notification', 'SMTP server port', 'number', FALSE),
    ('smtp_user', '', 'notification', 'SMTP username', 'string', FALSE),
    ('smtp_password', '', 'notification', 'SMTP password', 'string', FALSE),
    ('from_email', '', 'notification', 'Default from email address', 'string', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Comments
COMMENT ON TABLE system_settings IS 'System-wide configuration settings';
COMMENT ON TABLE cms_content IS 'Content management for frontend pages';
COMMENT ON TABLE branding_assets IS 'Branding assets (logos, images, etc.)';
COMMENT ON COLUMN system_settings.category IS 'Category of setting: branding, billing, ocpp, payment, notification, general';
COMMENT ON COLUMN system_settings.is_public IS 'Whether this setting can be accessed by frontend without authentication';
COMMENT ON COLUMN cms_content.vendor_id IS 'NULL for global content, or specific vendor ID for vendor-specific content';
COMMENT ON COLUMN branding_assets.vendor_id IS 'NULL for global branding, or specific vendor ID for vendor-specific branding';



