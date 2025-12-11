-- Wallet System Support
-- Wallet transactions table for audit trail

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'TopUp', 'Payment', 'Refund', 'Adjustment', 'Charge'
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS',
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Completed', 'Failed', 'Cancelled'
    balance_before DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference VARCHAR(255) UNIQUE,
    payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
    transaction_id INTEGER REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    admin_id INTEGER,
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference);

-- Comments
COMMENT ON TABLE wallet_transactions IS 'Wallet transaction ledger for audit trail';
COMMENT ON COLUMN wallet_transactions.type IS 'Transaction type: TopUp, Payment, Refund, Adjustment, Charge';
COMMENT ON COLUMN wallet_transactions.balance_before IS 'User balance before this transaction';
COMMENT ON COLUMN wallet_transactions.balance_after IS 'User balance after this transaction';



