const express = require('express');
const router = express.Router();
const pool = require('./config/database'); // Corrected path from project root

// Middleware to check admin authentication, defined inline
const requireAdminAuth = (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }
  next();
};

// Admin Dashboard
router.get('/', (req, res) => {
  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    user: req.session.user
  });
});

// --- City Management ---

// GET page to manage all cities
router.get('/cities', requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cities ORDER BY name ASC');
    res.render('admin/manage-cities', {
      title: 'Manage Cities',
      cities: result.rows,
      user: req.session.user,
      toast: req.query.toast
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// POST to add a new city
router.post('/cities/add', requireAdminAuth, async (req, res) => {
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
router.post('/cities/delete/:id', requireAdminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM cities WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Server error or city is in use.' });
  }
});


// --- Partner (Bus Company) Management ---

// GET page to manage all partners
router.get('/partners', requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bus_companies ORDER BY company_name ASC');
    res.render('admin/manage-partners', {
      title: 'Manage Partners',
      partners: result.rows,
      user: req.session.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET page for a single partner's details
router.get('/partners/:id', requireAdminAuth, async (req, res) => {
  try {
    const partnerResult = await pool.query('SELECT * FROM bus_companies WHERE id = $1', [req.params.id]);
    if (partnerResult.rows.length === 0) {
      return res.status(404).send('Partner not found');
    }

    // *** FIX: Fetch all available cities to populate the dropdown ***
    const citiesResult = await pool.query('SELECT * FROM cities ORDER BY name ASC');

    // Fetch cities already associated with the partner
    const partnerCitiesResult = await pool.query(`
            SELECT c.id, c.name FROM cities c
            JOIN partner_cities pc ON c.id = pc.city_id
            WHERE pc.partner_id = $1
            ORDER BY c.name ASC
        `, [req.params.id]);

    res.render('admin/partner-details', {
      title: 'Partner Details',
      partner: partnerResult.rows[0],
      allCities: citiesResult.rows, // This was the missing piece
      partnerCities: partnerCitiesResult.rows,
      user: req.session.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// POST to add a city to a partner
router.post('/partners/:id/add-city', requireAdminAuth, async (req, res) => {
  const partnerId = req.params.id;
  const { cityId } = req.body;

  if (!cityId) {
    return res.status(400).json({ success: false, message: 'City ID is required.' });
  }

  try {
    // Use ON CONFLICT to prevent duplicates
    await pool.query('INSERT INTO partner_cities (partner_id, city_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [partnerId, cityId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error while adding city.' });
  }
});


module.exports = router;