import express from 'express';
import { promisePool } from '../../config/database.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = express.Router();

// Get order statistics - MUST be before /:id route
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total revenue and order stats
    const [revenue] = await promisePool.query(
      `SELECT 
         COALESCE(SUM(total_amount), 0) as total_revenue,
         COUNT(*) as total_orders,
         COALESCE(AVG(total_amount), 0) as avg_order_value
       FROM orders 
       WHERE status != 'cancelled'`
    );

    // Get order counts by status
    const [statusCounts] = await promisePool.query(
      `SELECT status, COUNT(*) as count 
       FROM orders 
       GROUP BY status`
    );

    // Get recent orders (last 30 days)
    const [recentOrders] = await promisePool.query(
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    // Get previous month orders for growth calculation
    const [previousMonthOrders] = await promisePool.query(
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)`
    );

    // Calculate growth
    const currentCount = recentOrders[0].count;
    const previousCount = previousMonthOrders[0].count || 1;
    const ordersGrowth = previousCount > 0 ? Math.round(((currentCount - previousCount) / previousCount) * 100) : 0;

    // Get previous month revenue for growth calculation
    const [previousMonthRevenue] = await promisePool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue 
       FROM orders 
       WHERE status != 'cancelled'
       AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)`
    );

    const [currentMonthRevenue] = await promisePool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue 
       FROM orders 
       WHERE status != 'cancelled'
       AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    const currentRev = parseFloat(currentMonthRevenue[0].revenue);
    const previousRev = parseFloat(previousMonthRevenue[0].revenue) || 1;
    const revenueGrowth = previousRev > 0 ? Math.round(((currentRev - previousRev) / previousRev) * 100) : 0;

    // Format status counts
    const statusObj = statusCounts.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {});

    res.json({
      totalRevenue: parseFloat(revenue[0].total_revenue),
      totalOrders: revenue[0].total_orders,
      averageOrderValue: parseFloat(revenue[0].avg_order_value),
      revenueGrowth: revenueGrowth,
      ordersGrowth: ordersGrowth,
      pendingOrders: statusObj['pending'] || 0,
      processingOrders: statusObj['processing'] || 0,
      shippedOrders: statusObj['shipped'] || 0,
      deliveredOrders: statusObj['delivered'] || 0,
      cancelledOrders: statusObj['cancelled'] || 0,
      recentOrders: recentOrders[0].count
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

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

export default router;


