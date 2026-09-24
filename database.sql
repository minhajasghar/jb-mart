-- ═══════════════════════════════════════════════════════════════
-- JB MEGA MART KITCHEN — Complete Database Setup
-- Structure: Category → Subcategory (optional) → Items
-- Safe to run on existing DB (uses IF NOT EXISTS + INSERT IGNORE)
-- ═══════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS jbmegamart_123;
USE jbmegamart_123;

-- ─────────────────────────────────────────────
-- TABLE: orders (unchanged — live orders safe)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  address TEXT,
  items JSON NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  profit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- TABLE: subscribers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- TABLE: users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  password VARCHAR(255) NOT NULL DEFAULT '123',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- TABLE: store_settings
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- TABLE: categories
-- has_subcategories = TRUE  → subcategories exist, items are inside subcategories
-- has_subcategories = FALSE → items directly under category (no subcategories)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_order INT DEFAULT 0,
  image MEDIUMTEXT,
  has_subcategories BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- TABLE: subcategories
-- When category has_subcategories = TRUE, items live here
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subcategories (
  id VARCHAR(100) PRIMARY KEY,
  category_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  display_order INT DEFAULT 0,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- TABLE: products
-- category_id  → always set
-- subcategory_id → set only when category has_subcategories = TRUE
-- If subcategory_id is NULL → item is directly under category
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NULL DEFAULT NULL,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  image MEDIUMTEXT,
  category_id VARCHAR(50),
  subcategory_id VARCHAR(100) DEFAULT NULL,
  variant VARCHAR(255) DEFAULT NULL,
  is_out_of_stock BOOLEAN DEFAULT FALSE,
  is_special BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- MIGRATION: Add missing columns to existing tables safely
-- (Will warn "Duplicate column" on fresh DB — safe to ignore)
-- ─────────────────────────────────────────────
ALTER TABLE categories ADD COLUMN has_subcategories BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN subcategory_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE products ADD COLUMN is_special BOOLEAN DEFAULT FALSE;
ALTER TABLE products MODIFY COLUMN price DECIMAL(10,2) NULL;
ALTER TABLE subcategories ADD COLUMN image TEXT;
ALTER TABLE categories MODIFY COLUMN image MEDIUMTEXT;
ALTER TABLE products MODIFY COLUMN image MEDIUMTEXT;

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────
INSERT IGNORE INTO categories (id, name, display_order, image, has_subcategories) VALUES
  ('category-sandwiches',        'Sandwiches',          1,  '/sandwich.jpeg', FALSE),
  ('category-burgers',           'Burgers',             2,  '/burgerr.jpeg', FALSE),
  ('category-shawarma',          'Shawarma & Wraps',    3,  '/shawarma.jpeg', FALSE),
  ('category-pizza',             'Pizza',               4,  '/Pizza.png', TRUE),   -- subcategories: Small, Medium, Large
  ('category-salads',            'Salads',              5,  '/salad.jpeg', FALSE),
  ('category-fries',             'Fries',               6,  '/Fries.png', FALSE),
  ('category-nuggets',           'Nuggets',             7,  'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=80', FALSE),
  ('category-cakes',             'Cakes',               8,  '/Cakes.png', TRUE),   -- subcategories: 1LB, 2LB
  ('category-muffins',           'Cupcakes',            9,  '/Muffins.jpeg', FALSE),
  ('category-pastries',          'Pastries',            10, '/Pastries.jpeg', FALSE),
  ('category-donuts-creamrolls', 'Donuts & Cream Rolls',11, '/Donuts-Cream-rolls.png', FALSE),
  ('category-bakarkhani',        'Bakarkhani',          12, '/Bakarkhani.jpeg', FALSE),
  ('category-cookies-biscuits',  'Cookies & Biscuits',  13, '/Cookies-Buscuits.png', FALSE),
  ('category-next-cola',         'Next Cola',           14, '/drinks.png', TRUE),
  ('category-pepsi',             'Pepsi',               15, '/drinks.png', TRUE),
  ('category-coke',              'Coke',                16, '/drinks.png', TRUE);

-- ─────────────────────────────────────────────
-- SUBCATEGORIES — Pizza
-- ─────────────────────────────────────────────
INSERT IGNORE INTO subcategories (id, category_id, name, display_order) VALUES
  ('subcat-pizza-small',  'category-pizza', 'Small (9")',   1),
  ('subcat-pizza-medium', 'category-pizza', 'Medium (12")', 2),
  ('subcat-pizza-large',  'category-pizza', 'Large (14")',  3);

-- ─────────────────────────────────────────────
-- SUBCATEGORIES — Cakes
-- ─────────────────────────────────────────────
INSERT IGNORE INTO subcategories (id, category_id, name, display_order) VALUES
  ('subcat-cake-1lb', 'category-cakes', '1 LB', 1),
  ('subcat-cake-2lb', 'category-cakes', '2 LB', 2);

-- ─────────────────────────────────────────────
-- PRODUCTS — Sandwiches (no subcategory)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('chicken-sandwich',   'Chicken Sandwich',   549, 227, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIMxCvyCZPxYdFSkZzZQYV_IKSTz9Gvdt9fQGxSl7y7rarVKupQEBIYwRiZAgcgOnCXHhx8gwsBv2MUy6an7MJzmH57Loc7EsoxvCjCOHRHumE7xCfMjXbLRZ0Sc16dWtgTlYDIg7MWdJZ_e3OZCRIUb5XdXSjjPhAPI45Ze5a2yfVx4mNRvn9l2t7W3hOifSMD53xCtabZfCfMLAOCeaW6BzlV8_s8sqc_MNVAqiCp7WtDGM_pEidtaycpmVeZbS54_t2FB55pUJw', 'category-sandwiches', NULL, 1),
  ('tikka-sandwich',     'Tikka Sandwich',     549, 227, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIMxCvyCZPxYdFSkZzZQYV_IKSTz9Gvdt9fQGxSl7y7rarVKupQEBIYwRiZAgcgOnCXHhx8gwsBv2MUy6an7MJzmH57Loc7EsoxvCjCOHRHumE7xCfMjXbLRZ0Sc16dWtgTlYDIg7MWdJZ_e3OZCRIUb5XdXSjjPhAPI45Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-sandwiches', NULL, 2),
  ('fajita-sandwich',    'Fajita Sandwich',    549, 227, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIMxCvyCZPxYdFSkZzZQYV_IKSTz9Gvdt9fQGxSl7y7rarVKupQEBIYwRiZAgcgOnCXHhx8gwsBv2MUy6an7MJzmH57Loc7EsoxvCjCOHRHumE7xCfMjXbLRZ0Sc16dWtgTlYDIg7MWdJZ_e3OZCRIUb5XdXSjjPhAPI45Ze5a2yfVx4mNRvn9l2t7W3hOifSMD53xCtabZfCfMLAOCeaW6BzlV8_s8sqc_MNVAqiCp7WtDGM_pEidtaycpmVeZbS54_t2FB55pUJw', 'category-sandwiches', NULL, 3),
  ('bbq-sandwich',       'B.B.Q. Sandwich',    549, 227, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIMxCvyCZPxYdFSkZzZQYV_IKSTz9Gvdt9fQGxSl7y7rarVKupQEBIYwRiZAgcgOnCXHhx8gwsBv2MUy6an7MJzmH57Loc7EsoxvCjCOHRHumE7xCfMjXbLRZ0Sc16dWtgTlYDIg7MWdJZ_e3OZCRIUb5XdXSjjPhAPI45Ze5a2yfVx4mNRvn9l2t7W3hOifSMD53xCtabZfCfMLAOCeaW6BzlV8_s8sqc_MNVAqiCp7WtDGM_pEidtaycpmVeZbS54_t2FB55pUJw', 'category-sandwiches', NULL, 4),
  ('peri-peri-sandwich', 'Peri Peri Sandwich', 549, 227, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIMxCvyCZPxYdFSkZzZQYV_IKSTz9Gvdt9fQGxSl7y7rarVKupQEBIYwRiZAgcgOnCXHhx8gwsBv2MUy6an7MJzmH57Loc7EsoxvCjCOHRHumE7xCfMjXbLRZ0Sc16dWtgTlYDIg7MWdJZ_e3OZCRIUb5XdXSjjPhAPI45Ze5a2yfVx4mNRvn9l2t7W3hOifSMD53xCtabZfCfMLAOCeaW6BzlV8_s8sqc_MNVAqiCp7WtDGM_pEidtaycpmVeZbS54_t2FB55pUJw', 'category-sandwiches', NULL, 5),
  ('club-sandwich',      'Club Sandwich',      599, 284, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIMxCvyCZPxYdFSkZzZQYV_IKSTz9Gvdt9fQGxSl7y7rarVKupQEBIYwRiZAgcgOnCXHhx8gwsBv2MUy6an7MJzmH57Loc7EsoxvCjCOHRHumE7xCfMjXbLRZ0Sc16dWtgTlYDIg7MWdJZ_e3OZCRIUb5XdXSjjPhAPI45Ze5a2yfVx4mNRvn9l2t7W3hOifSMD53xCtabZfCfMLAOCeaW6BzlV8_s8sqc_MNVAqiCp7WtDGM_pEidtaycpmVeZbS54_t2FB55pUJw', 'category-sandwiches', NULL, 6);

-- ─────────────────────────────────────────────
-- PRODUCTS — Burgers (no subcategory)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('zinger',       'Zinger Premium', 479, 231, 'https://lh3.googleusercontent.com/aida-public/AB6AXuC657iXrjbdM94s3wzIBMtYByorBfb0fjRntUKF72clKEzb9dWfRD2rea5iqzIj2__5IjBMPZhJe9U9y5zWbcaprFRK-czxmKQiSrawrk9j7zqZQj6sGL9Du7ZM1tyrNrz8ADNtLmr9zDNOlTUbSMwdy5-n7XZez_aP689Vbtr227fCa6iYfdctt7YgCEPtVGL1YJILUnE7x4I8AAYPktI59yfDnHU_zaAflLCg_ArbrKeRWe88CfJFJujbpovas5GxIddpUIEqrUMk', 'category-burgers', NULL, 1),
  ('chicken-petti','Chicken Petti',  449, 181, 'https://lh3.googleusercontent.com/aida-public/AB6AXuC657iXrjbdM94s3wzIBMtYByorBfb0fjRntUKF72clKEzb9dWfRD2rea5iqzIj2__5IjBMPZhJe9U9y5zWbcaprFRK-czxmKQiSrawrk9j7zqZQj6sGL9Du7ZM1tyrNrz8ADNtLmr9zDNOlTUbSMwdy5-n7XZez_aP689Vbtr227fCa6iYfdctt7YgCEPtVGL1YJILUnE7x4I8AAYPktI59yfDnHU_zaAflLCg_ArbrKeRWe88CfJFJujbpovas5GxIddpUIEqrUMk', 'category-burgers', NULL, 2);

-- ─────────────────────────────────────────────
-- PRODUCTS — Shawarma & Wraps (no subcategory)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('chicken-shawarma', 'Chicken Shawarma', 399, 242, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80', 'category-shawarma', NULL, 1),
  ('tortilla-wrap',    'Tortilla Wrap',    449, 317, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80', 'category-shawarma', NULL, 2);

-- ─────────────────────────────────────────────
-- PRODUCTS — Pizza (inside subcategories: Small/Medium/Large)
-- Each size has all 6 flavors as separate products
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  -- Small Pizza Flavors
  ('pizza-sm-chicken-supreme', 'Chicken Supreme',  599,  316, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-small', 1),
  ('pizza-sm-chicken-tikka',   'Chicken Tikka',    599,  316, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-small', 2),
  ('pizza-sm-chicken-fajita',  'Chicken Fajita',   599,  316, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-small', 3),
  ('pizza-sm-peri-peri',       'Peri Peri Chicken',599,  316, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-small', 4),
  ('pizza-sm-smoked-chicken',  'Smoked Chicken',   599,  316, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-small', 5),
  ('pizza-sm-cheese-lover',    'Cheese Lover',     599,  316, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-small', 6),
  -- Medium Pizza Flavors
  ('pizza-md-chicken-supreme', 'Chicken Supreme',  1149, 478, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-medium', 1),
  ('pizza-md-chicken-tikka',   'Chicken Tikka',    1149, 478, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-medium', 2),
  ('pizza-md-chicken-fajita',  'Chicken Fajita',   1149, 478, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-medium', 3),
  ('pizza-md-peri-peri',       'Peri Peri Chicken',1149, 478, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-medium', 4),
  ('pizza-md-smoked-chicken',  'Smoked Chicken',   1149, 478, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-medium', 5),
  ('pizza-md-cheese-lover',    'Cheese Lover',     1149, 478, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-medium', 6),
  -- Large Pizza Flavors
  ('pizza-lg-chicken-supreme', 'Chicken Supreme',  1799, 823, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-large', 1),
  ('pizza-lg-chicken-tikka',   'Chicken Tikka',    1799, 823, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-large', 2),
  ('pizza-lg-chicken-fajita',  'Chicken Fajita',   1799, 823, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-large', 3),
  ('pizza-lg-peri-peri',       'Peri Peri Chicken',1799, 823, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-large', 4),
  ('pizza-lg-smoked-chicken',  'Smoked Chicken',   1799, 823, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-large', 5),
  ('pizza-lg-cheese-lover',    'Cheese Lover',     1799, 823, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0wUDDOzLWxnqjPfvc_aOIIkeprLCK0Hw3CSf7CYhfLkFTJhofX0H7SWZeLKIhrn3x2Um1ZZhYw9Ly8CdYcXspRXjGKIwtgGW9ImtaXXy_vvUyVCHODxPQTcPr8Csnq-_boPOQ5DSdQ_l8fsHYdRse6OLGHkC9XY2Pa7wRvVwNNQfVArBPapBpr3tgsVSmsjYcf70hMylPYPyVLqk8wYEH2jV2Qwx6iNlznKI4xpq8_evg0a6IMXnQLveM1jTc9hmtdThzPJAoUfm', 'category-pizza', 'subcat-pizza-large', 6);

-- ─────────────────────────────────────────────
-- PRODUCTS — Salads (direct, no subcategory, variants as separate products)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, variant, display_order) VALUES
  ('salad-250g',  'Salad', 199, 100, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', 'category-salads', NULL, '250g',  1),
  ('salad-500g',  'Salad', 349, 175, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', 'category-salads', NULL, '500g',  2),
  ('salad-1kg',   'Salad', 649, 325, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', 'category-salads', NULL, '1 KG',  3);

-- ─────────────────────────────────────────────
-- PRODUCTS — Fries (no subcategory)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('fries-std',       'Signature Fries - Std', 329, 164, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCibaOg9i9ntRiYLvnipdTmMoFzX-gypwklzcXst9lXlvUaCt9UfJmU-_r4_hgLdB4k1uDKvOHdFAhPd58KR9r4Vw13_74FMw3I_dLtZZWMf0YJBDlnvl2g0gzywHmrHSyK6TjewSZaSg7TCbRtn5rv_ZWUWZ6lBerbsFaLfc88feUAjQke-fFPb4hmN7Zl_-hHe4tDp1_XKjPWlqBj_0rqP8fZiYU8R1AUgej0ZMEusP02RyXJr3dS4wcEBPL13ZhIBftKq8SAgQWU', 'category-fries', NULL, 1),
  ('fries-loaded-sm', 'Loaded Fries - Sm',     479, 260, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCibaOg9i9ntRiYLvnipdTmMoFzX-gypwklzcXst9lXlvUaCt9UfJmU-_r4_hgLdB4k1uDKvOHdFAhPd58KR9r4Vw13_74FMw3I_dLtZZWMf0YJBDlnvl2g0gzywHmrHSyK6TjewSZaSg7TCbRtn5rv_ZWUWZ6lBerbsFaLfc88feUAjQke-fFPb4hmN7Zl_-hHe4tDp1_XKjPWlqBj_0rqP8fZiYU8R1AUgej0ZMEusP02RyXJr3dS4wcEBPL13ZhIBftKq8SAgQWU', 'category-fries', NULL, 2),
  ('fries-loaded-lg', 'Loaded Fries - Lg',     549, 377, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCibaOg9i9ntRiYLvnipdTmMoFzX-gypwklzcXst9lXlvUaCt9UfJmU-_r4_hgLdB4k1uDKvOHdFAhPd58KR9r4Vw13_74FMw3I_dLtZZWMf0YJBDlnvl2g0gzywHmrHSyK6TjewSZaSg7TCbRtn5rv_ZWUWZ6lBerbsFaLfc88feUAjQke-fFPb4hmN7Zl_-hHe4tDp1_XKjPWlqBj_0rqP8fZiYU8R1AUgej0ZMEusP02RyXJr3dS4wcEBPL13ZhIBftKq8SAgQWU', 'category-fries', NULL, 3);

-- ─────────────────────────────────────────────
-- PRODUCTS — Nuggets (no subcategory)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('nuggets', 'Golden Nuggets', 399, 166, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=80', 'category-nuggets', NULL, 1);

-- ─────────────────────────────────────────────
-- PRODUCTS — Cakes (inside subcategories: 1LB / 2LB → flavors)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  -- 1 LB Cakes
  ('pineapple-cake-1lb',   'Pineapple Cake',    800,  400, '/Cakes.png', 'category-cakes', 'subcat-cake-1lb', 1),
  ('black-forest-cake-1lb','Black Forest Cake', 800,  400, '/Cakes.png', 'category-cakes', 'subcat-cake-1lb', 2),
  ('red-velvet-cake-1lb',  'Red Velvet Cake',   800,  400, '/Cakes.png', 'category-cakes', 'subcat-cake-1lb', 3),
  ('mix-fruit-cake-1lb',   'Mix Fruit Cake',    800,  400, '/Cakes.png', 'category-cakes', 'subcat-cake-1lb', 4),
  ('chocolate-cake-1lb',   'Chocolate Cake',    800,  400, '/Cakes.png', 'category-cakes', 'subcat-cake-1lb', 5),
  -- 2 LB Cakes
  ('pineapple-cake-2lb',   'Pineapple Cake',    1600, 800, '/Cakes.png', 'category-cakes', 'subcat-cake-2lb', 1),
  ('black-forest-cake-2lb','Black Forest Cake', 1600, 800, '/Cakes.png', 'category-cakes', 'subcat-cake-2lb', 2),
  ('red-velvet-cake-2lb',  'Red Velvet Cake',   1600, 800, '/Cakes.png', 'category-cakes', 'subcat-cake-2lb', 3),
  ('mix-fruit-cake-2lb',   'Mix Fruit Cake',    1600, 800, '/Cakes.png', 'category-cakes', 'subcat-cake-2lb', 4),
  ('chocolate-cake-2lb',   'Chocolate Cake',    1600, 800, '/Cakes.png', 'category-cakes', 'subcat-cake-2lb', 5);

-- ─────────────────────────────────────────────
-- PRODUCTS — Cupcakes (no subcategory)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('muffin-chocolate',  'Cupcake Chocolate',  120, 60, '/Muffins.jpeg', 'category-muffins', NULL, 1),
  ('vanilla-muffin',    'Vanilla Cupcake',    120, 60, '/Muffins.jpeg', 'category-muffins', NULL, 2),
  ('red-velvet-muffin', 'Red Velvet Cupcake', 120, 60, '/Muffins.jpeg', 'category-muffins', NULL, 3);

-- ─────────────────────────────────────────────
-- PRODUCTS — Pastries (no subcategory)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('pineapple-pastry',    'Pineapple Pastry',    120, 60, '/Pastries.jpeg', 'category-pastries', NULL, 1),
  ('black-forest-pastry', 'Black Forest Pastry', 120, 60, '/Pastries.jpeg', 'category-pastries', NULL, 2),
  ('red-velvet-pastry',   'Red Velvet Pastry',   120, 60, '/Pastries.jpeg', 'category-pastries', NULL, 3),
  ('mix-fruit-pastry',    'Mix Fruit Pastry',    120, 60, '/Pastries.jpeg', 'category-pastries', NULL, 4),
  ('chocolate-pastry',    'Chocolate Pastry',    120, 60, '/Pastries.jpeg', 'category-pastries', NULL, 5);

-- ─────────────────────────────────────────────
-- PRODUCTS — Donuts & Cream Rolls (no subcategory)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('cream-roll', 'Cream Roll', 150, 75, '/Donuts-Cream-rolls.png', 'category-donuts-creamrolls', NULL, 1),
  ('donut',      'Donut',      150, 75, '/Donuts-Cream-rolls.png', 'category-donuts-creamrolls', NULL, 2);

-- ─────────────────────────────────────────────
-- PRODUCTS — Cookies & Biscuits (no subcategory)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('cake-rusk',         'Cake Rusk',         1600, 800, '/Cookies-Buscuits.png', 'category-cookies-biscuits', NULL, 1),
  ('almond-khatai',     'Almond Khatai',     1800, 900, '/Cookies-Buscuits.png', 'category-cookies-biscuits', NULL, 2),
  ('plain-khatai',      'Plain Khatai',      1499, 750, '/Cookies-Buscuits.png', 'category-cookies-biscuits', NULL, 3),
  ('assorted-biscuits', 'Assorted Biscuits', 1499, 750, '/Cookies-Buscuits.png', 'category-cookies-biscuits', NULL, 4);

-- ─────────────────────────────────────────────
-- SUBCATEGORIES — Drinks (Next Cola, Pepsi, Coke)
-- Brand-based subcategories under each category
-- ─────────────────────────────────────────────
INSERT IGNORE INTO subcategories (id, category_id, name, display_order, image) VALUES
  ('subcat-nextcola-nextcola', 'category-next-cola', 'Next Cola',       1, '/drinks.png'),
  ('subcat-nextcola-fizzup',   'category-next-cola', 'Fizzup',          2, '/fizzup.jpeg'),
  ('subcat-nextcola-water',    'category-next-cola', 'Next Water',      3, '/Water.png'),
  ('subcat-pepsi-pepsi',       'category-pepsi',     'Pepsi',           1, '/pepsi.png'),
  ('subcat-pepsi-7up',         'category-pepsi',     '7Up',             2, '/7up.png'),
  ('subcat-pepsi-mirinda',     'category-pepsi',     'Mirinda',         3, '/mirinda.png'),
  ('subcat-pepsi-dew',         'category-pepsi',     'Mountain Dew',    4, '/Mountain dew.png'),
  ('subcat-pepsi-water',       'category-pepsi',     'Water',           5, '/Water.png'),
  ('subcat-coke-coke',         'category-coke',      'Coca-Cola',       1, '/cocacola.png'),
  ('subcat-coke-sprite',       'category-coke',      'Sprite',          2, '/Sprite.png'),
  ('subcat-coke-fanta',        'category-coke',      'Fanta',           3, '/Fanta.png'),
  ('subcat-coke-juices',       'category-coke',      'Juices',          4, '/Juice.jpeg'),
  ('subcat-coke-water',        'category-coke',      'Water',           5, '/Water.png');

-- ─────────────────────────────────────────────
-- PRODUCTS — Next Cola → Next Cola
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('next-cola-300ml',  'Next Cola 300ml',  70,  35, '/drinks.png', 'category-next-cola', 'subcat-nextcola-nextcola', 1),
  ('next-cola-500ml',  'Next Cola 500ml',  90,  45, '/drinks.png', 'category-next-cola', 'subcat-nextcola-nextcola', 2),
  ('next-cola-1ltr',   'Next Cola 1ltr',   130, 65, '/drinks.png', 'category-next-cola', 'subcat-nextcola-nextcola', 3),
  ('next-cola-1500ml', 'Next Cola 1500ml', 160, 80, '/drinks.png', 'category-next-cola', 'subcat-nextcola-nextcola', 4);

-- ─────────────────────────────────────────────
-- PRODUCTS — Next Cola → Fizzup
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('fizzup-300ml',     'Fizzup 300ml',     70,  35, '/drinks.png', 'category-next-cola', 'subcat-nextcola-fizzup', 1),
  ('fizzup-500ml',     'Fizzup 500ml',     90,  45, '/drinks.png', 'category-next-cola', 'subcat-nextcola-fizzup', 2),
  ('fizzup-1ltr',      'Fizzup 1ltr',      130, 65, '/drinks.png', 'category-next-cola', 'subcat-nextcola-fizzup', 3),
  ('fizzup-1500ml',    'Fizzup 1500ml',    160, 80, '/drinks.png', 'category-next-cola', 'subcat-nextcola-fizzup', 4);

-- ─────────────────────────────────────────────
-- PRODUCTS — Next Cola → Next Water
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('next-water-500ml', 'Next Water 500ml',   50, 25, '/drinks.png', 'category-next-cola', 'subcat-nextcola-water', 1),
  ('next-water-1500ml','Next Water 1500ml', 100, 50, '/drinks.png', 'category-next-cola', 'subcat-nextcola-water', 2);

-- ─────────────────────────────────────────────
-- PRODUCTS — Pepsi → Pepsi
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('pepsi-can-250ml',      'Pepsi Can 250ml',       120, 60, '/drinks.png', 'category-pepsi', 'subcat-pepsi-pepsi', 1),
  ('pepsi-diet-can-250ml', 'Pepsi Diet Can 250ml',  120, 60, '/drinks.png', 'category-pepsi', 'subcat-pepsi-pepsi', 2),
  ('pepsi-345ml',          'Pepsi 345ml',            70, 35, '/drinks.png', 'category-pepsi', 'subcat-pepsi-pepsi', 3),
  ('pepsi-zero-345ml',     'Pepsi Zero 345ml',       70, 35, '/drinks.png', 'category-pepsi', 'subcat-pepsi-pepsi', 4),
  ('pepsi-500ml',          'Pepsi 500ml',           100, 50, '/drinks.png', 'category-pepsi', 'subcat-pepsi-pepsi', 5),
  ('pepsi-zero-500ml',     'Pepsi Zero 500ml',      100, 50, '/drinks.png', 'category-pepsi', 'subcat-pepsi-pepsi', 6),
  ('pepsi-1ltr',           'Pepsi 1ltr',            160, 80, '/drinks.png', 'category-pepsi', 'subcat-pepsi-pepsi', 7),
  ('pepsi-zero-1ltr',      'Pepsi Zero 1ltr',       160, 80, '/drinks.png', 'category-pepsi', 'subcat-pepsi-pepsi', 8),
  ('pepsi-1500ml',         'Pepsi 1500ml',          200, 100,'/drinks.png', 'category-pepsi', 'subcat-pepsi-pepsi', 9),
  ('pepsi-zero-1500ml',    'Pepsi Zero 1500ml',     200, 100,'/drinks.png', 'category-pepsi', 'subcat-pepsi-pepsi', 10);

-- ─────────────────────────────────────────────
-- PRODUCTS — Pepsi → 7Up
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('7up-345ml',          '7Up 345ml',          70,  35, '/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 1),
  ('7up-zero-345ml',     '7Up Zero 345ml',     70,  35, '/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 2),
  ('7up-mint-345ml',     '7Up Mint 345ml',     70,  35, '/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 3),
  ('7up-500ml',          '7Up 500ml',          100, 50, '/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 4),
  ('7up-zero-500ml',     '7Up Zero 500ml',     100, 50, '/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 5),
  ('7up-mint-500ml',     '7Up Mint 500ml',     100, 50, '/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 6),
  ('7up-1ltr',           '7Up 1ltr',           160, 80, '/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 7),
  ('7up-zero-1ltr',      '7Up Zero 1ltr',      160, 80, '/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 8),
  ('7up-mint-1ltr',      '7Up Mint 1ltr',      160, 80, '/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 9),
  ('7up-1500ml',         '7Up 1500ml',         200, 100,'/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 10),
  ('7up-zero-1500ml',    '7Up Zero 1500ml',    200, 100,'/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 11),
  ('7up-mint-1500ml',    '7Up Mint 1500ml',    200, 100,'/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 12),
  ('7up-can-250ml',      '7Up Can 250ml',      120, 60, '/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 13),
  ('7up-diet-can-250ml', '7Up Diet Can 250ml', 120, 60, '/drinks.png', 'category-pepsi', 'subcat-pepsi-7up', 14);

-- ─────────────────────────────────────────────
-- PRODUCTS — Pepsi → Mirinda
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('mirinda-345ml',     'Mirinda 345ml',    70,  35, '/drinks.png', 'category-pepsi', 'subcat-pepsi-mirinda', 1),
  ('mirinda-500ml',     'Mirinda 500ml',    100, 50, '/drinks.png', 'category-pepsi', 'subcat-pepsi-mirinda', 2),
  ('mirinda-1ltr',      'Mirinda 1ltr',     160, 80, '/drinks.png', 'category-pepsi', 'subcat-pepsi-mirinda', 3),
  ('mirinda-1500ml',    'Mirinda 1500ml',   200, 100,'/drinks.png', 'category-pepsi', 'subcat-pepsi-mirinda', 4),
  ('mirinda-can-250ml', 'Mirinda Can 250ml', 120, 60, '/drinks.png', 'category-pepsi', 'subcat-pepsi-mirinda', 5);

-- ─────────────────────────────────────────────
-- PRODUCTS — Pepsi → Mountain Dew
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('dew-345ml',  'Dew 345ml',  70,  35, '/drinks.png', 'category-pepsi', 'subcat-pepsi-dew', 1),
  ('dew-500ml',  'Dew 500ml',  110, 55, '/drinks.png', 'category-pepsi', 'subcat-pepsi-dew', 2),
  ('dew-1ltr',   'Dew 1ltr',   160, 80, '/drinks.png', 'category-pepsi', 'subcat-pepsi-dew', 3),
  ('dew-1500ml', 'Dew 1500ml', 200, 100,'/drinks.png', 'category-pepsi', 'subcat-pepsi-dew', 4);

-- ─────────────────────────────────────────────
-- PRODUCTS — Pepsi → Water
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('aqyafina-500ml',   'Aqyafina Water 500ml',   50,  25, '/drinks.png', 'category-pepsi', 'subcat-pepsi-water', 1),
  ('aqyafina-1500ml',  'Aqyafina Water 1500ml',  100, 50, '/drinks.png', 'category-pepsi', 'subcat-pepsi-water', 2);

-- ─────────────────────────────────────────────
-- PRODUCTS — Coke → Coca-Cola
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('coke-can-250ml',      'Coke Can 250ml',      120, 60,  '/drinks.png', 'category-coke', 'subcat-coke-coke', 1),
  ('coke-zero-can-250ml', 'Coke Zero Can 250ml', 120, 60,  '/drinks.png', 'category-coke', 'subcat-coke-coke', 2),
  ('coke-345ml',          'Coke 345ml',           70,  35,  '/drinks.png', 'category-coke', 'subcat-coke-coke', 3),
  ('coke-zero-345ml',     'Coke Zero 345ml',      70,  35,  '/drinks.png', 'category-coke', 'subcat-coke-coke', 4),
  ('coke-500ml',          'Coke 500ml',           100, 50,  '/drinks.png', 'category-coke', 'subcat-coke-coke', 5),
  ('coke-zero-500ml',     'Coke Zero 500ml',      100, 50,  '/drinks.png', 'category-coke', 'subcat-coke-coke', 6),
  ('coke-1ltr',           'Coke 1ltr',            160, 80,  '/drinks.png', 'category-coke', 'subcat-coke-coke', 7),
  ('coke-zero-1ltr',      'Coke Zero 1ltr',       120, 60,  '/drinks.png', 'category-coke', 'subcat-coke-coke', 8),
  ('coke-1500ml',         'Coke 1500ml',          180, 90,  '/drinks.png', 'category-coke', 'subcat-coke-coke', 9),
  ('coke-zero-1500ml',    'Coke Zero 1500ml',     180, 90,  '/drinks.png', 'category-coke', 'subcat-coke-coke', 10);

-- ─────────────────────────────────────────────
-- PRODUCTS — Coke → Sprite
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('sprite-can-250ml',      'Sprite Can 250ml',      120, 60,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 1),
  ('sprite-diet-can-250ml', 'Sprite Diet Can 250ml', 120, 60,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 2),
  ('sprite-mint-can-250ml', 'Sprite Mint Can 250ml', 120, 60,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 3),
  ('sprite-345ml',          'Sprite 345ml',           70,  35,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 4),
  ('sprite-mint-345ml',     'Sprite Mint 345ml',     70,  35,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 5),
  ('sprite-500ml',          'Sprite 500ml',          100, 50,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 6),
  ('sprite-zero-500ml',     'Sprite Zero 500ml',     100, 50,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 7),
  ('sprite-mint-500ml',     'Sprite Mint 500ml',     100, 50,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 8),
  ('sprite-1ltr',           'Sprite 1ltr',           160, 80,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 9),
  ('sprite-zero-1ltr',      'Sprite Zero 1ltr',      160, 80,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 10),
  ('sprite-mint-1ltr',      'Sprite Mint 1ltr',      160, 80,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 11),
  ('sprite-1500ml',         'Sprite 1500ml',         180, 90,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 12),
  ('sprite-zero-1500ml',    'Sprite Zero 1500ml',    180, 90,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 13),
  ('sprite-mint-1500ml',    'Sprite Mint 1500ml',    180, 90,  '/drinks.png', 'category-coke', 'subcat-coke-sprite', 14);

-- ─────────────────────────────────────────────
-- PRODUCTS — Coke → Fanta
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('fanta-can-250ml', 'Fanta Can 250ml', 120, 60, '/drinks.png', 'category-coke', 'subcat-coke-fanta', 1),
  ('fanta-500ml',     'Fanta 500ml',     100, 50, '/drinks.png', 'category-coke', 'subcat-coke-fanta', 2),
  ('fanta-1ltr',      'Fanta 1ltr',      160, 80, '/drinks.png', 'category-coke', 'subcat-coke-fanta', 3),
  ('fanta-1500ml',    'Fanta 1500ml',    180, 90, '/drinks.png', 'category-coke', 'subcat-coke-fanta', 4);

-- ─────────────────────────────────────────────
-- PRODUCTS — Coke → Juices
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('cappy-palpi-300ml', 'Cappy Palpi 300ml', 120, 60, '/drinks.png', 'category-coke', 'subcat-coke-juices', 1);

-- ─────────────────────────────────────────────
-- PRODUCTS — Coke → Water
-- ─────────────────────────────────────────────
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('dasani-500ml',   'Dasani Water 500ml',   55,  28, '/drinks.png', 'category-coke', 'subcat-coke-water', 1),
  ('dasani-1500ml',  'Dasani Water 1500ml',  110, 55, '/drinks.png', 'category-coke', 'subcat-coke-water', 2);

-- ─────────────────────────────────────────────
-- STORE SETTINGS
-- ─────────────────────────────────────────────
-- ─────────────────────────────────────────────
-- SEED USERS
-- ─────────────────────────────────────────────
INSERT IGNORE INTO users (name, role, password) VALUES
  ('admin', 'admin', 'admin123'),
  ('cook', 'cook', 'cook123');

INSERT IGNORE INTO store_settings (setting_key, setting_value) VALUES
  ('store_name',      'JB Mega Mart Kitchen'),
  ('store_address',   'J.B Mega Mart, Fauji Foundation Road, Near Ishfaq Chowk Harbanspura, Lahore.'),
  ('store_phone',     '03238887892'),
  ('delivery_radius', '10'),
  ('delivery_fee',    '150'),
  ('cash_tax',        '16'),
  ('card_tax',        '5'),
  ('is_kitchen_open', 'true');

-- ═══════════════════════════════════════════════════════════════
-- EXISTING-DB MIGRATION: Split Drinks → Next Cola / Pepsi / Coke
-- Safe to run on fresh DB too (0 rows affected)
-- ═══════════════════════════════════════════════════════════════

-- 1. Add new categories (Next Cola, Pepsi, Coke)
INSERT IGNORE INTO categories (id, name, display_order, image, has_subcategories) VALUES
  ('category-next-cola', 'Next Cola', 14, '/drinks.png', TRUE),
  ('category-pepsi',     'Pepsi',     15, '/drinks.png', TRUE),
  ('category-coke',      'Coke',      16, '/drinks.png', TRUE);
UPDATE categories SET image = COALESCE(NULLIF(image, ''), '/drinks.png') WHERE id IN ('category-next-cola','category-pepsi','category-coke');

-- 2. Delete old subcat-drinks-* subcategories
DELETE FROM subcategories WHERE id LIKE 'subcat-drinks-%';

-- 3. Create new subcategories
INSERT IGNORE INTO subcategories (id, category_id, name, display_order, image) VALUES
  ('subcat-nextcola-nextcola', 'category-next-cola', 'Next Cola',       1, '/drinks.png'),
  ('subcat-nextcola-fizzup',   'category-next-cola', 'Fizzup',          2, '/fizzup.jpeg'),
  ('subcat-nextcola-water',    'category-next-cola', 'Next Water',      3, '/Water.png'),
  ('subcat-pepsi-pepsi',       'category-pepsi',     'Pepsi',           1, '/pepsi.png'),
  ('subcat-pepsi-7up',         'category-pepsi',     '7Up',             2, '/7up.png'),
  ('subcat-pepsi-mirinda',     'category-pepsi',     'Mirinda',         3, '/mirinda.png'),
  ('subcat-pepsi-dew',         'category-pepsi',     'Mountain Dew',    4, '/Mountain dew.png'),
  ('subcat-pepsi-water',       'category-pepsi',     'Water',           5, '/Water.png'),
  ('subcat-coke-coke',         'category-coke',      'Coca-Cola',       1, '/cocacola.png'),
  ('subcat-coke-sprite',       'category-coke',      'Sprite',          2, '/Sprite.png'),
  ('subcat-coke-fanta',        'category-coke',      'Fanta',           3, '/Fanta.png'),
  ('subcat-coke-juices',       'category-coke',      'Juices',          4, '/Juice.jpeg'),
  ('subcat-coke-water',        'category-coke',      'Water',           5, '/Water.png');

-- 4. Add Next Cola products
INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES
  ('next-cola-300ml',  'Next Cola 300ml',  70,  35, '/drinks.png', 'category-next-cola', 'subcat-nextcola-nextcola', 1),
  ('next-cola-500ml',  'Next Cola 500ml',  90,  45, '/drinks.png', 'category-next-cola', 'subcat-nextcola-nextcola', 2),
  ('next-cola-1ltr',   'Next Cola 1ltr',   130, 65, '/drinks.png', 'category-next-cola', 'subcat-nextcola-nextcola', 3),
  ('next-cola-1500ml', 'Next Cola 1500ml', 160, 80, '/drinks.png', 'category-next-cola', 'subcat-nextcola-nextcola', 4);

-- 5. Move products to new categories and subcategories (also set default image if missing)
UPDATE products SET category_id = 'category-next-cola', subcategory_id = 'subcat-nextcola-fizzup', image = COALESCE(image, '/drinks.png') WHERE id IN ('fizzup-300ml','fizzup-500ml','fizzup-1ltr','fizzup-1500ml');
UPDATE products SET category_id = 'category-next-cola', subcategory_id = 'subcat-nextcola-water', image = COALESCE(image, '/drinks.png') WHERE id IN ('next-water-500ml','next-water-1500ml');
UPDATE products SET category_id = 'category-pepsi', subcategory_id = 'subcat-pepsi-pepsi', image = COALESCE(image, '/drinks.png') WHERE id IN ('pepsi-345ml','pepsi-zero-345ml','pepsi-500ml','pepsi-zero-500ml','pepsi-1ltr','pepsi-zero-1ltr','pepsi-1500ml','pepsi-zero-1500ml','pepsi-can-250ml','pepsi-diet-can-250ml');
UPDATE products SET category_id = 'category-pepsi', subcategory_id = 'subcat-pepsi-7up', image = COALESCE(image, '/drinks.png') WHERE id LIKE '7up-%';
UPDATE products SET category_id = 'category-pepsi', subcategory_id = 'subcat-pepsi-mirinda', image = COALESCE(image, '/drinks.png') WHERE id LIKE 'mirinda-%';
UPDATE products SET category_id = 'category-pepsi', subcategory_id = 'subcat-pepsi-dew', image = COALESCE(image, '/drinks.png') WHERE id LIKE 'dew-%';
UPDATE products SET category_id = 'category-pepsi', subcategory_id = 'subcat-pepsi-water', image = COALESCE(image, '/drinks.png') WHERE id LIKE 'aqyafina-%';
UPDATE products SET category_id = 'category-coke', subcategory_id = 'subcat-coke-coke', image = COALESCE(image, '/drinks.png') WHERE id IN ('coke-can-250ml','coke-zero-can-250ml','coke-345ml','coke-zero-345ml','coke-500ml','coke-zero-500ml','coke-1ltr','coke-zero-1ltr','coke-1500ml','coke-zero-1500ml');
UPDATE products SET category_id = 'category-coke', subcategory_id = 'subcat-coke-sprite', image = COALESCE(image, '/drinks.png') WHERE id LIKE 'sprite-%';
UPDATE products SET category_id = 'category-coke', subcategory_id = 'subcat-coke-fanta', image = COALESCE(image, '/drinks.png') WHERE id LIKE 'fanta-%';
UPDATE products SET category_id = 'category-coke', subcategory_id = 'subcat-coke-juices', image = COALESCE(image, '/drinks.png') WHERE id = 'cappy-palpi-300ml';
UPDATE products SET category_id = 'category-coke', subcategory_id = 'subcat-coke-water', image = COALESCE(image, '/drinks.png') WHERE id LIKE 'dasani-%';

-- ═══════════════════════════════════════════════════════════════
-- BACKEND API REFERENCE
-- ═══════════════════════════════════════════════════════════════
-- 
-- GET /api/menu
--   → Returns categories with has_subcategories flag
--   → If has_subcategories = TRUE:
--       JOIN subcategories WHERE category_id = cat.id
--       JOIN products WHERE subcategory_id = subcat.id
--   → If has_subcategories = FALSE:
--       JOIN products WHERE category_id = cat.id AND subcategory_id IS NULL
--
-- POST /api/admin/categories        → INSERT into categories
-- DELETE /api/admin/categories/:id  → CASCADE deletes subcategories + products
--
-- POST /api/admin/subcategories        → INSERT into subcategories
-- DELETE /api/admin/subcategories/:id  → CASCADE deletes products inside
--
-- POST /api/admin/products        → INSERT into products
-- DELETE /api/admin/products/:id  → DELETE single product
-- PUT /api/admin/products/:id     → UPDATE product
--
-- ═══════════════════════════════════════════════════════════════