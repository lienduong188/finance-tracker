-- Add multi-language name fields to categories table
ALTER TABLE categories ADD COLUMN name_vi VARCHAR(255);
ALTER TABLE categories ADD COLUMN name_en VARCHAR(255);
ALTER TABLE categories ADD COLUMN name_ja VARCHAR(255);
