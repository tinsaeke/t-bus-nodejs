const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function createAdmin() {
  try {
    const email = 'admin@tbus.et';
    const password = 'admin123';
    const name = 'System Administrator';
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query(
      'INSERT INTO users (email, password_hash, user_type, full_name) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      [email, hashedPassword, 'super_admin', name]
    );
    
    console.log('Admin user created!');
    console.log('Email:', email);
    console.log('Password:', password);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();