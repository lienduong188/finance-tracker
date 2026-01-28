-- Update user enabled status based on email_verified
-- Users who have verified email should be enabled
-- Users who haven't verified email should be disabled

UPDATE users SET enabled = true WHERE email_verified = true;
UPDATE users SET enabled = false WHERE email_verified = false;
