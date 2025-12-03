import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createTables() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tshirt_store',
    multipleStatements: true
  };

  console.log(`\n🔧 Setting up database: ${config.database}\n`);

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL\n');

    // Read and execute the schema
    const schemaPath = join(__dirname, 'database', 'setup-zanru.sql');
    let schema = readFileSync(schemaPath, 'utf8');
    
    // Remove USE statement if database is already set
    schema = schema.replace(/USE\s+\w+;?\s*/i, '');
    
    console.log('📦 Creating tables...');
    await connection.query(schema);
    console.log('✅ Tables created successfully!\n');

    // Verify
    const [tables] = await connection.query('SHOW TABLES');
    console.log('📋 Tables in database:');
    tables.forEach(table => {
      console.log(`   ✓ ${Object.values(table)[0]}`);
    });

    const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
    console.log(`\n📦 Products loaded: ${products[0].count}`);
    console.log('\n✅ Database setup complete! You can now restart your server.\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database does not exist. Create it first:');
      console.log(`   CREATE DATABASE ${config.database};`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Check your .env file credentials');
    } else {
      console.log('\n💡 Error details:', error.code);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTables();

