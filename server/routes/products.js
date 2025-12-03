import express from 'express';
import { promisePool } from '../config/database.js';

const router = express.Router();

// GET all products
router.get('/', async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = rows[0];
    // Parse JSON fields
    product.sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
    product.colors = typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors;
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;

