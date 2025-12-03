# Backend Server - MySQL E-commerce API

This is the backend server for the T-shirt e-commerce application, using Express.js and MySQL.

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Database

1. Create a MySQL database:
```sql
CREATE DATABASE tshirt_store;
```

2. Run the schema file to create tables:
```bash
mysql -u root -p tshirt_store < database/schema.sql
```

Or manually execute the SQL in `database/schema.sql` using your MySQL client.

### 3. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tshirt_store
PORT=3001
```

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product

### Cart
- `GET /api/cart` - Get cart items (requires `x-session-id` header)
- `POST /api/cart` - Add item to cart (requires `x-session-id` header)
- `PUT /api/cart/:id` - Update cart item quantity (requires `x-session-id` header)
- `DELETE /api/cart/:id` - Remove item from cart (requires `x-session-id` header)
- `DELETE /api/cart` - Clear entire cart (requires `x-session-id` header)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders?email=...` - Get orders by email

## Frontend Configuration

Make sure your frontend `.env` file includes:

```env
VITE_API_URL=http://localhost:3001/api
```

