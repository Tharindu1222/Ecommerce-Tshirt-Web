import express from 'express';
import bcrypt from 'bcryptjs';
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

// Get all users
router.get('/', adminAuth, async (req, res) => {
  try {
    const [users] = await promisePool.query(
      `SELECT id, email, first_name, last_name, phone, role, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await promisePool.query(
      `SELECT id, email, first_name, last_name, phone, address, city, state, zip_code, country, role, created_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    res.json({
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
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, phone, address, city, state, zipCode, country, role } = req.body;

    await promisePool.query(
      `UPDATE users 
       SET first_name = ?, last_name = ?, phone = ?, address = ?, 
           city = ?, state = ?, zip_code = ?, country = ?, role = ?, updated_at = NOW()
       WHERE id = ?`,
      [firstName, lastName, phone, address, city, state, zipCode, country || 'USA', role || 'user', req.params.id]
    );

    const [users] = await promisePool.query(
      'SELECT id, email, first_name, last_name, phone, address, city, state, zip_code, country, role FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    res.json({
      message: 'User updated successfully',
      user: {
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
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Don't allow deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const [result] = await promisePool.query(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Reset user password (admin can reset any user's password)
router.post('/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await promisePool.query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, req.params.id]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get user statistics
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalUsers] = await promisePool.query('SELECT COUNT(*) as count FROM users');
    const [totalAdmins] = await promisePool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const [recentUsers] = await promisePool.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    res.json({
      totalUsers: totalUsers[0].count,
      totalAdmins: totalAdmins[0].count,
      recentUsers: recentUsers[0].count
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;

