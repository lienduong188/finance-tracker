-- Add planned date and planned account to spending plan items
ALTER TABLE spending_plan_items ADD COLUMN planned_date DATE;
ALTER TABLE spending_plan_items ADD COLUMN planned_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX idx_spending_plan_items_planned_account ON spending_plan_items(planned_account_id);
