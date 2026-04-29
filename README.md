# 🏨 HostelMS – Complete Setup Guide

## Requirements
- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- **MySQL Server** 8.0+ → [mysql.com/downloads](https://dev.mysql.com/downloads/mysql/)
- Any modern browser (Chrome, Edge, Firefox)

---

## Step 1 – Run the Database Setup Script (Easiest)

Right-click `setup-db.ps1` in the project root → **Run with PowerShell**

It will:
- Find your MySQL installation automatically
- Ask for your MySQL root password
- Create the `hostel_db` database with all tables + seed data
- Update `backend/.env` with your password

---

## Step 2 – OR Set Up Manually via MySQL Workbench / phpMyAdmin

1. Open **MySQL Workbench** (or phpMyAdmin)
2. Open the file: `backend/schema.sql`
3. Click **Execute** (⚡) — this creates the database, all 6 tables, and seeds demo data

---

## Step 3 – Configure Environment

Edit `backend/.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=hostel_db
JWT_SECRET=hostelms_super_secret_key_2024
PORT=5000
```

---

## Step 4 – Install Dependencies (Only First Time)

```powershell
cd "d:\SLIIT\2nd year\2nd sem\ITP\new project\backend"
npm install
```

---

## Step 5 – Start the Server

```powershell
cd "d:\SLIIT\2nd year\2nd sem\ITP\new project\backend"
npm start
```

You should see:
```
✅ MySQL connected to database: hostel_db
🏨 HostelMS Server running on http://localhost:5000
```

---

## Step 6 – Open the App

**http://localhost:5000/pages/login.html**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hostelms.lk | Admin@1234 |
| Student | student@hostelms.lk | Student@1234 |

---

## Troubleshooting

### ❌ MySQL connection failed: Access denied
→ Your `DB_PASSWORD` in `.env` is wrong. Check your MySQL root password.

### ❌ Cannot connect to server / ECONNREFUSED
→ MySQL service is not running. Open **Services** (Win+R → `services.msc`) and start **MySQL80**.

### ❌ Port 5000 already in use
→ Change `PORT=5001` in `.env` and restart.

### ❌ node is not recognized
→ Install Node.js from [nodejs.org](https://nodejs.org) and restart terminal.

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Students & admin accounts |
| `rooms` | Room inventory & status |
| `room_allocations` | Room assignments |
| `fee_structures` | Fee type catalog |
| `fee_payments` | Payment records |
| `visitors` | Visitor registrations |
