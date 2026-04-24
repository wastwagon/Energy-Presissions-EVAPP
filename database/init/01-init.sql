-- Database Initialization Script
-- This script runs automatically when the PostgreSQL container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('Active', 'Completed', 'Cancelled', 'Failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE connector_status AS ENUM ('Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE charge_point_status AS ENUM ('Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted', 'Offline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE id_tag_status AS ENUM ('Active', 'Blocked', 'Expired', 'Invalid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('Pending', 'Processing', 'Succeeded', 'Failed', 'Refunded', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('Generated', 'Sent', 'Paid', 'Overdue', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Charge Points (Stations)
CREATE TABLE IF NOT EXISTS charge_points (
    id SERIAL PRIMARY KEY,
    charge_point_id VARCHAR(50) UNIQUE NOT NULL,
    vendor VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    firmware_version VARCHAR(50),
    status charge_point_status DEFAULT 'Offline',
    last_heartbeat TIMESTAMP,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Connectors
CREATE TABLE IF NOT EXISTS connectors (
    id SERIAL PRIMARY KEY,
    charge_point_id VARCHAR(50) NOT NULL REFERENCES charge_points(charge_point_id) ON DELETE CASCADE,
    connector_id INTEGER NOT NULL,
    connector_type VARCHAR(50),
    power_rating_kw DECIMAL(10, 2),
    status connector_status DEFAULT 'Available',
    last_status_update TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(charge_point_id, connector_id)
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    account_type VARCHAR(20) DEFAULT 'Customer',
    balance DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'Active',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- IdTags (Authorization Tokens)
CREATE TABLE IF NOT EXISTS id_tags (
    id SERIAL PRIMARY KEY,
    id_tag VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    parent_id_tag VARCHAR(50),
    status id_tag_status DEFAULT 'Active',
    expiry_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER UNIQUE NOT NULL,
    charge_point_id VARCHAR(50) NOT NULL REFERENCES charge_points(charge_point_id),
    connector_id INTEGER NOT NULL,
    id_tag VARCHAR(50) REFERENCES id_tags(id_tag),
    user_id INTEGER REFERENCES users(id),
    meter_start INTEGER NOT NULL,
    meter_stop INTEGER,
    start_time TIMESTAMP NOT NULL,
    stop_time TIMESTAMP,
    total_energy_kwh DECIMAL(10, 3),
    duration_minutes INTEGER,
    total_cost DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    status transaction_status DEFAULT 'Active',
    reason VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Meter Values
CREATE TABLE IF NOT EXISTS meter_values (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    energy_wh INTEGER,
    power_kw DECIMAL(10, 2),
    voltage_v DECIMAL(10, 2),
    current_a DECIMAL(10, 2),
    frequency_hz DECIMAL(10, 2),
    temperature_c DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tariffs (Pricing Rules)
CREATE TABLE IF NOT EXISTS tariffs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    energy_rate DECIMAL(10, 4),
    time_rate DECIMAL(10, 4),
    base_fee DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(transaction_id),
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_gateway VARCHAR(50),
    payment_gateway_id VARCHAR(255),
    status payment_status DEFAULT 'Pending',
    processed_at TIMESTAMP,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_id INTEGER REFERENCES transactions(transaction_id),
    user_id INTEGER REFERENCES users(id),
    subtotal DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    total DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    status invoice_status DEFAULT 'Generated',
    pdf_path VARCHAR(255),
    sent_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Authorization Cache
CREATE TABLE IF NOT EXISTS authorization_cache (
    id SERIAL PRIMARY KEY,
    id_tag VARCHAR(50) NOT NULL,
    status id_tag_status NOT NULL,
    expiry_date TIMESTAMP,
    parent_id_tag VARCHAR(50),
    cached_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(id_tag)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_charge_point ON transactions(charge_point_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_start_time ON transactions(start_time);
CREATE INDEX IF NOT EXISTS idx_meter_values_transaction ON meter_values(transaction_id);
CREATE INDEX IF NOT EXISTS idx_meter_values_timestamp ON meter_values(timestamp);
CREATE INDEX IF NOT EXISTS idx_connectors_charge_point ON connectors(charge_point_id);
CREATE INDEX IF NOT EXISTS idx_id_tags_user ON id_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_transaction ON invoices(transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers (DROP first so re-apply of init is safe on existing DBs)
DROP TRIGGER IF EXISTS update_charge_points_updated_at ON charge_points;
CREATE TRIGGER update_charge_points_updated_at BEFORE UPDATE ON charge_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_connectors_updated_at ON connectors;
CREATE TRIGGER update_connectors_updated_at BEFORE UPDATE ON connectors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_id_tags_updated_at ON id_tags;
CREATE TRIGGER update_id_tags_updated_at BEFORE UPDATE ON id_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tariffs_updated_at ON tariffs;
CREATE TRIGGER update_tariffs_updated_at BEFORE UPDATE ON tariffs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default tariff (Ghana Cedis)
INSERT INTO tariffs (name, description, energy_rate, time_rate, base_fee, currency, is_active)
VALUES (
    'Standard Rate',
    'Default pricing: GHS 0.50 per kWh, GHS 0.10 per hour, GHS 2.00 base fee',
    0.50,
    0.10,
    2.00,
    'GHS',
    TRUE
) ON CONFLICT DO NOTHING;

-- Create a function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year_part || '-%';
    
    new_number := 'INV-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON DATABASE ev_billing_db IS 'EV Charging Billing Software Database';

