-- Add family_id to transactions table for group transactions
ALTER TABLE transactions ADD COLUMN family_id UUID REFERENCES families(id) ON DELETE SET NULL;

-- Create index for family transactions
CREATE INDEX idx_transactions_family_id ON transactions(family_id);

-- Note: user_id remains NOT NULL because we always track who created the transaction
-- family_id is optional - if set, this is a group transaction visible to all members
