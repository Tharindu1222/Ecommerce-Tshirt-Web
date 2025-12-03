# Create Users Table - Quick Fix

You're getting a 500 error because the `users` table doesn't exist yet. Follow these steps:

## Step 1: Run This SQL in MySQL

**Option A: Using MySQL Command Line**
```bash
mysql -u root -p zanru < server/database/add-users-table.sql
```

**Option B: Copy/Paste into MySQL Workbench**

1. Open MySQL Workbench
2. Connect to your database
3. Select the `zanru` database
4. Copy and paste this SQL:

```sql
USE zanru;

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
```

5. Execute the query (F9 or Execute button)

## Step 2: Verify Table Was Created

Run this in MySQL:
```sql
USE zanru;
SHOW TABLES;
DESCRIBE users;
```

You should see the `users` table listed.

## Step 3: Try Registration Again

After creating the table, try registering again. The 500 error should be resolved!

## Troubleshooting

If you still get errors:
1. Check backend console logs for the actual error message
2. Verify you're connected to the correct database (`zanru`)
3. Make sure MySQL is running
4. Check that the table was created successfully

