# T-BUS Ethiopia - Node.js Migration

This is the Node.js version of the T-BUS Ethiopia bus booking system, designed to be deployed on Render.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment Variables
Copy `.env` file and update with your PostgreSQL credentials:
```bash
# For Render deployment
DATABASE_URL=postgresql://username:password@hostname:port/database_name

# Local development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=t_bus_ethiopia
DB_USER=postgres
DB_PASSWORD=your_password

PORT=3000
SESSION_SECRET=your-super-secret-key
```

### 3. Set up PostgreSQL Database
Run the SQL commands in `database/postgresql-schema.sql` on your PostgreSQL database.

### 4. Run the Application
```bash
# Development
npm run dev

# Production
npm start
```

## 📁 Project Structure

```
├── config/
│   └── database.js          # PostgreSQL connection
├── database/
│   └── postgresql-schema.sql # Database schema
├── routes/
│   ├── public.js            # Public pages (home, search)
│   └── api.js               # API endpoints
├── views/
│   ├── index.ejs            # Home page
│   └── search.ejs           # Search results
├── server.js                # Main application
├── package.json
└── .env                     # Environment variables
```

## 🌐 Render Deployment

### 1. Create PostgreSQL Database
- Go to Render Dashboard
- Create new PostgreSQL database
- Copy the connection string

### 2. Create Web Service
- Connect your GitHub repository
- Set build command: `npm install`
- Set start command: `npm start`
- Add environment variable: `DATABASE_URL=your_postgres_connection_string`

### 3. Deploy
- Push code to GitHub
- Render will automatically deploy

## ✅ Migration Status

**Completed:**
- ✅ Basic Node.js/Express setup
- ✅ PostgreSQL database connection
- ✅ Home page with search form
- ✅ Search results page
- ✅ API endpoints for cities and search
- ✅ Render-compatible configuration

**Next Steps:**
- ✅ Booking page and process
- ✅ Admin panel migration
- ✅ Partner portal migration
- 🔄 Payment integration

## 👤 User Access

### Admin Access
```bash
npm run create-admin
```
- Email: admin@tbus.et
- Password: admin123
- URL: `/admin/login`

### Partner Access
```bash
npm run create-partner
```
- Email: partner@demo.com
- Password: partner123
- URL: `/partner/login`

## 🔧 Key Changes from PHP

1. **Database**: MySQL → PostgreSQL
2. **Backend**: PHP → Node.js/Express
3. **Templates**: PHP includes → EJS templates
4. **Sessions**: PHP sessions → Express sessions
5. **Deployment**: XAMPP → Render

## 📞 Support

For deployment help or issues, contact the development team.