const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: { // Loosening policy to allow CDN and inline styles/scripts needed by Bootstrap & our app
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      "img-src": ["'self'", "data:", "https:"], // Allow all https images
      "connect-src": ["'self'", "https://cdn.jsdelivr.net"],
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
// In production, it's critical to have a secret. If it's not set, we must exit.
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.error('FATAL ERROR: SESSION_SECRET environment variable is not set.');
  process.exit(1);
}

app.use(session({
  // The secret is required. For production, the check above ensures it's set.
  // For development, we can use a simpler, non-persistent secret.
  secret: process.env.SESSION_SECRET || 'a-temporary-secret-for-dev-only',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true // Prevent client-side script access to the cookie
  }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS, images). This should come before the routes.
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin')); // Use the correct admin routes file
app.use('/partner', require('./routes/partner-fixed')); // Use the corrected partner routes
app.use('/', require('./routes/auth')); // General authentication routes
app.use('/', require('./routes/public')); // Public routes should be last

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Page not found' });
});

app.listen(PORT, () => {
  console.log(`T-BUS Ethiopia server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Visit: http://localhost:${PORT}`);
});