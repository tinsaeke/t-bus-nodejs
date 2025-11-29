const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function createPartner() {
  try {
    // First create a bus company
    const companyResult = await pool.query(
      'INSERT INTO bus_companies (company_name, contact_person_name, contact_phone) VALUES ($1, $2, $3) RETURNING id',
      ['Demo Bus Company', 'John Doe', '+251911000000']
    );
    
    const companyId = companyResult.rows[0].id;
    
    // Create partner user
    const email = 'partner@demo.com';
    const password = 'partner123';
    const name = 'Partner Admin';
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query(
      'INSERT INTO users (email, password_hash, user_type, full_name, bus_company_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
      [email, hashedPassword, 'partner_admin', name, companyId]
    );
    
    console.log('Partner user created!');
    console.log('Company:', 'Demo Bus Company');
    console.log('Email:', email);
    console.log('Password:', password);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createPartner();