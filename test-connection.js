#!/usr/bin/env node

/**
 * Test script to verify backend connection
 * Run with: node test-connection.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function testConnection() {
  console.log('🔍 Testing backend connection...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthRes = await fetch(`${API_URL}/health`);
    const health = await healthRes.json();
    console.log('   ✅ Health check:', health);
    
    // Test products endpoint
    console.log('\n2. Testing products endpoint...');
    const productsRes = await fetch(`${API_URL}/products`);
    const products = await productsRes.json();
    console.log(`   ✅ Found ${products.length} products`);
    if (products.length > 0) {
      console.log(`   📦 First product: ${products[0].name}`);
    }
    
    console.log('\n✅ All tests passed! Backend is connected and working.');
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - Backend server is running (npm run dev:backend)');
    console.log('   - MySQL database is set up');
    console.log('   - Backend is accessible at', API_URL);
    process.exit(1);
  }
}

testConnection();

