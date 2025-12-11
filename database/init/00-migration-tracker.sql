-- Migration Tracker Table
-- This table tracks which migrations have been run
-- Used to prevent running migrations multiple times

CREATE TABLE IF NOT EXISTS migration_tracker (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW(),
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_migration_tracker_name ON migration_tracker(migration_name);
CREATE INDEX IF NOT EXISTS idx_migration_tracker_executed_at ON migration_tracker(executed_at);

COMMENT ON TABLE migration_tracker IS 'Tracks which database migrations have been executed to prevent duplicate runs';

