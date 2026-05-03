-- ═══════════════════════════════════════════════════════════════
-- ShopWave V2 — Seed Data
-- ═══════════════════════════════════════════════════════════════

-- Categories
INSERT INTO categories (name, slug, active) VALUES
('Electronics', 'electronics', true),
('Mobiles & Tablets', 'mobiles-tablets', true),
('Laptops & Computers', 'laptops-computers', true),
('Audio & Headphones', 'audio-headphones', true),
('Cameras & Photography', 'cameras-photography', true),
('TV & Home Theatre', 'tv-home-theatre', true),
('Fashion & Clothing', 'fashion-clothing', true),
('Footwear', 'footwear', true),
('Watches & Accessories', 'watches-accessories', true),
('Home & Kitchen', 'home-kitchen', true),
('Beauty & Skincare', 'beauty-skincare', true),
('Sports & Fitness', 'sports-fitness', true),
('Books', 'books', true),
('Gaming', 'gaming', true)
ON CONFLICT (slug) DO NOTHING;

-- Admin user (password: Admin@123 — BCrypt(12))
INSERT INTO users (email, password, first_name, last_name, role, is_active, created_at, updated_at)
VALUES ('admin@shopwave.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NJzMaGEty', 'Admin', 'ShopWave', 'ADMIN', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Demo seller
INSERT INTO users (email, password, first_name, last_name, role, is_active, created_at, updated_at)
VALUES ('seller@shopwave.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NJzMaGEty', 'Demo', 'Seller', 'SELLER', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Coupons
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, active)
VALUES
('WELCOME10', 'PERCENTAGE', 10, 500, 200, true),
('FLAT200', 'FLAT', 200, 1000, 200, true),
('SAVE20', 'PERCENTAGE', 20, 2000, 500, true)
ON CONFLICT (code) DO NOTHING;

-- Products
INSERT INTO products (name, slug, description, price, original_price, discount_percent, stock, sku, brand, category_id, average_rating, total_reviews, is_featured, is_active, status, free_shipping, image_url)
SELECT * FROM (VALUES
  ('iPhone 15 Pro', 'iphone-15-pro', 'Apple A17 Pro chip, 48MP camera, titanium design', 134900, 149900, 10, 50, 'IPH15P-001', 'Apple', (SELECT id FROM categories WHERE slug='mobiles-tablets'), 4.8, 2341, true, true, 'ACTIVE', true, 'https://images.unsplash.com/photo-1695048133142-1a20484429be?w=400'),
  ('Samsung Galaxy S24 Ultra', 'samsung-s24-ultra', 'Snapdragon 8 Gen 3, 200MP camera, S Pen included', 124999, 134999, 7, 35, 'SGS24U-001', 'Samsung', (SELECT id FROM categories WHERE slug='mobiles-tablets'), 4.7, 1876, true, true, 'ACTIVE', true, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'),
  ('MacBook Pro 14 M3', 'macbook-pro-14-m3', 'Apple M3 chip, 14-inch Liquid Retina XDR, 18hr battery', 168990, 189990, 11, 20, 'MBP14M3-001', 'Apple', (SELECT id FROM categories WHERE slug='laptops-computers'), 4.9, 987, true, true, 'ACTIVE', true, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'),
  ('Sony WH-1000XM5', 'sony-wh-1000xm5', 'Industry-leading noise cancelling headphones, 30hr battery', 26990, 34990, 23, 80, 'SNYWH5-001', 'Sony', (SELECT id FROM categories WHERE slug='audio-headphones'), 4.8, 3421, true, true, 'ACTIVE', true, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'),
  ('Dell XPS 15', 'dell-xps-15', 'Intel Core i9-13900H, RTX 4060, 15.6" OLED display', 179990, 199990, 10, 15, 'DXPS15-001', 'Dell', (SELECT id FROM categories WHERE slug='laptops-computers'), 4.6, 654, true, true, 'ACTIVE', true, 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400'),
  ('Canon EOS R6 Mark II', 'canon-eos-r6-ii', '24.2MP full-frame mirrorless, 4K video, IBIS', 214995, 239995, 10, 12, 'CEOSRII-001', 'Canon', (SELECT id FROM categories WHERE slug='cameras-photography'), 4.7, 432, true, true, 'ACTIVE', true, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400'),
  ('Samsung 65" QLED 4K TV', 'samsung-65-qled', 'Quantum HDR, 120Hz, Smart TV with Tizen OS', 89990, 109990, 18, 30, 'SQLED65-001', 'Samsung', (SELECT id FROM categories WHERE slug='tv-home-theatre'), 4.5, 892, true, true, 'ACTIVE', true, 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400'),
  ('Nike Air Max 270', 'nike-air-max-270', 'Lightweight running shoe with Max Air unit heel', 12995, 15995, 19, 120, 'NAM270-001', 'Nike', (SELECT id FROM categories WHERE slug='footwear'), 4.4, 2109, false, true, 'ACTIVE', false, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'),
  ('Rolex Submariner', 'rolex-submariner', 'Professional divers watch, 300m waterproof, Oystersteel', 849500, 849500, 0, 5, 'RLXSUB-001', 'Rolex', (SELECT id FROM categories WHERE slug='watches-accessories'), 5.0, 187, true, true, 'ACTIVE', true, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'),
  ('Dyson V15 Detect', 'dyson-v15-detect', 'Laser reveals invisible dust, up to 60min runtime', 52900, 62900, 16, 45, 'DV15D-001', 'Dyson', (SELECT id FROM categories WHERE slug='home-kitchen'), 4.7, 1234, false, true, 'ACTIVE', true, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
  ('OnePlus 12', 'oneplus-12', 'Snapdragon 8 Gen 3, Hasselblad camera, 100W charging', 64999, 69999, 7, 60, 'OP12-001', 'OnePlus', (SELECT id FROM categories WHERE slug='mobiles-tablets'), 4.6, 876, false, true, 'ACTIVE', true, 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400'),
  ('Bose QuietComfort 45', 'bose-qc45', 'Legendary noise cancellation, 24hr battery, foldable', 24990, 29990, 17, 90, 'BQCE45-001', 'Bose', (SELECT id FROM categories WHERE slug='audio-headphones'), 4.6, 2341, false, true, 'ACTIVE', false, 'https://images.unsplash.com/photo-1546435770-a3e736e8b9f0?w=400'),
  ('Adidas Ultraboost 23', 'adidas-ultraboost-23', 'Responsive Boost midsole, Primeknit upper, energy return', 16999, 19999, 15, 200, 'AUB23-001', 'Adidas', (SELECT id FROM categories WHERE slug='footwear'), 4.5, 1567, false, true, 'ACTIVE', false, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400'),
  ('iPad Pro 12.9" M2', 'ipad-pro-129-m2', 'Apple M2 chip, Liquid Retina XDR, Apple Pencil support', 112900, 124900, 10, 40, 'IPPROM2-001', 'Apple', (SELECT id FROM categories WHERE slug='mobiles-tablets'), 4.8, 1023, true, true, 'ACTIVE', true, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'),
  ('PlayStation 5', 'playstation-5', 'Next-gen gaming console, 825GB SSD, 4K 120fps', 54990, 54990, 0, 25, 'PS5-001', 'Sony', (SELECT id FROM categories WHERE slug='gaming'), 4.9, 4321, true, true, 'ACTIVE', true, 'https://images.unsplash.com/photo-1607853202273-232359bb824e?w=400'),
  ('Nike Dri-FIT Training Shirt', 'nike-drifit-shirt', 'Moisture-wicking fabric, athletic fit, UV protection', 1999, 2999, 33, 500, 'NDFT-001', 'Nike', (SELECT id FROM categories WHERE slug='fashion-clothing'), 4.3, 876, false, true, 'ACTIVE', false, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400')
) AS v(name, slug, description, price, original_price, discount_percent, stock, sku, brand, category_id, average_rating, total_reviews, is_featured, is_active, status, free_shipping, image_url)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = v.sku);