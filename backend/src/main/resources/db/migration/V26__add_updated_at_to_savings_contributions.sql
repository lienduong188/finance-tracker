-- Add missing updated_at column to savings_contributions table
ALTER TABLE savings_contributions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
