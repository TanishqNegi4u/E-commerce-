INSERT INTO categories (name, description) 
SELECT 'Electronics', 'Electronic devices and gadgets' 
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Electronics');

INSERT INTO categories (name, description) 
SELECT 'Fashion', 'Clothing and accessories' 
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Fashion');

INSERT INTO categories (name, description) 
SELECT 'Home & Kitchen', 'Home appliances and kitchen' 
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Home & Kitchen');

INSERT INTO categories (name, description) 
SELECT 'Books', 'Books and literature' 
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Books');

INSERT INTO categories (name, description) 
SELECT 'Sports', 'Sports and fitness' 
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Sports');

INSERT INTO products (name, brand, price, original_price, stock, description, free_shipping, active, category_id)
SELECT 'Samsung Galaxy S24 Ultra', 'Samsung', 124999, 149999, 12, 'Latest Samsung flagship phone', true, true, 1
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Samsung Galaxy S24 Ultra');

INSERT INTO products (name, brand, price, original_price, stock, description, free_shipping, active, category_id)
SELECT 'Sony WH-1000XM5 Headphones', 'Sony', 29990, 39990, 23, 'Best noise cancelling headphones', false, true, 1
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Sony WH-1000XM5 Headphones');

INSERT INTO products (name, brand, price, original_price, stock, description, free_shipping, active, category_id)
SELECT 'Apple MacBook Pro M3', 'Apple', 249990, 299990, 5, 'Powerful laptop for professionals', true, true, 1
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Apple MacBook Pro M3');

INSERT INTO products (name, brand, price, original_price, stock, description, free_shipping, active, category_id)
SELECT 'OnePlus Nord CE 3 Lite 5G', 'OnePlus', 19999, 24999, 56, 'Affordable 5G smartphone', true, true, 1
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='OnePlus Nord CE 3 Lite 5G');

INSERT INTO products (name, brand, price, original_price, stock, description, free_shipping, active, category_id)
SELECT 'Bose SoundLink Flex Speaker', 'Bose', 11900, 15900, 30, 'Portable bluetooth speaker', false, true, 1
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Bose SoundLink Flex Speaker');

INSERT INTO products (name, brand, price, original_price, stock, description, free_shipping, active, category_id)
SELECT 'Nike Air Max 270', 'Nike', 14995, 19995, 34, 'Comfortable running shoes', false, true, 2
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Nike Air Max 270');

INSERT INTO products (name, brand, price, original_price, stock, description, free_shipping, active, category_id)
SELECT 'Adidas Ultraboost 23', 'Adidas', 17999, 24999, 45, 'Premium running shoes', false, true, 2
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Adidas Ultraboost 23');

INSERT INTO products (name, brand, price, original_price, stock, description, free_shipping, active, category_id)
SELECT 'Instant Pot Duo 7-in-1', 'Instant Pot', 9499, 13999, 67, 'Multi-use pressure cooker', false, true, 3
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Instant Pot Duo 7-in-1');

INSERT INTO products (name, brand, price, original_price, stock, description, free_shipping, active, category_id)
SELECT 'Prestige Iris Induction Cooker', 'Prestige', 2999, 4299, 89, 'Energy efficient induction cooker', false, true, 3
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Prestige Iris Induction Cooker');

INSERT INTO products (name, brand, price, original_price, stock, description, free_shipping, active, category_id)
SELECT 'Atomic Habits', 'Penguin', 399, 799, 456, 'Best self-help book by James Clear', false, true, 4
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Atomic Habits');

INSERT INTO products (name, brand, price, original_price, stock, description, free_shipping, active, category_id)
SELECT 'Wildcraft Hiking Backpack 45L', 'Wildcraft', 2299, 3499, 78, 'Durable hiking backpack', false, true, 5
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Wildcraft Hiking Backpack 45L');