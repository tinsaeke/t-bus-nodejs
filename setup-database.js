const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting to database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    
    // Read and execute schema
    const schema = fs.readFileSync('./database/postgresql-schema.sql', 'utf8');
    await client.query(schema);
    console.log('✅ Database schema created successfully!');
    
    client.release();
    
    console.log('🎉 Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();