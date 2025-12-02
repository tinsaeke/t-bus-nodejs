const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

// @route   GET /login
// @desc    Show the login page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// @route   POST /login
// @desc    Authenticate user (admin or partner)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required.' });
  }

  if (!isValidEmail(email)) {
    return res.render('login', { error: 'Invalid email format.' });
  }

  if (!password || password.length < 1 || password.length > 255) {
    return res.render('login', { error: 'Invalid password.' });
  }

  if (typeof password !== 'string') {
    return res.render('login', { error: 'Invalid password format.' });
  }

  try {
    const userQuery = `
      SELECT u.*, bc.company_name, bc.is_active as company_is_active
      FROM users u
      LEFT JOIN bus_companies bc ON u.bus_company_id = bc.id
      WHERE u.email = $1
    `;
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.render('login', { error: 'Invalid credentials. Please try again.' });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.render('login', { error: 'Invalid credentials. Please try again.' });
    }

    if (user.user_type === 'super_admin' || user.user_type === 'admin') {
      req.session.admin = {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.user_type
      };
      return res.redirect('/admin/dashboard');
    } else if (user.user_type === 'partner_admin' && user.company_is_active) {
      req.session.partner = {
        id: user.id,
        email: user.email,
        name: user.full_name,
        company_id: user.bus_company_id,
        company_name: user.company_name
      };
      return res.redirect('/partner/dashboard');
    }

    res.render('login', { error: 'Your account is inactive or invalid. Please contact support.' });
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'An internal server error occurred. Please try again later.' });
  }
});

// @route   GET /logout
// @desc    Destroy session and log user out
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.redirect('/login');
    }
    res.redirect('/login');
  });
});

module.exports = router;
