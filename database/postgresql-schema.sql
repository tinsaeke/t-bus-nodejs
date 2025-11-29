-- T BUS Database Schema for PostgreSQL
-- Run this on your Render PostgreSQL database

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bus companies table
CREATE TABLE IF NOT EXISTS bus_companies (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    contact_person_name VARCHAR(100),
    contact_phone VARCHAR(20),
    logo_url VARCHAR(500),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) CHECK (user_type IN ('super_admin', 'partner_admin')) NOT NULL,
    bus_company_id INTEGER REFERENCES bus_companies(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buses table
CREATE TABLE IF NOT EXISTS buses (
    id SERIAL PRIMARY KEY,
    bus_company_id INTEGER NOT NULL REFERENCES bus_companies(id) ON DELETE CASCADE,
    bus_number VARCHAR(50) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('standard', 'vip', 'business')) DEFAULT 'standard',
    total_seats INTEGER NOT NULL,
    amenities JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    from_city_id INTEGER NOT NULL REFERENCES cities(id),
    to_city_id INTEGER NOT NULL REFERENCES cities(id),
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available_seats INTEGER NOT NULL,
    travel_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_dates ON schedules(travel_date, from_city_id, to_city_id);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    passenger_full_name VARCHAR(100) NOT NULL,
    passenger_phone VARCHAR(20) NOT NULL,
    seat_number INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    booking_status VARCHAR(20) CHECK (booking_status IN ('confirmed', 'cancelled', 'pending', 'pending_approval')) DEFAULT 'confirmed',
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'pending_approval')) DEFAULT 'pending',
    payment_method VARCHAR(20) CHECK (payment_method IN ('telebirr', 'cbe_birr', 'cash')),
    payment_reference VARCHAR(100),
    qr_code_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for bookings
CREATE INDEX IF NOT EXISTS idx_booking_ref ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_passenger_phone ON bookings(passenger_phone);

-- Popular routes table
CREATE TABLE IF NOT EXISTS popular_routes (
    id SERIAL PRIMARY KEY,
    from_city_id INTEGER NOT NULL REFERENCES cities(id),
    to_city_id INTEGER NOT NULL REFERENCES cities(id),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Promotional codes table
CREATE TABLE IF NOT EXISTS promotional_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(10) CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    max_discount DECIMAL(10,2),
    min_booking_amount DECIMAL(10,2) DEFAULT 0,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(20) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    passenger_name VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(20),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    message TEXT NOT NULL,
    notification_type VARCHAR(20) CHECK (notification_type IN ('sms', 'email', 'push')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bus tracking table
CREATE TABLE IF NOT EXISTS bus_tracking (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id),
    current_location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(20) CHECK (status IN ('not_started', 'on_route', 'delayed', 'arrived')) DEFAULT 'not_started',
    estimated_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    delay_minutes INTEGER DEFAULT 0,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add cancellation fields to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

-- Add amenities to buses
ALTER TABLE buses ADD COLUMN IF NOT EXISTS wifi BOOLEAN DEFAULT FALSE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS ac BOOLEAN DEFAULT FALSE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS charging_ports BOOLEAN DEFAULT FALSE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS entertainment BOOLEAN DEFAULT FALSE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS refreshments BOOLEAN DEFAULT FALSE;

-- Insert sample cities
INSERT INTO cities (name) VALUES 
('Addis Ababa'),
('Dire Dawa'),
('Hawassa'),
('Bahir Dar'),
('Mekelle'),
('Adama'),
('Gondar'),
('Jimma'),
('Dessie'),
('Arba Minch'),
('Nekemte'),
('Debre Markos'),
('Axum'),
('Lalibela'),
('Harar')
ON CONFLICT (name) DO NOTHING;

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample promotional codes
INSERT INTO promotional_codes (code, description, discount_type, discount_value, max_discount, expires_at) VALUES 
('WELCOME10', 'Welcome discount for new users', 'percentage', 10.00, 50.00, '2024-12-31 23:59:59'),
('STUDENT15', 'Student discount', 'percentage', 15.00, 75.00, '2024-12-31 23:59:59'),
('FAMILY20', 'Family travel discount', 'fixed', 20.00, NULL, '2024-12-31 23:59:59'),
('NEWYEAR25', 'New Year special discount', 'percentage', 25.00, 100.00, '2024-01-31 23:59:59'),
('WEEKEND15', 'Weekend travel discount', 'percentage', 15.00, 60.00, '2024-12-31 23:59:59')
ON CONFLICT (code) DO NOTHING;

-- Update buses with sample amenities
UPDATE buses SET 
    wifi = CASE WHEN type IN ('vip', 'business') THEN TRUE ELSE FALSE END,
    ac = CASE WHEN type IN ('vip', 'business') THEN TRUE ELSE RANDOM() > 0.5 END,
    charging_ports = CASE WHEN type = 'business' THEN TRUE ELSE RANDOM() > 0.7 END,
    entertainment = CASE WHEN type = 'vip' THEN TRUE ELSE FALSE END,
    refreshments = CASE WHEN type IN ('vip', 'business') THEN TRUE ELSE FALSE END
WHERE wifi IS NULL;



-- Partner cities table (each partner manages their own cities)
CREATE TABLE IF NOT EXISTS partner_cities (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES bus_companies(id) ON DELETE CASCADE,
    city_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(partner_id, city_name)
);

INSERT INTO users (email, password_hash, user_type, full_name) 
VALUES ('admin@tbus.et', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPDzA672u', 'super_admin', 'System Administrator');
