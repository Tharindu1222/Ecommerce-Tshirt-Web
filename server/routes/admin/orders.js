import express from 'express';
import { promisePool } from '../../config/database.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = express.Router();

// Get all orders (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, email } = req.query;
    
    let query = `
      SELECT o.*, 
             u.first_name, u.last_name, u.phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (email) {
      query += ' AND o.email LIKE ?';
      params.push(`%${email}%`);
    }

    query += ' ORDER BY o.created_at DESC';

    const [orders] = await promisePool.query(query, params);

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await promisePool.query(
          `SELECT oi.*, p.name as product_name, p.image_url as product_image
           FROM order_items oi
           LEFT JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?
           ORDER BY oi.created_at`,
          [order.id]
        );

        return {
          ...order,
          shipping_address: typeof order.shipping_address === 'string' 
            ? JSON.parse(order.shipping_address) 
            : order.shipping_address,
          items: items
        };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by ID
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await promisePool.query(
      `SELECT o.*, 
              u.first_name, u.last_name, u.phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Get order items
    const [items] = await promisePool.query(
      `SELECT oi.*, p.name as product_name, p.image_url as product_image, p.description as product_description
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?
       ORDER BY oi.created_at`,
      [id]
    );

    res.json({
      ...order,
      shipping_address: typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address,
      items: items
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await promisePool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );

    // Get updated order
    const [orders] = await promisePool.query(
      `SELECT o.*, 
              u.first_name, u.last_name, u.phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );

    const order = orders[0];

    // Get order items
    const [items] = await promisePool.query(
      `SELECT oi.*, p.name as product_name, p.image_url as product_image
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    res.json({
      ...order,
      shipping_address: typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address,
      items: items
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Get order statistics
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalOrders] = await promisePool.query(
      'SELECT COUNT(*) as count FROM orders'
    );

    const [statusCounts] = await promisePool.query(
      `SELECT status, COUNT(*) as count 
       FROM orders 
       GROUP BY status`
    );

    const [revenue] = await promisePool.query(
      `SELECT 
         SUM(total_amount) as total_revenue,
         COUNT(*) as total_orders,
         AVG(total_amount) as avg_order_value
       FROM orders 
       WHERE status != 'cancelled'`
    );

    const [recentOrders] = await promisePool.query(
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    res.json({
      totalOrders: totalOrders[0].count,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
      revenue: revenue[0] || { total_revenue: 0, total_orders: 0, avg_order_value: 0 },
      recentOrders: recentOrders[0].count
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

export default router;


