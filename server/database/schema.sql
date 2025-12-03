-- MySQL Database Schema for T-Shirt E-commerce Store

-- Create database (run this separately if needed)
-- CREATE DATABASE IF NOT EXISTS tshirt_store;
-- USE tshirt_store;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category ENUM('t-shirt', 'hoodie') NOT NULL,
  image_url TEXT NOT NULL,
  sizes JSON NOT NULL,
  colors JSON NOT NULL,
  stock INT DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NULL,
  session_id VARCHAR(255) NULL,
  product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  size VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id),
  INDEX idx_product_id (product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NULL,
  email VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  size VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_id (order_id)
);

-- Insert sample products
INSERT INTO products (id, name, description, price, category, image_url, sizes, colors, stock, featured) VALUES
(UUID(), 'Essential Oversized Tee', 'Premium cotton oversized t-shirt with a relaxed fit. Perfect for everyday wear with superior comfort and style.', 29.99, 't-shirt', 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=800', '["S", "M", "L", "XL", "XXL"]', '["Black", "White", "Gray", "Navy"]', 100, TRUE),
(UUID(), 'Street Oversized Tee', 'Bold oversized t-shirt with a contemporary street style. Made from heavyweight cotton for a premium feel.', 34.99, 't-shirt', 'https://images.pexels.com/photos/8148579/pexels-photo-8148579.jpeg?auto=compress&cs=tinysrgb&w=800', '["S", "M", "L", "XL", "XXL"]', '["Black", "Olive", "Cream"]', 85, TRUE),
(UUID(), 'Classic Oversized Hoodie', 'Ultra-comfortable oversized hoodie with a modern fit. Features premium fleece interior and adjustable drawstrings.', 59.99, 'hoodie', 'https://images.pexels.com/photos/7679453/pexels-photo-7679453.jpeg?auto=compress&cs=tinysrgb&w=800', '["S", "M", "L", "XL", "XXL"]', '["Black", "Gray", "Navy", "Burgundy"]', 75, TRUE),
(UUID(), 'Urban Oversized Hoodie', 'Premium heavyweight hoodie designed for maximum comfort. Perfect for layering with a relaxed, oversized fit.', 64.99, 'hoodie', 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800', '["S", "M", "L", "XL", "XXL"]', '["Black", "Charcoal", "Forest Green"]', 60, TRUE),
(UUID(), 'Minimal Oversized Tee', 'Clean and minimal oversized t-shirt. Crafted from soft cotton with a contemporary silhouette.', 27.99, 't-shirt', 'https://images.pexels.com/photos/8532620/pexels-photo-8532620.jpeg?auto=compress&cs=tinysrgb&w=800', '["S", "M", "L", "XL", "XXL"]', '["White", "Black", "Sand"]', 120, FALSE),
(UUID(), 'Comfort Oversized Hoodie', 'Cozy oversized hoodie with a soft brushed interior. Features kangaroo pocket and ribbed cuffs for the perfect fit.', 54.99, 'hoodie', 'https://images.pexels.com/photos/7679470/pexels-photo-7679470.jpeg?auto=compress&cs=tinysrgb&w=800', '["S", "M", "L", "XL", "XXL"]', '["Gray", "Black", "Navy"]', 90, FALSE);

