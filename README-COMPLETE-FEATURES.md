# T-BUS Ethiopia - Bus Ticketing System

## Overview
T-BUS Ethiopia is an online bus booking platform for the Ethiopian market.

## Features

### Booking
- Real-time seat selection with visual bus layout
- Multi-passenger booking support
- Dynamic pricing
- Payment methods: Telebirr, CBE Birr, Cash
- Booking confirmation with QR codes
- Digital tickets

### Search & Filters
- City-to-city search with date selection
- Bus type filtering
- Departure time filtering
- Amenities filtering
- Popular route suggestions

### Payment & Pricing
- Multiple payment methods
- Promotional codes
- Dynamic pricing
- Payment status tracking
- Refund management

### User Experience
- Responsive design
- Mobile optimization
- Offline ticket access
- Push notifications
- Multi-language support (English/Amharic)

### Tracking & Notifications
- Live bus tracking
- Interactive maps
- Journey timeline
- SMS notifications
- Email notifications
- Delay notifications

### Booking Management
- Ticket tracking
- Booking modification
- Cancellation system
- Booking history
- Status tracking

### Multi-user System
- Customer portal
- Partner portal
- Admin panel
- Role-based access
- Company management

### Bus & Route Management
- Fleet management
- Route configuration
- Schedule management
- Seat availability tracking
- Amenity display
- Bus types: Standard, VIP, Business

### Analytics & Reporting
- Booking analytics
- Route performance
- Customer insights
- Revenue reports
- Occupancy rates
- Partner performance

### Security
- Data protection
- Secure authentication
- Rate limiting
- CORS protection
- HTTP header security
- Input validation

### Integration & APIs
- RESTful APIs
- Payment gateway integration
- SMS gateway integration
- Email service integration
- Weather API integration
- Maps integration

### Mobile Features
- Native app support
- Offline tickets
- Push notifications
- Biometric login
- Quick booking
- Location services

### Localization
- Ethiopian design
- Local payment methods
- Amharic language support
- Ethiopian calendar support
- Ethiopian Birr pricing
- Cultural holidays

### Technical Stack
- PostgreSQL database
- Node.js backend
- EJS templating
- Bootstrap UI
- Express.js framework
- Session management
- Environment configuration

### Deployment
- Render deployment
- Environment variables
- Database migrations
- Load balancing support
- CDN integration
- Performance monitoring

## Database Schema

### Core Tables
- cities
- bus_companies
- buses
- schedules
- bookings
- users

### Feature Tables
- promotional_codes
- reviews
- notifications
- bus_tracking
- newsletter_subscribers

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn


### Environment Variables
```env
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-secret-key
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com
```

## Support & Contact

- Technical Support: support@tbus.et
- Business Inquiries: business@tbus.et
- Emergency Hotline: +251 911 223344
- WhatsApp Support: +251 911 223344

## License

Proprietary software developed for T-BUS Ethiopia.
