const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const translations = require('../config/translations');

// Input validation helpers
const isValidPhone = (phone) => /^[0-9+\-\s()]{7,20}$/.test(phone);
const isValidName = (name) => /^[a-zA-Z\s'-]{2,100}$/.test(name);
const isValidSeatNumber = (seat) => /^\d+$/.test(seat) && parseInt(seat) > 0;

// Middleware to set language
router.use((req, res, next) => {
  const lang = req.session.language || 'en';
  res.locals.t = translations[lang] || translations.en;
  res.locals.currentLang = lang;
  next();
});

// Home page
router.get('/', async (req, res) => {
  let cities = [];
  let popularRoutes = [];

  try {
    const citiesResult = await pool.query('SELECT * FROM cities ORDER BY name');
    cities = citiesResult.rows;

    const popularRoutesQuery = `
      SELECT 
        fc.name as from_city,
        tc.name as to_city,
        MIN(s.price) as min_price,
        COUNT(*) as route_count
      FROM schedules s
      JOIN cities fc ON s.from_city_id = fc.id
      JOIN cities tc ON s.to_city_id = tc.id
      WHERE s.is_active = true AND s.travel_date >= CURRENT_DATE
      GROUP BY fc.name, tc.name, s.from_city_id, s.to_city_id
      ORDER BY route_count DESC
      LIMIT 6
    `;

    const popularRoutesResult = await pool.query(popularRoutesQuery);
    popularRoutes = popularRoutesResult.rows;

  } catch (error) {
    console.error('Database error on home page:', error.message);
    cities = [
      { id: 1, name: 'Addis Ababa' },
      { id: 2, name: 'Dire Dawa' },
      { id: 3, name: 'Hawassa' },
      { id: 4, name: 'Bahir Dar' },
      { id: 5, name: 'Mekelle' },
      { id: 6, name: 'Adama' },
      { id: 7, name: 'Gondar' },
      { id: 8, name: 'Jimma' },
      { id: 9, name: 'Dessie' },
      { id: 10, name: 'Arba Minch' }
    ];
  }

  res.render('index', {
    title: 'T BUS - Ethiopia\'s Leading Online Bus Booking Platform',
    cities: cities,
    popularRoutes: popularRoutes
  });
});

// Search page
router.get('/search', async (req, res) => {
  try {
    const { from_city, to_city, travel_date, passengers = 1 } = req.query;

    if (!from_city || !to_city || !travel_date) {
      return res.redirect('/');
    }

    if (isNaN(from_city) || isNaN(to_city) || isNaN(passengers)) {
      return res.redirect('/');
    }

    if (parseInt(passengers) < 1 || parseInt(passengers) > 20) {
      return res.redirect('/');
    }

    const schedulesQuery = `
      SELECT 
        s.*,
        fc.name as from_city_name,
        tc.name as to_city_name,
        b.bus_number,
        b.type as bus_type,
        bc.company_name,
        bc.logo_url
      FROM schedules s
      JOIN cities fc ON s.from_city_id = fc.id
      JOIN cities tc ON s.to_city_id = tc.id
      JOIN buses b ON s.bus_id = b.id
      JOIN bus_companies bc ON b.bus_company_id = bc.id
      WHERE s.from_city_id = $1 
        AND s.to_city_id = $2
        AND s.travel_date::date = $3::date
        AND make_timestamp(
            EXTRACT(YEAR FROM s.travel_date)::integer,
            EXTRACT(MONTH FROM s.travel_date)::integer,
            EXTRACT(DAY FROM s.travel_date)::integer,
            EXTRACT(HOUR FROM s.departure_time)::integer,
            EXTRACT(MINUTE FROM s.departure_time)::integer,
            0) >= timezone('utc', now())
        AND s.is_active = true
        AND s.available_seats >= $4
      ORDER BY s.departure_time
    `;

    const schedulesResult = await pool.query(schedulesQuery, [from_city, to_city, travel_date, passengers]);
    const schedules = schedulesResult.rows;

    const fromCityResult = await pool.query('SELECT name FROM cities WHERE id = $1', [from_city]);
    const toCityResult = await pool.query('SELECT name FROM cities WHERE id = $1', [to_city]);

    res.render('search', {
      title: 'Search Results - T BUS',
      schedules: schedules,
      searchParams: {
        from_city: from_city,
        to_city: to_city,
        travel_date: travel_date,
        passengers: passengers,
        from_city_name: fromCityResult.rows[0]?.name || 'Unknown',
        to_city_name: toCityResult.rows[0]?.name || 'Unknown'
      }
    });
  } catch (error) {
    console.error('Error searching schedules:', error);
    res.render('search', {
      title: 'Search Results - T BUS',
      schedules: [],
      searchParams: req.query,
      error: 'Unable to search schedules at this time'
    });
  }
});

// Booking page
router.get('/booking/:schedule_id', async (req, res) => {
  try {
    const { schedule_id } = req.params;
    const { passengers = 1 } = req.query;

    if (!schedule_id || isNaN(schedule_id)) {
      return res.redirect('/');
    }

    const scheduleQuery = `
      SELECT 
        s.*,
        fc.name as from_city_name,
        tc.name as to_city_name,
        b.bus_number,
        b.type as bus_type,
        b.total_seats,
        b.wifi, b.ac, b.charging_ports, b.entertainment, b.refreshments,
        bc.company_name,
        bc.logo_url
      FROM schedules s
      JOIN cities fc ON s.from_city_id = fc.id
      JOIN cities tc ON s.to_city_id = tc.id
      JOIN buses b ON s.bus_id = b.id
      JOIN bus_companies bc ON b.bus_company_id = bc.id
      WHERE s.id = $1 AND s.is_active = true
    `;

    const scheduleResult = await pool.query(scheduleQuery, [schedule_id]);

    if (scheduleResult.rows.length === 0) {
      return res.redirect('/');
    }

    const schedule = scheduleResult.rows[0];

    res.render('seat-selection', {
      title: 'Select Your Seat - T BUS',
      schedule: schedule,
      passengers: parseInt(passengers)
    });
  } catch (error) {
    console.error('Error loading booking page:', error);
    res.redirect('/');
  }
});

// Process booking
router.post('/booking', async (req, res) => {
  try {
    const { schedule_id, passenger_name, passenger_phone, seat_number, payment_method } = req.body;

    if (!schedule_id || isNaN(schedule_id)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule ID.' });
    }

    // Input validation
    if (!passenger_name || !isValidName(passenger_name)) {
      return res.status(400).json({ success: false, message: 'Invalid passenger name.' });
    }

    if (!passenger_phone || !isValidPhone(passenger_phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number.' });
    }

    if (!seat_number || !isValidSeatNumber(seat_number)) {
      return res.status(400).json({ success: false, message: 'Invalid seat number.' });
    }

    const validPaymentMethods = ['cash', 'telebirr', 'cbe_birr'];
    if (!payment_method || !validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method.' });
    }

    const scheduleResult = await pool.query('SELECT price, travel_date FROM schedules WHERE id = $1', [schedule_id]);
    if (scheduleResult.rows.length === 0 || new Date(scheduleResult.rows[0].travel_date) < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ success: false, message: 'Schedule not found or has expired.' });
    }
    const price = scheduleResult.rows[0].price;

    const seatCheck = await pool.query(
      'SELECT COUNT(*) as count FROM bookings WHERE schedule_id = $1 AND seat_number = $2 AND booking_status != $3',
      [schedule_id, seat_number, 'cancelled']
    );

    if (seatCheck.rows[0].count > 0) {
      return res.status(409).json({ success: false, message: 'Selected seat is already taken.' });
    }

    const bookingRef = 'TB' + Date.now().toString().slice(-8);
    const bookingStatus = 'pending_approval';
    const paymentStatus = payment_method === 'cash' ? 'pending' : 'pending_approval';

    const bookingQuery = `
      INSERT INTO bookings (booking_reference, schedule_id, passenger_full_name, passenger_phone, 
                           seat_number, total_price, payment_method, booking_status, payment_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    await pool.query(bookingQuery, [
      bookingRef, schedule_id, passenger_name, passenger_phone,
      seat_number, price, payment_method, bookingStatus, paymentStatus
    ]);

    await pool.query('UPDATE schedules SET available_seats = available_seats - 1 WHERE id = $1', [schedule_id]);

    const smsMessage = `Your T-BUS booking ${bookingRef} is ${bookingStatus}. Seat: ${seat_number}.`;
    await sendNotification(passenger_phone, smsMessage, 'sms', bookingRef);

    res.status(200).json({ success: true, message: 'Booking successful!', bookingRef: bookingRef });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred during booking.' });
  }
});

// Helper function to send notifications
async function sendNotification(phone, message, type, bookingRef) {
  try {
    if (!phone || !message || !type || !bookingRef) {
      throw new Error('Missing required notification parameters');
    }
    await pool.query(
      'INSERT INTO notifications (booking_reference, phone_number, message, notification_type) VALUES ($1, $2, $3, $4)',
      [bookingRef, phone, message, type]
    );
  } catch (error) {
    console.error('Notification error:', error);
  }
}

// Booking success page
router.get('/booking-success', async (req, res) => {
  try {
    const { ref } = req.query;

    if (!ref || !/^TB[0-9]{8}$/.test(ref)) {
      return res.redirect('/');
    }

    const bookingQuery = `
      SELECT b.*, s.departure_time, s.arrival_time, s.travel_date,
             fc.name as from_city, tc.name as to_city,
             bus.bus_number, bc.company_name
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN cities fc ON s.from_city_id = fc.id
      JOIN cities tc ON s.to_city_id = tc.id
      JOIN buses bus ON s.bus_id = bus.id
      JOIN bus_companies bc ON bus.bus_company_id = bc.id
      WHERE b.booking_reference = $1
    `;

    const bookingResult = await pool.query(bookingQuery, [ref]);

    if (bookingResult.rows.length === 0) {
      return res.redirect('/');
    }

    res.render('booking-success', {
      title: 'Booking Confirmed - T BUS',
      booking: bookingResult.rows[0]
    });
  } catch (error) {
    console.error('Error loading booking success:', error);
    res.redirect('/');
  }
});

// Manage booking page
router.get('/manage-booking', (req, res) => {
  res.render('manage-booking', {
    title: 'Manage Booking - T BUS',
    booking: null,
    error: null
  });
});

// Search booking
router.post('/manage-booking', async (req, res) => {
  try {
    const { booking_reference, passenger_phone } = req.body;

    if (!booking_reference || !passenger_phone) {
      return res.render('manage-booking', {
        title: 'Manage Booking - T BUS',
        booking: null,
        error: 'Booking reference and phone number are required.'
      });
    }

    const bookingQuery = `
      SELECT b.*, s.departure_time, s.arrival_time, s.travel_date,
             fc.name as from_city, tc.name as to_city,
             bus.bus_number, bc.company_name
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN cities fc ON s.from_city_id = fc.id
      JOIN cities tc ON s.to_city_id = tc.id
      JOIN buses bus ON s.bus_id = bus.id
      JOIN bus_companies bc ON bus.bus_company_id = bc.id
      WHERE b.booking_reference = $1 AND b.passenger_phone = $2
    `;

    const bookingResult = await pool.query(bookingQuery, [booking_reference, passenger_phone]);

    if (bookingResult.rows.length === 0) {
      return res.render('manage-booking', {
        title: 'Manage Booking - T BUS',
        booking: null,
        error: 'Booking not found. Please check your reference and phone number.'
      });
    }

    res.render('manage-booking', {
      title: 'Manage Booking - T BUS',
      booking: bookingResult.rows[0],
      error: null
    });
  } catch (error) {
    console.error('Error searching booking:', error);
    res.render('manage-booking', {
      title: 'Manage Booking - T BUS',
      booking: null,
      error: 'Unable to search booking at this time'
    });
  }
});

// Cancel booking
router.post('/cancel-booking', async (req, res) => {
  try {
    const { booking_reference, passenger_phone } = req.body;

    if (!booking_reference || !passenger_phone) {
      return res.status(400).json({ success: false, message: 'Booking reference and phone number are required.' });
    }

    const bookingQuery = `
      SELECT b.*, s.id as schedule_id FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      WHERE b.booking_reference = $1 AND b.passenger_phone = $2
    `;

    const bookingResult = await pool.query(bookingQuery, [booking_reference, passenger_phone]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookingResult.rows[0];

    if (booking.booking_status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This booking is already cancelled.' });
    }

    if (booking.booking_status === 'confirmed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel confirmed bookings. Contact support for assistance.' });
    }

    await pool.query(
      'UPDATE bookings SET booking_status = $1 WHERE booking_reference = $2',
      ['cancelled', booking_reference]
    );

    await pool.query(
      'UPDATE schedules SET available_seats = available_seats + 1 WHERE id = $1',
      [booking.schedule_id]
    );

    const smsMessage = `Your T-BUS booking ${booking_reference} has been cancelled.`;
    await sendNotification(passenger_phone, smsMessage, 'sms', booking_reference);

    res.status(200).json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while cancelling the booking.' });
  }
});

// Language switching
router.get('/lang/:language', (req, res) => {
  const { language } = req.params;
  if (['en', 'am'].includes(language)) {
    req.session.language = language;
  }
  res.redirect(req.get('Referer') || '/');
});

// Bus tracking page
router.get('/track-bus/:booking_reference', async (req, res) => {
  try {
    const { booking_reference } = req.params;

    if (!booking_reference || !/^TB[0-9]{8}$/.test(booking_reference)) {
      return res.redirect('/manage-booking?error=invalid_reference');
    }

    const bookingQuery = `
      SELECT b.*, s.*, fc.name as from_city, tc.name as to_city,
             bus.bus_number, bc.company_name
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN cities fc ON s.from_city_id = fc.id
      JOIN cities tc ON s.to_city_id = tc.id
      JOIN buses bus ON s.bus_id = bus.id
      JOIN bus_companies bc ON bus.bus_company_id = bc.id
      WHERE b.booking_reference = $1
    `;

    const bookingResult = await pool.query(bookingQuery, [booking_reference]);

    if (bookingResult.rows.length === 0) {
      return res.redirect('/manage-booking?error=booking_not_found');
    }

    res.render('track-bus', {
      title: 'Track Your Bus - T BUS',
      booking: bookingResult.rows[0]
    });
  } catch (error) {
    console.error('Error loading tracking page:', error);
    res.redirect('/manage-booking');
  }
});

module.exports = router;
