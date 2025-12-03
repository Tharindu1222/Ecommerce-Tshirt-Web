import express from 'express';
import { promisePool } from '../../config/database.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = express.Router();

// Get all products (admin view with more details)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [products] = await promisePool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );

    const formattedProducts = products.map(product => ({
      ...product,
      sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes,
      colors: typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product statistics
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalProducts] = await promisePool.query('SELECT COUNT(*) as count FROM products');
    const [featuredProducts] = await promisePool.query("SELECT COUNT(*) as count FROM products WHERE featured = TRUE");
    const [lowStock] = await promisePool.query("SELECT COUNT(*) as count FROM products WHERE stock < 10");
    const [categoryCounts] = await promisePool.query(
      'SELECT category, COUNT(*) as count FROM products GROUP BY category'
    );
    const [recentProducts] = await promisePool.query(
      'SELECT COUNT(*) as count FROM products WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const [totalStock] = await promisePool.query('SELECT SUM(stock) as total FROM products');

    res.json({
      totalProducts: totalProducts[0].count,
      featuredProducts: featuredProducts[0].count,
      lowStock: lowStock[0].count,
      categoryCounts: categoryCounts.reduce((acc, item) => {
        acc[item.category] = item.count;
        return acc;
      }, {}),
      recentProducts: recentProducts[0].count,
      totalStock: totalStock[0].total || 0
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ error: 'Failed to fetch product statistics' });
  }
});

// Get single product
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [products] = await promisePool.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    product.sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
    product.colors = typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors;

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, image_url, sizes, colors, stock, featured } = req.body;

    if (!name || !description || !price || !category || !image_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await promisePool.query(
      `INSERT INTO products (name, description, price, category, image_url, sizes, colors, stock, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        price,
        category,
        image_url,
        JSON.stringify(sizes || []),
        JSON.stringify(colors || []),
        stock || 0,
        featured || false
      ]
    );

    // Get created product by name (since UUID doesn't return insertId)
    const [products] = await promisePool.query(
      'SELECT * FROM products WHERE name = ? ORDER BY created_at DESC LIMIT 1',
      [name]
    );

    const product = products[0];
    product.sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
    product.colors = typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors;

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, image_url, sizes, colors, stock, featured } = req.body;

    await promisePool.query(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, category = ?, image_url = ?, 
           sizes = ?, colors = ?, stock = ?, featured = ?
       WHERE id = ?`,
      [
        name,
        description,
        price,
        category,
        image_url,
        JSON.stringify(sizes || []),
        JSON.stringify(colors || []),
        stock,
        featured,
        req.params.id
      ]
    );

    const [products] = await promisePool.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    product.sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
    product.colors = typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors;

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await promisePool.query(
      'DELETE FROM products WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;

