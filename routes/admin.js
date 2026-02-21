const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../config/database');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Middleware to check admin authentication
const requireAuth = (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect('/login');
  }
  next();
};

// Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const [
      totalCompaniesResult,
      activeCompaniesResult,
      partnerUsersResult,
      totalRevenueResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM bus_companies'),
      pool.query('SELECT COUNT(*) as count FROM bus_companies WHERE is_active = true'),
      pool.query("SELECT COUNT(*) as count FROM users WHERE user_type = 'partner_admin'"),
      pool.query("SELECT SUM(total_price) as sum FROM bookings WHERE booking_status = 'confirmed'")
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - T BUS',
      admin: req.session.admin,
      stats: {
        totalCompanies: totalCompaniesResult.rows[0].count || 0,
        activeCompanies: activeCompaniesResult.rows[0].count || 0,
        partnerUsers: partnerUsersResult.rows[0].count || 0,
        revenue: totalRevenueResult.rows[0].sum || 0
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard - T BUS',
      admin: req.session.admin,
      stats: { totalCompanies: 0, activeCompanies: 0, partnerUsers: 0, revenue: 0 },
      error: 'Could not load dashboard statistics.'
    });
  }
});

// GET profile page
router.get('/profile', requireAuth, (req, res) => {
  res.render('admin/profile', {
    title: 'My Profile - T BUS Admin',
    admin: req.session.admin,
    error: null,
    success: null
  });
});

// POST to update profile (email and password)
router.post('/profile/update', requireAuth, async (req, res) => {
  const { email, current_password, new_password, confirm_password } = req.body;
  const adminId = req.session.admin.id;

  if (!email || !isValidEmail(email)) {
    return res.render('admin/profile', { title: 'My Profile', admin: req.session.admin, error: 'Invalid email format.', success: null });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [adminId]);
    if (userResult.rows.length === 0) {
      return res.render('admin/profile', { title: 'My Profile', admin: req.session.admin, error: 'User not found.', success: null });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!validPassword) {
      return res.render('admin/profile', { title: 'My Profile', admin: req.session.admin, error: 'Incorrect current password.', success: null });
    }

    if (new_password) {
      if (new_password !== confirm_password) {
        return res.render('admin/profile', { title: 'My Profile', admin: req.session.admin, error: 'New passwords do not match.', success: null });
      }
      if (new_password.length < 8) {
        return res.render('admin/profile', { title: 'My Profile', admin: req.session.admin, error: 'Password must be at least 8 characters long.', success: null });
      }
      const hashedNewPassword = await bcrypt.hash(new_password, 10);
      await pool.query('UPDATE users SET email = $1, password_hash = $2 WHERE id = $3', [email, hashedNewPassword, adminId]);
    } else {
      await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, adminId]);
    }

    req.session.admin.email = email;

    res.render('admin/profile', {
      title: 'My Profile',
      admin: req.session.admin,
      error: null,
      success: 'Profile updated successfully!'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.render('admin/profile', { title: 'My Profile', admin: req.session.admin, error: 'An error occurred while updating the profile.', success: null });
  }
});

// Companies management
router.get('/companies', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bus_companies ORDER BY company_name');
    res.render('admin/companies', {
      title: 'Manage Companies - T BUS',
      admin: req.session.admin,
      companies: result.rows
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.render('admin/companies', {
      title: 'Manage Companies - T BUS',
      admin: req.session.admin,
      companies: []
    });
  }
});

// GET page to manage all cities
router.get('/manage-cities', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cities ORDER BY name ASC');
    res.render('admin/cities', {
      title: 'Manage Cities',
      cities: result.rows,
      admin: req.session.admin,
      toast: req.query.toast
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// POST to add a new city
router.post('/manage-cities/add', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).redirect('/admin/manage-cities?toast=City name cannot be empty.');
  }
  if (name.length > 100) {
    return res.status(400).redirect('/admin/manage-cities?toast=City name is too long.');
  }
  try {
    await pool.query('INSERT INTO cities (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
    res.redirect('/admin/manage-cities?toast=City added successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// POST to delete a city
router.post('/manage-cities/delete/:id', requireAuth, async (req, res) => {
  try {
    const cityId = parseInt(req.params.id);
    if (isNaN(cityId)) {
      return res.status(400).json({ success: false, message: 'Invalid city ID.' });
    }
    await pool.query('DELETE FROM cities WHERE id = $1', [cityId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Server error or city is in use.' });
  }
});

// POST to toggle city status
router.post('/manage-cities/toggle/:id', requireAuth, async (req, res) => {
  try {
    const cityId = parseInt(req.params.id);
    if (isNaN(cityId)) {
      return res.status(400).json({ success: false, message: 'Invalid city ID.' });
    }
    await pool.query('UPDATE cities SET is_active = NOT is_active WHERE id = $1', [cityId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error toggling city status:', err);
    res.json({ success: false, message: 'Server error while toggling status.' });
  }
});

// GET page to manage all partners
router.get('/partners', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bus_companies ORDER BY company_name ASC');
    res.render('admin/manage-partners', {
      title: 'Manage Partners',
      partners: result.rows,
      admin: req.session.admin
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET page for a single partner's details
router.get('/partners/:id', requireAuth, async (req, res) => {
  try {
    const partnerId = parseInt(req.params.id);
    if (isNaN(partnerId)) {
      return res.status(400).send('Invalid partner ID');
    }
    const partnerResult = await pool.query('SELECT * FROM bus_companies WHERE id = $1', [partnerId]);
    if (partnerResult.rows.length === 0) {
      return res.status(404).send('Partner not found');
    }
    const citiesResult = await pool.query('SELECT * FROM cities ORDER BY name ASC');
    const partnerCitiesResult = await pool.query(`
            SELECT c.id, c.name FROM cities c
            JOIN partner_cities pc ON c.id = pc.city_id
            WHERE pc.partner_id = $1
            ORDER BY c.name ASC
        `, [partnerId]);

    res.render('admin/partner-details', {
      title: 'Partner Details',
      partner: partnerResult.rows[0],
      allCities: citiesResult.rows,
      partnerCities: partnerCitiesResult.rows,
      admin: req.session.admin
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Add company with partner account
router.post('/companies/add', requireAuth, async (req, res) => {
  const { company_name, contact_person_name, contact_phone, description, email, password } = req.body;
  if (company_name && email && password && isValidEmail(email)) {
    try {
      const companyResult = await pool.query(
        'INSERT INTO bus_companies (company_name, contact_person_name, contact_phone, description) VALUES ($1, $2, $3, $4) RETURNING id',
        [company_name, contact_person_name, contact_phone, description]
      );

      const companyId = companyResult.rows[0].id;
      const hashedPassword = await bcrypt.hash(password, 10);

      await pool.query(
        'INSERT INTO users (email, password_hash, user_type, bus_company_id, full_name) VALUES ($1, $2, $3, $4, $5)',
        [email, hashedPassword, 'partner_admin', companyId, contact_person_name || 'Partner Admin']
      );
    } catch (error) {
      console.error('Error adding company:', error);
    }
  }
  res.redirect('/admin/companies');
});

// Toggle company status
router.post('/companies/toggle/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid company ID.' });
  }
  try {
    await pool.query('UPDATE bus_companies SET is_active = NOT is_active WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling company:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle company status.' });
  }
});

// Delete company
router.post('/companies/delete/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid company ID.' });
  }
  try {
    await pool.query('DELETE FROM bus_companies WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ success: false, message: 'Failed to delete company.' });
  }
});

// Edit company
router.post('/companies/edit/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).redirect('/admin/companies');
  }
  const { company_name, contact_person_name, contact_phone, description, email, password } = req.body;
  try {
    await pool.query(
      'UPDATE bus_companies SET company_name = $1, contact_person_name = $2, contact_phone = $3, description = $4 WHERE id = $5',
      [company_name, contact_person_name, contact_phone, description, id]
    );

    if (email && isValidEmail(email)) {
      await pool.query(
        'UPDATE users SET email = $1, full_name = $2 WHERE bus_company_id = $3',
        [email, contact_person_name || 'Partner Admin', id]
      );

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE bus_company_id = $2',
          [hashedPassword, id]
        );
      }
    }
  } catch (error) {
    console.error('Error editing company:', error);
  }
  res.redirect('/admin/companies');
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Admin logout error:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;
