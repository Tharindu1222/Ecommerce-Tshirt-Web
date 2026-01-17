import express from 'express';
import { promisePool } from '../../config/database.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = express.Router();

// Get product statistics - MUST be before other routes
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalProducts] = await promisePool.query('SELECT COUNT(*) as count FROM products');
    const [featuredProducts] = await promisePool.query("SELECT COUNT(*) as count FROM products WHERE featured = TRUE");
    const [lowStock] = await promisePool.query("SELECT COUNT(*) as count FROM products WHERE stock < 10 AND stock > 0");
    const [outOfStock] = await promisePool.query("SELECT COUNT(*) as count FROM products WHERE stock = 0");
    const [categoryCounts] = await promisePool.query(
      'SELECT category, COUNT(*) as count FROM products GROUP BY category'
    );
    const [recentProducts] = await promisePool.query(
      'SELECT COUNT(*) as count FROM products WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const [totalStock] = await promisePool.query('SELECT SUM(stock) as total FROM products');
    const [inventoryValue] = await promisePool.query('SELECT SUM(price * stock) as value FROM products');

    res.json({
      totalProducts: totalProducts[0].count,
      featuredProducts: featuredProducts[0].count,
      lowStock: lowStock[0].count,
      outOfStock: outOfStock[0].count,
      categoryCounts: categoryCounts.reduce((acc, item) => {
        acc[item.category] = item.count;
        return acc;
      }, {}),
      recentProducts: recentProducts[0].count,
      totalStock: totalStock[0].total || 0,
      inventoryValue: parseFloat(inventoryValue[0].value || 0)
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ error: 'Failed to fetch product statistics' });
  }
});

// Get low stock products - Add after stats route
router.get('/low-stock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    
    const [products] = await promisePool.query(
      `SELECT id, name, stock, price, image_url, category
       FROM products 
       WHERE stock <= ? AND stock > 0
       ORDER BY stock ASC`,
      [threshold]
    );

    res.json(products);
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

// Get out of stock products
router.get('/out-of-stock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [products] = await promisePool.query(
      `SELECT id, name, stock, price, image_url, category
       FROM products 
       WHERE stock = 0
       ORDER BY name ASC`
    );

    res.json(products);
  } catch (error) {
    console.error('Error fetching out of stock products:', error);
    res.status(500).json({ error: 'Failed to fetch out of stock products' });
  }
});

// Get all products (admin view with more details)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [products] = await promisePool.query(`
      SELECT 
        p.*,
        fd.id as flash_deal_id,
        fd.discount_percentage,
        fd.start_time,
        fd.end_time,
        fd.is_active as flash_deal_active
      FROM products p
      LEFT JOIN flash_deals fd ON p.id = fd.product_id 
        AND fd.is_active = TRUE 
        AND fd.start_time <= NOW() 
        AND fd.end_time > NOW()
      ORDER BY p.created_at DESC
    `);

    const formattedProducts = products.map(row => {
      const product = {
        id: row.id,
        name: row.name,
        description: row.description,
        price: row.price,
        category: row.category,
        image_url: row.image_url,
        sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes,
        colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors,
        stock: row.stock,
        featured: row.featured,
        created_at: row.created_at
      };
      
      // Add flashDeal if exists
      if (row.flash_deal_id) {
        product.flashDeal = {
          id: row.flash_deal_id,
          discount_percentage: row.discount_percentage,
          start_time: row.start_time,
          end_time: row.end_time,
          is_active: row.flash_deal_active
        };
      }
      
      return product;
    });

    res.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [products] = await promisePool.query(`
      SELECT 
        p.*,
        fd.id as flash_deal_id,
        fd.discount_percentage,
        fd.start_time,
        fd.end_time,
        fd.is_active as flash_deal_active
      FROM products p
      LEFT JOIN flash_deals fd ON p.id = fd.product_id 
        AND fd.is_active = TRUE 
        AND fd.start_time <= NOW() 
        AND fd.end_time > NOW()
      WHERE p.id = ?
    `, [req.params.id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const row = products[0];
    const product = {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      category: row.category,
      image_url: row.image_url,
      sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes,
      colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors,
      stock: row.stock,
      featured: row.featured,
      created_at: row.created_at
    };
    
    // Add flashDeal if exists
    if (row.flash_deal_id) {
      product.flashDeal = {
        id: row.flash_deal_id,
        discount_percentage: row.discount_percentage,
        start_time: row.start_time,
        end_time: row.end_time,
        is_active: row.flash_deal_active
      };
    }

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
    const forceDelete = req.query.force === 'true';

    // Check if product exists in any orders
    const [orderItems] = await promisePool.query(
      'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
      [req.params.id]
    );

    if (orderItems[0].count > 0 && !forceDelete) {
      return res.status(400).json({ 
        error: 'Cannot delete product that has been ordered. It appears in existing orders.',
        canForceDelete: true
      });
    }

    // If force delete and product is in orders, we need to handle order_items
    if (forceDelete && orderItems[0].count > 0) {
      // Option 1: Set product_id to NULL in order_items (requires schema change)
      // Option 2: Delete the order_items (loses order history - not recommended)
      // Option 3: Keep product info but mark as deleted
      // For now, we'll delete order_items to allow the delete
      await promisePool.query(
        'DELETE FROM order_items WHERE product_id = ?',
        [req.params.id]
      );
    }

    // Delete from cart_items first
    await promisePool.query(
      'DELETE FROM cart_items WHERE product_id = ?',
      [req.params.id]
    );

    // Now delete the product
    const [result] = await promisePool.query(
      'DELETE FROM products WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ 
      message: 'Product deleted successfully',
      orderItemsDeleted: forceDelete && orderItems[0].count > 0
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;

