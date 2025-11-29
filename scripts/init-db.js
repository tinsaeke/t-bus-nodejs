const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '../database/postgresql-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Creating tables...');
    await client.query(schema);
    console.log('✅ Database tables created/verified');
    
    // Test inserting a city
    console.log('Testing city insertion...');
    await client.query('INSERT INTO cities (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', ['Test City']);
    
    // Test fetching cities
    const result = await client.query('SELECT * FROM cities LIMIT 5');
    console.log('✅ Cities in database:', result.rows.length);
    
    client.release();
    console.log('✅ Database initialization complete');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

initializeDatabase();