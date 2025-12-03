# ⚠️ IMPORTANT: Create Database Tables

Your backend is running but the database tables don't exist. Follow these steps:

## Step 1: Open MySQL

**Option A: MySQL Command Line**
```bash
mysql -u root -p
```

**Option B: MySQL Workbench**
- Open MySQL Workbench
- Connect to your server

## Step 2: Select Your Database

```sql
USE zanru;
```

## Step 3: Run the SQL File

**Option A: Using Command Line**
```bash
mysql -u root -p zanru < server/create-tables-now.sql
```

**Option B: Copy/Paste SQL**
1. Open `server/create-tables-now.sql` in a text editor
2. Copy ALL the contents
3. Paste into MySQL Workbench or command line
4. Execute (F9 in Workbench, or press Enter in command line)

## Step 4: Verify Tables Were Created

Run this in MySQL:
```sql
USE zanru;
SHOW TABLES;
SELECT COUNT(*) FROM products;
```

You should see:
- 4 tables: `products`, `cart_items`, `orders`, `order_items`
- 6 products

## Step 5: Restart Backend (if needed)

If your backend is still running, the errors should stop immediately. If not:
```bash
cd server
npm start
```

## Step 6: Refresh Browser

Refresh your browser - products should now load! 🎉

---

## Quick Copy-Paste SQL (if file doesn't work)

If you can't use the file, copy this entire block:

```sql
USE zanru;

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

INSERT INTO products (id, name, description, price, category, image_url, sizes, colors, stock, featured) VALUES
(UUID(), 'Essential Oversized Tee', 'Premium cotton oversized t-shirt with a relaxed fit. Perfect for everyday wear with superior comfort and style.', 29.99, 't-shirt', 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=800', '["S", "M", "L", "XL", "XXL"]', '["Black", "White", "Gray", "Navy"]', 100, TRUE),
(UUID(), 'Street Oversized Tee', 'Bold oversized t-shirt with a contemporary street style. Made from heavyweight cotton for a premium feel.', 34.99, 't-shirt', 'https://images.pexels.com/photos/8148579/pexels-photo-8148579.jpeg?auto=compress&cs=tinysrgb&w=800', '["S", "M", "L", "XL", "XXL"]', '["Black", "Olive", "Cream"]', 85, TRUE),
(UUID(), 'Classic Oversized Hoodie', 'Ultra-comfortable oversized hoodie with a modern fit. Features premium fleece interior and adjustable drawstrings.', 59.99, 'hoodie', 'https://images.pexels.com/photos/7679453/pexels-photo-7679453.jpeg?auto=compress&cs=tinysrgb&w=800', '["S", "M", "L", "XL", "XXL"]', '["Black", "Gray", "Navy", "Burgundy"]', 75, TRUE),
(UUID(), 'Urban Oversized Hoodie', 'Premium heavyweight hoodie designed for maximum comfort. Perfect for layering with a relaxed, oversized fit.', 64.99, 'hoodie', 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800', '["S", "M", "L", "XL", "XXL"]', '["Black", "Charcoal", "Forest Green"]', 60, TRUE),
(UUID(), 'Minimal Oversized Tee', 'Clean and minimal oversized t-shirt. Crafted from soft cotton with a contemporary silhouette.', 27.99, 't-shirt', 'https://images.pexels.com/photos/8532620/pexels-photo-8532620.jpeg?auto=compress&cs=tinysrgb&w=800', '["S", "M", "L", "XL", "XXL"]', '["White", "Black", "Sand"]', 120, FALSE),
(UUID(), 'Comfort Oversized Hoodie', 'Cozy oversized hoodie with a soft brushed interior. Features kangaroo pocket and ribbed cuffs for the perfect fit.', 54.99, 'hoodie', 'https://images.pexels.com/photos/7679470/pexels-photo-7679470.jpeg?auto=compress&cs=tinysrgb&w=800', '["S", "M", "L", "XL", "XXL"]', '["Gray", "Black", "Navy"]', 90, FALSE);
```

