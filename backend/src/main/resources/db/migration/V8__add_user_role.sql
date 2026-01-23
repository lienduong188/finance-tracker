-- Add role column with default USER
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'USER';

-- Add enabled column for disable/enable user
ALTER TABLE users ADD COLUMN enabled BOOLEAN DEFAULT TRUE;

-- Create index for role
CREATE INDEX idx_users_role ON users(role);

-- Update existing users to USER role (in case any NULL values)
UPDATE users SET role = 'USER' WHERE role IS NULL;
UPDATE users SET enabled = TRUE WHERE enabled IS NULL;
