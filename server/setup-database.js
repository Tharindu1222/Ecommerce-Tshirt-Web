#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates all required tables in the configured database
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tshirt_store',
    multipleStatements: true
  };

  console.log(`📦 Connecting to database: ${config.database}...`);

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL\n');

    // Read schema file
    const schemaPath = join(__dirname, 'database', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    console.log('🔨 Creating tables...');
    
    // Execute schema
    await connection.query(schema);
    
    console.log('✅ Tables created successfully!\n');

    // Verify tables exist
    const [tables] = await connection.query('SHOW TABLES');
    console.log('📋 Created tables:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });

    // Check products count
    const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
    console.log(`\n📦 Products in database: ${products[0].count}`);

    console.log('\n✅ Database setup complete!');
    
  } catch (error) {
    console.error('\n❌ Error setting up database:', error.message);
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database does not exist. Please create it first:');
      console.log(`   CREATE DATABASE ${config.database};`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Access denied. Check your database credentials in .env file');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();

