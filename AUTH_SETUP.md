# Authentication Setup Guide

Follow these steps to set up user authentication and profiles:

## Step 1: Install Backend Dependencies

```bash
cd server
npm install
```

This will install:
- `bcryptjs` - For password hashing
- `jsonwebtoken` - For JWT token generation

## Step 2: Create Users Table

Run this SQL in your MySQL database:

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

**Or use the SQL file:**
```bash
mysql -u root -p zanru < server/database/add-users-table.sql
```

## Step 3: Add JWT Secret to Backend .env

Add this to your `server/.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Important:** Use a strong, random secret in production!

## Step 4: Restart Backend Server

```bash
cd server
npm start
```

## Step 5: Test Authentication

1. **Register a new user:**
   - Click "Login" in the navbar
   - Click "Sign up"
   - Fill in the registration form
   - Submit

2. **Login:**
   - Click "Login" in the navbar
   - Enter your email and password
   - Submit

3. **View Profile:**
   - After logging in, click the user icon in the navbar
   - Update your profile information
   - Save changes

## Features Included

✅ **User Registration**
- Email and password validation
- Optional profile fields (name, phone)
- Automatic login after registration

✅ **User Login**
- Email/password authentication
- JWT token storage
- Persistent sessions

✅ **User Profiles**
- View and edit profile information
- Address management
- Profile picture placeholder

✅ **Protected Routes**
- JWT token authentication
- Automatic token validation
- Secure API endpoints

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)

## Frontend Components

- `Login.tsx` - Login modal
- `Register.tsx` - Registration modal
- `UserProfile.tsx` - User profile editor
- `AuthContext.tsx` - Authentication state management

## Security Notes

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Tokens are stored in localStorage
- All protected routes require valid JWT token

## Next Steps

- Add password reset functionality
- Add email verification
- Add social login (Google, Facebook)
- Add user roles and permissions

