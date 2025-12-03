import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || "Tharindu#1222",
  database: process.env.DB_NAME || 'tshirt_store',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promisify for async/await
export const promisePool = db.promise();

