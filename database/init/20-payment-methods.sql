-- User Payment Methods (saved cards, mobile money)
-- For faster top-ups and recurring payments

CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,  -- 'card', 'mobile_money'
    provider VARCHAR(50),       -- 'paystack', 'mtn', 'vodafone', 'airteltigo'
    last_four VARCHAR(4),      -- Last 4 digits for cards
    phone VARCHAR(20),         -- For mobile money
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

COMMENT ON TABLE payment_methods IS 'User saved payment methods for quick top-ups';
