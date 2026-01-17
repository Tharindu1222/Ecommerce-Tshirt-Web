import { promisePool } from './config/database.js';

/**
 * Quick database diagnostic script
 * Checks if all required columns and tables exist
 */

async function checkDatabase() {
  console.log('🔍 Checking database setup...\n');

  try {
    // 1. Check if users table has role column
    console.log('1️⃣  Checking users table...');
    try {
      const [users] = await promisePool.query('SELECT id, email, role FROM users LIMIT 1');
      console.log('✅ Users table OK (role column exists)');
      console.log(`   Sample: ${users.length > 0 ? users[0].email : 'No users yet'}\n`);
    } catch (error) {
      console.log('❌ Issue with users table:');
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('   Missing "role" column - Run: node setup-customer-management.js\n');
      } else {
        console.log(`   ${error.message}\n`);
      }
    }

    // 2. Check if orders table has user_id column
    console.log('2️⃣  Checking orders table...');
    try {
      const [orders] = await promisePool.query('SELECT id, user_id, email FROM orders LIMIT 1');
      console.log('✅ Orders table OK (user_id column exists)');
      console.log(`   Sample: ${orders.length > 0 ? orders[0].id : 'No orders yet'}\n`);
    } catch (error) {
      console.log('❌ Issue with orders table:');
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('   Missing "user_id" column - Run: node setup-customer-management.js\n');
      } else {
        console.log(`   ${error.message}\n`);
      }
    }

    // 3. Check counts
    console.log('3️⃣  Checking data...');
    const [userCount] = await promisePool.query('SELECT COUNT(*) as count FROM users');
    const [orderCount] = await promisePool.query('SELECT COUNT(*) as count FROM orders');
    console.log(`✅ Found ${userCount[0].count} users`);
    console.log(`✅ Found ${orderCount[0].count} orders\n`);

    // 4. Check admin users
    console.log('4️⃣  Checking admin users...');
    try {
      const [admins] = await promisePool.query("SELECT email FROM users WHERE role = 'admin'");
      if (admins.length === 0) {
        console.log('⚠️  No admin users found!');
        console.log('   Create one with: UPDATE users SET role = "admin" WHERE email = "your@email.com"\n');
      } else {
        console.log('✅ Found admin users:');
        admins.forEach(admin => console.log(`   - ${admin.email}`));
        console.log('');
      }
    } catch (error) {
      console.log('❌ Cannot check admin users (role column missing)\n');
    }

    // 5. Check orders with user_id
    console.log('5️⃣  Checking order-user links...');
    try {
      const [linkedOrders] = await promisePool.query('SELECT COUNT(*) as count FROM orders WHERE user_id IS NOT NULL');
      const [totalOrders] = await promisePool.query('SELECT COUNT(*) as count FROM orders');
      console.log(`✅ ${linkedOrders[0].count} of ${totalOrders[0].count} orders are linked to users\n`);
      
      if (linkedOrders[0].count === 0 && totalOrders[0].count > 0) {
        console.log('⚠️  Orders exist but none are linked to users!');
        console.log('   Fix with: UPDATE orders o SET user_id = (SELECT id FROM users u WHERE u.email = o.email LIMIT 1)\n');
      }
    } catch (error) {
      console.log('❌ Cannot check order links (user_id column missing)\n');
    }

    console.log('✅ Database check complete!\n');
    console.log('If you see any ❌ or ⚠️  above, run: node setup-customer-management.js\n');

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('\nPossible issues:');
    console.log('1. Database is not running');
    console.log('2. Wrong credentials in config/database.js');
    console.log('3. Database does not exist\n');
  } finally {
    await promisePool.end();
  }
}

// Run check
checkDatabase().catch(error => {
  console.error('Check failed:', error);
  process.exit(1);
});
