-- Add family_id to budgets table for group budgets
ALTER TABLE budgets ADD COLUMN family_id UUID REFERENCES families(id) ON DELETE CASCADE;

-- Make user_id nullable (budget can belong to family OR user)
ALTER TABLE budgets ALTER COLUMN user_id DROP NOT NULL;

-- Create index for family budgets
CREATE INDEX idx_budgets_family_id ON budgets(family_id);

-- Add constraint: budget must belong to either user or family
ALTER TABLE budgets ADD CONSTRAINT chk_budget_owner
    CHECK (user_id IS NOT NULL OR family_id IS NOT NULL);
