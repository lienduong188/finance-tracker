-- Credit Card Payment Plans table
CREATE TABLE credit_card_payment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

    payment_type VARCHAR(20) NOT NULL, -- INSTALLMENT, REVOLVING

    -- Common fields
    original_amount DECIMAL(19, 4) NOT NULL,
    total_amount_with_fee DECIMAL(19, 4) NOT NULL,
    remaining_amount DECIMAL(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    start_date DATE NOT NULL,
    next_payment_date DATE,

    -- Installment specific
    total_installments INTEGER,
    completed_installments INTEGER DEFAULT 0,
    installment_amount DECIMAL(19, 4),
    installment_fee_rate DECIMAL(8, 4), -- e.g., 0.02 = 2%

    -- Revolving specific
    monthly_payment DECIMAL(19, 4),
    interest_rate DECIMAL(8, 4), -- annual rate, e.g., 0.15 = 15%

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Credit Card Payments (individual payment records)
CREATE TABLE credit_card_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES credit_card_payment_plans(id) ON DELETE CASCADE,

    payment_number INTEGER NOT NULL,
    principal_amount DECIMAL(19, 4) NOT NULL,
    fee_amount DECIMAL(19, 4) DEFAULT 0,
    interest_amount DECIMAL(19, 4) DEFAULT 0,
    total_amount DECIMAL(19, 4) NOT NULL,
    remaining_after DECIMAL(19, 4) NOT NULL,

    due_date DATE NOT NULL,
    payment_date DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, OVERDUE

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add payment_type and payment_plan_id to transactions
ALTER TABLE transactions ADD COLUMN payment_type VARCHAR(20) DEFAULT 'ONE_TIME';
ALTER TABLE transactions ADD COLUMN payment_plan_id UUID REFERENCES credit_card_payment_plans(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_cc_payment_plans_user_id ON credit_card_payment_plans(user_id);
CREATE INDEX idx_cc_payment_plans_transaction_id ON credit_card_payment_plans(transaction_id);
CREATE INDEX idx_cc_payment_plans_account_id ON credit_card_payment_plans(account_id);
CREATE INDEX idx_cc_payment_plans_status ON credit_card_payment_plans(status);
CREATE INDEX idx_cc_payment_plans_next_payment ON credit_card_payment_plans(next_payment_date);

CREATE INDEX idx_cc_payments_plan_id ON credit_card_payments(plan_id);
CREATE INDEX idx_cc_payments_due_date ON credit_card_payments(due_date);
CREATE INDEX idx_cc_payments_status ON credit_card_payments(status);

CREATE INDEX idx_transactions_payment_plan ON transactions(payment_plan_id);

-- Comments
COMMENT ON TABLE credit_card_payment_plans IS 'Payment plans for installment (分割払い) or revolving (リボ払い) credit card transactions';
COMMENT ON TABLE credit_card_payments IS 'Individual payment records for credit card payment plans';
COMMENT ON COLUMN credit_card_payment_plans.payment_type IS 'INSTALLMENT = 分割払い, REVOLVING = リボ払い';
COMMENT ON COLUMN credit_card_payment_plans.installment_fee_rate IS 'Fee rate per installment, e.g., 0.02 = 2%';
COMMENT ON COLUMN credit_card_payment_plans.interest_rate IS 'Annual interest rate for revolving, e.g., 0.15 = 15%';
