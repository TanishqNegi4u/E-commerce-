-- V3: Add max_usage column to coupons (C5 fix)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_usage INT NULL;

-- Update existing coupons to have a sensible default (100 uses)
UPDATE coupons SET max_usage = 100 WHERE max_usage IS NULL AND active = true;