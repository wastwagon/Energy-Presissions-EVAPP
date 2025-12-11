-- Connection Logs for Device Debugging
-- This script creates tables for tracking connection attempts, failures, and errors

-- Connection Logs Table
CREATE TABLE IF NOT EXISTS connection_logs (
    id SERIAL PRIMARY KEY,
    charge_point_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'connection_attempt', 'connection_success', 'connection_failed', 'connection_closed', 'error', 'message_error'
    status VARCHAR(50), -- 'success', 'failed', 'rejected', 'timeout', 'error'
    error_code VARCHAR(100), -- OCPP error code or WebSocket close code
    error_message TEXT, -- Detailed error message
    close_code INTEGER, -- WebSocket close code (if applicable)
    close_reason TEXT, -- WebSocket close reason
    ip_address VARCHAR(45), -- Client IP address
    user_agent TEXT, -- User agent string
    request_url TEXT, -- Full request URL
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    metadata JSONB, -- Additional debug information
    created_at TIMESTAMP DEFAULT NOW()
);

-- Connection Statistics Table (for quick lookups)
CREATE TABLE IF NOT EXISTS connection_statistics (
    charge_point_id VARCHAR(50) PRIMARY KEY,
    total_attempts INTEGER DEFAULT 0,
    successful_connections INTEGER DEFAULT 0,
    failed_connections INTEGER DEFAULT 0,
    last_connection_attempt TIMESTAMP,
    last_successful_connection TIMESTAMP,
    last_failed_connection TIMESTAMP,
    last_error_code VARCHAR(100),
    last_error_message TEXT,
    consecutive_failures INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_connection_logs_charge_point_id ON connection_logs(charge_point_id);
CREATE INDEX IF NOT EXISTS idx_connection_logs_event_type ON connection_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_connection_logs_status ON connection_logs(status);
CREATE INDEX IF NOT EXISTS idx_connection_logs_created_at ON connection_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_logs_vendor_id ON connection_logs(vendor_id);

-- Trigger to update connection statistics
CREATE OR REPLACE FUNCTION update_connection_statistics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_type = 'connection_attempt' THEN
        INSERT INTO connection_statistics (charge_point_id, total_attempts, last_connection_attempt, updated_at)
        VALUES (NEW.charge_point_id, 1, NEW.created_at, NOW())
        ON CONFLICT (charge_point_id) DO UPDATE
        SET 
            total_attempts = connection_statistics.total_attempts + 1,
            last_connection_attempt = NEW.created_at,
            updated_at = NOW();
    ELSIF NEW.event_type = 'connection_success' THEN
        INSERT INTO connection_statistics (charge_point_id, successful_connections, last_successful_connection, consecutive_failures, updated_at)
        VALUES (NEW.charge_point_id, 1, NEW.created_at, 0, NOW())
        ON CONFLICT (charge_point_id) DO UPDATE
        SET 
            successful_connections = connection_statistics.successful_connections + 1,
            last_successful_connection = NEW.created_at,
            consecutive_failures = 0,
            updated_at = NOW();
    ELSIF NEW.event_type IN ('connection_failed', 'connection_closed', 'error') THEN
        INSERT INTO connection_statistics (charge_point_id, failed_connections, last_failed_connection, last_error_code, last_error_message, consecutive_failures, updated_at)
        VALUES (NEW.charge_point_id, 1, NEW.created_at, NEW.error_code, NEW.error_message, 1, NOW())
        ON CONFLICT (charge_point_id) DO UPDATE
        SET 
            failed_connections = connection_statistics.failed_connections + 1,
            last_failed_connection = NEW.created_at,
            last_error_code = NEW.error_code,
            last_error_message = NEW.error_message,
            consecutive_failures = CASE 
                WHEN NEW.event_type = 'connection_failed' THEN connection_statistics.consecutive_failures + 1
                ELSE connection_statistics.consecutive_failures
            END,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_connection_statistics
    AFTER INSERT ON connection_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_connection_statistics();

-- Comments
COMMENT ON TABLE connection_logs IS 'Detailed logs of all connection attempts, successes, failures, and errors for debugging';
COMMENT ON TABLE connection_statistics IS 'Aggregated connection statistics for quick lookups and monitoring';
COMMENT ON COLUMN connection_logs.event_type IS 'Type of event: connection_attempt, connection_success, connection_failed, connection_closed, error, message_error';
COMMENT ON COLUMN connection_logs.close_code IS 'WebSocket close code (e.g., 1008 = Policy Violation, 4003 = Tenant Disabled)';
COMMENT ON COLUMN connection_statistics.consecutive_failures IS 'Number of consecutive failed connection attempts (resets on success)';



