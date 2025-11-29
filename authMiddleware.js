// This middleware checks if an admin is logged in.
const isAdmin = (req, res, next) => {
  if (req.session.admin) {
    // If req.session.admin exists, the user is an admin.
    // Continue to the next function in the chain (the route handler).
    return next();
  }
  // If not, redirect them to the login page.
  res.redirect('/login');
};

// This middleware checks if a partner is logged in.
const isPartner = (req, res, next) => {
  if (req.session.partner) {
    // If req.session.partner exists, the user is a partner.
    // Continue to the next function in the chain.
    return next();
  }
  // If not, redirect them to the login page.
  res.redirect('/login');
};

// This middleware checks if any user (admin or partner) is logged in.
const isAuthenticated = (req, res, next) => {
  if (req.session.admin || req.session.partner) {
    return next();
  }
  res.redirect('/login');
};

module.exports = { isAdmin, isPartner, isAuthenticated };