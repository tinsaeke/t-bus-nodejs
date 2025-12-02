const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../config/database');

const store = require('../data/store');
const { companies, cities, buses, schedules } = store;

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Middleware to check partner authentication
const requireAuth = (req, res, next) => {
  if (!req.session.partner) {
    return res.redirect('/login');
  }
  next();
};

// Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const companyId = req.session.partner.company_id;

    const [
      busesResult,
      schedulesResult,
      bookingsResult,
      revenueResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM buses WHERE bus_company_id = $1 AND is_active = true', [companyId]),
      pool.query('SELECT COUNT(*) as count FROM schedules s JOIN buses b ON s.bus_id = b.id WHERE b.bus_company_id = $1 AND s.travel_date >= CURRENT_DATE AND s.is_active = true', [companyId]),
      pool.query('SELECT COUNT(*) as count FROM bookings bo JOIN schedules s ON bo.schedule_id = s.id JOIN buses b ON s.bus_id = b.id WHERE b.bus_company_id = $1', [companyId]),
      pool.query("SELECT SUM(bo.total_price) as sum FROM bookings bo JOIN schedules s ON bo.schedule_id = s.id JOIN buses b ON s.bus_id = b.id WHERE b.bus_company_id = $1 AND bo.booking_status = 'confirmed'", [companyId])
    ]);

    res.render('partner/dashboard', {
      title: 'Partner Dashboard - T BUS',
      partner: req.session.partner,
      stats: {
        buses: busesResult.rows[0].count || 0,
        schedules: schedulesResult.rows[0].count || 0,
        bookings: bookingsResult.rows[0].count || 0,
        revenue: revenueResult.rows[0].sum || 0
      }
    });
  } catch (error) {
    console.error('Partner dashboard error:', error);
    res.render('partner/dashboard', {
      title: 'Partner Dashboard - T BUS',
      partner: req.session.partner,
      stats: { buses: 0, schedules: 0, bookings: 0, revenue: 0 },
      error: 'Could not load dashboard statistics.'
    });
  }
});

// GET profile page
router.get('/profile', requireAuth, (req, res) => {
  res.render('partner/profile', {
    title: 'My Profile - T BUS Partner',
    partner: req.session.partner,
    error: null,
    success: null
  });
});

// POST to update profile (email and password)
router.post('/profile/update', requireAuth, async (req, res) => {
  const { email, current_password, new_password, confirm_password } = req.body;
  const partnerId = req.session.partner.id;

  if (!email || !isValidEmail(email)) {
    return res.render('partner/profile', { title: 'My Profile', partner: req.session.partner, error: 'Invalid email format.', success: null });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [partnerId]);
    if (userResult.rows.length === 0) {
      return res.render('partner/profile', { title: 'My Profile', partner: req.session.partner, error: 'User not found.', success: null });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!validPassword) {
      return res.render('partner/profile', { title: 'My Profile', partner: req.session.partner, error: 'Incorrect current password.', success: null });
    }

    if (new_password) {
      if (new_password !== confirm_password) {
        return res.render('partner/profile', { title: 'My Profile', partner: req.session.partner, error: 'New passwords do not match.', success: null });
      }
      if (new_password.length < 8) {
        return res.render('partner/profile', { title: 'My Profile', partner: req.session.partner, error: 'Password must be at least 8 characters long.', success: null });
      }
      const hashedNewPassword = await bcrypt.hash(new_password, 10);
      await pool.query('UPDATE users SET email = $1, password_hash = $2 WHERE id = $3', [email, hashedNewPassword, partnerId]);
    } else {
      await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, partnerId]);
    }

    req.session.partner.email = email;

    res.render('partner/profile', {
      title: 'My Profile',
      partner: req.session.partner,
      error: null,
      success: 'Profile updated successfully!'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.render('partner/profile', { title: 'My Profile', partner: req.session.partner, error: 'An error occurred while updating the profile.', success: null });
  }
});

// Buses management
router.get('/buses', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM buses WHERE bus_company_id = $1 ORDER BY created_at DESC',
      [req.session.partner.company_id]
    );
    res.render('partner/buses', {
      title: 'Manage Buses - T BUS',
      partner: req.session.partner,
      buses: result.rows
    });
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.render('partner/buses', {
      title: 'Manage Buses - T BUS',
      partner: req.session.partner,
      buses: [],
      error: 'Could not fetch bus data.'
    });
  }
});

// Add bus
router.post('/buses/add', requireAuth, async (req, res) => {
  const { bus_number, type, total_seats } = req.body;
  if (bus_number) {
    try {
      const seats = parseInt(total_seats);
      if (isNaN(seats) || seats < 1) {
        return res.redirect('/partner/buses');
      }
      await pool.query(
        'INSERT INTO buses (bus_company_id, bus_number, type, total_seats) VALUES ($1, $2, $3, $4)',
        [req.session.partner.company_id, bus_number, type, seats]
      );
    } catch (error) {
      console.error('Error adding bus to database:', error);
    }
  }
  res.redirect('/partner/buses');
});

// Edit bus
router.post('/buses/edit/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { bus_number, type, total_seats } = req.body;
  const companyId = req.session.partner.company_id;
  const busId = parseInt(id);

  if (isNaN(busId)) {
    return res.redirect('/partner/buses');
  }

  try {
    const seats = parseInt(total_seats);
    if (isNaN(seats) || seats < 1) {
      return res.redirect('/partner/buses');
    }
    await pool.query(
      'UPDATE buses SET bus_number = $1, type = $2, total_seats = $3 WHERE id = $4 AND bus_company_id = $5',
      [bus_number, type, seats, busId, companyId]
    );
  } catch (error) {
    console.error('Error editing bus:', error);
  }
  res.redirect('/partner/buses');
});

// Schedules management
router.get('/schedules', requireAuth, async (req, res) => {
  try {
    const partnerId = req.session.partner.company_id;
    const schedulesQuery = `
      SELECT s.*, b.bus_number, fc.name as from_city, tc.name as to_city
      FROM schedules s
      JOIN buses b ON s.bus_id = b.id
      JOIN cities fc ON s.from_city_id = fc.id
      JOIN cities tc ON s.to_city_id = tc.id
      WHERE b.bus_company_id = $1 AND s.travel_date >= CURRENT_DATE
      ORDER BY s.travel_date ASC, s.departure_time ASC
    `;
    const schedulesResult = await pool.query(schedulesQuery, [partnerId]);
    const companyBusesResult = await pool.query('SELECT * FROM buses WHERE bus_company_id = $1 AND is_active = true', [partnerId]);

    const partnerCitiesResult = await pool.query(
      'SELECT c.name, c.id FROM partner_cities pc JOIN cities c ON c.id = pc.city_id WHERE pc.partner_id = $1 ORDER BY c.name',
      [partnerId]
    );

    res.render('partner/schedules', {
      title: 'Manage Schedules - T BUS',
      partner: req.session.partner,
      schedules: schedulesResult.rows,
      buses: companyBusesResult.rows,
      cities: partnerCitiesResult.rows
    });
  } catch (error) {
    console.error('Error fetching schedule data:', error);
    res.render('partner/schedules', {
      title: 'Manage Schedules - T BUS',
      partner: req.session.partner,
      schedules: [],
      buses: [],
      cities: [],
      error: 'Could not fetch schedule data.'
    });
  }
});

// Add schedule with conflict validation
router.post('/schedules/add', requireAuth, async (req, res) => {
  const { bus_id, from_city_id, to_city_id, departure_time, arrival_time, price, travel_date } = req.body;
  try {
    const busResult = await pool.query('SELECT total_seats FROM buses WHERE id = $1 AND bus_company_id = $2', [bus_id, req.session.partner.company_id]);
    if (busResult.rows.length === 0) {
      return res.redirect('/partner/schedules?error=Invalid bus selection.');
    }

    const conflictQuery = `
      SELECT COUNT(*) as count FROM schedules
      WHERE bus_id = $1 AND travel_date = $2 AND is_active = true
      AND NOT (arrival_time <= $3 OR departure_time >= $4)
    `;
    const conflictResult = await pool.query(conflictQuery, [bus_id, travel_date, departure_time, arrival_time]);
    
    if (conflictResult.rows[0].count > 0) {
      return res.redirect('/partner/schedules?error=Bus is already scheduled for another route at this time.');
    }

    const available_seats = busResult.rows[0].total_seats;
    const scheduleQuery = `
      INSERT INTO schedules (bus_id, from_city_id, to_city_id, departure_time, arrival_time, price, travel_date, available_seats)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await pool.query(scheduleQuery, [
      parseInt(bus_id), parseInt(from_city_id), parseInt(to_city_id),
      departure_time, arrival_time, parseFloat(price), travel_date, available_seats
    ]);
  } catch (error) {
    console.error('Error adding schedule to database:', error);
  }
  res.redirect('/partner/schedules');
});

// Edit schedule with conflict validation
router.post('/schedules/edit/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { bus_id, from_city_id, to_city_id, departure_time, arrival_time, price, travel_date } = req.body;
  const companyId = req.session.partner.company_id;
  const scheduleId = parseInt(id);

  if (isNaN(scheduleId)) {
    return res.redirect('/partner/schedules');
  }

  try {
    const busResult = await pool.query('SELECT id FROM buses WHERE id = $1 AND bus_company_id = $2', [bus_id, companyId]);
    if (busResult.rows.length === 0) {
      return res.redirect('/partner/schedules?error=Invalid bus selection.');
    }

    const conflictQuery = `
      SELECT COUNT(*) as count FROM schedules
      WHERE bus_id = $1 AND travel_date = $2 AND is_active = true AND id != $3
      AND NOT (arrival_time <= $4 OR departure_time >= $5)
    `;
    const conflictResult = await pool.query(conflictQuery, [bus_id, travel_date, scheduleId, departure_time, arrival_time]);
    
    if (conflictResult.rows[0].count > 0) {
      return res.redirect('/partner/schedules?error=Bus is already scheduled for another route at this time.');
    }

    const scheduleQuery = `
      UPDATE schedules SET
        bus_id = $1,
        from_city_id = $2,
        to_city_id = $3,
        departure_time = $4,
        arrival_time = $5,
        price = $6,
        travel_date = $7
      WHERE id = $8
    `;
    await pool.query(scheduleQuery, [
      parseInt(bus_id),
      parseInt(from_city_id),
      parseInt(to_city_id),
      departure_time,
      arrival_time,
      parseFloat(price),
      travel_date,
      scheduleId
    ]);
  } catch (error) {
    console.error('Error editing schedule:', error);
  }
  res.redirect('/partner/schedules');
});

// Delete bus
router.post('/buses/delete/:id', requireAuth, async (req, res) => {
  try {
    const busId = parseInt(req.params.id);
    if (isNaN(busId)) {
      return res.status(400).json({ success: false, message: 'Invalid bus ID.' });
    }
    await pool.query('DELETE FROM buses WHERE id = $1 AND bus_company_id = $2', [busId, req.session.partner.company_id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bus:', error);
    res.status(500).json({ success: false, message: 'Failed to delete bus.' });
  }
});

// Toggle bus status
router.post('/buses/toggle/:id', requireAuth, async (req, res) => {
  try {
    const busId = parseInt(req.params.id);
    if (isNaN(busId)) {
      return res.status(400).json({ success: false, message: 'Invalid bus ID.' });
    }
    await pool.query('UPDATE buses SET is_active = NOT is_active WHERE id = $1 AND bus_company_id = $2', [busId, req.session.partner.company_id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling bus status:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to toggle bus status.' });
  }
});

// Delete schedule
router.post('/schedules/delete/:id', requireAuth, async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    if (isNaN(scheduleId)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule ID.' });
    }
    const checkQuery = 'SELECT s.id FROM schedules s JOIN buses b ON s.bus_id = b.id WHERE s.id = $1 AND b.bus_company_id = $2';
    const checkResult = await pool.query(checkQuery, [scheduleId, req.session.partner.company_id]);
    if (checkResult.rows.length > 0) {
      await pool.query('DELETE FROM schedules WHERE id = $1', [scheduleId]);
      return res.json({ success: true });
    }
    res.status(403).json({ success: false, message: 'Permission denied.' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to delete schedule.' });
  }
});

// Toggle schedule status
router.post('/schedules/toggle/:id', requireAuth, async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    if (isNaN(scheduleId)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule ID.' });
    }
    const checkQuery = 'SELECT s.id FROM schedules s JOIN buses b ON s.bus_id = b.id WHERE s.id = $1 AND b.bus_company_id = $2';
    const checkResult = await pool.query(checkQuery, [scheduleId, req.session.partner.company_id]);
    if (checkResult.rows.length > 0) {
      await pool.query('UPDATE schedules SET is_active = NOT is_active WHERE id = $1', [scheduleId]);
      return res.json({ success: true });
    }
    res.status(403).json({ success: false, message: 'Permission denied.' });
  } catch (error) {
    console.error('Error toggling schedule status:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle schedule status.' });
  }
});

// Bookings view
router.get('/bookings', requireAuth, async (req, res) => {
  try {
    const companyId = req.session.partner.company_id;

    const bookingsQuery = `
      SELECT b.*, s.departure_time, s.travel_date,
             fc.name as from_city, tc.name as to_city,
             bus.bus_number
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN cities fc ON s.from_city_id = fc.id
      JOIN cities tc ON s.to_city_id = tc.id
      JOIN buses bus ON s.bus_id = bus.id
      WHERE bus.bus_company_id = $1
      ORDER BY b.created_at DESC
    `;

    const bookingsResult = await pool.query(bookingsQuery, [companyId]);

    res.render('partner/bookings', {
      title: 'View Bookings - T BUS',
      partner: req.session.partner,
      bookings: bookingsResult.rows
    });
  } catch (error) {
    console.error('Partner bookings error:', error);
    res.render('partner/bookings', {
      title: 'View Bookings - T BUS',
      partner: req.session.partner,
      bookings: [],
      error: 'Could not fetch bookings.'
    });
  }
});

// Approve booking
router.post('/bookings/approve/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const bookingId = parseInt(id);
    if (isNaN(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
    }
    const verifyQuery = `SELECT b.id FROM bookings b JOIN schedules s ON b.schedule_id = s.id JOIN buses bus ON s.bus_id = bus.id WHERE b.id = $1 AND bus.bus_company_id = $2`;
    const verifyResult = await pool.query(verifyQuery, [bookingId, req.session.partner.company_id]);

    if (verifyResult.rows.length > 0) {
      await pool.query("UPDATE bookings SET booking_status = 'confirmed', payment_status = 'paid' WHERE id = $1", [bookingId]);
      res.json({ success: true, message: 'Booking approved' });
    } else {
      res.status(403).json({ success: false, message: 'Permission denied' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// Reject booking
router.post('/bookings/reject/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const bookingId = parseInt(id);
    if (isNaN(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
    }
    const verifyQuery = `SELECT b.id, b.schedule_id FROM bookings b JOIN schedules s ON b.schedule_id = s.id JOIN buses bus ON s.bus_id = bus.id WHERE b.id = $1 AND bus.bus_company_id = $2`;
    const verifyResult = await pool.query(verifyQuery, [bookingId, req.session.partner.company_id]);

    if (verifyResult.rows.length > 0) {
      await pool.query("UPDATE bookings SET booking_status = 'cancelled', payment_status = 'failed' WHERE id = $1", [bookingId]);
      await pool.query('UPDATE schedules SET available_seats = available_seats + 1 WHERE id = $1', [verifyResult.rows[0].schedule_id]);
      res.json({ success: true, message: 'Booking rejected' });
    } else {
      res.status(403).json({ success: false, message: 'Permission denied' });
    }
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// Cities management for partners
router.get('/cities', requireAuth, async (req, res) => {
  try {
    const partnerId = req.session.partner.company_id;

    const myCitiesQuery = `
      SELECT c.id, c.name FROM cities c
      JOIN partner_cities pc ON c.id = pc.city_id
      WHERE pc.partner_id = $1
      ORDER BY c.name ASC
    `;
    const myCitiesResult = await pool.query(myCitiesQuery, [partnerId]);
    const myCities = myCitiesResult.rows;
    const myCityIds = myCities.map(c => c.id);

    const allCitiesResult = await pool.query('SELECT * FROM cities ORDER BY name');

    const availableCities = allCitiesResult.rows.filter(
      city => !myCityIds.includes(city.id)
    );

    res.render('partner/cities', {
      title: 'Manage My Cities - T BUS',
      partner: req.session.partner,
      myCities: myCities,
      availableCities: availableCities,
      error: null
    });
  } catch (error) {
    console.error('Error fetching cities for partner:', error);
    res.render('partner/cities', {
      title: 'Manage My Cities - T BUS',
      partner: req.session.partner,
      myCities: [],
      availableCities: [],
      error: 'Could not load city data.'
    });
  }
});

// Add a city to the partner's list of cities
router.post('/cities/add', requireAuth, async (req, res) => {
  const { city_id } = req.body;
  const partnerId = req.session.partner.company_id;
  const cityId = parseInt(city_id);

  if (!isNaN(cityId) && partnerId) {
    try {
      await pool.query(
        'INSERT INTO partner_cities (partner_id, city_id) VALUES ($1, $2) ON CONFLICT (partner_id, city_id) DO NOTHING',
        [partnerId, cityId]
      );
    } catch (error) {
      console.error('Error adding city to partner list:', error);
    }
  }
  res.redirect('/partner/cities');
});

// Create a new city in the main system and add it to the partner's list
router.post('/cities/create-and-add', requireAuth, async (req, res) => {
  const { new_city_name } = req.body;
  const partnerId = req.session.partner.company_id;

  if (!new_city_name || !partnerId || typeof new_city_name !== 'string' || new_city_name.trim().length === 0) {
    return res.redirect('/partner/cities');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO cities (name)
      SELECT $1::varchar
      WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name ILIKE $1)
    `;
    await client.query(insertQuery, [new_city_name.trim()]);

    const cityResult = await client.query('SELECT id FROM cities WHERE name ILIKE $1', [new_city_name.trim()]);
    const cityId = cityResult.rows[0].id;

    await client.query('INSERT INTO partner_cities (partner_id, city_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [partnerId, cityId]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating and adding city:', error);
  } finally {
    client.release();
    res.redirect('/partner/cities');
  }
});

// Edit a city name in the main system
router.post('/cities/edit/:id', requireAuth, async (req, res) => {
  const cityIdToEdit = parseInt(req.params.id);
  const { city_name } = req.body;

  if (isNaN(cityIdToEdit) || !city_name || typeof city_name !== 'string' || city_name.trim().length === 0) {
    return res.redirect('/partner/cities?error=City name cannot be empty.');
  }

  try {
    await pool.query('UPDATE cities SET name = $1 WHERE id = $2', [city_name.trim(), cityIdToEdit]);
    res.redirect('/partner/cities');
  } catch (error) {
    console.error('Error editing city name:', error);
    res.redirect('/partner/cities?error=Failed to update city.');
  }
});

// Remove a city from the partner's list
router.post('/cities/delete/:id', requireAuth, async (req, res) => {
  const cityIdToRemove = parseInt(req.params.id);
  const partnerId = req.session.partner.company_id;

  if (isNaN(cityIdToRemove)) {
    return res.status(400).json({ success: false, message: 'Invalid city ID.' });
  }

  try {
    await pool.query(
      'DELETE FROM partner_cities WHERE city_id = $1 AND partner_id = $2',
      [cityIdToRemove, partnerId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing city from partner list:', error);
    res.status(500).json({ success: false, message: 'Failed to remove city.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Partner logout error:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;
