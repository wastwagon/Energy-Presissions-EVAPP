-- Pending Commands table for command queuing
CREATE TABLE IF NOT EXISTS pending_commands (
    id SERIAL PRIMARY KEY,
    charge_point_id VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    response JSONB,
    processed_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for pending_commands
CREATE INDEX IF NOT EXISTS idx_pending_commands_charge_point ON pending_commands(charge_point_id);
CREATE INDEX IF NOT EXISTS idx_pending_commands_status ON pending_commands(status);
CREATE INDEX IF NOT EXISTS idx_pending_commands_charge_point_status ON pending_commands(charge_point_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_commands_expires_at ON pending_commands(expires_at);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_pending_commands_updated_at ON pending_commands;
CREATE TRIGGER update_pending_commands_updated_at BEFORE UPDATE ON pending_commands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



