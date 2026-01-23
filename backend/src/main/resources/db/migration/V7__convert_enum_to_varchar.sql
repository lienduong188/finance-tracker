-- V7: Convert PostgreSQL enum types to VARCHAR for Hibernate compatibility

-- Convert accounts.type from account_type to VARCHAR
ALTER TABLE accounts ALTER COLUMN type TYPE VARCHAR(50) USING type::text;

-- Convert categories.type from category_type to VARCHAR
ALTER TABLE categories ALTER COLUMN type TYPE VARCHAR(50) USING type::text;

-- Convert transactions.type from transaction_type to VARCHAR
ALTER TABLE transactions ALTER COLUMN type TYPE VARCHAR(50) USING type::text;

-- Convert budgets.period from budget_period to VARCHAR
ALTER TABLE budgets ALTER COLUMN period TYPE VARCHAR(50) USING period::text;

-- Drop the enum types (optional, but keeps DB clean)
DROP TYPE IF EXISTS account_type;
DROP TYPE IF EXISTS category_type;
DROP TYPE IF EXISTS transaction_type;
DROP TYPE IF EXISTS budget_period;
