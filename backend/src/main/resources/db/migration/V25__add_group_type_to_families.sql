-- Add group type to families table
-- Types: FAMILY, FRIENDS, WORK, OTHER
ALTER TABLE families ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'FAMILY';

CREATE INDEX idx_families_type ON families(type);
