-- Sample Charging Stations in Ghana
-- These are example locations for testing the nearby stations feature

-- Greater Accra Region Stations
INSERT INTO charge_points (
    charge_point_id,
    vendor_id,
    model,
    status,
    location_latitude,
    location_longitude,
    location_address,
    location_name,
    location_city,
    location_region,
    location_district,
    location_landmarks,
    amenities,
    operating_hours
) VALUES
(
    'CP-ACC-001',
    1,
    'AC Wallbox 22kW',
    'Available',
    5.6037, -- Accra Central approximate
    -0.1870,
    'Independence Avenue, Accra',
    'Accra Central Charging Station',
    'Accra',
    'Greater Accra',
    'Accra Metropolitan',
    'Near Independence Square, close to Osu Castle',
    '["restroom", "wifi", "security", "cafe"]'::jsonb,
    '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "07:00", "close": "20:00"}, "sunday": {"open": "08:00", "close": "18:00"}}'::jsonb
),
(
    'CP-ACC-002',
    1,
    'DC Fast Charger 50kW',
    'Available',
    5.5500, -- Airport area
    -0.2000,
    'Kotoka International Airport, Accra',
    'Kotoka Airport Charging Hub',
    'Accra',
    'Greater Accra',
    'La Nkwantanang Madina',
    'Terminal 3, Parking Area A',
    '["restroom", "wifi", "security", "restaurant"]'::jsonb,
    '{"monday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "friday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}}'::jsonb
),
(
    'CP-ACC-003',
    1,
    'AC Wallbox 22kW',
    'Charging',
    5.6500, -- East Legon area
    -0.1500,
    'East Legon, Accra',
    'East Legon Shopping Center',
    'Accra',
    'Greater Accra',
    'La Nkwantanang Madina',
    'Near Shoprite, East Legon',
    '["restroom", "wifi", "shopping"]'::jsonb,
    '{"monday": {"open": "08:00", "close": "20:00"}, "tuesday": {"open": "08:00", "close": "20:00"}, "wednesday": {"open": "08:00", "close": "20:00"}, "thursday": {"open": "08:00", "close": "20:00"}, "friday": {"open": "08:00", "close": "21:00"}, "saturday": {"open": "09:00", "close": "21:00"}, "sunday": {"open": "10:00", "close": "18:00"}}'::jsonb
),
(
    'CP-ACC-004',
    1,
    'DC Fast Charger 50kW',
    'Available',
    5.7000, -- Tema area
    -0.0100,
    'Tema Port, Tema',
    'Tema Port Charging Station',
    'Tema',
    'Greater Accra',
    'Tema Metropolitan',
    'Port Area, Gate 1',
    '["restroom", "wifi", "security"]'::jsonb,
    '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "07:00", "close": "20:00"}, "sunday": {"open": "08:00", "close": "18:00"}}'::jsonb
),
(
    'CP-ASH-001',
    1,
    'DC Fast Charger 50kW',
    'Available',
    6.6900, -- Kumasi approximate
    -1.6200,
    'Kejetia Market, Kumasi',
    'Kumasi Central Charging Hub',
    'Kumasi',
    'Ashanti',
    'Kumasi Metropolitan',
    'Kejetia Market, Parking Area',
    '["restroom", "wifi", "security"]'::jsonb,
    '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "07:00", "close": "20:00"}, "sunday": {"open": "08:00", "close": "18:00"}}'::jsonb
),
(
    'CP-WES-001',
    1,
    'AC Wallbox 22kW',
    'Available',
    4.9000, -- Takoradi approximate
    -1.7600,
    'Takoradi Harbor, Takoradi',
    'Takoradi Port Charging Station',
    'Takoradi',
    'Western',
    'Sekondi-Takoradi Metropolitan',
    'Harbor Road, near Port Authority',
    '["restroom", "wifi", "security"]'::jsonb,
    '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "07:00", "close": "20:00"}, "sunday": {"open": "08:00", "close": "18:00"}}'::jsonb
)
ON CONFLICT (charge_point_id) DO UPDATE SET
    location_latitude = EXCLUDED.location_latitude,
    location_longitude = EXCLUDED.location_longitude,
    location_name = EXCLUDED.location_name,
    location_city = EXCLUDED.location_city,
    location_region = EXCLUDED.location_region;

-- Create sample connectors for these stations
INSERT INTO connectors (charge_point_id, connector_id, connector_type, power_rating_kw, status)
SELECT 
    cp.charge_point_id,
    1,
    'Type 2',
    CASE 
        WHEN cp.model LIKE '%50kW%' THEN 50
        WHEN cp.model LIKE '%22kW%' THEN 22
        ELSE 7
    END,
    'Available'
FROM charge_points cp
WHERE cp.charge_point_id IN ('CP-ACC-001', 'CP-ACC-002', 'CP-ACC-003', 'CP-ACC-004', 'CP-ASH-001', 'CP-WES-001')
ON CONFLICT (charge_point_id, connector_id) DO NOTHING;

-- Add second connector for fast chargers
INSERT INTO connectors (charge_point_id, connector_id, connector_type, power_rating_kw, status)
SELECT 
    cp.charge_point_id,
    2,
    'CCS',
    50,
    'Available'
FROM charge_points cp
WHERE cp.model LIKE '%50kW%'
ON CONFLICT (charge_point_id, connector_id) DO NOTHING;

-- Comments
COMMENT ON TABLE charge_points IS 'Charging stations across Ghana. Use location fields for mapping and nearby search.';

