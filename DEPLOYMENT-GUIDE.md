# 🚀 T-BUS Ethiopia Deployment Guide

## 📋 Prerequisites
- Render account with PostgreSQL database (✅ Already created)
- Node.js 18+ installed locally
- Git repository

## 🗄️ Database Setup

### 1. Connect to Your Render Database
Use the PSQL command from your Render dashboard:
```bash
PGPASSWORD=uQET1YY7YDMWx9qlhvzEnwVnAY7C6zdd psql -h dpg-d4io702li9vc73en3sog-a.frankfurt-postgres.render.com -U t_bus_ethiopia_db_user t_bus_ethiopia_db
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
Add these in Render Web Service settings:
```
DATABASE_URL=postgresql://t_bus_ethiopia_db_user:uQET1YY7YDMWx9qlhvzEnwVnAY7C6zdd@dpg-d4io702li9vc73en3sog-a.frankfurt-postgres.render.com/t_bus_ethiopia_db
SESSION_SECRET=tbus-ethiopia-super-secret-key-2024
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
```env
DATABASE_URL=postgresql://t_bus_ethiopia_db_user:uQET1YY7YDMWx9qlhvzEnwVnAY7C6zdd@dpg-d4io702li9vc73en3sog-a.frankfurt-postgres.render.com/t_bus_ethiopia_db
SESSION_SECRET=tbus-ethiopia-super-secret-key-2024
NODE_ENV=development
PORT=3001
```

### 3. Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:3001`

## 🔐 Default Login Credentials

### Admin Panel (`/admin/login`)
- **Email:** admin@tbus.et
- **Password:** password

### Partner Portal (`/partner/login`)
- **Email:** partner@selam.et
- **Password:** password

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

## 🔧 Troubleshooting

### Database Connection Issues
- Ensure DATABASE_URL is correct
- Check Render database status
- Verify IP restrictions (should allow 0.0.0.0/0)

### Deployment Failures
- Check build logs in Render dashboard
- Verify all environment variables are set
- Ensure Node.js version compatibility

### Feature Issues
- Check browser console for JavaScript errors
- Verify API endpoints are responding
- Test with different browsers/devices

## 📞 Support
- **Technical Issues:** Check logs in Render dashboard
- **Feature Requests:** Update code and redeploy
- **Database Issues:** Use Render database console

---

🎉 **Your T-BUS Ethiopia system is now ready for production use!**

The system includes all modern bus ticketing features comparable to international platforms, specifically designed for the Ethiopian market with local payment methods, Amharic language support, and cultural customization.