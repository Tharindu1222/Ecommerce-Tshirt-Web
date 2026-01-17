import express from 'express';
import { randomUUID } from 'crypto';
import { promisePool } from '../config/database.js';

const router = express.Router();

// GET cart items by session_id
router.get('/', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.json([]);
    }

    const [rows] = await promisePool.query(
      `SELECT ci.*, 
              JSON_OBJECT(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'price', p.price,
                'category', p.category,
                'image_url', p.image_url,
                'sizes', p.sizes,
                'colors', p.colors,
                'stock', p.stock,
                'featured', p.featured,
                'created_at', p.created_at,
                'flashDeal', IF(fd.id IS NOT NULL,
                  JSON_OBJECT(
                    'id', fd.id,
                    'discount_percentage', fd.discount_percentage,
                    'start_time', fd.start_time,
                    'end_time', fd.end_time,
                    'is_active', fd.is_active
                  ),
                  NULL
                )
              ) as product
       FROM cart_items ci
       LEFT JOIN products p ON ci.product_id = p.id
       LEFT JOIN flash_deals fd ON p.id = fd.product_id 
         AND fd.is_active = TRUE 
         AND fd.start_time <= NOW() 
         AND fd.end_time > NOW()
       WHERE ci.session_id = ?
       ORDER BY ci.created_at DESC`,
      [sessionId]
    );

    // Parse JSON fields
    const cartItems = rows.map(row => {
      const product = typeof row.product === 'string' ? JSON.parse(row.product) : row.product;
      if (product.sizes && typeof product.sizes === 'string') {
        product.sizes = JSON.parse(product.sizes);
      }
      if (product.colors && typeof product.colors === 'string') {
        product.colors = JSON.parse(product.colors);
      }
      return {
        ...row,
        product
      };
    });

    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart items' });
  }
});

// POST add item to cart
router.post('/', async (req, res) => {
  try {
    const { product_id, quantity, size, color } = req.body;
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Check if item already exists
    const [existing] = await promisePool.query(
      'SELECT * FROM cart_items WHERE session_id = ? AND product_id = ? AND size = ? AND color = ?',
      [sessionId, product_id, size, color]
    );

    if (existing.length > 0) {
      // Update quantity
      const newQuantity = existing[0].quantity + quantity;
      await promisePool.query(
        'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?',
        [newQuantity, existing[0].id]
      );

      // Fetch updated item with product
      const [updated] = await promisePool.query(
        `SELECT ci.*, 
                JSON_OBJECT(
                  'id', p.id,
                  'name', p.name,
                  'description', p.description,
                  'price', p.price,
                  'category', p.category,
                  'image_url', p.image_url,
                  'sizes', p.sizes,
                  'colors', p.colors,
                  'stock', p.stock,
                  'featured', p.featured,
                  'created_at', p.created_at,
                  'flashDeal', IF(fd.id IS NOT NULL,
                    JSON_OBJECT(
                      'id', fd.id,
                      'discount_percentage', fd.discount_percentage,
                      'start_time', fd.start_time,
                      'end_time', fd.end_time,
                      'is_active', fd.is_active
                    ),
                    NULL
                  )
                ) as product
         FROM cart_items ci
         LEFT JOIN products p ON ci.product_id = p.id
         LEFT JOIN flash_deals fd ON p.id = fd.product_id 
           AND fd.is_active = TRUE 
           AND fd.start_time <= NOW() 
           AND fd.end_time > NOW()
         WHERE ci.id = ?`,
        [existing[0].id]
      );

      const product = typeof updated[0].product === 'string' ? JSON.parse(updated[0].product) : updated[0].product;
      if (product.sizes && typeof product.sizes === 'string') {
        product.sizes = JSON.parse(product.sizes);
      }
      if (product.colors && typeof product.colors === 'string') {
        product.colors = JSON.parse(product.colors);
      }
      return res.json({
        ...updated[0],
        product
      });
    }

    // Insert new item
    const cartItemId = randomUUID();
    await promisePool.query(
      'INSERT INTO cart_items (id, session_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?, ?)',
      [cartItemId, sessionId, product_id, quantity, size, color]
    );

    // Fetch created item with product
    const [newItem] = await promisePool.query(
      `SELECT ci.*, 
              JSON_OBJECT(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'price', p.price,
                'category', p.category,
                'image_url', p.image_url,
                'sizes', p.sizes,
                'colors', p.colors,
                'stock', p.stock,
                'featured', p.featured,
                'created_at', p.created_at,
                'flashDeal', IF(fd.id IS NOT NULL,
                  JSON_OBJECT(
                    'id', fd.id,
                    'discount_percentage', fd.discount_percentage,
                    'start_time', fd.start_time,
                    'end_time', fd.end_time,
                    'is_active', fd.is_active
                  ),
                  NULL
                )
              ) as product
       FROM cart_items ci
       LEFT JOIN products p ON ci.product_id = p.id
       LEFT JOIN flash_deals fd ON p.id = fd.product_id 
         AND fd.is_active = TRUE 
         AND fd.start_time <= NOW() 
         AND fd.end_time > NOW()
       WHERE ci.id = ?`,
      [cartItemId]
    );

    const product = typeof newItem[0].product === 'string' ? JSON.parse(newItem[0].product) : newItem[0].product;
    if (product.sizes && typeof product.sizes === 'string') {
      product.sizes = JSON.parse(product.sizes);
    }
    if (product.colors && typeof product.colors === 'string') {
      product.colors = JSON.parse(product.colors);
    }
    res.status(201).json({
      ...newItem[0],
      product
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PUT update cart item quantity
router.put('/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    if (quantity <= 0) {
      // Delete item if quantity is 0 or less
      await promisePool.query(
        'DELETE FROM cart_items WHERE id = ? AND session_id = ?',
        [req.params.id, sessionId]
      );
      return res.json({ message: 'Item removed from cart' });
    }

    await promisePool.query(
      'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ? AND session_id = ?',
      [quantity, req.params.id, sessionId]
    );

    // Fetch updated item with product
    const [updated] = await promisePool.query(
      `SELECT ci.*, 
              JSON_OBJECT(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'price', p.price,
                'category', p.category,
                'image_url', p.image_url,
                'sizes', p.sizes,
                'colors', p.colors,
                'stock', p.stock,
                'featured', p.featured,
                'created_at', p.created_at,
                'flashDeal', IF(fd.id IS NOT NULL,
                  JSON_OBJECT(
                    'id', fd.id,
                    'discount_percentage', fd.discount_percentage,
                    'start_time', fd.start_time,
                    'end_time', fd.end_time,
                    'is_active', fd.is_active
                  ),
                  NULL
                )
              ) as product
       FROM cart_items ci
       LEFT JOIN products p ON ci.product_id = p.id
       LEFT JOIN flash_deals fd ON p.id = fd.product_id 
         AND fd.is_active = TRUE 
         AND fd.start_time <= NOW() 
         AND fd.end_time > NOW()
       WHERE ci.id = ?`,
      [req.params.id]
    );

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const product = typeof updated[0].product === 'string' ? JSON.parse(updated[0].product) : updated[0].product;
    if (product.sizes && typeof product.sizes === 'string') {
      product.sizes = JSON.parse(product.sizes);
    }
    if (product.colors && typeof product.colors === 'string') {
      product.colors = JSON.parse(product.colors);
    }
    res.json({
      ...updated[0],
      product
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE remove item from cart
router.delete('/:id', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    await promisePool.query(
      'DELETE FROM cart_items WHERE id = ? AND session_id = ?',
      [req.params.id, sessionId]
    );

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// DELETE clear entire cart
router.delete('/', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    await promisePool.query(
      'DELETE FROM cart_items WHERE session_id = ?',
      [sessionId]
    );

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;

