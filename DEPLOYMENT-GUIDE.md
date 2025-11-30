# 🛑 CRITICAL SECURITY WARNING

**DO NOT COMMIT REAL SECRETS OR PASSWORDS TO THIS FILE.**
This guide uses placeholders like `<YOUR_..._HERE>`. You must replace these with your actual credentials from your hosting provider (e.g., Render) in your deployment environment, not in the code.

# 🚀 T-BUS Ethiopia Deployment Guide

## 📋 Prerequisites

- Render account with PostgreSQL database (✅ Already created)
- Node.js 18+ installed locally
- Git repository

## 🗄️ Database Setup

### 1. Connect to Your Render Database

Use the PSQL command from your Render dashboard. You will be prompted for the password.

```bash
# Example from Render, replace with your actual connection string
psql -h <YOUR_DATABASE_HOST> -U <YOUR_DATABASE_USER> <YOUR_DATABASE_NAME>
```

### 2. Run Database Schema

Copy and paste the contents of `database/postgresql-schema.sql` into the PSQL terminal to create all tables.

### 3. Create Admin User

Run this SQL command in PSQL:

```sql
INSERT INTO users (email, password_hash, user_type, full_name)
VALUES ('admin@tbus.et', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 'System Administrator');
```

**Login:** admin@tbus.et / **Password:** password
**IMPORTANT:** You should change this default password immediately after your first login.

### 4. Create Sample Data

```sql
-- Insert sample bus company
INSERT INTO bus_companies (company_name, contact_person_name, contact_phone)
VALUES ('Selam Bus', 'Dawit Mekonnen', '+251911123456');

-- Create partner user
INSERT INTO users (email, password_hash, user_type, full_name, bus_company_id)
VALUES ('partner@selam.et', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'partner_admin', 'Selam Bus Admin', 1);
```

**Partner Login:** partner@selam.et / **Password:** password
**IMPORTANT:** You should change this default password immediately after your first login.

## 🌐 Render Web Service Deployment

### 1. Create Web Service

- Go to Render Dashboard → New → Web Service
- Connect your GitHub repository
- Use these settings:

**Build Command:**

```bash
npm install
```

**Start Command:**

```bash
npm start
```

### 2. Environment Variables

Add these in Render Web Service settings. Get the `DATABASE_URL` from your Render PostgreSQL instance. The `SESSION_SECRET` should be a new, long, and random string that you generate yourself.

```
DATABASE_URL=<PASTE_YOUR_RENDER_DATABASE_URL_HERE>
SESSION_SECRET=<GENERATE_A_NEW_STRONG_SECRET_HERE>
NODE_ENV=production
PORT=10000
```

### 3. Deploy

- Click "Create Web Service"
- Wait for deployment to complete
- Your app will be available at: `https://your-service-name.onrender.com`

## 🧪 Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Create .env File

Create a file named `.env` in the project root.

```env
# Use your Render database for local development or a local PostgreSQL instance
DATABASE_URL=<PASTE_YOUR_DATABASE_URL_HERE>

# Use a long, random string for development
SESSION_SECRET=<GENERATE_A_DEVELOPMENT_SECRET_HERE>

NODE_ENV=development
PORT=3001
```

### 3. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:3001`

## 🔐 Default Login Credentials

### Unified Login (`/login`)

#### Admin

- **Email:** `admin@tbus.et`
- **Password:** `password`

#### Partner

- **Email:** `partner@selam.et`
- **Password:** `password`

## ✨ Features Available

### 🎫 Public Features

- ✅ Bus search and booking
- ✅ Seat selection with visual layout
- ✅ Multiple payment methods (Telebirr, CBE Birr, Cash)
- ✅ Real-time bus tracking
- ✅ Booking management and cancellation
- ✅ Multi-language support (English/Amharic)
- ✅ Mobile-responsive design
- ✅ Promotional codes and discounts

### 👨‍💼 Admin Features

- ✅ Company management
- ✅ City and route management
- ✅ Bus fleet management
- ✅ Booking oversight
- ✅ User management
- ✅ Analytics and reports

### 🚌 Partner Features

- ✅ Company-specific dashboard
- ✅ Bus and schedule management
- ✅ Booking approval system
- ✅ Revenue tracking
- ✅ Customer management

## 🛠️ Post-Deployment Setup

### 1. Add Sample Cities

Login as admin and add Ethiopian cities:

- Addis Ababa, Dire Dawa, Hawassa, Bahir Dar, Mekelle, etc.

### 2. Create Bus Fleet

- Add buses with different types (Standard, VIP, Business)
- Set amenities (WiFi, AC, Charging ports)

### 3. Setup Routes & Schedules

- Create popular routes between cities
- Set departure times and pricing
- Configure seat availability

### 4. Test Booking Flow

- Search for buses
- Select seats
- Complete booking
- Test payment approval workflow

## 💡 Recommended Next Steps

### Adopt a Database Migration Tool

The current database setup process relies on manually running a SQL file. This is acceptable for the initial setup, but it quickly becomes difficult to manage as your application grows and you need to make changes to the database schema (e.g., add a table, alter a column).

For a more robust and professional workflow, we strongly recommend adopting a **database migration tool**. This will allow you to:

- Version your database schema changes in code.
- Reliably apply and roll back changes across different environments (development, production).
- Automate database updates as part of your deployment process.

A popular and excellent choice for this project is [**`node-pg-migrate`**](https://github.com/salsita/node-pg-migrate). It integrates well with Node.js and PostgreSQL.

## 🔧 Troubleshooting

### Database Connection Issues

- Ensure DATABASE_URL is correct in your environment variables.
- Check Render database status.
- Verify IP restrictions (should allow 0.0.0.0/0).

### Deployment Failures

- Check build logs in Render dashboard.
- Verify all environment variables are set.
- Ensure Node.js version compatibility.

### Feature Issues

- Check browser console for JavaScript errors.
- Verify API endpoints are responding.
- Test with different browsers/devices.

## 📞 Support

- **Technical Issues:** Check logs in Render dashboard
- **Feature Requests:** Update code and redeploy
- **Database Issues:** Use Render database console

---

🎉 **Your T-BUS Ethiopia system is now ready for production use!**

The system includes all modern bus ticketing features comparable to international platforms, specifically designed for the Ethiopian market with local payment methods, Amharic language support, and cultural customization.
