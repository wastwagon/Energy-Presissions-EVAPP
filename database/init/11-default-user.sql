-- Default User Seed Script
-- Creates default admin user for initial system access

-- Insert default admin user
-- Password: admin123 (bcrypt hash)
-- Email: admin@evcharging.com
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    account_type,
    balance,
    currency,
    status,
    email_verified,
    tenant_id,
    created_at,
    updated_at
) VALUES (
    1,
    'admin@evcharging.com',
    '$2b$10$32W/fXDTkOVKdTREVCI4i.8wiMXc10RJszYVOV.GvvYAi1y9.Me4m', -- admin123
    'System',
    'Administrator',
    '+233000000000',
    'SuperAdmin',
    0.00,
    'GHS',
    'Active',
    TRUE,
    1, -- Default tenant
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE
SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    account_type = EXCLUDED.account_type,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Insert default walk-in customer user
-- This is a special user for cash payments
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    account_type,
    balance,
    currency,
    status,
    email_verified,
    tenant_id,
    created_at,
    updated_at
) VALUES (
    2,
    'walkin@evcharging.com',
    '$2b$10$32W/fXDTkOVKdTREVCI4i.8wiMXc10RJszYVOV.GvvYAi1y9.Me4m', -- walkin123 (not used for login)
    'Walk-In',
    'Customer',
    'WalkIn',
    0.00,
    'GHS',
    'Active',
    FALSE,
    1, -- Default tenant
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Comments
COMMENT ON TABLE users IS 'Users table with default admin user (admin@evcharging.com / admin123)';
COMMENT ON COLUMN users.account_type IS 'Account types: Customer, Admin, SuperAdmin, WalkIn';



