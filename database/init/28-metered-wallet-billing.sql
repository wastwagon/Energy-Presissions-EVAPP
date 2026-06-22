-- Metered wallet billing: pay-as-you-charge (no upfront session amount)

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS billing_mode VARCHAR(20) NULL DEFAULT 'metered',
  ADD COLUMN IF NOT EXISTS billed_cost_so_far DECIMAL(10, 2) NULL DEFAULT 0;

COMMENT ON COLUMN transactions.billing_mode IS 'reserved = upfront wallet hold; metered = deduct per kWh during session';
COMMENT ON COLUMN transactions.billed_cost_so_far IS 'Running total deducted from wallet for metered sessions';

UPDATE transactions
SET billing_mode = 'reserved'
WHERE wallet_reserved_amount IS NOT NULL
  AND wallet_reserved_amount > 0
  AND (billing_mode IS NULL OR billing_mode = 'metered');

UPDATE transactions SET billed_cost_so_far = 0 WHERE billed_cost_so_far IS NULL;
