-- Add paid_at column to invoices table if it doesn't exist
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Update default currency to GHS for existing tables (if needed)
-- Note: This only affects new records, existing records keep their currency

-- Create index for payment gateway lookups
CREATE INDEX IF NOT EXISTS idx_payments_gateway_id ON payments(payment_gateway_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Add comment for Ghana Cedis support
COMMENT ON COLUMN tariffs.currency IS 'Currency code (GHS for Ghana Cedis)';
COMMENT ON COLUMN transactions.currency IS 'Currency code (GHS for Ghana Cedis)';
COMMENT ON COLUMN invoices.currency IS 'Currency code (GHS for Ghana Cedis)';
COMMENT ON COLUMN payments.currency IS 'Currency code (GHS for Ghana Cedis)';



