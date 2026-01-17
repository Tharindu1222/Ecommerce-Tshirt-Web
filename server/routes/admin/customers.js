import express from 'express';
import { promisePool } from '../../config/database.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

// Helper to combine auth middlewares
const adminAuth = async (req, res, next) => {
  authenticateToken(req, res, () => {
    requireAdmin(req, res, next);
  });
};

const router = express.Router();

/**
 * Get ALL customers - both registered users AND guest customers
 * Includes people who ordered without creating an account
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    // Get registered users with their order stats
    const [registeredUsers] = await promisePool.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.city,
        u.state,
        u.role,
        u.created_at,
        'registered' as customer_type,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id OR u.email = o.email
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    // Get guest customers (people who ordered without account)
    const [guestCustomers] = await promisePool.query(`
      SELECT 
        NULL as id,
        o.email,
        MAX(JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.firstName'))) as first_name,
        MAX(JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.lastName'))) as last_name,
        MAX(JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.phone'))) as phone,
        MAX(JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.city'))) as city,
        MAX(JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.state'))) as state,
        'user' as role,
        MIN(o.created_at) as created_at,
        'guest' as customer_type,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM orders o
      LEFT JOIN users u ON o.email = u.email
      WHERE u.id IS NULL
      GROUP BY o.email
      ORDER BY MIN(o.created_at) DESC
    `);

    // Combine both lists and convert numeric values
    const allCustomers = [...registeredUsers, ...guestCustomers].map(customer => ({
      ...customer,
      total_orders: parseInt(customer.total_orders || 0),
      total_spent: parseFloat(customer.total_spent || 0)
    }));

    res.json(allCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * Get customer statistics including guest customers
 */
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    // Registered users
    const [registeredCount] = await promisePool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'user'"
    );

    // Guest customers (unique emails from orders without user accounts)
    const [guestCount] = await promisePool.query(`
      SELECT COUNT(DISTINCT o.email) as count
      FROM orders o
      LEFT JOIN users u ON o.email = u.email
      WHERE u.id IS NULL
    `);

    // Active customers (ordered in last 90 days) - both types
    const [activeRegistered] = await promisePool.query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      INNER JOIN orders o ON (u.id = o.user_id OR u.email = o.email)
      WHERE u.role = 'user' 
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    `);

    const [activeGuest] = await promisePool.query(`
      SELECT COUNT(DISTINCT o.email) as count
      FROM orders o
      LEFT JOIN users u ON o.email = u.email
      WHERE u.id IS NULL 
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    `);

    // Revenue and order stats
    const [revenue] = await promisePool.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders'
    );

    const [orderStats] = await promisePool.query(
      'SELECT COUNT(*) as total_orders, COALESCE(AVG(total_amount), 0) as avg_value FROM orders'
    );

    const totalCustomers = registeredCount[0].count + guestCount[0].count;
    const activeCustomers = activeRegistered[0].count + activeGuest[0].count;

    res.json({
      totalCustomers,
      registeredCustomers: registeredCount[0].count,
      guestCustomers: guestCount[0].count,
      activeCustomers,
      totalRevenue: parseFloat(revenue[0].total),
      avgOrderValue: parseFloat(orderStats[0].avg_value),
      conversionRate: totalCustomers > 0 
        ? ((registeredCount[0].count / totalCustomers) * 100).toFixed(1)
        : 0
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * Get customer details by email (works for both registered and guest)
 */
router.get('/by-email/:email', adminAuth, async (req, res) => {
  try {
    const { email } = req.params;

    // Check if registered user exists
    const [users] = await promisePool.query(
      'SELECT id, email, first_name, last_name, phone, address, city, state, zip_code, country, role, created_at FROM users WHERE email = ?',
      [email]
    );

    let customerInfo;
    let customerType = 'guest';

    if (users.length > 0) {
      // Registered user
      const user = users[0];
      customerType = 'registered';
      customerInfo = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zip_code,
        country: user.country,
        role: user.role,
        created_at: user.created_at,
        customer_type: customerType
      };
    } else {
      // Guest customer - get info from most recent order
      const [orders] = await promisePool.query(
        'SELECT shipping_address, created_at FROM orders WHERE email = ? ORDER BY created_at DESC LIMIT 1',
        [email]
      );

      if (orders.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const shippingAddress = typeof orders[0].shipping_address === 'string'
        ? JSON.parse(orders[0].shipping_address)
        : orders[0].shipping_address;

      customerInfo = {
        id: null,
        email: email,
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country || 'USA',
        role: 'user',
        created_at: orders[0].created_at,
        customer_type: customerType
      };
    }

    // Get all orders for this email
    const [orders] = await promisePool.query(`
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.payment_method,
        o.payment_status,
        o.created_at,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.email = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 20
    `, [email]);

    // Get order statistics
    const [stats] = await promisePool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_spent
      FROM orders
      WHERE email = ?
    `, [email]);

    res.json({
      ...customerInfo,
      total_orders: stats[0].total_orders,
      total_spent: parseFloat(stats[0].total_spent),
      orders: orders.map(order => ({
        ...order,
        total_amount: parseFloat(order.total_amount),
        items_count: parseInt(order.items_count)
      }))
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

/**
 * Get guest customers only
 */
router.get('/guests', adminAuth, async (req, res) => {
  try {
    const [guestCustomers] = await promisePool.query(`
      SELECT 
        o.email,
        MAX(JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.firstName'))) as first_name,
        MAX(JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.lastName'))) as last_name,
        MAX(JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.phone'))) as phone,
        MAX(JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.city'))) as city,
        MAX(JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.state'))) as state,
        MIN(o.created_at) as first_order_date,
        MAX(o.created_at) as last_order_date,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM orders o
      LEFT JOIN users u ON o.email = u.email
      WHERE u.id IS NULL
      GROUP BY o.email
      ORDER BY MAX(o.created_at) DESC
    `);

    res.json(guestCustomers);
  } catch (error) {
    console.error('Error fetching guest customers:', error);
    res.status(500).json({ error: 'Failed to fetch guest customers' });
  }
});

/**
 * Convert guest customer to registered user (send invitation)
 * This marks them for invitation - actual registration done by user
 */
router.post('/invite-guest', adminAuth, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const [existing] = await promisePool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already has an account' });
    }

    // Check if they have orders
    const [orders] = await promisePool.query(
      'SELECT COUNT(*) as count FROM orders WHERE email = ?',
      [email]
    );

    if (orders[0].count === 0) {
      return res.status(404).json({ error: 'No orders found for this email' });
    }

    // In a real system, you would:
    // 1. Create an invitation record
    // 2. Send an email with registration link
    // 3. Include a special token for account creation
    
    res.json({
      message: 'Guest customer identified for invitation',
      email: email,
      orderCount: orders[0].count,
      note: 'In production, send invitation email with registration link'
    });
  } catch (error) {
    console.error('Error inviting guest:', error);
    res.status(500).json({ error: 'Failed to invite guest customer' });
  }
});

export default router;
