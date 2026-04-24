-- Enhanced Database Schema
-- Additional tables for OCPP 1.6J CSMS requirements

-- Update ChargePoint table with new fields
ALTER TABLE charge_points
ADD COLUMN IF NOT EXISTS iccid VARCHAR(50),
ADD COLUMN IF NOT EXISTS imsi VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP,
ADD COLUMN IF NOT EXISTS heartbeat_interval INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS supported_profiles JSONB;

-- Update Connector table with error codes
ALTER TABLE connectors
ADD COLUMN IF NOT EXISTS error_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS vendor_error_code VARCHAR(255);

-- Update Transaction table with reservation support
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS reservation_id INTEGER;

-- Enhanced MeterSample table (replaces/enhances meter_values)
CREATE TABLE IF NOT EXISTS meter_samples (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    charge_point_id VARCHAR(50) NOT NULL REFERENCES charge_points(charge_point_id) ON DELETE CASCADE,
    connector_id INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    measurand VARCHAR(100), -- e.g., "Energy.Active.Import.Register", "Power.Active.Import"
    location VARCHAR(50), -- e.g., "Outlet", "Inlet", "Body"
    phase VARCHAR(10), -- e.g., "L1", "L2", "L3", NULL
    unit VARCHAR(20), -- e.g., "Wh", "W", "V", "A", "Hz", "Celsius"
    value DECIMAL(20, 4) NOT NULL,
    context VARCHAR(50), -- e.g., "Sample.Periodic", "Sample.Clock", "Transaction.Begin", "Transaction.End"
    format VARCHAR(50), -- e.g., "Raw", "SignedData"
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for meter_samples
CREATE INDEX IF NOT EXISTS idx_meter_samples_transaction ON meter_samples(transaction_id);
CREATE INDEX IF NOT EXISTS idx_meter_samples_charge_point ON meter_samples(charge_point_id);
CREATE INDEX IF NOT EXISTS idx_meter_samples_timestamp ON meter_samples(timestamp);
CREATE INDEX IF NOT EXISTS idx_meter_samples_connector ON meter_samples(charge_point_id, connector_id);

-- Configuration Keys table
CREATE TABLE IF NOT EXISTS config_keys (
    id SERIAL PRIMARY KEY,
    charge_point_id VARCHAR(50) REFERENCES charge_points(charge_point_id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    readonly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(charge_point_id, key)
);

-- Index for config_keys
CREATE INDEX IF NOT EXISTS idx_config_keys_charge_point ON config_keys(charge_point_id);

-- ChargingProfile table (stub for future Smart Charging)
CREATE TABLE IF NOT EXISTS charging_profiles (
    id SERIAL PRIMARY KEY,
    charge_point_id VARCHAR(50) NOT NULL REFERENCES charge_points(charge_point_id) ON DELETE CASCADE,
    connector_id INTEGER,
    transaction_id INTEGER REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    stack_level INTEGER NOT NULL DEFAULT 0,
    charging_profile_purpose VARCHAR(50) NOT NULL, -- "ChargePointMaxProfile", "TxDefaultProfile", "TxProfile"
    charging_profile_kind VARCHAR(50) NOT NULL, -- "Absolute", "Recurring", "Relative"
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    charging_schedule JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for charging_profiles
CREATE INDEX IF NOT EXISTS idx_charging_profiles_charge_point ON charging_profiles(charge_point_id);
CREATE INDEX IF NOT EXISTS idx_charging_profiles_transaction ON charging_profiles(transaction_id);

-- FirmwareJob table (for future firmware updates)
CREATE TABLE IF NOT EXISTS firmware_jobs (
    id SERIAL PRIMARY KEY,
    charge_point_id VARCHAR(50) NOT NULL REFERENCES charge_points(charge_point_id) ON DELETE CASCADE,
    location TEXT NOT NULL, -- URL to firmware file
    retrieve_date TIMESTAMP NOT NULL,
    retry_interval INTEGER DEFAULT 0,
    retries INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Pending', -- "Pending", "Downloading", "Installing", "Installed", "InstallationFailed"
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for firmware_jobs
CREATE INDEX IF NOT EXISTS idx_firmware_jobs_charge_point ON firmware_jobs(charge_point_id);
CREATE INDEX IF NOT EXISTS idx_firmware_jobs_status ON firmware_jobs(status);

-- DiagnosticsJob table (for future diagnostics)
CREATE TABLE IF NOT EXISTS diagnostics_jobs (
    id SERIAL PRIMARY KEY,
    charge_point_id VARCHAR(50) NOT NULL REFERENCES charge_points(charge_point_id) ON DELETE CASCADE,
    location TEXT NOT NULL, -- URL to upload diagnostics
    start_time TIMESTAMP,
    stop_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending', -- "Pending", "Uploading", "Uploaded", "UploadFailed"
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for diagnostics_jobs
CREATE INDEX IF NOT EXISTS idx_diagnostics_jobs_charge_point ON diagnostics_jobs(charge_point_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_jobs_status ON diagnostics_jobs(status);

-- OCPP Message Log (for debugging - stores raw OCPP frames in dev mode)
CREATE TABLE IF NOT EXISTS ocpp_message_log (
    id SERIAL PRIMARY KEY,
    charge_point_id VARCHAR(50) REFERENCES charge_points(charge_point_id) ON DELETE SET NULL,
    message_type VARCHAR(20) NOT NULL, -- "CALL", "CALLRESULT", "CALLERROR"
    message_id VARCHAR(100),
    action VARCHAR(100),
    direction VARCHAR(20) NOT NULL, -- "INCOMING", "OUTGOING"
    payload JSONB,
    raw_message TEXT,
    response_status VARCHAR(50),
    error_code VARCHAR(50),
    error_description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for ocpp_message_log
CREATE INDEX IF NOT EXISTS idx_ocpp_log_charge_point ON ocpp_message_log(charge_point_id);
CREATE INDEX IF NOT EXISTS idx_ocpp_log_created_at ON ocpp_message_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ocpp_log_action ON ocpp_message_log(action);
CREATE INDEX IF NOT EXISTS idx_ocpp_log_message_id ON ocpp_message_log(message_id);

-- Connection State table (for tracking WebSocket connections)
CREATE TABLE IF NOT EXISTS connection_states (
    id SERIAL PRIMARY KEY,
    charge_point_id VARCHAR(50) UNIQUE NOT NULL REFERENCES charge_points(charge_point_id) ON DELETE CASCADE,
    is_connected BOOLEAN DEFAULT FALSE,
    last_connected_at TIMESTAMP,
    last_disconnected_at TIMESTAMP,
    connection_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for connection_states
CREATE INDEX IF NOT EXISTS idx_connection_states_charge_point ON connection_states(charge_point_id);
CREATE INDEX IF NOT EXISTS idx_connection_states_connected ON connection_states(is_connected);

-- Add updated_at triggers for new tables
DROP TRIGGER IF EXISTS update_config_keys_updated_at ON config_keys;
CREATE TRIGGER update_config_keys_updated_at BEFORE UPDATE ON config_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_charging_profiles_updated_at ON charging_profiles;
CREATE TRIGGER update_charging_profiles_updated_at BEFORE UPDATE ON charging_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_firmware_jobs_updated_at ON firmware_jobs;
CREATE TRIGGER update_firmware_jobs_updated_at BEFORE UPDATE ON firmware_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_diagnostics_jobs_updated_at ON diagnostics_jobs;
CREATE TRIGGER update_diagnostics_jobs_updated_at BEFORE UPDATE ON diagnostics_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_connection_states_updated_at ON connection_states;
CREATE TRIGGER update_connection_states_updated_at BEFORE UPDATE ON connection_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default configuration keys (global)
INSERT INTO config_keys (charge_point_id, key, value, readonly) VALUES
    (NULL, 'HeartbeatInterval', '300', FALSE),
    (NULL, 'MeterValueSampleInterval', '60', FALSE),
    (NULL, 'MeterValuesSampledData', 'Energy.Active.Import.Register,Power.Active.Import,Voltage,Current.Import', FALSE),
    (NULL, 'ConnectionTimeOut', '60', FALSE),
    (NULL, 'MinimumStatusDuration', '0', FALSE)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE meter_samples IS 'Enhanced meter value samples with full OCPP SampledValue support';
COMMENT ON TABLE config_keys IS 'OCPP configuration keys (global or per charge point)';
COMMENT ON TABLE charging_profiles IS 'Smart Charging profiles (future feature)';
COMMENT ON TABLE firmware_jobs IS 'Firmware update jobs (future feature)';
COMMENT ON TABLE diagnostics_jobs IS 'Diagnostics upload jobs (future feature)';
COMMENT ON TABLE ocpp_message_log IS 'Raw OCPP message log for debugging (dev mode)';
COMMENT ON TABLE connection_states IS 'WebSocket connection state tracking';



