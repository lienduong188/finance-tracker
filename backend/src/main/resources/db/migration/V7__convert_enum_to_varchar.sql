-- V7: Convert PostgreSQL enum types to VARCHAR for Hibernate compatibility
-- This migration is idempotent - safe to run multiple times

-- Convert accounts.type from account_type to VARCHAR (skip if already VARCHAR)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'accounts' AND column_name = 'type'
               AND udt_name = 'account_type') THEN
        ALTER TABLE accounts ALTER COLUMN type TYPE VARCHAR(50) USING type::text;
    END IF;
END $$;

-- Convert categories.type from category_type to VARCHAR
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'categories' AND column_name = 'type'
               AND udt_name = 'category_type') THEN
        ALTER TABLE categories ALTER COLUMN type TYPE VARCHAR(50) USING type::text;
    END IF;
END $$;

-- Convert transactions.type from transaction_type to VARCHAR
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'transactions' AND column_name = 'type'
               AND udt_name = 'transaction_type') THEN
        ALTER TABLE transactions ALTER COLUMN type TYPE VARCHAR(50) USING type::text;
    END IF;
END $$;

-- Convert budgets.period from budget_period to VARCHAR
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'budgets' AND column_name = 'period'
               AND udt_name = 'budget_period') THEN
        ALTER TABLE budgets ALTER COLUMN period DROP DEFAULT;
        ALTER TABLE budgets ALTER COLUMN period TYPE VARCHAR(50) USING period::text;
        ALTER TABLE budgets ALTER COLUMN period SET DEFAULT 'MONTHLY';
    END IF;
END $$;

-- Drop the enum types with CASCADE
DROP TYPE IF EXISTS account_type CASCADE;
DROP TYPE IF EXISTS category_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS budget_period CASCADE;
