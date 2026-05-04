CREATE TABLE IF NOT EXISTS addresses (
    id              BIGSERIAL    PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(50)  NOT NULL,
    address_line1   VARCHAR(255) NOT NULL,
    address_line2   VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    postal_code     VARCHAR(20)  NOT NULL,
    country         VARCHAR(100) NOT NULL DEFAULT 'India',
    address_type    VARCHAR(20)  DEFAULT 'HOME',
    is_default      BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_address_id BIGINT REFERENCES addresses(id) ON DELETE SET NULL;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

-- FIX: unit_price was nullable but CartItem.java declares it NOT NULL.
-- Added NOT NULL DEFAULT 0 to match the entity, then backfill from products.
ALTER TABLE cart_items
    ADD COLUMN IF NOT EXISTS unit_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE cart_items ci
SET unit_price = p.price
FROM products p
WHERE ci.product_id = p.id
  AND ci.unit_price = 0;