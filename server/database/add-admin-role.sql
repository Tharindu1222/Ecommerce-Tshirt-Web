-- Add admin role to users table
-- Run this SQL to add admin functionality

USE zanru;

-- Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') DEFAULT 'user';

-- Create index for role
CREATE INDEX IF NOT EXISTS idx_role ON users(role);

-- Optional: Set yourself as admin (replace 'your-email@example.com' with your email)
-- UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

