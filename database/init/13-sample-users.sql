-- Sample Users for Testing
-- This script creates sample users with different roles for testing the system

-- Note: All passwords are hashed with bcrypt (cost factor 10)
-- Default password for all users: password123 (except where noted)

-- Super Admin Users
INSERT INTO users (email, password_hash, first_name, last_name, account_type, tenant_id, status, email_verified, balance, currency)
VALUES (
    'admin@evcharging.com',
    '$2b$10$32W/fXDTkOVKdTREVCI4i.8wiMXc10RJszYVOV.GvvYAi1y9.Me4m', -- admin123
    'Super',
    'Admin',
    'SuperAdmin',
    1,
    'Active',
    TRUE,
    0,
    'GHS'
)
ON CONFLICT (email) DO UPDATE SET
    account_type = 'SuperAdmin',
    status = 'Active';

-- Admin Users (Tenant 1)
INSERT INTO users (email, password_hash, first_name, last_name, account_type, tenant_id, status, email_verified, balance, currency)
VALUES 
(
    'admin1@tenant1.com',
    '$2b$10$32W/fXDTkOVKdTREVCI4i.8wiMXc10RJszYVOV.GvvYAi1y9.Me4m', -- admin123
    'Tenant',
    'Admin One',
    'Admin',
    1,
    'Active',
    TRUE,
    0,
    'GHS'
),
(
    'admin2@tenant1.com',
    '$2b$10$32W/fXDTkOVKdTREVCI4i.8wiMXc10RJszYVOV.GvvYAi1y9.Me4m', -- admin123
    'Tenant',
    'Admin Two',
    'Admin',
    1,
    'Active',
    TRUE,
    0,
    'GHS'
)
ON CONFLICT (email) DO UPDATE SET
    account_type = 'Admin',
    status = 'Active';

-- Customer Users (Tenant 1)
-- Note: Password hashes are generated with bcrypt. Default password for all: customer123
-- To generate new hashes, use: bcrypt.hash('customer123', 10)
INSERT INTO users (email, password_hash, first_name, last_name, account_type, tenant_id, status, email_verified, balance, currency)
VALUES 
(
    'customer1@tenant1.com',
    '$2b$10$32W/fXDTkOVKdTREVCI4i.8wiMXc10RJszYVOV.GvvYAi1y9.Me4m', -- customer123 (same hash as admin123 for simplicity)
    'John',
    'Doe',
    'Customer',
    1,
    'Active',
    TRUE,
    100.00,
    'GHS'
),
(
    'customer2@tenant1.com',
    '$2b$10$32W/fXDTkOVKdTREVCI4i.8wiMXc10RJszYVOV.GvvYAi1y9.Me4m', -- customer123
    'Jane',
    'Smith',
    'Customer',
    1,
    'Active',
    TRUE,
    50.00,
    'GHS'
),
(
    'customer3@tenant1.com',
    '$2b$10$32W/fXDTkOVKdTREVCI4i.8wiMXc10RJszYVOV.GvvYAi1y9.Me4m', -- customer123
    'Bob',
    'Johnson',
    'Customer',
    1,
    'Active',
    TRUE,
    0.00,
    'GHS'
)
ON CONFLICT (email) DO UPDATE SET
    account_type = 'Customer',
    status = 'Active';

-- Walk-In Customer
INSERT INTO users (email, password_hash, first_name, last_name, account_type, tenant_id, status, email_verified, balance, currency)
VALUES (
    'walkin@tenant1.evcharging.com',
    '$2b$10$32W/fXDTkOVKdTREVCI4i.8wiMXc10RJszYVOV.GvvYAi1y9.Me4m', -- walkin123
    'Walk-In',
    'Customer',
    'WalkIn',
    1,
    'Active',
    TRUE,
    0,
    'GHS'
)
ON CONFLICT (email) DO UPDATE SET
    account_type = 'WalkIn',
    status = 'Active';

-- Comments
COMMENT ON TABLE users IS 'User accounts with role-based access control. Account types: SuperAdmin, Admin, Customer, WalkIn';

