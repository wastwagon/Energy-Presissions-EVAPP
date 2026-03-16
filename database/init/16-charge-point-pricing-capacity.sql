-- Add pricing and capacity fields to charge_points table
-- This migration adds support for individual charge station pricing and capacity

-- Add total capacity field (sum of all connectors' power ratings)
ALTER TABLE charge_points 
ADD COLUMN IF NOT EXISTS total_capacity_kw DECIMAL(10, 2) NULL;

-- Add price per kWh field for individual station pricing
ALTER TABLE charge_points 
ADD COLUMN IF NOT EXISTS price_per_kwh DECIMAL(10, 4) NULL;

-- Add currency field (defaults to GHS for Ghana)
ALTER TABLE charge_points 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'GHS' NULL;

-- Update total capacity from connectors if not set
UPDATE charge_points cp
SET total_capacity_kw = (
  SELECT COALESCE(SUM(power_rating_kw), 0)
  FROM connectors c
  WHERE c.charge_point_id = cp.charge_point_id
)
WHERE total_capacity_kw IS NULL;

-- Add comment
COMMENT ON COLUMN charge_points.total_capacity_kw IS 'Total charging capacity in kW (sum of all connectors)';
COMMENT ON COLUMN charge_points.price_per_kwh IS 'Price per kWh for this specific charge station (overrides tariff if set)';
COMMENT ON COLUMN charge_points.currency IS 'Currency code for pricing (e.g., GHS, USD)';
