-- FIX: unit_price was added as nullable in V4 but CartItem.java declares it NOT NULL.
-- Backfill any zero/null values from the product price first, then enforce NOT NULL.

UPDATE cart_items ci
SET unit_price = p.price
FROM products p
WHERE ci.product_id = p.id
  AND (ci.unit_price IS NULL OR ci.unit_price = 0);

ALTER TABLE cart_items
    ALTER COLUMN unit_price SET NOT NULL,
    ALTER COLUMN unit_price SET DEFAULT 0;