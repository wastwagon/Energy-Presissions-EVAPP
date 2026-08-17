-- Follow-up for databases that already applied 29-vendor-payouts.sql.
-- Safe to re-run. Fresh installs also apply this after 29.

ALTER TABLE vendor_payouts
    DROP CONSTRAINT IF EXISTS vendor_payouts_amount_positive;
ALTER TABLE vendor_payouts
    ADD CONSTRAINT vendor_payouts_amount_positive CHECK (amount > 0);

COMMENT ON COLUMN vendors.payout_cycle IS 'How often Clean Motion settles this vendor: weekly (Mondays), biweekly (even ISO-week Mondays), or monthly (1st).';
COMMENT ON COLUMN vendors.payout_hold_days IS 'Days after a completed session before the sale matures into the next payout (refund/chargeback window).';
