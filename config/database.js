const { Pool } = require('pg');
require('dotenv').config(); // Ensure environment variables are loaded

// Database configuration
const pool = new Pool({
  // Use the connection string from the .env file
  connectionString: process.env.DATABASE_URL,
  // For production environments, ensure your DATABASE_URL includes `?ssl=true`.
  // Most cloud providers (like Render, Heroku) require SSL and their connection strings include this.
  // The `pg` library automatically handles SSL correctly when the connection string is configured properly.
  // The previous insecure setting `ssl: { rejectUnauthorized: false }` has been removed for security.
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

module.exports = pool;