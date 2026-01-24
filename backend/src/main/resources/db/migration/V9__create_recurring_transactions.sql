-- Recurring Transactions table
CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    description TEXT,

    -- Transfer fields
    to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    exchange_rate DECIMAL(19, 6),

    -- Recurrence settings
    frequency VARCHAR(20) NOT NULL,
    interval_value INT NOT NULL DEFAULT 1,
    day_of_week INT,
    day_of_month INT,

    -- Schedule control
    start_date DATE NOT NULL,
    end_date DATE,
    next_execution_date DATE NOT NULL,
    last_execution_date DATE,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    execution_count INT NOT NULL DEFAULT 0,
    max_executions INT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_recurring_txn_user ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_txn_status ON recurring_transactions(status);
CREATE INDEX idx_recurring_txn_next_exec ON recurring_transactions(next_execution_date);
CREATE INDEX idx_recurring_txn_user_status ON recurring_transactions(user_id, status);

-- Add recurring_transaction_id to transactions table for tracking
ALTER TABLE transactions
ADD COLUMN recurring_transaction_id UUID REFERENCES recurring_transactions(id) ON DELETE SET NULL;
