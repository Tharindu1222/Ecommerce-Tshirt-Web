import { promisePool } from './config/database.js';
import bcrypt from 'bcryptjs';

/**
 * Seed test customer data for Customer Management System
 * This creates sample customers and orders for testing
 */

async function seedCustomerData() {
  console.log('🌱 Seeding customer data...\n');

  try {
    // Sample customer data
    const customers = [
      {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-0101',
        city: 'New York',
        state: 'NY',
        orders: 5,
        avgAmount: 75.00
      },
      {
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '555-0102',
        city: 'Los Angeles',
        state: 'CA',
        orders: 3,
        avgAmount: 120.00
      },
      {
        email: 'bob.wilson@example.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        phone: '555-0103',
        city: 'Chicago',
        state: 'IL',
        orders: 8,
        avgAmount: 65.00
      },
      {
        email: 'alice.brown@example.com',
        firstName: 'Alice',
        lastName: 'Brown',
        phone: '555-0104',
        city: 'Houston',
        state: 'TX',
        orders: 2,
        avgAmount: 95.00
      },
      {
        email: 'charlie.davis@example.com',
        firstName: 'Charlie',
        lastName: 'Davis',
        phone: '555-0105',
        city: 'Phoenix',
        state: 'AZ',
        orders: 12,
        avgAmount: 55.00
      },
      {
        email: 'diana.miller@example.com',
        firstName: 'Diana',
        lastName: 'Miller',
        phone: '555-0106',
        city: 'Philadelphia',
        state: 'PA',
        orders: 1,
        avgAmount: 150.00
      },
      {
        email: 'evan.garcia@example.com',
        firstName: 'Evan',
        lastName: 'Garcia',
        phone: '555-0107',
        city: 'San Antonio',
        state: 'TX',
        orders: 6,
        avgAmount: 80.00
      },
      {
        email: 'fiona.martinez@example.com',
        firstName: 'Fiona',
        lastName: 'Martinez',
        phone: '555-0108',
        city: 'San Diego',
        state: 'CA',
        orders: 4,
        avgAmount: 110.00
      },
      {
        email: 'george.lopez@example.com',
        firstName: 'George',
        lastName: 'Lopez',
        phone: '555-0109',
        city: 'Dallas',
        state: 'TX',
        orders: 0,
        avgAmount: 0
      },
      {
        email: 'hannah.lee@example.com',
        firstName: 'Hannah',
        lastName: 'Lee',
        phone: '555-0110',
        city: 'San Jose',
        state: 'CA',
        orders: 15,
        avgAmount: 45.00
      }
    ];

    const passwordHash = await bcrypt.hash('password123', 10);
    let createdCustomers = 0;
    let createdOrders = 0;

    for (const customer of customers) {
      // Check if customer already exists
      const [existing] = await promisePool.query(
        'SELECT id FROM users WHERE email = ?',
        [customer.email]
      );

      let userId;

      if (existing.length > 0) {
        console.log(`ℹ️  Customer ${customer.email} already exists, skipping...`);
        userId = existing[0].id;
      } else {
        // Create customer
        const [result] = await promisePool.query(
          `INSERT INTO users 
           (email, password_hash, first_name, last_name, phone, city, state, role, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'user', DATE_SUB(NOW(), INTERVAL ? DAY))`,
          [
            customer.email,
            passwordHash,
            customer.firstName,
            customer.lastName,
            customer.phone,
            customer.city,
            customer.state,
            Math.floor(Math.random() * 180) // Random join date within last 6 months
          ]
        );

        userId = result.insertId;
        createdCustomers++;
        console.log(`✅ Created customer: ${customer.firstName} ${customer.lastName}`);
      }

      // Create orders for this customer
      const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      
      for (let i = 0; i < customer.orders; i++) {
        // Random order date within last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const orderAmount = customer.avgAmount + (Math.random() * 40 - 20); // +/- $20 variation
        const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

        const [orderResult] = await promisePool.query(
          `INSERT INTO orders 
           (user_id, email, total_amount, status, shipping_address, created_at) 
           VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
          [
            userId,
            customer.email,
            orderAmount.toFixed(2),
            status,
            JSON.stringify({
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
              phone: customer.phone,
              address: `${Math.floor(Math.random() * 9999)} Main St`,
              city: customer.city,
              state: customer.state,
              zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
              country: 'USA'
            }),
            daysAgo
          ]
        );

        // Create order items
        const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
        const [products] = await promisePool.query('SELECT id, price FROM products LIMIT 5');

        if (products.length > 0) {
          for (let j = 0; j < numItems; j++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
            const colors = ['Black', 'White', 'Gray', 'Navy', 'Cream'];

            await promisePool.query(
              `INSERT INTO order_items 
               (order_id, product_id, quantity, size, color, price) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                orderResult.insertId,
                product.id,
                Math.floor(Math.random() * 2) + 1, // 1-2 quantity
                sizes[Math.floor(Math.random() * sizes.length)],
                colors[Math.floor(Math.random() * colors.length)],
                product.price
              ]
            );
          }
        }

        createdOrders++;
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   - Customers created: ${createdCustomers}`);
    console.log(`   - Orders created: ${createdOrders}`);
    console.log(`   - Total customers in DB: ${customers.length}`);
    console.log('');

    // Show statistics
    const [stats] = await promisePool.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_customers,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'user'
    `);

    console.log('📈 Current Statistics:');
    console.log(`   - Total Customers: ${stats[0].total_customers}`);
    console.log(`   - Total Orders: ${stats[0].total_orders}`);
    console.log(`   - Total Revenue: $${parseFloat(stats[0].total_revenue).toFixed(2)}`);
    console.log(`   - Avg Order Value: $${parseFloat(stats[0].avg_order_value).toFixed(2)}`);
    console.log('');

    console.log('🎉 Customer data seeded successfully!');
    console.log('');
    console.log('ℹ️  Test credentials for any customer:');
    console.log('   Email: Any of the emails above');
    console.log('   Password: password123');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await promisePool.end();
  }
}

// Run seeding
seedCustomerData().catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
