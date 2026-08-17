-- Vendor settlement: admin-set payout cycle + vendor payout destination (MoMo or bank).
-- Idempotent: safe to re-run on an existing database.

DO $$ BEGIN
    CREATE TYPE vendor_payout_cycle AS ENUM ('weekly', 'biweekly', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vendor_payout_method AS ENUM ('mobile_money', 'bank');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vendor_payout_status AS ENUM ('paid', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE vendors
    ADD COLUMN IF NOT EXISTS payout_cycle vendor_payout_cycle NOT NULL DEFAULT 'monthly',
    ADD COLUMN IF NOT EXISTS payout_hold_days INTEGER NOT NULL DEFAULT 7,
    ADD COLUMN IF NOT EXISTS payout_method vendor_payout_method,
    ADD COLUMN IF NOT EXISTS payout_momo_network VARCHAR(32),
    ADD COLUMN IF NOT EXISTS payout_momo_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS payout_bank_name VARCHAR(128),
    ADD COLUMN IF NOT EXISTS payout_account_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payout_account_number VARCHAR(64),
    ADD COLUMN IF NOT EXISTS payout_bank_branch VARCHAR(128);

ALTER TABLE vendors
    DROP CONSTRAINT IF EXISTS vendors_payout_hold_days_check;
ALTER TABLE vendors
    ADD CONSTRAINT vendors_payout_hold_days_check CHECK (payout_hold_days >= 0 AND payout_hold_days <= 90);

CREATE TABLE IF NOT EXISTS vendor_payouts (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GHS',
    status vendor_payout_status NOT NULL DEFAULT 'paid',
    paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reference VARCHAR(128),
    notes TEXT,
    method_snapshot VARCHAR(64),
    destination_snapshot VARCHAR(128),
    by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_paid_at ON vendor_payouts(paid_at);

ALTER TABLE vendor_payouts
    DROP CONSTRAINT IF EXISTS vendor_payouts_amount_positive;
ALTER TABLE vendor_payouts
    ADD CONSTRAINT vendor_payouts_amount_positive CHECK (amount > 0);

COMMENT ON COLUMN vendors.payout_cycle IS 'How often Clean Motion settles this vendor: weekly (Mondays), biweekly (even ISO-week Mondays), or monthly (1st).';
COMMENT ON COLUMN vendors.payout_hold_days IS 'Days after a completed session before the sale matures into the next payout (refund/chargeback window).';
COMMENT ON COLUMN vendors.payout_method IS 'Vendor-chosen destination: Ghana mobile money or bank transfer.';
COMMENT ON TABLE vendor_payouts IS 'Manual settlement ledger. Platform collects customer payments; Super Admin records payouts after transferring MoMo/bank.';
