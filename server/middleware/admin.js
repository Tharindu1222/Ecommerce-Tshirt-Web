import { promisePool } from '../config/database.js';

// Middleware to check if user is admin
// Note: This assumes authenticateToken has already been called and req.user is set
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user role from database
    const [users] = await promisePool.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user.role = user.role;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

