-- Add payment method columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cod' AFTER status,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' AFTER payment_method,
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255) NULL AFTER payment_status,
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255) NULL AFTER payment_id;

-- Update existing orders to have default payment method
UPDATE orders SET payment_method = 'cod', payment_status = 'pending' WHERE payment_method IS NULL;
