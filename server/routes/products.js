import express from 'express';
import { promisePool } from '../config/database.js';

const router = express.Router();

// GET all products with active flash deals
router.get('/', async (req, res) => {
  try {
    const [rows] = await promisePool.query(`
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
    
    // Format the response to include flashDeal object
    const products = rows.map(row => {
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
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product by ID with flash deal
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await promisePool.query(`
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
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const row = rows[0];
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

export default router;

