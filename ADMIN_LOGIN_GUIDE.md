# Admin Login Guide

## 🚀 Quick Steps to Access Admin Panel

### Step 1: Make Your Account Admin

Run this SQL command in your MySQL database:

```sql
USE zanru;
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Replace `'your-email@example.com'` with your actual email address.

### Step 2: Login

1. Go to your website: `http://localhost:5173`
2. Click the **Login** button in the navbar
3. Enter your email and password
4. Click **Login**

### Step 3: Automatic Redirect

After logging in with an admin account, you will be **automatically redirected** to the admin dashboard at `/admin`.

### Alternative Access Methods

You can also access the admin panel by:

1. **Settings Icon**: After logging in as admin, click the ⚙️ (Settings) icon in the navbar
2. **Direct URL**: Navigate to `http://localhost:5173/admin` (will redirect if not admin)

## 🔒 Security Features

- Only users with `role = 'admin'` can access the admin panel
- Non-admin users are automatically redirected to the home page
- Admin routes are protected on both frontend and backend

## 📋 Admin Dashboard Features

Once logged in, you can:

- **Statistics**: View user statistics and overview
- **Products**: Add, edit, and delete products
- **Users**: Manage users, change roles, reset passwords

## 🐛 Troubleshooting

**Problem**: Login doesn't redirect to admin panel
- **Solution**: Make sure you've updated your user role in the database (Step 1)
- **Solution**: Logout and login again to refresh your session

**Problem**: "Access Denied" message
- **Solution**: Your account doesn't have admin role. Run the SQL command in Step 1
- **Solution**: Make sure you're logged in with the correct email

**Problem**: Can't see Settings icon
- **Solution**: Only admin users see the Settings icon. Verify your role in database

