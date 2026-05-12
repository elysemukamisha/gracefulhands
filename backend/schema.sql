-- Graceful Hands Therapeutic Massage
-- Run this in phpMyAdmin > u549394637_Gracefulhands > SQL tab

CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(20) PRIMARY KEY,
  clientName VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  serviceId VARCHAR(20),
  duration INT DEFAULT 60,
  date VARCHAR(100),
  time VARCHAR(10),
  status ENUM('Pending','Confirmed','Cancelled','Completed') DEFAULT 'Pending',
  intakeDetails JSON,
  totalPrice DECIMAL(10,2) DEFAULT 0,
  createdAt VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  serviceType VARCHAR(255),
  painPoints TEXT,
  hasInsurance TINYINT(1) DEFAULT 0,
  status ENUM('New','Contacted','Booked','Lost') DEFAULT 'New',
  createdAt VARCHAR(50),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  durationOptions JSON,
  prices JSON,
  basePrice DECIMAL(10,2) DEFAULT 0,
  image TEXT,
  category ENUM('Therapeutic','Relaxation','Specialty') DEFAULT 'Therapeutic'
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  message TEXT,
  date VARCHAR(100)
);

-- Single-row settings table
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  primaryColor VARCHAR(20) DEFAULT '#2D4F3E',
  secondaryColor VARCHAR(20) DEFAULT '#D4AF37',
  metaTitle VARCHAR(255) DEFAULT 'Graceful Hands | Modern Luxury Therapeutic Massage',
  metaDescription TEXT,
  instagramUrl VARCHAR(500),
  facebookUrl VARCHAR(500),
  announcementBar VARCHAR(500)
);

INSERT IGNORE INTO settings (id) VALUES (1);
