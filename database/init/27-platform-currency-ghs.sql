-- Platform currency is GHS only. Normalize legacy USD defaults from early schema.

UPDATE transactions SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';
UPDATE charge_points SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';
UPDATE tariffs SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';
UPDATE invoices SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';
UPDATE payments SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';
UPDATE users SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';
UPDATE wallet_transactions SET currency = 'GHS' WHERE currency IS NULL OR currency <> 'GHS';

ALTER TABLE transactions ALTER COLUMN currency SET DEFAULT 'GHS';
ALTER TABLE charge_points ALTER COLUMN currency SET DEFAULT 'GHS';
ALTER TABLE tariffs ALTER COLUMN currency SET DEFAULT 'GHS';
ALTER TABLE invoices ALTER COLUMN currency SET DEFAULT 'GHS';
ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'GHS';
ALTER TABLE users ALTER COLUMN currency SET DEFAULT 'GHS';
