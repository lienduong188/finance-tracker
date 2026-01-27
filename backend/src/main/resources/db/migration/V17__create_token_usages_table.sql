-- Token usage tracking for AI chatbot
CREATE TABLE token_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    model VARCHAR(50),
    feature VARCHAR(50),
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_token_usages_user_id ON token_usages(user_id);
CREATE INDEX idx_token_usages_created_at ON token_usages(created_at);
CREATE INDEX idx_token_usages_user_created ON token_usages(user_id, created_at);
CREATE INDEX idx_token_usages_feature ON token_usages(feature);
