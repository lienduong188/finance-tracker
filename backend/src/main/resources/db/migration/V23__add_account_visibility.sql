-- Add visibility and family_id columns to accounts table
ALTER TABLE accounts ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE';
ALTER TABLE accounts ADD COLUMN family_id UUID REFERENCES families(id) ON DELETE SET NULL;

-- Create account_permissions table for specific member visibility
CREATE TABLE account_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    can_view BOOLEAN NOT NULL DEFAULT TRUE,
    can_transact BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, user_id)
);

-- Indexes
CREATE INDEX idx_accounts_visibility ON accounts(visibility);
CREATE INDEX idx_accounts_family_id ON accounts(family_id);
CREATE INDEX idx_account_permissions_account_id ON account_permissions(account_id);
CREATE INDEX idx_account_permissions_user_id ON account_permissions(user_id);
