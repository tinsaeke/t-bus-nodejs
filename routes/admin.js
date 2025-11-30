const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../config/database');

// Middleware to check admin authentication
const requireAuth = (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }
  next();
};

// Login page
router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Admin Login - T BUS', error: null });
});

// Process login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND (user_type = $2 OR user_type = $3)',
      [email, 'super_admin', 'admin']
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (validPassword) {
        req.session.admin = {
          id: user.id,
          email: user.email,
          name: user.full_name
        };
        return res.redirect('/admin/dashboard');
      }
    }

    // If user not found or password invalid, render login with error
    return res.render('admin/login', { title: 'Admin Login - T BUS', error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    return res.render('admin/login', { title: 'Admin Login - T BUS', error: 'An unexpected error occurred. Please try again.' });
  }
});

// Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const [ // Queries are now focused on company and user management
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
      stats: { // The stats object is updated to reflect the new data
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

// --- Profile Management ---

// GET profile page
router.get('/profile', requireAuth, (req, res) => {
  res.render('admin/profile', {
    title: 'My Profile - T BUS Admin',
    admin: req.session.admin,
    error: null,
    success: null
  });
});

// POST to change password
router.post('/profile/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  const adminId = req.session.admin.id;

  // Basic validation
  if (new_password !== confirm_password) {
    return res.render('admin/profile', { title: 'My Profile', admin: req.session.admin, error: 'New passwords do not match.', success: null });
  }
  if (new_password.length < 8) {
    return res.render('admin/profile', { title: 'My Profile', admin: req.session.admin, error: 'Password must be at least 8 characters long.', success: null });
  }

  try {
    // Get current user from DB
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [adminId]);
    if (userResult.rows.length === 0) {
      return res.render('admin/profile', { title: 'My Profile', admin: req.session.admin, error: 'User not found.', success: null });
    }

    const user = userResult.rows[0];

    // Check if current password is correct
    const validPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!validPassword) {
      return res.render('admin/profile', { title: 'My Profile', admin: req.session.admin, error: 'Incorrect current password.', success: null });
    }

    // Hash new password and update DB
    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedNewPassword, adminId]);

    res.render('admin/profile', {
      title: 'My Profile',
      admin: req.session.admin,
      error: null,
      success: 'Password updated successfully!'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.render('admin/profile', { title: 'My Profile', admin: req.session.admin, error: 'An error occurred while updating the password.', success: null });
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
      companies: [] // Fallback to an empty array on error
    });
  }
});

// --- City Management (from admin-fixed.js) ---

// GET page to manage all cities
router.get('/cities', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cities ORDER BY name ASC');
    res.render('admin/manage-cities', {
      title: 'Manage Cities',
      cities: result.rows,
      admin: req.session.admin, // Changed from user to admin
      toast: req.query.toast
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// POST to add a new city
router.post('/cities/add', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).redirect('/admin/cities?toast=City name cannot be empty.');
  }
  try {
    await pool.query('INSERT INTO cities (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
    res.redirect('/admin/cities?toast=City added successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// POST to delete a city
router.post('/cities/delete/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM cities WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Server error or city is in use.' });
  }
});

// POST to toggle city status (This was missing)
router.post('/cities/toggle/:id', requireAuth, async (req, res) => {
  try {
    // This route assumes your 'cities' table has an 'is_active' column.
    // If not, you will need to add it: ALTER TABLE cities ADD COLUMN is_active BOOLEAN DEFAULT true;
    await pool.query('UPDATE cities SET is_active = NOT is_active WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error toggling city status:', err);
    res.json({ success: false, message: 'Server error while toggling status.' });
  }
});

// --- Partner (Bus Company) Management (from admin-fixed.js) ---

// GET page to manage all partners
router.get('/partners', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bus_companies ORDER BY company_name ASC');
    res.render('admin/manage-partners', {
      title: 'Manage Partners',
      partners: result.rows,
      admin: req.session.admin // Changed from user to admin
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET page for a single partner's details
router.get('/partners/:id', requireAuth, async (req, res) => {
  try {
    const partnerResult = await pool.query('SELECT * FROM bus_companies WHERE id = $1', [req.params.id]);
    if (partnerResult.rows.length === 0) {
      return res.status(404).send('Partner not found');
    }
    const citiesResult = await pool.query('SELECT * FROM cities ORDER BY name ASC');
    const partnerCitiesResult = await pool.query(`
            SELECT c.id, c.name FROM cities c
            JOIN partner_cities pc ON c.id = pc.city_id
            WHERE pc.partner_id = $1
            ORDER BY c.name ASC
        `, [req.params.id]);

    res.render('admin/partner-details', {
      title: 'Partner Details',
      partner: partnerResult.rows[0],
      allCities: citiesResult.rows,
      partnerCities: partnerCitiesResult.rows,
      admin: req.session.admin // Changed from user to admin
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


// // Bookings management
// router.get('/bookings', requireAuth, async (req, res) => {
//   try {
//     const bookingsQuery = `
//       SELECT b.*, s.departure_time, s.travel_date,
//              fc.name as from_city, tc.name as to_city,
//              bc.company_name
//       FROM bookings b
//       JOIN schedules s ON b.schedule_id = s.id
//       JOIN cities fc ON s.from_city_id = fc.id
//       JOIN cities tc ON s.to_city_id = tc.id
//       JOIN buses bus ON s.bus_id = bus.id
//       JOIN bus_companies bc ON bus.bus_company_id = bc.id
//       ORDER BY b.created_at DESC
//       LIMIT 100
//     `;

//     const bookingsResult = await pool.query(bookingsQuery);
//     res.render('admin/bookings', {
//       title: 'Manage Bookings - T BUS',
//       admin: req.session.admin,
//       bookings: bookingsResult.rows
//     });
//   } catch (error) {
//     console.error('Bookings error:', error);
//     res.render('admin/bookings', {
//       title: 'Manage Bookings - T BUS',
//       admin: req.session.admin,
//       bookings: []
//     });
//   }
// });

// // Cities management
// router.get('/cities', requireAuth, async (req, res) => {
//   try {
//     const result = await pool.query('SELECT * FROM cities ORDER BY name');
//     res.render('admin/cities', {
//       title: 'Manage Cities - T BUS',
//       admin: req.session.admin,
//       cities: result.rows
//     });
//   } catch (error) {
//     console.error('Error fetching cities:', error);
//     res.render('admin/cities', {
//       title: 'Manage Cities - T BUS',
//       admin: req.session.admin,
//       cities: cities
//     });
//   }
// });

// // Add city
// router.post('/cities/add', requireAuth, async (req, res) => {
//   const { name } = req.body;
//   if (name) {
//     try {
//       console.log('Admin attempting to add city to database:', name);
//       const result = await pool.query('INSERT INTO cities (name) VALUES ($1) RETURNING id', [name]);
//       console.log('✅ Admin city added to database successfully:', result.rows[0]);
//     } catch (error) {
//       console.error('❌ Admin database error adding city:', error.message);
//       console.error('Full error:', error);
//       if (!cities.find(c => c.name === name)) {
//         const newId = cities.length > 0 ? Math.max(...cities.map(c => c.id)) + 1 : 1;
//         cities.push({ id: newId, name: name });
//         console.log('Added to in-memory store instead');
//       }
//     }
//   }
//   res.redirect('/admin/cities');
// });

// // Delete city
// router.post('/cities/delete/:id', requireAuth, async (req, res) => {
//   const id = parseInt(req.params.id);
//   try {
//     await pool.query('DELETE FROM cities WHERE id = $1', [id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error deleting city:', error);
//     const index = cities.findIndex(c => c.id === id);
//     if (index > -1) {
//       cities.splice(index, 1);
//     }
//     res.json({ success: true });
//   }
// });

// // Schedules management
// router.get('/schedules', requireAuth, async (req, res) => {
//   try {
//     const schedulesQuery = `
//       SELECT s.*, b.bus_number, fc.name as from_city, tc.name as to_city, bc.company_name
//       FROM schedules s
//       JOIN buses b ON s.bus_id = b.id
//       JOIN cities fc ON s.from_city_id = fc.id
//       JOIN cities tc ON s.to_city_id = tc.id
//       JOIN bus_companies bc ON b.bus_company_id = bc.id
//       ORDER BY s.travel_date DESC, s.departure_time
//     `;

//     const schedulesResult = await pool.query(schedulesQuery);
//     res.render('admin/schedules', {
//       title: 'Manage Schedules - T BUS',
//       admin: req.session.admin,
//       schedules: schedulesResult.rows
//     });
//   } catch (error) {
//     console.error('Schedules error:', error);
//     res.render('admin/schedules', {
//       title: 'Manage Schedules - T BUS',
//       admin: req.session.admin,
//       schedules: []
//     });
//   }
// });

// Add company with partner account
router.post('/companies/add', requireAuth, async (req, res) => {
  const { company_name, contact_person_name, contact_phone, description, email, password } = req.body;
  if (company_name && email && password) {
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
  const { company_name, contact_person_name, contact_phone, description, email, password } = req.body;
  try {
    await pool.query(
      'UPDATE bus_companies SET company_name = $1, contact_person_name = $2, contact_phone = $3, description = $4 WHERE id = $5',
      [company_name, contact_person_name, contact_phone, description, id]
    );

    // Now, handle the user account update separately for clarity and correctness.
    if (email) {
      // Always update email and full_name
      await pool.query(
        'UPDATE users SET email = $1, full_name = $2 WHERE bus_company_id = $3',
        [email, contact_person_name || 'Partner Admin', id]
      );

      // If a new password was provided, update it in a separate query
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
    // Redirect to the common login page, not the admin-specific one
    res.redirect('/login');
  });
});


module.exports = router;