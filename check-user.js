const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// This script now acts as a password reset tool for the admin user.
const ADMIN_EMAIL = 'admin@tbus.et';
const ADMIN_PASSWORD = 'admin123';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUser() {
  try {
    // Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [ADMIN_EMAIL]);
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    if (result.rows.length === 0) {
      console.log('❌ User not found. Creating admin user...');
      await pool.query(`
        INSERT INTO users (email, password_hash, user_type, full_name, is_active) 
        VALUES ($1, $2, 'super_admin', 'System Administrator', true)
      `, [ADMIN_EMAIL, hash]);

      console.log('✅ Admin user created!');
    } else {
      console.log('✅ User found. Forcibly resetting password...');
      await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, ADMIN_EMAIL]);
      console.log('✅ Admin password has been reset successfully.');
    }

    console.log('\n🔐 Login with:');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);

  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  process.exit(0);
}

checkUser();