-- Create spending_plans table
CREATE TABLE spending_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    icon VARCHAR(50),
    color VARCHAR(7),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNING',
    total_estimated DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total_actual DECIMAL(19, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_spending_plan_owner CHECK (
        (family_id IS NOT NULL AND user_id IS NULL) OR
        (family_id IS NULL AND user_id IS NOT NULL)
    )
);

-- Create spending_plan_items table (estimated items)
CREATE TABLE spending_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES spending_plans(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    estimated_amount DECIMAL(19, 4) NOT NULL,
    actual_amount DECIMAL(19, 4) NOT NULL DEFAULT 0,
    icon VARCHAR(50),
    notes TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create spending_plan_expenses table (actual expenses)
CREATE TABLE spending_plan_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES spending_plan_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    amount DECIMAL(19, 4) NOT NULL,
    amount_in_plan_currency DECIMAL(19, 4) NOT NULL,
    note TEXT,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_spending_plans_family_id ON spending_plans(family_id);
CREATE INDEX idx_spending_plans_user_id ON spending_plans(user_id);
CREATE INDEX idx_spending_plans_status ON spending_plans(status);
CREATE INDEX idx_spending_plan_items_plan_id ON spending_plan_items(plan_id);
CREATE INDEX idx_spending_plan_items_category_id ON spending_plan_items(category_id);
CREATE INDEX idx_spending_plan_expenses_item_id ON spending_plan_expenses(item_id);
CREATE INDEX idx_spending_plan_expenses_user_id ON spending_plan_expenses(user_id);
CREATE INDEX idx_spending_plan_expenses_account_id ON spending_plan_expenses(account_id);
CREATE INDEX idx_spending_plan_expenses_date ON spending_plan_expenses(expense_date);

-- Comments
COMMENT ON TABLE spending_plans IS 'Spending plans for specific purposes like trips, weddings, events';
COMMENT ON TABLE spending_plan_items IS 'Estimated expense items within a spending plan';
COMMENT ON TABLE spending_plan_expenses IS 'Actual expenses recorded against plan items';
COMMENT ON COLUMN spending_plans.status IS 'PLANNING, ACTIVE, COMPLETED, CANCELLED';
