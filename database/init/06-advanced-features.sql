-- Advanced Features Support
-- Reservations, Local Auth List, and additional tables

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER UNIQUE NOT NULL,
    charge_point_id VARCHAR(50) NOT NULL REFERENCES charge_points(charge_point_id) ON DELETE CASCADE,
    connector_id INTEGER NOT NULL,
    id_tag VARCHAR(50) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Used', 'Expired', 'Cancelled'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for reservations
CREATE INDEX IF NOT EXISTS idx_reservations_charge_point ON reservations(charge_point_id);
CREATE INDEX IF NOT EXISTS idx_reservations_id_tag ON reservations(id_tag);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_expiry_date ON reservations(expiry_date);

-- Local Auth List table
CREATE TABLE IF NOT EXISTS local_auth_list (
    id SERIAL PRIMARY KEY,
    charge_point_id VARCHAR(50) NOT NULL REFERENCES charge_points(charge_point_id) ON DELETE CASCADE,
    id_tag VARCHAR(50) NOT NULL,
    id_tag_info JSONB NOT NULL, -- Contains status, expiryDate, parentIdTag
    list_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(charge_point_id, id_tag)
);

-- Local Auth List Version table (tracks current version per charge point)
CREATE TABLE IF NOT EXISTS local_auth_list_versions (
    id SERIAL PRIMARY KEY,
    charge_point_id VARCHAR(50) UNIQUE NOT NULL REFERENCES charge_points(charge_point_id) ON DELETE CASCADE,
    list_version INTEGER NOT NULL DEFAULT 1,
    update_type VARCHAR(20) DEFAULT 'Full', -- 'Full', 'Differential'
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for local_auth_list
CREATE INDEX IF NOT EXISTS idx_local_auth_list_charge_point ON local_auth_list(charge_point_id);
CREATE INDEX IF NOT EXISTS idx_local_auth_list_id_tag ON local_auth_list(id_tag);
CREATE INDEX IF NOT EXISTS idx_local_auth_list_version ON local_auth_list(list_version);

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_local_auth_list_updated_at ON local_auth_list;
CREATE TRIGGER update_local_auth_list_updated_at BEFORE UPDATE ON local_auth_list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE reservations IS 'Reservations for charging connectors';
COMMENT ON TABLE local_auth_list IS 'Local authorization list for offline authorization';
COMMENT ON TABLE local_auth_list_versions IS 'Tracks current version of local auth list per charge point';



