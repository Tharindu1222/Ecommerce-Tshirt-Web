# Admin Dashboard Setup Guide

Complete guide to set up and use the admin dashboard.

## Step 1: Add Admin Role to Database

Run this SQL in MySQL:

```sql
USE zanru;

-- Add role column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') DEFAULT 'user';

-- Create index for role
CREATE INDEX IF NOT EXISTS idx_role ON users(role);
```

**Or use the SQL file:**
```bash
mysql -u root -p zanru < server/database/add-admin-role.sql
```

## Step 2: Make Yourself Admin

Run this SQL (replace with your email):

```sql
USE zanru;
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Step 3: Install Frontend Dependencies

```bash
npm install
```

This will install `react-router-dom` for routing.

## Step 4: Restart Servers

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
npm run dev
```

## Step 5: Access Admin Dashboard

1. Login with your admin account
2. Click the settings icon (⚙️) in the navbar
3. Or navigate to: `http://localhost:5173/admin`

## Admin Dashboard Features

### 📊 Statistics Tab
- Total users count
- Admin users count
- New users (last 30 days)

### 📦 Products Management
- **View all products** - See all products in a table
- **Add Product** - Create new products with:
  - Name, description, price
  - Category (t-shirt/hoodie)
  - Image URL
  - Sizes and colors (dynamic arrays)
  - Stock quantity
  - Featured status
- **Edit Product** - Update any product details
- **Delete Product** - Remove products from database

### 👥 User Management
- **View all users** - See all registered users
- **Edit User** - Update user information:
  - Name, phone
  - Role (user/admin)
- **Reset Password** - Admin can reset any user's password
- **Delete User** - Remove users (can't delete yourself)

## API Endpoints

### Admin Products
- `GET /api/admin/products` - Get all products
- `GET /api/admin/products/:id` - Get single product
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

### Admin Users
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get single user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/reset-password` - Reset password
- `GET /api/admin/users/stats/overview` - Get user statistics

## Security

- All admin routes require authentication
- Admin middleware checks user role
- Only users with `role = 'admin'` can access
- Protected by JWT tokens

## Troubleshooting

### "Admin access required" error
- Make sure you've set your role to 'admin' in the database
- Logout and login again to refresh your token
- Check backend logs for errors

### Can't see admin icon
- Verify your role is 'admin' in database
- Check browser console for errors
- Make sure you're logged in

### Products/Users not loading
- Check backend is running
- Verify database tables exist
- Check browser console for API errors

## Next Steps

- Add order management
- Add analytics and reports
- Add bulk operations
- Add image upload functionality
- Add product categories management

