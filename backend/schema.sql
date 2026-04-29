-- ============================================================
-- HostelMS – MySQL Database Schema & Seed Data
-- Run this in MySQL: SOURCE schema.sql;
-- Or paste in phpMyAdmin / MySQL Workbench
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS hostel_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hostel_db;

-- ─────────────── USERS ───────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  nic         VARCHAR(15)  NOT NULL,
  phone       VARCHAR(15)  NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('student','admin') NOT NULL DEFAULT 'student',
  status      ENUM('active','inactive')       NOT NULL DEFAULT 'active',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed: admin (password = Admin@1234) + student (password = Student@1234)
INSERT INTO users (name, email, nic, phone, password, role, status) VALUES
('Admin User',     'admin@hostelms.lk',   '881234567V', '0771234560',
 '$2a$12$9WZ.N0kB6zmJMB8Xf4nrP.Gue8gLoT3YHcgqKUanCkbZ7BHTcF43m', 'admin',   'active'),
('John Perera',    'student@hostelms.lk', '991234567V', '0771234561',
 '$2a$12$qGexBHp0QfYCL0bJFMiuWupCVCYn2H24Km4b3RbHl3bXS5pSTQW9S', 'student', 'active'),
('Nimal Silva',    'nimal@student.lk',    '001234567V', '0771234562',
 '$2a$12$qGexBHp0QfYCL0bJFMiuWupCVCYn2H24Km4b3RbHl3bXS5pSTQW9S', 'student', 'active'),
('Kasun Bandara',  'kasun@student.lk',    '011234567V', '0771234563',
 '$2a$12$qGexBHp0QfYCL0bJFMiuWupCVCYn2H24Km4b3RbHl3bXS5pSTQW9S', 'student', 'inactive'),
('Priya Fernando', 'priya@student.lk',    '921234567V', '0771234564',
 '$2a$12$qGexBHp0QfYCL0bJFMiuWupCVCYn2H24Km4b3RbHl3bXS5pSTQW9S', 'student', 'active'),
('Sunil Ranasinghe','sunil@student.lk',   '871234567V', '0771234565',
 '$2a$12$qGexBHp0QfYCL0bJFMiuWupCVCYn2H24Km4b3RbHl3bXS5pSTQW9S', 'student', 'active');

-- ─────────────── ROOMS ───────────────
CREATE TABLE IF NOT EXISTS rooms (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  room_number  VARCHAR(10) NOT NULL UNIQUE,
  type         ENUM('Single','Double','Suite') NOT NULL,
  floor        INT NOT NULL DEFAULT 1,
  capacity     INT NOT NULL DEFAULT 1,
  price        DECIMAL(10,2) NOT NULL,
  status       ENUM('available','occupied','maintenance') NOT NULL DEFAULT 'available',
  amenities    TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO rooms (room_number, type, floor, capacity, price, status, amenities) VALUES
('A101','Single',1,1,15000.00,'available','WiFi,AC,Wardrobe,Study Desk'),
('A102','Single',1,1,15000.00,'occupied', 'WiFi,AC,Wardrobe,Study Desk'),
('A103','Single',1,1,15000.00,'available','WiFi,Fan,Wardrobe'),
('A104','Single',1,1,15000.00,'available','WiFi,Fan,Wardrobe'),
('B201','Double',2,2,22000.00,'available','WiFi,AC,Wardrobe,Study Desk,Bathroom'),
('B202','Double',2,2,22000.00,'occupied', 'WiFi,AC,Wardrobe,Study Desk,Bathroom'),
('B203','Double',2,2,22000.00,'occupied', 'WiFi,Fan,Wardrobe,Bathroom'),
('B204','Double',2,2,22000.00,'maintenance','WiFi,AC,Wardrobe,Study Desk,Bathroom'),
('B205','Double',2,2,22000.00,'available','WiFi,AC,Wardrobe,Bathroom'),
('C301','Suite', 3,1,35000.00,'available','WiFi,AC,Wardrobe,Study Desk,Private Bathroom,TV,Balcony'),
('C302','Suite', 3,1,35000.00,'occupied', 'WiFi,AC,Wardrobe,Study Desk,Private Bathroom,TV'),
('C303','Suite', 3,1,35000.00,'available','WiFi,AC,Wardrobe,Study Desk,Private Bathroom,TV,Balcony');

-- ─────────────── ROOM ALLOCATIONS ───────────────
CREATE TABLE IF NOT EXISTS room_allocations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  room_id     INT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  notes       TEXT,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id)    REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO room_allocations (student_id, room_id, start_date, end_date, is_active) VALUES
(2, 2,  '2024-01-15', '2024-12-15', 1),
(3, 6,  '2024-02-01', '2024-12-01', 1),
(5, 11, '2024-02-10', '2024-12-10', 1);

-- ─────────────── FEE STRUCTURES ───────────────
CREATE TABLE IF NOT EXISTS fee_structures (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  category        VARCHAR(50)  NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  billing_period  ENUM('monthly','semester','annual','one-time') NOT NULL DEFAULT 'monthly',
  description     TEXT,
  effective_from  DATE NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO fee_structures (name, category, amount, billing_period, description, effective_from) VALUES
('Accommodation – Single', 'accommodation', 15000.00, 'monthly',  'Single room monthly fee',       '2024-01-01'),
('Accommodation – Double', 'accommodation', 22000.00, 'monthly',  'Double room monthly fee',       '2024-01-01'),
('Accommodation – Suite',  'accommodation', 35000.00, 'monthly',  'Suite monthly fee',             '2024-01-01'),
('Mess Fee',               'meals',          8000.00, 'monthly',  'Three meals per day',           '2024-01-01'),
('Electricity & Water',    'utilities',      2500.00, 'monthly',  'Shared utility costs',          '2024-01-01'),
('Laundry Service',        'laundry',        1500.00, 'monthly',  'Weekly laundry service',        '2024-01-01'),
('Security Deposit',       'security',      30000.00, 'one-time', 'Refundable on checkout',        '2024-01-01');

-- ─────────────── FEE PAYMENTS ───────────────
CREATE TABLE IF NOT EXISTS fee_payments (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  student_id       INT NOT NULL,
  fee_type         VARCHAR(80) NOT NULL,
  amount           DECIMAL(10,2) NOT NULL,
  payment_method   ENUM('cash','bank_transfer','online','cheque') NOT NULL DEFAULT 'cash',
  payment_date     DATE NOT NULL,
  billing_month    VARCHAR(7)  NOT NULL,  -- YYYY-MM
  reference_no     VARCHAR(100),
  notes            TEXT,
  status           ENUM('paid','pending','overdue') NOT NULL DEFAULT 'paid',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO fee_payments (student_id, fee_type, amount, payment_method, payment_date, billing_month, reference_no, status) VALUES
(2, 'accommodation', 15000.00, 'bank_transfer', '2024-02-01', '2024-02', 'BT20240201', 'paid'),
(2, 'meals',          8000.00, 'cash',           '2024-02-01', '2024-02', NULL,         'paid'),
(3, 'accommodation', 22000.00, 'online',         '2024-02-05', '2024-02', 'ONL1023',    'paid'),
(4, 'accommodation', 15000.00, 'cash',           '2024-02-08', '2024-02', NULL,         'pending'),
(5, 'security',      30000.00, 'bank_transfer',  '2024-01-15', '2024-01', 'BT20240115', 'paid');

-- ─────────────── VISITORS ───────────────
CREATE TABLE IF NOT EXISTS visitors (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  visitor_name    VARCHAR(100) NOT NULL,
  visitor_nic     VARCHAR(15)  NOT NULL,
  visitor_phone   VARCHAR(15)  NOT NULL,
  host_student_id INT NOT NULL,
  relationship    VARCHAR(50),
  visit_purpose   VARCHAR(80)  NOT NULL,
  purpose_detail  TEXT,
  visit_date      DATE NOT NULL,
  visit_time      TIME,
  num_visitors    INT NOT NULL DEFAULT 1,
  status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO visitors (visitor_name, visitor_nic, visitor_phone, host_student_id, relationship, visit_purpose, visit_date, visit_time, num_visitors, status) VALUES
('Kamal Perera',       '631234567V', '0771234500', 2, 'parent',   'personal',  '2024-02-18', '10:00:00', 1, 'approved'),
('Siri Silva',          '721234567V', '0771234501', 3, 'sibling',  'emergency', '2024-02-20', '14:00:00', 2, 'approved'),
('Amali Fernando',     '811234567V', '0771234502', 5, 'relative', 'pickup',    '2024-02-21', '09:00:00', 1, 'pending'),
('Rohana Bandara',     '551234567V', '0771234503', 4, 'parent',   'delivery',  '2024-02-22', '11:00:00', 1, 'pending'),
('Sunethra Ranasinghe','461234567V', '0771234504', 6, 'relative', 'personal',  '2024-02-15', '15:00:00', 3, 'rejected'),
('Dinesh Kumar',       '911234567V', '0771234505', 2, 'friend',   'personal',  '2024-02-25', '13:00:00', 1, 'pending');

-- ── Done
SELECT 'HostelMS database setup complete!' AS Status;
