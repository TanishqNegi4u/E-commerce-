-- ═══════════════════════════════════════════════════════
--  ShopWave — Seed Data
--  Categories + 60 professional products
-- ═══════════════════════════════════════════════════════

-- ── CATEGORIES ───────────────────────────────────────────

INSERT INTO categories (name, slug, active)
SELECT 'Electronics', 'electronics', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Electronics');

INSERT INTO categories (name, slug, active)
SELECT 'Mobiles & Tablets', 'mobiles-tablets', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Mobiles & Tablets');

INSERT INTO categories (name, slug, active)
SELECT 'Laptops & Computers', 'laptops-computers', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Laptops & Computers');

INSERT INTO categories (name, slug, active)
SELECT 'Audio & Headphones', 'audio-headphones', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Audio & Headphones');

INSERT INTO categories (name, slug, active)
SELECT 'Cameras & Photography', 'cameras-photography', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Cameras & Photography');

INSERT INTO categories (name, slug, active)
SELECT 'TV & Home Theatre', 'tv-home-theatre', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='TV & Home Theatre');

INSERT INTO categories (name, slug, active)
SELECT 'Fashion & Clothing', 'fashion-clothing', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Fashion & Clothing');

INSERT INTO categories (name, slug, active)
SELECT 'Footwear', 'footwear', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Footwear');

INSERT INTO categories (name, slug, active)
SELECT 'Watches & Accessories', 'watches-accessories', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Watches & Accessories');

INSERT INTO categories (name, slug, active)
SELECT 'Home & Kitchen', 'home-kitchen', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Home & Kitchen');

INSERT INTO categories (name, slug, active)
SELECT 'Beauty & Skincare', 'beauty-skincare', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Beauty & Skincare');

INSERT INTO categories (name, slug, active)
SELECT 'Sports & Fitness', 'sports-fitness', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Sports & Fitness');

INSERT INTO categories (name, slug, active)
SELECT 'Books', 'books', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Books');

INSERT INTO categories (name, slug, active)
SELECT 'Toys & Games', 'toys-games', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Toys & Games');

INSERT INTO categories (name, slug, active)
SELECT 'Automotive', 'automotive', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Automotive');


-- ═══════════════════════════════════════════════════════
--  MOBILES & TABLETS  (category_id = 2)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Samsung Galaxy S24 Ultra 256GB', 'samsung-galaxy-s24-ultra', 'Samsung', 124999, 149999, 18, '6.8" QHD+ Dynamic AMOLED, 200MP camera, S Pen included, Snapdragon 8 Gen 3, 5000mAh battery', true, true, true, 'ACTIVE', 4.8, 3241, 12400, 980, NOW(), NOW(), 2
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='samsung-galaxy-s24-ultra');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Apple iPhone 15 Pro Max 256GB', 'apple-iphone-15-pro-max', 'Apple', 159900, 189900, 10, '6.7" Super Retina XDR, A17 Pro chip, 48MP ProRAW camera, Titanium design, USB-C', true, true, true, 'ACTIVE', 4.9, 5621, 28000, 1540, NOW(), NOW(), 2
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='apple-iphone-15-pro-max');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'OnePlus 12 256GB', 'oneplus-12-256gb', 'OnePlus', 64999, 74999, 35, '6.82" LTPO AMOLED 120Hz, Snapdragon 8 Gen 3, 50MP Hasselblad camera, 100W SUPERVOOC charging', true, true, false, 'ACTIVE', 4.6, 2187, 8900, 720, NOW(), NOW(), 2
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='oneplus-12-256gb');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Google Pixel 8 Pro 128GB', 'google-pixel-8-pro', 'Google', 84999, 106999, 22, '6.7" LTPO OLED, Google Tensor G3, 50MP triple camera, 7 years OS updates, Magic Eraser', true, true, false, 'ACTIVE', 4.7, 1893, 7200, 610, NOW(), NOW(), 2
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='google-pixel-8-pro');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Xiaomi 14 Ultra 512GB', 'xiaomi-14-ultra', 'Xiaomi', 99999, 119999, 14, '6.73" LTPO AMOLED, Snapdragon 8 Gen 3, Leica quad camera 50MP, 90W HyperCharge', true, true, false, 'ACTIVE', 4.5, 1432, 5600, 430, NOW(), NOW(), 2
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='xiaomi-14-ultra');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Apple iPad Pro 12.9" M2 WiFi 256GB', 'apple-ipad-pro-12-m2', 'Apple', 112900, 139900, 9, '12.9" Liquid Retina XDR, M2 chip, Face ID, Thunderbolt, ProMotion 120Hz, 10-hour battery', true, true, true, 'ACTIVE', 4.8, 2109, 9800, 540, NOW(), NOW(), 2
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='apple-ipad-pro-12-m2');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Samsung Galaxy Tab S9 Ultra', 'samsung-galaxy-tab-s9-ultra', 'Samsung', 108999, 134999, 11, '14.6" Dynamic AMOLED 2X, Snapdragon 8 Gen 2, S Pen included, IP68, 12000mAh battery', true, true, false, 'ACTIVE', 4.7, 987, 4300, 310, NOW(), NOW(), 2
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='samsung-galaxy-tab-s9-ultra');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Realme GT 5 Pro 256GB', 'realme-gt5-pro', 'Realme', 34999, 42999, 48, '6.78" LTPO AMOLED 144Hz, Snapdragon 8 Gen 3, 50MP Sony IMX890, 100W SuperVOOC', false, true, false, 'ACTIVE', 4.3, 1654, 5400, 390, NOW(), NOW(), 2
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='realme-gt5-pro');


-- ═══════════════════════════════════════════════════════
--  LAPTOPS & COMPUTERS  (category_id = 3)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Apple MacBook Pro 16" M3 Pro 512GB', 'apple-macbook-pro-16-m3-pro', 'Apple', 249990, 299990, 7, '16" Liquid Retina XDR, M3 Pro chip, 18GB RAM, 22-hour battery, MagSafe, Thunderbolt 4', true, true, true, 'ACTIVE', 4.9, 2341, 18900, 870, NOW(), NOW(), 3
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='apple-macbook-pro-16-m3-pro');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Apple MacBook Air 13" M2 256GB', 'apple-macbook-air-13-m2', 'Apple', 114900, 134900, 20, '13.6" Liquid Retina, M2 chip, 8GB RAM, fanless design, 18-hour battery, MagSafe 3', true, true, true, 'ACTIVE', 4.8, 4312, 21000, 1650, NOW(), NOW(), 3
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='apple-macbook-air-13-m2');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Dell XPS 15 Intel i9 RTX 4060', 'dell-xps-15-i9-rtx4060', 'Dell', 189990, 219990, 8, '15.6" OLED 3.5K Touch, Intel Core i9-13900H, 32GB DDR5, RTX 4060, 1TB NVMe SSD', true, true, false, 'ACTIVE', 4.6, 876, 7600, 290, NOW(), NOW(), 3
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='dell-xps-15-i9-rtx4060');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'ASUS ROG Zephyrus G14 2024', 'asus-rog-zephyrus-g14-2024', 'ASUS', 164990, 194990, 12, '14" QHD+ 165Hz, AMD Ryzen 9 8945HS, RX 7900S 16GB, 32GB RAM, 1TB SSD, AniMe Matrix LED', true, true, true, 'ACTIVE', 4.7, 1243, 9800, 480, NOW(), NOW(), 3
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='asus-rog-zephyrus-g14-2024');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Lenovo ThinkPad X1 Carbon Gen 11', 'lenovo-thinkpad-x1-carbon-gen11', 'Lenovo', 144990, 169990, 15, '14" IPS Anti-glare, Intel Core i7-1365U, 16GB LPDDR5, 512GB SSD, Military-grade MIL-SPEC', true, true, false, 'ACTIVE', 4.6, 743, 4500, 230, NOW(), NOW(), 3
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='lenovo-thinkpad-x1-carbon-gen11');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'HP Spectre x360 14" OLED', 'hp-spectre-x360-14-oled', 'HP', 159990, 184990, 9, '14" 2.8K OLED Touch 120Hz, Intel Core Ultra 7, 16GB RAM, 1TB SSD, 360° convertible', true, true, false, 'ACTIVE', 4.5, 654, 3800, 190, NOW(), NOW(), 3
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='hp-spectre-x360-14-oled');


-- ═══════════════════════════════════════════════════════
--  AUDIO & HEADPHONES  (category_id = 4)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Sony WH-1000XM5 Wireless Headphones', 'sony-wh-1000xm5', 'Sony', 29990, 39990, 34, 'Industry-leading noise cancellation, 30-hour battery, Multipoint connection, LDAC Hi-Res Audio', false, true, true, 'ACTIVE', 4.8, 5621, 24000, 2100, NOW(), NOW(), 4
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='sony-wh-1000xm5');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Bose QuietComfort Ultra Headphones', 'bose-quietcomfort-ultra', 'Bose', 34900, 42900, 22, 'Immersive Audio, world-class noise cancellation, 24hr battery, CustomTune technology', false, true, true, 'ACTIVE', 4.7, 3214, 14000, 1230, NOW(), NOW(), 4
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='bose-quietcomfort-ultra');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Apple AirPods Pro 2nd Generation', 'apple-airpods-pro-2', 'Apple', 24900, 29900, 45, 'Active Noise Cancellation, Adaptive Transparency, Personalized Spatial Audio, H2 chip, MagSafe', false, true, true, 'ACTIVE', 4.8, 8921, 38000, 3400, NOW(), NOW(), 4
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='apple-airpods-pro-2');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Samsung Galaxy Buds3 Pro', 'samsung-galaxy-buds3-pro', 'Samsung', 17999, 22999, 38, 'Blade-type design, ANC, 360° Audio, Blade Lights, 6-hour battery + 24hr case', false, true, false, 'ACTIVE', 4.5, 2109, 8700, 780, NOW(), NOW(), 4
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='samsung-galaxy-buds3-pro');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'JBL Flip 6 Portable Bluetooth Speaker', 'jbl-flip-6', 'JBL', 9999, 13999, 67, 'IP67 waterproof & dustproof, 12-hour playtime, PartyBoost, bold JBL Original Pro Sound', false, true, false, 'ACTIVE', 4.6, 7843, 29000, 3200, NOW(), NOW(), 4
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='jbl-flip-6');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Bose SoundLink Max Portable Speaker', 'bose-soundlink-max', 'Bose', 39900, 46900, 18, 'Biggest and loudest SoundLink ever, IP67, 20-hour battery, Party Mode, premium carry handle', false, true, false, 'ACTIVE', 4.7, 1243, 5400, 430, NOW(), NOW(), 4
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='bose-soundlink-max');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Sennheiser Momentum 4 Wireless', 'sennheiser-momentum-4', 'Sennheiser', 26990, 34990, 16, '60-hour battery life, Adaptive Noise Cancellation, Sound Personalization, Crystal-clear calls', false, true, false, 'ACTIVE', 4.6, 987, 4200, 320, NOW(), NOW(), 4
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='sennheiser-momentum-4');


-- ═══════════════════════════════════════════════════════
--  TV & HOME THEATRE  (category_id = 6)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'LG 65" C3 OLED evo 4K Smart TV', 'lg-65-c3-oled-4k', 'LG', 159990, 219990, 6, 'Self-lit OLED pixels, Infinite contrast, α9 AI Processor 4K Gen6, Dolby Vision IQ, webOS 23', true, true, true, 'ACTIVE', 4.9, 1876, 12000, 430, NOW(), NOW(), 6
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='lg-65-c3-oled-4k');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Samsung 55" QN90C Neo QLED 4K TV', 'samsung-55-qn90c-neo-qled', 'Samsung', 124990, 164990, 8, 'Quantum Matrix Technology Pro, Neural Quantum Processor 4K, Anti-Reflection, Object Tracking Sound+', true, true, true, 'ACTIVE', 4.7, 1432, 8700, 340, NOW(), NOW(), 6
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='samsung-55-qn90c-neo-qled');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Sony 50" X90L BRAVIA XR 4K Google TV', 'sony-50-x90l-bravia-xr', 'Sony', 89990, 119990, 11, 'XR Cognitive Processor, XR Triluminos Pro, Acoustic Multi-Audio, Google TV, HDMI 2.1', true, true, false, 'ACTIVE', 4.6, 876, 5400, 260, NOW(), NOW(), 6
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='sony-50-x90l-bravia-xr');


-- ═══════════════════════════════════════════════════════
--  CAMERAS & PHOTOGRAPHY  (category_id = 5)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Sony Alpha A7 IV Mirrorless Camera', 'sony-alpha-a7-iv', 'Sony', 259990, 299990, 5, '33MP full-frame BSI CMOS, 4K 60p video, Real-time Eye AF, 5-axis stabilization, CFexpress A', true, true, true, 'ACTIVE', 4.9, 1243, 8900, 180, NOW(), NOW(), 5
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='sony-alpha-a7-iv');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Canon EOS R6 Mark II Mirrorless', 'canon-eos-r6-mark-ii', 'Canon', 239990, 274990, 6, '40MP full-frame CMOS, 4K 60p RAW, 40fps burst, Dual Pixel CMOS AF II, In-body stabilization', true, true, false, 'ACTIVE', 4.8, 987, 6500, 150, NOW(), NOW(), 5
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='canon-eos-r6-mark-ii');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'GoPro HERO12 Black', 'gopro-hero12-black', 'GoPro', 44990, 54990, 28, '5.3K60 video, 27MP photos, HyperSmooth 6.0, Enduro battery, Waterproof 10m, HDR video', false, true, false, 'ACTIVE', 4.7, 3421, 14000, 1200, NOW(), NOW(), 5
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='gopro-hero12-black');


-- ═══════════════════════════════════════════════════════
--  FASHION & CLOTHING  (category_id = 7)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Levi''s 511 Slim Fit Jeans', 'levis-511-slim-fit-jeans', 'Levi''s', 3499, 4999, 120, 'Slim fit through thigh and leg, sits below waist, stretch denim for all-day comfort, classic 5-pocket styling', false, true, false, 'ACTIVE', 4.5, 6782, 28000, 4300, NOW(), NOW(), 7
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='levis-511-slim-fit-jeans');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Allen Solly Formal Slim Fit Shirt', 'allen-solly-formal-slim-shirt', 'Allen Solly', 1299, 2199, 200, 'Premium cotton blend, slim fit, wrinkle-resistant, spread collar, available in 8 colours', false, true, false, 'ACTIVE', 4.3, 4312, 16000, 3200, NOW(), NOW(), 7
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='allen-solly-formal-slim-shirt');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Nike Dri-FIT Training T-Shirt', 'nike-dri-fit-training-tshirt', 'Nike', 2495, 3295, 150, 'Sweat-wicking Dri-FIT technology, standard fit, crew neck, 100% recycled polyester, reflective Swoosh', false, true, false, 'ACTIVE', 4.4, 5621, 22000, 4100, NOW(), NOW(), 7
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='nike-dri-fit-training-tshirt');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'H&M Oversized Hoodie', 'hm-oversized-hoodie', 'H&M', 1999, 2999, 180, 'Soft brushed-inside fabric, oversized fit, kangaroo pocket, ribbed cuffs and hem, unisex design', false, true, false, 'ACTIVE', 4.2, 3109, 12000, 2400, NOW(), NOW(), 7
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='hm-oversized-hoodie');


-- ═══════════════════════════════════════════════════════
--  FOOTWEAR  (category_id = 8)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Nike Air Max 270 React', 'nike-air-max-270-react', 'Nike', 14995, 19995, 45, 'Max Air 270 unit for all-day comfort, React foam midsole, breathable mesh upper, rubber outsole', false, true, true, 'ACTIVE', 4.6, 4312, 18000, 2300, NOW(), NOW(), 8
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='nike-air-max-270-react');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Adidas Ultraboost 23 Running Shoes', 'adidas-ultraboost-23', 'Adidas', 17999, 24999, 38, 'BOOST midsole for incredible energy return, Primeknit+ upper, Continental rubber outsole, Linear Energy Push system', false, true, true, 'ACTIVE', 4.5, 3876, 15000, 1980, NOW(), NOW(), 8
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='adidas-ultraboost-23');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Puma RS-X Reinvention Sneakers', 'puma-rsx-reinvention', 'Puma', 8999, 12999, 56, 'Retro running meets street style, thick chunky sole, mesh and suede upper, RS cushioning system', false, true, false, 'ACTIVE', 4.3, 2109, 8700, 1100, NOW(), NOW(), 8
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='puma-rsx-reinvention');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Skechers Go Walk 6 Slip-On', 'skechers-go-walk-6', 'Skechers', 4999, 6999, 89, 'Ultra-lightweight, Goga Max insole, 5GEN midsole, machine washable, air-cooled Memory Foam', false, true, false, 'ACTIVE', 4.4, 5678, 21000, 3400, NOW(), NOW(), 8
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='skechers-go-walk-6');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Red Tape Formal Derby Shoes', 'red-tape-formal-derby', 'Red Tape', 3499, 5499, 70, 'Genuine leather upper, cushioned insole, derby lace-up closure, flexible rubber sole, classic formal design', false, true, false, 'ACTIVE', 4.2, 3421, 12000, 1800, NOW(), NOW(), 8
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='red-tape-formal-derby');


-- ═══════════════════════════════════════════════════════
--  WATCHES & ACCESSORIES  (category_id = 9)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Apple Watch Series 9 GPS 45mm', 'apple-watch-series-9-gps-45mm', 'Apple', 44900, 52900, 25, 'S9 chip, Double Tap gesture, Always-On Retina display, ECG, Blood Oxygen, Crash Detection, 18hr battery', true, true, true, 'ACTIVE', 4.8, 6541, 28000, 2300, NOW(), NOW(), 9
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='apple-watch-series-9-gps-45mm');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Samsung Galaxy Watch 6 Classic 47mm', 'samsung-galaxy-watch6-classic-47mm', 'Samsung', 34999, 43999, 20, 'Rotating bezel, BioActive Sensor, Body Composition, Advanced sleep coaching, Sapphire Crystal glass', false, true, false, 'ACTIVE', 4.6, 2876, 11000, 980, NOW(), NOW(), 9
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='samsung-galaxy-watch6-classic-47mm');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Titan Raga Women Analog Watch', 'titan-raga-women-analog', 'Titan', 8995, 12995, 60, 'Rose gold plated case, mother of pearl dial, leather strap, Swarovski crystals, water resistant 30m', false, true, false, 'ACTIVE', 4.4, 4312, 16000, 2100, NOW(), NOW(), 9
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='titan-raga-women-analog');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Fossil Gen 6 Smartwatch 44mm', 'fossil-gen6-smartwatch-44mm', 'Fossil', 19995, 28995, 30, 'Wear OS by Google, Snapdragon 4100+, SpO2, Heart Rate, 1.28" AMOLED, Fast charging, Speaker', false, true, false, 'ACTIVE', 4.3, 1654, 6800, 480, NOW(), NOW(), 9
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='fossil-gen6-smartwatch-44mm');


-- ═══════════════════════════════════════════════════════
--  HOME & KITCHEN  (category_id = 10)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Dyson V15 Detect Cordless Vacuum', 'dyson-v15-detect', 'Dyson', 59900, 72900, 12, 'Laser detects invisible dust, HEPA filtration captures 99.99% particles, LCD screen, 60min runtime', true, true, true, 'ACTIVE', 4.8, 2341, 12000, 540, NOW(), NOW(), 10
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='dyson-v15-detect');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Instant Pot Duo 7-in-1 Electric Cooker 6L', 'instant-pot-duo-7in1-6l', 'Instant Pot', 9499, 13999, 78, 'Pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker & warmer — 7 in 1', false, true, false, 'ACTIVE', 4.7, 9823, 38000, 4200, NOW(), NOW(), 10
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='instant-pot-duo-7in1-6l');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Philips Air Fryer HD9200 4.1L', 'philips-airfryer-hd9200', 'Philips', 7999, 11999, 55, 'RapidAir technology, up to 90% less fat, 4.1L capacity, 7 presets, touch panel, auto shutoff', false, true, false, 'ACTIVE', 4.5, 7621, 29000, 3800, NOW(), NOW(), 10
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='philips-airfryer-hd9200');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Prestige Iris 750W Mixer Grinder', 'prestige-iris-mixer-grinder', 'Prestige', 3299, 4999, 90, '750W motor, 3 stainless steel jars, 3-speed control with incher, overload protector, 5-year warranty', false, true, false, 'ACTIVE', 4.3, 11234, 42000, 5600, NOW(), NOW(), 10
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='prestige-iris-mixer-grinder');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Nescafe Dolce Gusto Genio S Coffee Machine', 'nescafe-dolce-gusto-genio-s', 'Nescafe', 12999, 18999, 35, '15-bar pressure pump, 0.8L removable water tank, adjustable cup size & temperature, rapid heat-up 30s', false, true, false, 'ACTIVE', 4.4, 3421, 14000, 980, NOW(), NOW(), 10
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='nescafe-dolce-gusto-genio-s');


-- ═══════════════════════════════════════════════════════
--  BEAUTY & SKINCARE  (category_id = 11)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Dyson Airwrap Multi-Styler Complete', 'dyson-airwrap-multi-styler', 'Dyson', 45900, 54900, 14, 'Coanda effect styles and dries simultaneously, no extreme heat damage, 6 attachments, worldwide voltage', false, true, true, 'ACTIVE', 4.8, 4312, 22000, 780, NOW(), NOW(), 11
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='dyson-airwrap-multi-styler');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'The Ordinary Hyaluronic Acid 2% + B5', 'the-ordinary-hyaluronic-acid', 'The Ordinary', 799, 1299, 250, 'Multi-depth hyaluronic acid complex, draws moisture from environment, plumping effect, suitable all skin types', false, true, false, 'ACTIVE', 4.5, 12431, 48000, 8900, NOW(), NOW(), 11
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='the-ordinary-hyaluronic-acid');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Lakme 9to5 Primer + Matte Foundation', 'lakme-9to5-primer-matte-foundation', 'Lakme', 649, 999, 300, 'SPF 20, built-in primer, 16-hour stay, matte finish, covers blemishes, sweat & humidity proof', false, true, false, 'ACTIVE', 4.2, 18921, 72000, 12400, NOW(), NOW(), 11
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='lakme-9to5-primer-matte-foundation');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Neutrogena Hydro Boost Water Gel', 'neutrogena-hydro-boost-water-gel', 'Neutrogena', 1299, 1799, 180, 'Hyaluronic acid-infused gel, oil-free, non-comedogenic, instantly absorbs, 24hr hydration, dermatologist recommended', false, true, false, 'ACTIVE', 4.6, 9876, 38000, 6700, NOW(), NOW(), 11
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='neutrogena-hydro-boost-water-gel');


-- ═══════════════════════════════════════════════════════
--  SPORTS & FITNESS  (category_id = 12)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Garmin Forerunner 965 GPS Running Watch', 'garmin-forerunner-965', 'Garmin', 64990, 79990, 15, 'AMOLED display, Training Readiness, HRV Status, race predictor, 31-day battery, multi-sport GPS', false, true, true, 'ACTIVE', 4.8, 1243, 6800, 280, NOW(), NOW(), 12
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='garmin-forerunner-965');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Decathlon 20kg Adjustable Dumbbell Set', 'decathlon-20kg-adjustable-dumbbell', 'Decathlon', 4999, 7499, 40, 'Quick-adjust dial, 20kg per dumbbell, ergonomic handle, space-saving design, replaces 6 pairs of dumbbells', false, true, false, 'ACTIVE', 4.5, 3421, 14000, 1800, NOW(), NOW(), 12
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='decathlon-20kg-adjustable-dumbbell');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Wildcraft Granite 45L Hiking Backpack', 'wildcraft-granite-45l', 'Wildcraft', 3299, 4999, 55, 'Waterproof 45L, hip belt support, rain cover included, trekking pole attachment, 3D mesh back panel', false, true, false, 'ACTIVE', 4.4, 2876, 11000, 1400, NOW(), NOW(), 12
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='wildcraft-granite-45l');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Boldfit Whey Protein 2kg Chocolate', 'boldfit-whey-protein-2kg', 'Boldfit', 1999, 3499, 120, '25g protein per serving, 5.5g BCAA, low sugar, added digestive enzymes, 60 servings, lab tested', false, true, false, 'ACTIVE', 4.3, 8921, 34000, 5600, NOW(), NOW(), 12
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='boldfit-whey-protein-2kg');


-- ═══════════════════════════════════════════════════════
--  BOOKS  (category_id = 13)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Atomic Habits by James Clear', 'atomic-habits-james-clear', 'Penguin', 399, 799, 500, 'Tiny changes, remarkable results. #1 New York Times bestseller. Over 15 million copies sold worldwide', false, true, true, 'ACTIVE', 4.9, 24531, 98000, 18400, NOW(), NOW(), 13
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='atomic-habits-james-clear');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'The Psychology of Money by Morgan Housel', 'psychology-of-money-morgan-housel', 'Jaico', 349, 599, 400, 'Timeless lessons on wealth, greed and happiness. Over 4 million copies sold. 19 short stories about money', false, true, false, 'ACTIVE', 4.8, 18932, 76000, 14200, NOW(), NOW(), 13
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='psychology-of-money-morgan-housel');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Rich Dad Poor Dad by Robert Kiyosaki', 'rich-dad-poor-dad', 'Plata Publishing', 299, 499, 600, 'What the rich teach their kids about money that the poor and middle class do not. 32 million copies sold', false, true, false, 'ACTIVE', 4.7, 31243, 124000, 22000, NOW(), NOW(), 13
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='rich-dad-poor-dad');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Zero to One by Peter Thiel', 'zero-to-one-peter-thiel', 'Virgin Books', 349, 599, 350, 'Notes on startups, or how to build the future. Must-read for entrepreneurs and startup founders', false, true, false, 'ACTIVE', 4.6, 9821, 38000, 7200, NOW(), NOW(), 13
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='zero-to-one-peter-thiel');


-- ═══════════════════════════════════════════════════════
--  TOYS & GAMES  (category_id = 14)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'LEGO Technic Lamborghini Sian FKP 37', 'lego-technic-lamborghini-sian', 'LEGO', 44999, 54999, 18, '3696 pieces, 1:8 scale model, V12 engine with moving pistons, working steering & suspension, display stand', true, true, true, 'ACTIVE', 4.9, 2341, 12000, 430, NOW(), NOW(), 14
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='lego-technic-lamborghini-sian');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Sony PlayStation 5 Slim Disc Edition', 'sony-ps5-slim-disc', 'Sony', 54990, 59990, 8, 'PS5 Slim, 1TB SSD, 4K Blu-ray, DualSense controller, Tempest 3D audio, Ray tracing, 120fps gaming', true, true, true, 'ACTIVE', 4.9, 8921, 48000, 2100, NOW(), NOW(), 14
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='sony-ps5-slim-disc');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Nintendo Switch OLED Model', 'nintendo-switch-oled', 'Nintendo', 35990, 40990, 22, '7" vibrant OLED screen, enhanced audio, 64GB internal storage, wide adjustable stand, wired LAN port', true, true, true, 'ACTIVE', 4.8, 6543, 32000, 1800, NOW(), NOW(), 14
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='nintendo-switch-oled');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Funskool Monopoly Classic Board Game', 'funskool-monopoly-classic', 'Funskool', 999, 1499, 150, 'Classic trading board game, 2-8 players, buy sell trade properties, hotels, title deeds, age 8+', false, true, false, 'ACTIVE', 4.4, 9821, 38000, 6700, NOW(), NOW(), 14
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='funskool-monopoly-classic');


-- ═══════════════════════════════════════════════════════
--  AUTOMOTIVE  (category_id = 15)
-- ═══════════════════════════════════════════════════════

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Michelin Pilot Sport 4 Tyre 205/55 R16', 'michelin-pilot-sport4-205-55-r16', 'Michelin', 8999, 11999, 40, 'Ultra-high performance tyre, exceptional wet & dry grip, sporty handling, reinforced sidewall, speed rated Y', false, true, false, 'ACTIVE', 4.7, 1243, 5600, 340, NOW(), NOW(), 15
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='michelin-pilot-sport4-205-55-r16');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Varta Blue Dynamic Car Battery 55Ah', 'varta-blue-dynamic-battery-55ah', 'Varta', 4999, 6999, 30, '55Ah, 460A CCA, maintenance-free, AGM technology, superior cold-start performance, 4-year warranty', false, true, false, 'ACTIVE', 4.5, 876, 3800, 220, NOW(), NOW(), 15
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='varta-blue-dynamic-battery-55ah');

INSERT INTO products (name, slug, brand, price, original_price, stock, description, free_shipping, is_active, is_featured, status, average_rating, total_reviews, view_count, total_sold, created_at, updated_at, category_id)
SELECT 'Meguiar''s Ultimate Wax Paste 311g', 'meguiars-ultimate-wax-paste', 'Meguiar''s', 2499, 3499, 80, 'Synthetic polymer wax, deep gloss protection, hydrophobic shield, UV protection, lasts up to 12 months', false, true, false, 'ACTIVE', 4.6, 3421, 13000, 1800, NOW(), NOW(), 15
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='meguiars-ultimate-wax-paste');
