# T-BUS Ethiopia - Complete Bus Ticketing System

## 🚌 Overview
T-BUS Ethiopia is a comprehensive online bus booking platform designed specifically for the Ethiopian market. It provides a complete solution for bus companies, passengers, and administrators with modern features comparable to international bus ticketing systems.

## ✨ Complete Feature Set

### 🎫 **Core Booking Features**
- **Real-time Seat Selection**: Visual bus layout with 2+2 seating configuration
- **Multi-passenger Booking**: Support for group bookings up to 20 passengers
- **Dynamic Pricing**: Base pricing with promotional code support
- **Payment Integration**: Telebirr, CBE Birr, and cash payment options
- **Booking Confirmation**: Instant booking confirmation with QR codes
- **E-ticket Generation**: Digital tickets with QR codes for verification

### 🔍 **Advanced Search & Filters**
- **Smart Search**: City-to-city search with date selection
- **Advanced Filters**: Bus type, departure time, amenities filtering
- **Route Suggestions**: Popular route recommendations
- **City Swap**: Quick swap between departure and destination
- **Weather Integration**: Weather information for travel routes
- **Location-based Suggestions**: Route suggestions based on user location

### 💳 **Payment & Pricing**
- **Multiple Payment Methods**: Telebirr, CBE Birr, Cash at terminal
- **Promotional Codes**: Percentage and fixed amount discounts
- **Dynamic Pricing**: Real-time price calculations
- **Secure Transactions**: Bank-level security for payments
- **Payment Verification**: Real-time payment status tracking
- **Refund Management**: Automated refund calculations (90% refund policy)

### 📱 **Mobile & User Experience**
- **Responsive Design**: Optimized for all devices
- **Progressive Web App**: App-like experience on mobile
- **Offline Capability**: Cached tickets for offline access
- **Push Notifications**: Real-time booking and travel updates
- **Multi-language Support**: English and Amharic (አማርኛ)
- **Ethiopian UI**: Local imagery and cultural customization

### 🚍 **Real-time Tracking & Notifications**
- **Live Bus Tracking**: GPS-based real-time bus location
- **Interactive Maps**: Leaflet-based mapping with route visualization
- **Journey Timeline**: Step-by-step travel progress
- **SMS Notifications**: Automated booking and travel alerts
- **Email Notifications**: Booking confirmations and updates
- **Delay Notifications**: Real-time delay and arrival updates
- **Emergency Features**: Emergency contact and reporting system

### 🎯 **Booking Management**
- **Ticket Tracking**: Track tickets with booking reference and phone
- **Booking Modification**: Change travel dates and passenger details
- **Cancellation System**: 24-hour cancellation policy with refunds
- **Digital Wallet**: Store and manage multiple bookings
- **Booking History**: Complete travel history tracking
- **Status Management**: Pending, confirmed, cancelled status tracking

### 🏢 **Multi-user System**
- **Customer Portal**: Public booking and management interface
- **Partner Portal**: Bus company management dashboard
- **Admin Panel**: Super admin system management
- **Role-based Access**: Secure authentication and authorization
- **Company Management**: Multi-company support with individual branding

### 🚌 **Bus & Route Management**
- **Fleet Management**: Bus registration with amenities tracking
- **Route Planning**: City-to-city route configuration
- **Schedule Management**: Departure times and pricing setup
- **Capacity Management**: Real-time seat availability tracking
- **Amenity Display**: WiFi, AC, charging ports, entertainment display
- **Bus Types**: Standard, VIP, and Business class options

### 📊 **Analytics & Reporting**
- **Booking Analytics**: Revenue and booking statistics
- **Route Performance**: Popular routes and demand analysis
- **Customer Insights**: Travel patterns and preferences
- **Revenue Reports**: Financial reporting and analytics
- **Occupancy Rates**: Bus utilization statistics
- **Partner Performance**: Company-wise performance metrics

### 🔒 **Security & Compliance**
- **Data Protection**: GDPR-compliant data handling
- **Secure Authentication**: bcrypt password hashing
- **Rate Limiting**: API abuse prevention
- **CORS Protection**: Cross-origin request security
- **Helmet Security**: HTTP header security
- **Input Validation**: SQL injection and XSS prevention

### 🌐 **Integration & APIs**
- **RESTful APIs**: Complete API suite for mobile apps
- **Payment Gateway**: Integration-ready payment processing
- **SMS Gateway**: Notification service integration
- **Email Service**: Automated email notifications
- **Weather API**: Travel weather information
- **Maps Integration**: GPS tracking and route mapping

### 📱 **Mobile App Features**
- **Native App Support**: iOS and Android app download links
- **Offline Tickets**: Cached ticket access without internet
- **Push Notifications**: Real-time travel updates
- **Biometric Login**: Fingerprint and face ID support
- **Quick Booking**: Saved preferences for faster booking
- **Location Services**: Auto-detect departure city

### 🎨 **Ethiopian Localization**
- **Cultural Design**: Ethiopian landscape imagery and colors
- **Local Payment Methods**: Telebirr and CBE Birr integration
- **Amharic Language**: Full Amharic translation support
- **Ethiopian Calendar**: Local calendar system support
- **Local Currency**: Ethiopian Birr (ETB) pricing
- **Cultural Holidays**: Ethiopian holiday awareness

### 🔧 **Technical Features**
- **PostgreSQL Database**: Robust relational database
- **Node.js Backend**: Scalable server architecture
- **EJS Templating**: Server-side rendering
- **Bootstrap UI**: Modern responsive design
- **Express.js Framework**: RESTful API architecture
- **Session Management**: Secure user sessions
- **Environment Configuration**: Production-ready deployment

### 🚀 **Deployment & Scalability**
- **Render Deployment**: Cloud-ready configuration
- **Environment Variables**: Secure configuration management
- **Database Migrations**: Version-controlled schema updates
- **Load Balancing**: Horizontal scaling support
- **CDN Integration**: Static asset optimization
- **Monitoring**: Application performance monitoring

## 📋 **Database Schema**

### Core Tables
- **cities**: Ethiopian cities and destinations
- **bus_companies**: Bus operator information
- **buses**: Fleet management with amenities
- **schedules**: Route schedules and pricing
- **bookings**: Passenger bookings and payments
- **users**: Multi-role user management

### Feature Tables
- **promotional_codes**: Discount and promo management
- **reviews**: Customer feedback system
- **notifications**: SMS/Email notification queue
- **bus_tracking**: Real-time GPS tracking data
- **newsletter_subscribers**: Marketing email list

## 🛠 **Installation & Setup**

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd t-bus-ethiopia

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
psql -U postgres -d your_database -f database/postgresql-schema.sql

# Create admin user
npm run create-admin

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Variables
```env
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-secret-key
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com
```

## 🌟 **Key Differentiators**

1. **Ethiopian-First Design**: Built specifically for Ethiopian market needs
2. **Complete Feature Parity**: Matches international bus booking platforms
3. **Mobile-First Approach**: Optimized for mobile usage patterns
4. **Real-time Everything**: Live tracking, notifications, and updates
5. **Multi-stakeholder Support**: Customers, partners, and admins
6. **Scalable Architecture**: Ready for nationwide deployment
7. **Security-First**: Enterprise-grade security measures
8. **Integration-Ready**: API-first design for third-party integrations

## 📞 **Support & Contact**

- **Technical Support**: support@tbus.et
- **Business Inquiries**: business@tbus.et
- **Emergency Hotline**: +251 911 223344
- **WhatsApp Support**: +251 911 223344

## 📄 **License**

This project is proprietary software developed for T-BUS Ethiopia.

---

**T-BUS Ethiopia** - Connecting Ethiopia, One Journey at a Time 🇪🇹