-- Optional cellular backhaul metadata for OCPP chargers (4G/LTE SIM in cabinet)
ALTER TABLE charge_points ADD COLUMN IF NOT EXISTS cellular_provider VARCHAR(32) NULL;
ALTER TABLE charge_points ADD COLUMN IF NOT EXISTS cellular_apn VARCHAR(128) NULL;

COMMENT ON COLUMN charge_points.cellular_provider IS 'Recommended: MTN. Alternatives: Vodafone, AirtelTigo. Telecel not used on this network.';
COMMENT ON COLUMN charge_points.cellular_apn IS 'APN configured on the charger modem/SIM (e.g. internet for MTN Ghana)';
