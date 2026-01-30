-- Add soft delete fields for user account deletion (退会)
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN deletion_scheduled_at TIMESTAMP WITH TIME ZONE;

-- Index for finding accounts pending deletion
CREATE INDEX idx_users_deletion_scheduled_at ON users(deletion_scheduled_at) WHERE deletion_scheduled_at IS NOT NULL;
