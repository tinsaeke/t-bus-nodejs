const { Pool } = require('pg');
require('dotenv').config(); // Ensure environment variables are loaded

// Database configuration
const pool = new Pool({
  // Use the connection string from the .env file
  connectionString: process.env.DATABASE_URL,
  // The ssl=true parameter in the DATABASE_URL will handle SSL.
  // This object is a good fallback for cloud providers.
  ssl: { rejectUnauthorized: false }
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

module.exports = pool;