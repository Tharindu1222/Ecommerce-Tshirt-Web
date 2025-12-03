# Admin Dashboard - Quick Start

## 🚀 Setup Steps

### 1. Add Admin Role Column

Run this SQL:
```sql
USE zanru;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') DEFAULT 'user';
CREATE INDEX IF NOT EXISTS idx_role ON users(role);
```

### 2. Make Yourself Admin

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 3. Install Dependencies

```bash
npm install
cd server
npm install
```

### 4. Restart Servers

```bash
# Backend
cd server
npm start

# Frontend (new terminal)
npm run dev
```

### 5. Access Dashboard

1. Login with your admin account
2. Click the ⚙️ icon in navbar
3. Or go to: `http://localhost:5173/admin`

## ✨ Features

### Products Management
- ✅ Add new products
- ✅ Edit existing products  
- ✅ Delete products
- ✅ Manage sizes, colors, stock
- ✅ Set featured products

### User Management
- ✅ View all users
- ✅ Edit user profiles
- ✅ Change user roles (user/admin)
- ✅ Reset passwords
- ✅ Delete users

### Statistics
- ✅ Total users count
- ✅ Admin count
- ✅ New users (30 days)

## 📝 Notes

- All admin routes are protected
- Only users with `role = 'admin'` can access
- Logout and login again after setting admin role to refresh token

