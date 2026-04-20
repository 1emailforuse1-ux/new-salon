-- ============================================================
-- SALON DB SCHEMA FOR COCKROACHDB
-- Run this AFTER: CREATE DATABASE salon_db;
-- Connection: Use salon_db database
-- ============================================================

-- SuperAdmins Table
CREATE TABLE IF NOT EXISTS superadmins (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'superadmin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shops (Branches) Table
CREATE TABLE IF NOT EXISTS shops (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    shop_name VARCHAR(255) NOT NULL,
    admin_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    shop_id VARCHAR(100),
    admin_id VARCHAR(100),
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff (Employees) Table
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(50) DEFAULT 'employee',
    specialty VARCHAR(255),
    admin_id VARCHAR(100),
    shop_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    duration INTEGER DEFAULT 30,
    price DECIMAL(10, 2) DEFAULT 0,
    admin_id VARCHAR(100),
    admin_name VARCHAR(255),
    shop_id VARCHAR(100),
    shop_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    gender VARCHAR(20),
    last_services TEXT,
    last_payment_method VARCHAR(50),
    total_spent DECIMAL(10, 2) DEFAULT 0,
    admin_id VARCHAR(100),
    shop_id VARCHAR(100),
    shop_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    customer_name VARCHAR(255) NOT NULL,
    service_name VARCHAR(255),
    staff_name VARCHAR(255),
    date DATE,
    time VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending',
    admin_id VARCHAR(100),
    shop_id VARCHAR(100),
    shop_name VARCHAR(255),
    booked_by VARCHAR(255),
    processed_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices (Billing) Table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    customer_name VARCHAR(255),
    customer_id VARCHAR(100),
    service_name TEXT,
    total DECIMAL(10, 2) DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50),
    admin_id VARCHAR(100),
    shop_id VARCHAR(100),
    shop_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    stock INTEGER DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0,
    admin_id VARCHAR(100),
    shop_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (fallback table for legacy support)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    admin_id VARCHAR(100),
    shop_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAMPLE SUPERADMIN (Update phone to your number)
-- INSERT INTO superadmins (name, phone, role)
-- VALUES ('Super Admin', '9999999999', 'superadmin');
-- ============================================================
