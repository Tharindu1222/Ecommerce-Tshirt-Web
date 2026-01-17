import { promisePool } from './config/database.js';

/**
 * Setup script for Customer Management System
 * This ensures all necessary database columns and indexes exist
 */

async function setupCustomerManagement() {
  console.log('🚀 Setting up Customer Management System...\n');

  try {
    // 1. Add role column if it doesn't exist
    console.log('1️⃣  Adding role column to users table...');
    await promisePool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') DEFAULT 'user'
    `);
    console.log('✅ Role column ready\n');

    // 2. Add index on role
    console.log('2️⃣  Creating index on role...');
    try {
      await promisePool.query(`
        CREATE INDEX idx_role ON users(role)
      `);
      console.log('✅ Role index created\n');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Role index already exists\n');
      } else {
        throw error;
      }
    }

    // 3. Add user_id to orders if not exists (should already be there)
    console.log('3️⃣  Ensuring user_id column in orders table...');
    await promisePool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS user_id VARCHAR(36)
    `);
    console.log('✅ User_id column ready\n');

    // 4. Add foreign key for user_id in orders
    console.log('4️⃣  Creating foreign key for orders.user_id...');
    try {
      // Check if foreign key already exists
      const [fks] = await promisePool.query(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        AND CONSTRAINT_NAME = 'orders_ibfk_user'
      `);

      if (fks.length === 0) {
        await promisePool.query(`
          ALTER TABLE orders 
          ADD CONSTRAINT orders_ibfk_user 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        `);
        console.log('✅ Foreign key created\n');
      } else {
        console.log('ℹ️  Foreign key already exists\n');
      }
    } catch (error) {
      if (error.code === 'ER_FK_DUP_NAME' || error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Foreign key already exists\n');
      } else {
        console.log('⚠️  Foreign key creation skipped (may already exist)\n');
      }
    }

    // 5. Verify setup
    console.log('5️⃣  Verifying setup...');
    const [users] = await promisePool.query('SELECT COUNT(*) as count FROM users');
    const [admins] = await promisePool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const [orders] = await promisePool.query('SELECT COUNT(*) as count FROM orders WHERE user_id IS NOT NULL');
    
    console.log('✅ Setup verification:');
    console.log(`   - Total users: ${users[0].count}`);
    console.log(`   - Admin users: ${admins[0].count}`);
    console.log(`   - Orders with user_id: ${orders[0].count}\n`);

    // 6. Check for admin users
    if (admins[0].count === 0) {
      console.log('⚠️  WARNING: No admin users found!');
      console.log('   To create an admin user, run:');
      console.log('   UPDATE users SET role = \'admin\' WHERE email = \'your-email@example.com\';\n');
    } else {
      const [adminList] = await promisePool.query("SELECT email FROM users WHERE role = 'admin'");
      console.log('👑 Admin users:');
      adminList.forEach(admin => {
        console.log(`   - ${admin.email}`);
      });
      console.log('');
    }

    console.log('🎉 Customer Management System setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Ensure you have at least one admin user');
    console.log('2. Start the server: npm start');
    console.log('3. Login as admin and navigate to Customers tab');
    console.log('');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    throw error;
  } finally {
    await promisePool.end();
  }
}

// Run setup
setupCustomerManagement().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});
