const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function quickSetup() {
  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_type VARCHAR(20) NOT NULL,
        full_name VARCHAR(100) NOT NULL
      );
    `);
    
    // Insert cities
    await pool.query(`
      INSERT INTO cities (name) VALUES 
      ('Addis Ababa'), ('Dire Dawa'), ('Hawassa'), ('Bahir Dar')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Create admin
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (email, password_hash, user_type, full_name) 
      VALUES ($1, $2, 'super_admin', 'Admin') 
      ON CONFLICT (email) DO NOTHING;
    `, ['admin@tbus.et', hash]);
    
    console.log('✅ Database setup complete!');
    console.log('Login: admin@tbus.et / admin123');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  process.exit(0);
}

quickSetup();