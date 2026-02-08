-- Add username column to users table
ALTER TABLE users ADD COLUMN username VARCHAR(50);

-- Set default usernames for existing users (email prefix before @)
UPDATE users SET username = SPLIT_PART(email, '@', 1);

-- Set specific username for the main user
UPDATE users SET username = 'lien-finance' WHERE email = 'lienduong188@gmail.com';

-- Handle potential duplicate usernames by appending a counter
DO $$
DECLARE
    dup RECORD;
    counter INT;
BEGIN
    FOR dup IN
        SELECT username, array_agg(id ORDER BY created_at) as ids
        FROM users
        GROUP BY username
        HAVING COUNT(*) > 1
    LOOP
        counter := 1;
        FOR i IN 2..array_length(dup.ids, 1) LOOP
            UPDATE users
            SET username = dup.username || counter
            WHERE id = dup.ids[i];
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Now make it NOT NULL and UNIQUE
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT uk_users_username UNIQUE (username);
CREATE INDEX idx_users_username ON users(username);
