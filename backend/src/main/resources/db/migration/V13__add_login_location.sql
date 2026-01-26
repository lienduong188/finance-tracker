-- Add login location field to users table
ALTER TABLE users ADD COLUMN last_login_location VARCHAR(200);
