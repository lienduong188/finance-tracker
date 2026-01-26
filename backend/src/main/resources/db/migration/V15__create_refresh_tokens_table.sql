-- Create refresh_tokens table for token rotation
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    device_info VARCHAR(500),
    ip_address VARCHAR(45),
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index for token lookup
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Index for user lookup
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Index for cleanup job (expired/revoked tokens)
CREATE INDEX idx_refresh_tokens_expires_revoked ON refresh_tokens(expires_at, revoked);
