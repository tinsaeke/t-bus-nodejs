const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Creating admin user...');
    
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO users (email, password_hash, user_type, full_name) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      ['admin@tbus.et', adminPassword, 'super_admin', 'System Administrator']
    );
    
    console.log('✅ Admin created: admin@tbus.et / admin123');
    
    // Create sample bus company
    const companyResult = await pool.query(
      'INSERT INTO bus_companies (company_name, contact_person_name, contact_phone) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id',
      ['Selam Bus', 'Dawit Mekonnen', '+251911123456']
    );
    
    if (companyResult.rows.length > 0) {
      const companyId = companyResult.rows[0].id;
      
      const partnerPassword = await bcrypt.hash('partner123', 10);
      await pool.query(
        'INSERT INTO users (email, password_hash, user_type, full_name, bus_company_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
        ['partner@selam.et', partnerPassword, 'partner_admin', 'Selam Bus Admin', companyId]
      );
      
      console.log('✅ Partner created: partner@selam.et / partner123');
    }
    
    console.log('🎉 Users created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUsers();