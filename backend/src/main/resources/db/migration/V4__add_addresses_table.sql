


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

-- 2. Add shipping_address_id to orders (Order.java has @ManyToOne Address)
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_address_id BIGINT REFERENCES addresses(id) ON DELETE SET NULL;

-- 3. Add view_count to products (Product.java has @Column view_count)
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

-- 4. Add missing columns to cart_items (CartItem.java has unit_price, created_at, updated_at)
ALTER TABLE cart_items
    ADD COLUMN IF NOT EXISTS unit_price  DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
