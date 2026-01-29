-- Add locale column to users table
ALTER TABLE users ADD COLUMN locale VARCHAR(10) DEFAULT 'vi';

-- Update existing users based on their default currency
UPDATE users SET locale = 'ja' WHERE default_currency = 'JPY';
UPDATE users SET locale = 'en' WHERE default_currency = 'USD' OR default_currency = 'EUR';
UPDATE users SET locale = 'vi' WHERE locale IS NULL OR locale = 'vi';
