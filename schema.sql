-- Artify Database Schema (PostgreSQL / Supabase)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'seller', 'customer')),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for user lookups by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Seller Profiles Table
CREATE TABLE IF NOT EXISTS seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    story TEXT NOT NULL,
    craft_type VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    upi_id VARCHAR(100),
    bank_details TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching seller profile by user
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user ON seller_profiles(user_id);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for product filtering
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    shipping_address TEXT NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'online')),
    tracking_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for tracking customer orders
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10, 2) NOT NULL CHECK (price_at_purchase >= 0),
    seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE RESTRICT
);

-- Indexes for order item lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);

-- 6. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    transaction_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL CHECK (commission_amount >= 0),
    seller_payout_amount DECIMAL(10, 2) NOT NULL CHECK (seller_payout_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for order payments
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_product_customer_review UNIQUE(product_id, customer_id)
);

-- Index for product reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- ==========================================
-- SEED DATA (Default passwords are 'password123')
-- ==========================================

-- 1. Admin
INSERT INTO users (id, email, password_hash, role, name, phone)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin@artify.com', '$2a$10$X8TeeZ.6wU97C.x2i4B8K.r39ZqNn0c1c4Lw8d.wS9rD3z1J7I6j6', 'admin', 'Artify Admin', '+91 9999999999')
ON CONFLICT (email) DO NOTHING;

-- 2. Sellers
INSERT INTO users (id, email, password_hash, role, name, phone)
VALUES 
('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'suresh@artify.com', '$2a$10$X8TeeZ.6wU97C.x2i4B8K.r39ZqNn0c1c4Lw8d.wS9rD3z1J7I6j6', 'seller', 'Suresh Kumar', '+91 8888888888'),
('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'radha@artify.com', '$2a$10$X8TeeZ.6wU97C.x2i4B8K.r39ZqNn0c1c4Lw8d.wS9rD3z1J7I6j6', 'seller', 'Radha Devi', '+91 7777777777')
ON CONFLICT (email) DO NOTHING;

-- 3. Customers
INSERT INTO users (id, email, password_hash, role, name, phone)
VALUES ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'customer@artify.com', '$2a$10$X8TeeZ.6wU97C.x2i4B8K.r39ZqNn0c1c4Lw8d.wS9rD3z1J7I6j6', 'customer', 'Amit Sharma', '+91 9876543210')
ON CONFLICT (email) DO NOTHING;

-- 4. Seller Profiles
INSERT INTO seller_profiles (id, user_id, business_name, story, craft_type, city, state, upi_id, bank_details, is_approved)
VALUES 
('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Kumhar Gram Terracotta', 'I have been shaping riverbed clay since my childhood in Kumhar Gram. Each piece is fired in a wood-fueled kiln, giving it the natural variations of fire and earth. Cookware made of this clay naturally retains food nutrients.', 'Terracotta Clay Cookware & Pots', 'New Delhi', 'Delhi', 'suresh@okaxis', 'A/C: 1002003004, SBI, Kumhar Gram Branch', true),
('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Radha Handlooms', 'Taught by my grandmother, I spin organic cotton on a hand-operated charkha. Our handloom stoles take up to three days of manual weaving and use 100% natural vegetable dyes (indigo, madder root, and turmeric).', 'Handwoven Stoles & Cotton Rugs', 'Bhagalpur', 'Bihar', 'radha@okicici', 'A/C: 5006007008, PNB, Bhagalpur Branch', true)
ON CONFLICT (user_id) DO NOTHING;

-- 5. Products
INSERT INTO products (id, seller_id, name, description, price, stock, image_url, category, tags)
VALUES 
('11111111-1111-1111-1111-111111111111', 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'Traditional Terracotta Water Pot', 'Keep your water cool naturally during summers. Crafted using high porosity clay from the Yamuna riverbeds. Includes clay lid.', 18.50, 15, 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600', 'Ceramics', ARRAY['pottery', 'clay pot', 'kitchenware']),
('22222222-2222-2222-2222-222222222222', 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'Terracotta Biryani Handi (Clay Cookware)', 'Organic earthenware handi suitable for gas stoves and wood ovens. Cooking in clay balances the pH level of foods.', 24.00, 8, 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600', 'Ceramics', ARRAY['cookware', 'handi', 'organic']),
('33333333-3333-3333-3333-333333333333', 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'Organic Indigo Handloom stole', 'Handwoven stole dyed in natural indigo. Perfect accessory for linen outfits. Breathable and soft cotton texture.', 32.00, 5, 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600', 'Textiles', ARRAY['handloom', 'indigo', 'cotton', 'stole']),
('44444444-4444-4444-4444-444444444444', 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'Traditional Wood-carved Jewelry Box', 'Solid rosewood chest with brass inlay motifs. Features red velvet compartments to protect rings and necklaces.', 29.00, 12, 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600', 'Woodwork', ARRAY['rosewood', 'brass inlay', 'jewelry box'])
ON CONFLICT (id) DO NOTHING;

