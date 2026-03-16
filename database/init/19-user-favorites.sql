-- User Favorites (Favorite Stations)
-- Allows customers to save favorite charging stations

CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    charge_point_id VARCHAR(50) NOT NULL REFERENCES charge_points(charge_point_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, charge_point_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_charge_point_id ON user_favorites(charge_point_id);

COMMENT ON TABLE user_favorites IS 'User favorite charging stations for quick access';
