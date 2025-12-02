const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const pgPool = require('./config/database');
const pgSession = require('connect-pg-simple')(session);
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "https://cdn.jsdelivr.net"],
      "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": ["'self'", "https://cdn.jsdelivr.net"],
    }
  }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
  credentials: true
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use('/api/', generalLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.error('FATAL ERROR: SESSION_SECRET environment variable is not set.');
  process.exit(1);
}

const sessionConfig = {
  store: new pgSession({
    pool: pgPool,
    tableName: 'user_sessions',
    pruneSessionInterval: 60
  }),
  secret: process.env.SESSION_SECRET || 'a-temporary-secret-for-dev-only',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
};

app.use(session(sessionConfig));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));
app.use('/partner', require('./routes/partner-fixed'));

app.post('/login', loginLimiter);
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/public'));

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message;
  res.status(status).json({ error: message });
});

app.use((req, res, next) => {
  res.status(404);
  if (req.accepts('html')) {
    res.render('404', { url: req.url, user: req.session.user });
    return;
  }
  if (req.accepts('json')) {
    res.json({ error: 'Not found' });
    return;
  }
  res.type('txt').send('Not found');
});

const server = app.listen(PORT, () => {
  console.log(`T-BUS Ethiopia server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Visit: http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    pgPool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});
