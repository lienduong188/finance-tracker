-- Add linked account for credit card auto-payment
ALTER TABLE accounts ADD COLUMN linked_account_id UUID REFERENCES accounts(id);

-- Index for faster lookup
CREATE INDEX idx_accounts_linked_account ON accounts(linked_account_id);

COMMENT ON COLUMN accounts.linked_account_id IS 'Account to auto-pay credit card from on billing day';
