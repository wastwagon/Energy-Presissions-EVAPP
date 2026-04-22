-- Persist charge point IDs that must never be re-registered via OCPP/internal upsert after admin deletion.
-- Apply on existing databases: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/init/24-blocked-charge-point-ids.sql

CREATE TABLE IF NOT EXISTS blocked_charge_point_ids (
    charge_point_id VARCHAR(50) PRIMARY KEY,
    blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason VARCHAR(255) NOT NULL DEFAULT 'admin_delete'
);

CREATE INDEX IF NOT EXISTS idx_blocked_charge_point_ids_blocked_at ON blocked_charge_point_ids (blocked_at);

COMMENT ON TABLE blocked_charge_point_ids IS 'OCPP/internal registration denied for these IDs until removed via Super Admin unblock API';

-- One-time (optional): block demo IDs that were recreated by a seed without going through DELETE again:
-- INSERT INTO blocked_charge_point_ids (charge_point_id, reason) VALUES
--   ('CP-ACC-001', 'manual_cleanup'),
--   ('CP-ACC-002', 'manual_cleanup'),
--   ('CP-ACC-003', 'manual_cleanup'),
--   ('CP-ACC-004', 'manual_cleanup')
-- ON CONFLICT (charge_point_id) DO NOTHING;
