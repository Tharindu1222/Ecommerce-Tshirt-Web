import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'zanru',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check and add payment columns
    console.log('📝 Checking and adding payment columns to orders table...');
    
    // Check if columns exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'
    `, [dbConfig.database]);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    // Add payment_method if it doesn't exist
    if (!existingColumns.includes('payment_method')) {
      await connection.query(`ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cod' AFTER status`);
      console.log('✅ Added payment_method column');
    } else {
      console.log('ℹ️  payment_method column already exists');
    }
    
    // Add payment_status if it doesn't exist
    if (!existingColumns.includes('payment_status')) {
      await connection.query(`ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending' AFTER payment_method`);
      console.log('✅ Added payment_status column');
    } else {
      console.log('ℹ️  payment_status column already exists');
    }
    
    // Add payment_id if it doesn't exist
    if (!existingColumns.includes('payment_id')) {
      await connection.query(`ALTER TABLE orders ADD COLUMN payment_id VARCHAR(255) NULL AFTER payment_status`);
      console.log('✅ Added payment_id column');
    } else {
      console.log('ℹ️  payment_id column already exists');
    }
    
    // Add transaction_id if it doesn't exist
    if (!existingColumns.includes('transaction_id')) {
      await connection.query(`ALTER TABLE orders ADD COLUMN transaction_id VARCHAR(255) NULL AFTER payment_id`);
      console.log('✅ Added transaction_id column');
    } else {
      console.log('ℹ️  transaction_id column already exists');
    }

    // Update existing orders
    console.log('📝 Updating existing orders with default payment method...');
    const updateSQL = `
      UPDATE orders 
      SET payment_method = 'cod', payment_status = 'pending' 
      WHERE payment_method IS NULL
    `;
    
    const [result] = await connection.query(updateSQL);
    console.log(`✅ Updated ${result.affectedRows} existing orders`);

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();
