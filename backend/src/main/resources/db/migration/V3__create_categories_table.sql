-- V3: Create categories table
CREATE TYPE category_type AS ENUM ('INCOME', 'EXPENSE');

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type category_type NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Insert default system categories
INSERT INTO categories (id, name, type, icon, color, is_system) VALUES
-- Income categories
(gen_random_uuid(), 'Lương', 'INCOME', '💰', '#22c55e', TRUE),
(gen_random_uuid(), 'Thưởng', 'INCOME', '🎁', '#10b981', TRUE),
(gen_random_uuid(), 'Đầu tư', 'INCOME', '📈', '#14b8a6', TRUE),
(gen_random_uuid(), 'Thu nhập khác', 'INCOME', '💵', '#06b6d4', TRUE),

-- Expense categories
(gen_random_uuid(), 'Ăn uống', 'EXPENSE', '🍜', '#ef4444', TRUE),
(gen_random_uuid(), 'Di chuyển', 'EXPENSE', '🚗', '#f97316', TRUE),
(gen_random_uuid(), 'Mua sắm', 'EXPENSE', '🛒', '#f59e0b', TRUE),
(gen_random_uuid(), 'Giải trí', 'EXPENSE', '🎮', '#eab308', TRUE),
(gen_random_uuid(), 'Hóa đơn & Tiện ích', 'EXPENSE', '📄', '#84cc16', TRUE),
(gen_random_uuid(), 'Sức khỏe', 'EXPENSE', '💊', '#22c55e', TRUE),
(gen_random_uuid(), 'Giáo dục', 'EXPENSE', '📚', '#14b8a6', TRUE),
(gen_random_uuid(), 'Gia đình', 'EXPENSE', '👨‍👩‍👧', '#06b6d4', TRUE),
(gen_random_uuid(), 'Chi tiêu khác', 'EXPENSE', '📦', '#8b5cf6', TRUE);
