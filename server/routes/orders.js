import express from 'express';
import { randomUUID } from 'crypto';
import { promisePool } from '../config/database.js';

const router = express.Router();

// POST create order
router.post('/', async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { email, total_amount, shipping_address, cartItems } = req.body;

    // Insert order
    const orderId = randomUUID();
    await connection.query(
      'INSERT INTO orders (id, email, total_amount, status, shipping_address) VALUES (?, ?, ?, ?, ?)',
      [orderId, email, total_amount, 'pending', JSON.stringify(shipping_address)]
    );

    // Insert order items
    if (cartItems.length > 0) {
      const orderItems = cartItems.map(item => [
        randomUUID(),
        orderId,
        item.product_id,
        item.quantity,
        item.size,
        item.color,
        item.price
      ]);

      await connection.query(
        'INSERT INTO order_items (id, order_id, product_id, quantity, size, color, price) VALUES ?',
        [orderItems]
      );
    }

    await connection.commit();

    // Fetch created order
    const [order] = await connection.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    res.status(201).json({
      ...order[0],
      shipping_address: JSON.parse(order[0].shipping_address)
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    connection.release();
  }
});

// GET orders by email
router.get('/', async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    const [rows] = await promisePool.query(
      'SELECT * FROM orders WHERE email = ? ORDER BY created_at DESC',
      [email]
    );

    const orders = rows.map(row => ({
      ...row,
      shipping_address: JSON.parse(row.shipping_address)
    }));

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;

