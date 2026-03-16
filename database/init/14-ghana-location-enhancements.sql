-- Ghana Location Enhancements for Charge Points
-- Adds Ghana-specific location fields and spatial indexing

-- Add Ghana-specific location fields
ALTER TABLE charge_points
ADD COLUMN IF NOT EXISTS location_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_region VARCHAR(100), -- Greater Accra, Ashanti, etc.
ADD COLUMN IF NOT EXISTS location_district VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS ghana_post_gps_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS location_landmarks TEXT,
ADD COLUMN IF NOT EXISTS parking_info TEXT,
ADD COLUMN IF NOT EXISTS accessibility_features JSONB,
ADD COLUMN IF NOT EXISTS operating_hours JSONB, -- {"monday": {"open": "06:00", "close": "22:00"}, ...}
ADD COLUMN IF NOT EXISTS amenities JSONB; -- ["restroom", "cafe", "wifi", "security"]

-- Create spatial index for faster location queries (requires PostGIS extension)
-- Note: If PostGIS is not available, we'll use regular indexes
CREATE INDEX IF NOT EXISTS idx_charge_points_location_lat_lng 
ON charge_points(location_latitude, location_longitude) 
WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- Index for region-based queries
CREATE INDEX IF NOT EXISTS idx_charge_points_region ON charge_points(location_region);

-- Index for city-based queries
CREATE INDEX IF NOT EXISTS idx_charge_points_city ON charge_points(location_city);

-- Index for status and location (for nearby available stations)
CREATE INDEX IF NOT EXISTS idx_charge_points_status_location 
ON charge_points(status, location_latitude, location_longitude) 
WHERE status IN ('Available', 'Charging', 'Preparing', 'Finishing');

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL,
    lon1 DECIMAL,
    lat2 DECIMAL,
    lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    earth_radius DECIMAL := 6371; -- Earth radius in kilometers
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    a := sin(dlat/2) * sin(dlat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dlon/2) * sin(dlon/2);
    
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comments
COMMENT ON COLUMN charge_points.location_name IS 'Name of the charging station location';
COMMENT ON COLUMN charge_points.location_region IS 'Ghana region (e.g., Greater Accra, Ashanti, Western)';
COMMENT ON COLUMN charge_points.location_district IS 'Ghana district/municipality';
COMMENT ON COLUMN charge_points.ghana_post_gps_code IS 'Ghana Post GPS address code';
COMMENT ON COLUMN charge_points.location_landmarks IS 'Nearby landmarks for navigation (common in Ghana)';
COMMENT ON COLUMN charge_points.operating_hours IS 'Operating hours by day of week';
COMMENT ON COLUMN charge_points.amenities IS 'Available amenities at the station';

