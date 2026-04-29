# 🏨 HostelMS — Hostel Management System

> A full-stack web-based hostel management system built for the SLIIT IT2150 IT Project module.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Overview

HostelMS is a comprehensive digital hostel management platform that replaces paper-based workflows with an integrated web application. It supports two user roles — **Admin** and **Student** — each with a dedicated dashboard and set of permissions.

The system handles the complete lifecycle of a student's hostel stay:
- 🛏️ Room discovery and allocation
- 💳 Fee payment with digital proof upload
- 👥 Visitor registration and approval
- 🔧 Maintenance request tracking
- 📊 Real-time analytics for administrators

---

## ✨ Key Features

### 🔐 Authentication & Security
- JWT-based session management (24-hour token expiry)
- bcrypt password hashing (salt rounds: 12)
- Role-based access control — Admin and Student roles
- Rate limiting on login and registration endpoints
- Middleware-enforced route protection

### 🏠 Room Management
- 20 rooms across 3 types: **Single**, **Double**, **Suite**
- Live bed availability tracking using `bedStats()` — counts `confirmed_beds` vs `pending_beds` per room
- Dynamic room card states: **Book** / **🟡 Join Room** / **⏳ Pending** / **🔒 Full**
- Admin manual room status override with auto-eviction notification

### 🛏️ Shared Room Allocation
- Double rooms support **two students** with automatic **50% fee split**
- Partial occupancy stays bookable — shows "Join Room" for the second student
- Full allocation approval workflow: Student requests → Admin approves/rejects
- Co-occupant selector in the allocation form

### 💳 Fee Payment
- Supports: Cash, Cheque, Bank Transfer, Online Payment
- **Bank Transfer / Online** payments require a payment proof image upload (stored as Base64)
- 📄 View Proof link in the ledger for uploaded receipts
- **2-Step Deletion Approval**: Admin requests → Student receives notification → Student approves or rejects
- Admin payment approval workflow for student-submitted payments

### 👥 Visitor Management
- Students register visitors with NIC, relationship, purpose, date, and time
- Admin approves or rejects visitor requests
- Full visitor history with status badges

### 🔧 Maintenance Requests
- Submit tickets with category (Electrical, Plumbing, AC, Other) and priority (Low → Urgent)
- Admin updates status: Pending → In Progress → Resolved

### 📊 Admin Dashboard
- 6 KPI cards: Occupancy Rate, Available Rooms, Active Students, Total Revenue, Overdue Payments, Pending Visitors
- Room Status doughnut chart
- Monthly Revenue bar chart (last 6 months)
- Overdue students table with direct payment link
- Recent Activity feed

### 🔔 Notifications
- In-app notification banners on the student dashboard
- Triggered by: payment deletion requests, room evictions
- Dismissible via PATCH API

### 📋 Audit Log
- Tracks all admin actions (room status changes, payment deletions, etc.)
- Automatically purged beyond 200 entries

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express.js |
| **Database** | JSON flat-file (`hostelms-data.json`) |
| **Authentication** | JWT + bcrypt |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript |
| **Charts** | Chart.js |
| **Security** | express-rate-limit, dotenv |

---

## 📁 Project Structure

```
📦 HostelMS
├── backend/
│   ├── server.js              # Entry point, middleware, route mounting
│   ├── db.js                  # JSON database abstraction layer
│   ├── hostelms-data.json     # 🔒 NOT committed (gitignored)
│   ├── middleware/
│   │   └── auth.js            # JWT verification + requireAdmin
│   └── routes/
│       ├── auth.js            # Login, register
│       ├── rooms.js           # Room CRUD + bedStats + allocation
│       ├── fees.js            # Fee structures + payments + approval
│       ├── users.js           # User management
│       ├── visitors.js        # Visitor registration + approval
│       ├── maintenance.js     # Service/maintenance requests
│       └── analytics.js      # Dashboard KPI aggregations
└── frontend/
    ├── css/style.css          # Global design system
    ├── js/common.js           # Shared utilities: apiFetch, Session, Validate, buildSidebar
    ├── images/                # Room type images
    └── pages/                 # 18 HTML pages
        ├── login.html
        ├── register.html
        ├── dashboard.html         # Admin KPI dashboard
        ├── my-dashboard.html      # Student personal dashboard
        ├── rooms.html             # Room gallery with live availability
        ├── room-allocate.html     # Room booking + admin approval
        ├── fee-payment.html       # Fee ledger + proof upload
        ├── fee-structure.html     # Fee type management
        ├── visitor-register.html  # Register a visitor
        ├── visitor-history.html   # Visitor log
        ├── maintenance.html       # Maintenance requests
        ├── admin-rooms.html       # Admin room management
        ├── admin-users.html       # User management
        ├── profile.html           # Edit personal info
        ├── audit-log.html         # Admin action trail
        ├── data-viewer.html       # Raw database browser
        ├── service-requests.html  # Student service requests
        └── about.html             # Hostel information
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- Any modern browser (Chrome, Edge, Firefox)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Kalindu-Pabasara/Hostel-Management-System.git
cd Hostel-Management-System

# 2. Install backend dependencies
cd backend
npm install

# 3. Start the server
node server.js
```

### Access the App

Open your browser and go to:
```
http://localhost:5000/pages/login.html
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 🔑 Admin | `admin@hostelms.lk` | `Admin@1234` |
| 🎓 Student | `student@hostelms.lk` | `Student@1234` |

---

## 🔑 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| POST | `/api/auth/register` | Public | Register new student |
| GET | `/api/rooms` | Any | All rooms with bed stats |
| GET | `/api/rooms/available` | Any | Rooms with free beds |
| POST | `/api/rooms/allocate` | Any | Request room allocation |
| PATCH | `/api/rooms/allocate/:id/approve` | Admin | Approve allocation |
| PATCH | `/api/rooms/allocate/:id/reject` | Admin | Reject allocation |
| GET | `/api/fees/payments` | Any | Fee payment ledger |
| POST | `/api/fees/payment` | Any | Record a payment |
| DELETE | `/api/fees/payments/:id` | Admin | Request student approval to delete |
| POST | `/api/fees/payments/:id/approve_delete` | Student | Approve deletion |
| GET | `/api/me/dashboard` | Any | Student personal dashboard data |
| GET | `/api/analytics/overview` | Admin | KPI stats |
| GET | `/api/fees/overdue` | Admin | Students with no payment this month |

---

## 📸 Screenshots

> See `frontend/pages/` for live pages. Run the server and open the demo credentials above.

---

## 👥 Team

Developed by the HostelMS team as part of **IT2150: IT Project**
**2nd Year, Semester 2 — 2026**
Sri Lanka Institute of Information Technology (SLIIT)

---

## 📄 License

This project is for academic purposes — SLIIT IT2150 IT Project module.
