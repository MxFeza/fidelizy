-- Run this in the Supabase SQL editor before deploying this version
-- Adds a unique short code field to businesses for easy client lookup

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS short_code TEXT UNIQUE;
