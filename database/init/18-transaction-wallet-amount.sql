-- Add wallet reserved amount field to transactions table
-- This field stores the amount reserved from wallet for wallet-based charging

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS wallet_reserved_amount DECIMAL(10, 2) NULL;

COMMENT ON COLUMN transactions.wallet_reserved_amount IS 'Amount reserved from wallet for wallet-based charging. Transaction will stop automatically when this amount is exhausted.';
