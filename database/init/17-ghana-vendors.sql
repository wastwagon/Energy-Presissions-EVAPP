-- Ghana-Specific Vendors
-- This script adds sample vendors for Ghana EV charging operations

-- Insert Ghana vendors (skip if they already exist)
INSERT INTO vendors (name, slug, domain, status, contact_email, contact_phone, address, business_name)
VALUES 
  (
    'Energy Presissions Ghana',
    'energy-presissions-ghana',
    'energy-presissions.evcharging.com',
    'active',
    'info@energypresissions.com',
    '+233 XX XXX XXXX',
    'Accra, Greater Accra Region, Ghana',
    'Energy Presissions Ghana Limited'
  ),
  (
    'Ghana EV Network',
    'ghana-ev-network',
    'ghana-ev.evcharging.com',
    'active',
    'contact@ghanaevnetwork.com',
    '+233 XX XXX XXXX',
    'Kumasi, Ashanti Region, Ghana',
    'Ghana EV Network Limited'
  ),
  (
    'Accra Charging Solutions',
    'accra-charging-solutions',
    'accra-charging.evcharging.com',
    'active',
    'support@accracharging.com',
    '+233 XX XXX XXXX',
    'Accra, Greater Accra Region, Ghana',
    'Accra Charging Solutions'
  )
ON CONFLICT (slug) DO NOTHING;

-- Comments
COMMENT ON TABLE vendors IS 'Multi-vendor support: Each vendor represents a separate organization/white-label instance for commercial billing.';
