-- Add users table to existing database
-- Run this SQL in your MySQL database (zanru)

USE zanru;

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

-- Update orders table to link to users (if foreign key doesn't exist)
-- Note: MySQL doesn't support IF NOT EXISTS for foreign keys, so run this carefully
-- If you get an error, the foreign key might already exist, which is fine

-- Update cart_items to ensure user_id foreign key exists
-- Same note as above

