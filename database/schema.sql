-- ============================================================
-- ShopWave Database Schema
-- MySQL 8.0
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS wishlist_products;
DROP TABLE IF EXISTS wishlists;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_specs;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('CUSTOMER','SELLER','ADMIN','SUPER_ADMIN') DEFAULT 'CUSTOMER',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
);

-- ── Categories ────────────────────────────────────────────────
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    parent_id BIGINT,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_category_parent (parent_id),
    INDEX idx_category_slug (slug)
);

-- ── Products ──────────────────────────────────────────────────
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    highlights TEXT,
    price DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2),
    discount_percent INT,
    stock INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    brand VARCHAR(100),
    slug VARCHAR(255) UNIQUE,
    category_id BIGINT NOT NULL,
    seller_id BIGINT,
    average_rating DOUBLE DEFAULT 0.0,
    total_reviews INT DEFAULT 0,
    total_sold INT DEFAULT 0,
    free_shipping BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    status ENUM('ACTIVE','INACTIVE','OUT_OF_STOCK','DISCONTINUED') DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product_category (category_id),
    INDEX idx_product_status (status),
    INDEX idx_product_brand (brand),
    FULLTEXT INDEX ft_product_search (name, description, brand)
);

-- ── Product Images ────────────────────────────────────────────
CREATE TABLE product_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── Product Specs ─────────────────────────────────────────────
CREATE TABLE product_specs (
    product_id BIGINT NOT NULL,
    spec_key VARCHAR(100) NOT NULL,
    spec_value VARCHAR(500),
    PRIMARY KEY (product_id, spec_key),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── Addresses ─────────────────────────────────────────────────
CREATE TABLE addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(500) NOT NULL,
    address_line2 VARCHAR(500),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    address_type ENUM('HOME','WORK','OTHER') DEFAULT 'HOME',
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_address_user (user_id)
);

-- ── Coupons ───────────────────────────────────────────────────
CREATE TABLE coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type ENUM('PERCENTAGE','FIXED') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    valid_from DATETIME,
    valid_until DATETIME,
    active BOOLEAN DEFAULT TRUE,
    INDEX idx_coupon_code (code)
);

-- ── Orders ────────────────────────────────────────────────────
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    subtotal DECIMAL(12,2),
    shipping_charge DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    status ENUM('PENDING','CONFIRMED','PROCESSING','SHIPPED',
                'OUT_FOR_DELIVERY','DELIVERED','CANCELLED',
                'RETURNED','REFUNDED') DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    payment_status ENUM('PENDING','PAID','FAILED','REFUNDED') DEFAULT 'PENDING',
    shipping_address_id BIGINT,
    coupon_code VARCHAR(50),
    notes TEXT,
    estimated_delivery DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    INDEX idx_order_user (user_id),
    INDEX idx_order_status (status),
    INDEX idx_order_number (order_number)
);

-- ── Order Items ───────────────────────────────────────────────
CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    product_name VARCHAR(255),
    product_image VARCHAR(500),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_orderitem_order (order_id)
);

-- ── Carts ─────────────────────────────────────────────────────
CREATE TABLE carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Cart Items ────────────────────────────────────────────────
CREATE TABLE cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY unique_cart_product (cart_id, product_id)
);

-- ── Reviews ───────────────────────────────────────────────────
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255),
    body TEXT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product_review (user_id, product_id),
    INDEX idx_review_product (product_id)
);

-- ── Wishlists ─────────────────────────────────────────────────
CREATE TABLE wishlists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE wishlist_products (
    wishlist_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    PRIMARY KEY (wishlist_id, product_id),
    FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── Order Status History ──────────────────────────────────────
CREATE TABLE order_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    status ENUM('PENDING','CONFIRMED','PROCESSING','SHIPPED',
                'OUT_FOR_DELIVERY','DELIVERED','CANCELLED',
                'RETURNED','REFUNDED') NOT NULL,
    comment VARCHAR(500),
    updated_by VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_history_order (order_id)
);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Admin user (password: admin123)
INSERT INTO users (email, password, first_name, last_name, role, is_active, email_verified)
VALUES ('admin@shopwave.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i',
        'Admin', 'ShopWave', 'ADMIN', TRUE, TRUE);

-- Categories
INSERT INTO categories (name, slug, description, display_order) VALUES
('Electronics', 'electronics', 'Gadgets and devices', 1),
('Fashion', 'fashion', 'Clothing and accessories', 2),
('Home & Living', 'home', 'Home decor and appliances', 3),
('Sports', 'sports', 'Sports and fitness', 4),
('Beauty', 'beauty', 'Beauty and personal care', 5),
('Books', 'books', 'Books and stationery', 6);

-- Sample Products
INSERT INTO products (name, description, price, original_price, discount_percent,
    stock, brand, slug, category_id, seller_id, average_rating,
    total_reviews, total_sold, free_shipping, is_featured, status)
VALUES
('iPhone 15 Pro Max', 'Latest Apple flagship with titanium design',
    134900, 149900, 10, 15, 'Apple', 'iphone-15-pro-max',
    1, 1, 4.8, 2341, 890, TRUE, TRUE, 'ACTIVE'),

('Samsung 65 4K QLED TV', 'Stunning 4K display with quantum dots',
    89999, 129999, 31, 8, 'Samsung', 'samsung-65-4k-qled-tv',
    1, 1, 4.6, 876, 234, TRUE, TRUE, 'ACTIVE'),

('Sony WH-1000XM5', 'Industry leading noise cancellation headphones',
    29990, 39990, 25, 20, 'Sony', 'sony-wh-1000xm5',
    1, 1, 4.9, 3456, 1200, TRUE, TRUE, 'ACTIVE'),

('Nike Air Max 270', 'Comfortable running shoes with air cushioning',
    12995, 15995, 19, 42, 'Nike', 'nike-air-max-270',
    2, 1, 4.5, 1234, 567, FALSE, FALSE, 'ACTIVE'),

('MacBook Air M2', 'Supercharged by M2 chip',
    114900, 119900, 4, 10, 'Apple', 'macbook-air-m2',
    1, 1, 4.9, 1567, 445, TRUE, TRUE, 'ACTIVE'),

('Atomic Habits', 'Tiny changes remarkable results by James Clear',
    399, 799, 50, 500, 'Penguin', 'atomic-habits',
    6, 1, 4.8, 9876, 5000, TRUE, TRUE, 'ACTIVE');

-- Coupons
INSERT INTO coupons (code, discount_type, discount_value,
    min_order_amount, usage_limit, valid_until, active)
VALUES
('WELCOME10', 'PERCENTAGE', 10, 500, 1000,
    DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE),
('FLAT500', 'FIXED', 500, 2000, 500,
    DATE_ADD(NOW(), INTERVAL 6 MONTH), TRUE),
('SHOPWAVE20', 'PERCENTAGE', 20, 1000, 200,
    DATE_ADD(NOW(), INTERVAL 3 MONTH), TRUE);