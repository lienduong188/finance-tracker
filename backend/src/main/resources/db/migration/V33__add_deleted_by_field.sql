-- Add deleted_by field to track who deleted the account (null = self-deleted, UUID = admin deleted)
ALTER TABLE users ADD COLUMN deleted_by UUID REFERENCES users(id);
