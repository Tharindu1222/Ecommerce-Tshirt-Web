import express from 'express';
import { promisePool } from '../../config/database.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = express.Router();

// Get all flash deals
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [deals] = await promisePool.query(
      `SELECT fd.*, p.name as product_name, p.price as original_price, p.image_url
       FROM flash_deals fd
       LEFT JOIN products p ON fd.product_id = p.id
       ORDER BY fd.created_at DESC`
    );

    res.json(deals);
  } catch (error) {
    console.error('Error fetching flash deals:', error);
    res.status(500).json({ error: 'Failed to fetch flash deals' });
  }
});

// Get active flash deals (public route)
router.get('/active', async (req, res) => {
  try {
    const [deals] = await promisePool.query(
      `SELECT fd.*, p.name as product_name, p.price as original_price, p.image_url
       FROM flash_deals fd
       LEFT JOIN products p ON fd.product_id = p.id
       WHERE fd.is_active = TRUE 
       AND fd.start_time <= NOW() 
       AND fd.end_time >= NOW()
       ORDER BY fd.end_time ASC`
    );

    res.json(deals);
  } catch (error) {
    console.error('Error fetching active flash deals:', error);
    res.status(500).json({ error: 'Failed to fetch active flash deals' });
  }
});

// Get flash deal by product ID (public route)
router.get('/product/:productId', async (req, res) => {
  try {
    const [deals] = await promisePool.query(
      `SELECT * FROM flash_deals 
       WHERE product_id = ? 
       AND is_active = TRUE 
       AND start_time <= NOW() 
       AND end_time >= NOW()
       LIMIT 1`,
      [req.params.productId]
    );

    if (deals.length === 0) {
      return res.json(null);
    }

    res.json(deals[0]);
  } catch (error) {
    console.error('Error fetching flash deal:', error);
    res.status(500).json({ error: 'Failed to fetch flash deal' });
  }
});

// Create flash deal
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { product_id, discount_percentage, start_time, end_time } = req.body;

    if (!product_id || !discount_percentage || !start_time || !end_time) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (discount_percentage < 1 || discount_percentage > 99) {
      return res.status(400).json({ error: 'Discount must be between 1-99%' });
    }

    // Check if product exists
    const [products] = await promisePool.query(
      'SELECT id FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check for overlapping deals
    const [existing] = await promisePool.query(
      `SELECT id FROM flash_deals 
       WHERE product_id = ? 
       AND is_active = TRUE
       AND (
         (start_time <= ? AND end_time >= ?)
         OR (start_time <= ? AND end_time >= ?)
         OR (start_time >= ? AND end_time <= ?)
       )`,
      [product_id, start_time, start_time, end_time, end_time, start_time, end_time]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'This product already has an active flash deal in this time period' });
    }

    const [result] = await promisePool.query(
      `INSERT INTO flash_deals (product_id, discount_percentage, start_time, end_time) 
       VALUES (?, ?, ?, ?)`,
      [product_id, discount_percentage, start_time, end_time]
    );

    res.status(201).json({
      message: 'Flash deal created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating flash deal:', error);
    res.status(500).json({ error: 'Failed to create flash deal' });
  }
});

// Update flash deal
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { discount_percentage, start_time, end_time, is_active } = req.body;

    await promisePool.query(
      `UPDATE flash_deals 
       SET discount_percentage = ?, start_time = ?, end_time = ?, is_active = ?
       WHERE id = ?`,
      [discount_percentage, start_time, end_time, is_active, req.params.id]
    );

    res.json({ message: 'Flash deal updated successfully' });
  } catch (error) {
    console.error('Error updating flash deal:', error);
    res.status(500).json({ error: 'Failed to update flash deal' });
  }
});

// Delete flash deal
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await promisePool.query('DELETE FROM flash_deals WHERE id = ?', [req.params.id]);
    res.json({ message: 'Flash deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting flash deal:', error);
    res.status(500).json({ error: 'Failed to delete flash deal' });
  }
});

export default router;
