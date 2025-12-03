-- Users table for authentication and profiles
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Update orders table to link to users
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS user_id VARCHAR(36),
ADD FOREIGN KEY IF NOT EXISTS (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Update cart_items to link to users (already has user_id, but ensure foreign key)
ALTER TABLE cart_items
ADD FOREIGN KEY IF NOT EXISTS (user_id) REFERENCES users(id) ON DELETE SET NULL;

