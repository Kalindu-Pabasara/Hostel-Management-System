/* ============================================================
   HostelMS – Pure-JS JSON File Database
   Stores all data in backend/hostelms-data.json
   Zero external dependencies – uses Node.js built-in fs module
   ============================================================ */
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'hostelms-data.json');

// ─── Default seed data ────────────────────────────────────────
const DEFAULT_DATA = {
  users: [
    { id: 1, name: 'Admin User', email: 'admin@hostelms.lk', nic: '881234567V', phone: '0771234560', password: '$2a$12$9WZ.N0kB6zmJMB8Xf4nrP.Gue8gLoT3YHcgqKUanCkbZ7BHTcF43m', role: 'admin', status: 'active', created_at: '2024-01-10' },
    { id: 2, name: 'John Perera', email: 'student@hostelms.lk', nic: '991234567V', phone: '0771234561', password: '$2a$12$qGexBHp0QfYCL0bJFMiuWupCVCYn2H24Km4b3RbHl3bXS5pSTQW9S', role: 'student', status: 'active', created_at: '2024-02-05' },
    { id: 3, name: 'Nimal Silva', email: 'nimal@student.lk', nic: '001234567V', phone: '0771234562', password: '$2a$12$qGexBHp0QfYCL0bJFMiuWupCVCYn2H24Km4b3RbHl3bXS5pSTQW9S', role: 'student', status: 'active', created_at: '2024-02-08' },
    { id: 4, name: 'Kasun Bandara', email: 'kasun@student.lk', nic: '011234567V', phone: '0771234563', password: '$2a$12$qGexBHp0QfYCL0bJFMiuWupCVCYn2H24Km4b3RbHl3bXS5pSTQW9S', role: 'student', status: 'inactive', created_at: '2024-02-12' },
    { id: 5, name: 'Priya Fernando', email: 'priya@student.lk', nic: '921234567V', phone: '0771234564', password: '$2a$12$qGexBHp0QfYCL0bJFMiuWupCVCYn2H24Km4b3RbHl3bXS5pSTQW9S', role: 'student', status: 'active', created_at: '2024-02-15' },
    { id: 6, name: 'Sunil Ranasinghe', email: 'sunil@student.lk', nic: '871234567V', phone: '0771234565', password: '$2a$12$qGexBHp0QfYCL0bJFMiuWupCVCYn2H24Km4b3RbHl3bXS5pSTQW9S', role: 'student', status: 'active', created_at: '2024-02-20' },
  ],
  rooms: [
    { id: 1, room_number: 'A101', type: 'Single', floor: 1, capacity: 1, price: 15000, status: 'available', amenities: 'WiFi,AC,Wardrobe,Study Desk' },
    { id: 2, room_number: 'A102', type: 'Single', floor: 1, capacity: 1, price: 15000, status: 'occupied', amenities: 'WiFi,AC,Wardrobe,Study Desk' },
    { id: 3, room_number: 'A103', type: 'Single', floor: 1, capacity: 1, price: 15000, status: 'available', amenities: 'WiFi,Fan,Wardrobe' },
    { id: 4, room_number: 'A104', type: 'Single', floor: 1, capacity: 1, price: 15000, status: 'available', amenities: 'WiFi,Fan,Wardrobe' },
    { id: 5, room_number: 'B201', type: 'Double', floor: 2, capacity: 2, price: 22000, status: 'available', amenities: 'WiFi,AC,Wardrobe,Study Desk,Bathroom' },
    { id: 6, room_number: 'B202', type: 'Double', floor: 2, capacity: 2, price: 22000, status: 'occupied', amenities: 'WiFi,AC,Wardrobe,Study Desk,Bathroom' },
    { id: 7, room_number: 'B203', type: 'Double', floor: 2, capacity: 2, price: 22000, status: 'occupied', amenities: 'WiFi,Fan,Wardrobe,Bathroom' },
    { id: 8, room_number: 'B204', type: 'Double', floor: 2, capacity: 2, price: 22000, status: 'maintenance', amenities: 'WiFi,AC,Wardrobe,Study Desk,Bathroom' },
    { id: 9, room_number: 'B205', type: 'Double', floor: 2, capacity: 2, price: 22000, status: 'available', amenities: 'WiFi,AC,Wardrobe,Bathroom' },
    { id: 10, room_number: 'C301', type: 'Suite', floor: 3, capacity: 1, price: 35000, status: 'available', amenities: 'WiFi,AC,Wardrobe,Study Desk,Private Bathroom,TV,Balcony' },
    { id: 11, room_number: 'C302', type: 'Suite', floor: 3, capacity: 1, price: 35000, status: 'occupied', amenities: 'WiFi,AC,Wardrobe,Study Desk,Private Bathroom,TV' },
    { id: 12, room_number: 'C303', type: 'Suite', floor: 3, capacity: 1, price: 35000, status: 'available', amenities: 'WiFi,AC,Wardrobe,Study Desk,Private Bathroom,TV,Balcony' },
  ],
  room_allocations: [
    { id: 1, student_id: 2, room_id: 2, start_date: '2024-01-15', end_date: '2024-12-15', notes: null, is_active: 1, created_at: '2024-01-15' },
    { id: 2, student_id: 3, room_id: 6, start_date: '2024-02-01', end_date: '2024-12-01', notes: null, is_active: 1, created_at: '2024-02-01' },
    { id: 3, student_id: 5, room_id: 11, start_date: '2024-02-10', end_date: '2024-12-10', notes: null, is_active: 1, created_at: '2024-02-10' },
  ],
  fee_structures: [
    { id: 1, name: 'Accommodation - Single', category: 'accommodation', amount: 15000, billing_period: 'monthly', description: 'Single room monthly fee', effective_from: '2024-01-01' },
    { id: 2, name: 'Accommodation - Double', category: 'accommodation', amount: 22000, billing_period: 'monthly', description: 'Double room monthly fee', effective_from: '2024-01-01' },
    { id: 3, name: 'Accommodation - Suite', category: 'accommodation', amount: 35000, billing_period: 'monthly', description: 'Suite monthly fee', effective_from: '2024-01-01' },
    { id: 4, name: 'Mess Fee', category: 'meals', amount: 8000, billing_period: 'monthly', description: 'Three meals per day', effective_from: '2024-01-01' },
    { id: 5, name: 'Electricity & Water', category: 'utilities', amount: 2500, billing_period: 'monthly', description: 'Shared utility costs', effective_from: '2024-01-01' },
    { id: 6, name: 'Laundry Service', category: 'laundry', amount: 1500, billing_period: 'monthly', description: 'Weekly laundry service', effective_from: '2024-01-01' },
    { id: 7, name: 'Security Deposit', category: 'security', amount: 30000, billing_period: 'one-time', description: 'Refundable on checkout', effective_from: '2024-01-01' },
  ],
  fee_payments: [
    { id: 1, student_id: 2, studentName: 'John Perera', fee_type: 'accommodation', amount: 15000, payment_method: 'bank_transfer', payment_date: '2024-02-01', billing_month: '2024-02', reference_no: 'BT20240201', status: 'paid', notes: null },
    { id: 2, student_id: 2, studentName: 'John Perera', fee_type: 'meals', amount: 8000, payment_method: 'cash', payment_date: '2024-02-01', billing_month: '2024-02', reference_no: null, status: 'paid', notes: null },
    { id: 3, student_id: 3, studentName: 'Nimal Silva', fee_type: 'accommodation', amount: 22000, payment_method: 'online', payment_date: '2024-02-05', billing_month: '2024-02', reference_no: 'ONL1023', status: 'paid', notes: null },
    { id: 4, student_id: 4, studentName: 'Kasun Bandara', fee_type: 'accommodation', amount: 15000, payment_method: 'cash', payment_date: '2024-02-08', billing_month: '2024-02', reference_no: null, status: 'pending', notes: '2nd instalment due' },
    { id: 5, student_id: 5, studentName: 'Priya Fernando', fee_type: 'security', amount: 30000, payment_method: 'bank_transfer', payment_date: '2024-01-15', billing_month: '2024-01', reference_no: 'BT20240115', status: 'paid', notes: null },
  ],
  visitors: [
    { id: 1, visitor_name: 'Kamal Perera', visitor_nic: '631234567V', visitor_phone: '0771234500', host_student_id: 2, hostName: 'John Perera', relationship: 'parent', visit_purpose: 'personal', visit_date: '2024-02-18', visit_time: '10:00', num_visitors: 1, status: 'approved', created_at: '2024-02-17' },
    { id: 2, visitor_name: 'Siri Silva', visitor_nic: '721234567V', visitor_phone: '0771234501', host_student_id: 3, hostName: 'Nimal Silva', relationship: 'sibling', visit_purpose: 'emergency', visit_date: '2024-02-20', visit_time: '14:00', num_visitors: 2, status: 'approved', created_at: '2024-02-19' },
    { id: 3, visitor_name: 'Amali Fernando', visitor_nic: '811234567V', visitor_phone: '0771234502', host_student_id: 5, hostName: 'Priya Fernando', relationship: 'relative', visit_purpose: 'pickup', visit_date: '2024-02-21', visit_time: '09:00', num_visitors: 1, status: 'pending', created_at: '2024-02-20' },
    { id: 4, visitor_name: 'Rohana Bandara', visitor_nic: '551234567V', visitor_phone: '0771234503', host_student_id: 4, hostName: 'Kasun Bandara', relationship: 'parent', visit_purpose: 'delivery', visit_date: '2024-02-22', visit_time: '11:00', num_visitors: 1, status: 'pending', created_at: '2024-02-21' },
    { id: 5, visitor_name: 'Sunethra Ranasinghe', visitor_nic: '461234567V', visitor_phone: '0771234504', host_student_id: 6, hostName: 'Sunil Ranasinghe', relationship: 'relative', visit_purpose: 'personal', visit_date: '2024-02-15', visit_time: '15:00', num_visitors: 3, status: 'rejected', created_at: '2024-02-14' },
    { id: 6, visitor_name: 'Dinesh Kumar', visitor_nic: '911234567V', visitor_phone: '0771234505', host_student_id: 2, hostName: 'John Perera', relationship: 'friend', visit_purpose: 'personal', visit_date: '2024-02-25', visit_time: '13:00', num_visitors: 1, status: 'pending', created_at: '2024-02-24' },
  ],
  maintenance: [
    { id: 1, student_id: 2, studentName: 'John Perera', room_number: 'A102', category: 'electrical', description: 'Light bulb not working', priority: 'low',    status: 'resolved',     admin_notes: 'Replaced bulb',   created_at: '2024-02-10' },
    { id: 2, student_id: 3, studentName: 'Nimal Silva',  room_number: 'B202', category: 'plumbing',   description: 'Tap leaking in bathroom', priority: 'high',   status: 'in-progress',  admin_notes: null,              created_at: '2024-02-18' },
    { id: 3, student_id: 5, studentName: 'Priya Fernando', room_number: 'C302', category: 'ac',       description: 'AC not cooling properly', priority: 'medium', status: 'pending',      admin_notes: null,              created_at: '2024-02-22' },
  ],
  notifications: [],
  audit_log: [],
  _seq: { users: 6, rooms: 12, room_allocations: 3, fee_structures: 7, fee_payments: 5, visitors: 6, maintenance: 3, audit_log: 0, notifications: 0 }
};


// ─── Load or initialise DB ────────────────────────────────────
let data;
if (fs.existsSync(DB_FILE)) {
  try { data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { data = JSON.parse(JSON.stringify(DEFAULT_DATA)); }
} else {
  data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  console.log('✅ JSON database created with seed data →', DB_FILE);
}
console.log('✅ JSON file database ready →', DB_FILE);

// ─── Persist helper ───────────────────────────────────────────
function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ─── Next ID helper ───────────────────────────────────────────
function nextId(table) {
  data._seq[table] = (data._seq[table] || 0) + 1;
  return data._seq[table];
}

// ─── DB API (mimics SQLite sync interface) ────────────────────
const db = {
  // users
  users: {
    all: () => data.users,
    findBy: (k, v) => data.users.find(u => u[k] === v),
    create: (u) => { u.id = nextId('users'); u.created_at = new Date().toISOString().split('T')[0]; data.users.push(u); save(); return u; },
    update: (id, ch) => { const i = data.users.findIndex(u => u.id === id); if (i > -1) { Object.assign(data.users[i], ch); save(); } },
    delete: (id) => { data.users = data.users.filter(u => u.id !== id); save(); },
  },
  // rooms
  rooms: {
    all: () => data.rooms,
    available: () => data.rooms.filter(r => r.status === 'available'),
    findById: (id) => data.rooms.find(r => r.id === id),
    setStatus: (id, s) => { const r = data.rooms.find(r => r.id === id); if (r) { r.status = s; save(); } },
  },
  // allocations
  allocations: {
    all: () => data.room_allocations,
    create: (a) => { a.id = nextId('room_allocations'); a.created_at = new Date().toISOString().split('T')[0]; data.room_allocations.push(a); save(); return a; },
    findById: (id) => data.room_allocations.find(a => a.id === id),
    update: (id, ch) => { const i = data.room_allocations.findIndex(a => a.id === id); if (i > -1) { Object.assign(data.room_allocations[i], ch); save(); } },
    delete: (id) => { data.room_allocations = data.room_allocations.filter(a => a.id !== id); save(); },
  },
  // fee structures
  feeStructures: {
    all: () => data.fee_structures,
    findById: (id) => data.fee_structures.find(f => f.id === id),
    create: (f) => { f.id = nextId('fee_structures'); f.created_at = new Date().toISOString().split('T')[0]; data.fee_structures.push(f); save(); return f; },
    update: (id, ch) => { const i = data.fee_structures.findIndex(f => f.id === id); if (i > -1) { Object.assign(data.fee_structures[i], ch); save(); } },
    delete: (id) => { data.fee_structures = data.fee_structures.filter(f => f.id !== id); save(); },
  },
  // fee payments
  feePayments: {
    all: () => data.fee_payments,
    byStudent: (sid) => data.fee_payments.filter(p => p.student_id === sid),
    create: (p) => { p.id = nextId('fee_payments'); p.created_at = new Date().toISOString().split('T')[0]; data.fee_payments.push(p); save(); return p; },
    findById: (id) => data.fee_payments.find(p => p.id === id),
    update: (id, ch) => { const i = data.fee_payments.findIndex(p => p.id === id); if (i > -1) { Object.assign(data.fee_payments[i], ch); save(); } },
    delete: (id) => { data.fee_payments = data.fee_payments.filter(p => p.id !== id); save(); },
  },
  // visitors
  visitors: {
    all:       () => data.visitors,
    byHost:    (hid) => data.visitors.filter(v => v.host_student_id === hid),
    findById:  (id)  => data.visitors.find(v => v.id === id),
    create:    (v)   => { v.id = nextId('visitors'); v.created_at = new Date().toISOString().split('T')[0]; data.visitors.push(v); save(); return v; },
    setStatus: (id, s) => { const v = data.visitors.find(v => v.id === id); if (v) { v.status = s; save(); } },
    delete:    (id)  => { data.visitors = data.visitors.filter(v => v.id !== id); save(); },
  },
  // notifications
  notifications: {
    all: () => data.notifications || [],
    byUser: (uid) => (data.notifications || []).filter(n => n.user_id === uid),
    create: (n) => { 
        if (!data.notifications) data.notifications = [];
        n.id = nextId('notifications'); 
        n.created_at = new Date().toISOString(); 
        n.is_read = 0;
        data.notifications.push(n); 
        save(); 
        return n; 
    },
    markRead: (id) => { const i = (data.notifications || []).findIndex(n => n.id === id); if (i > -1) { data.notifications[i].is_read = 1; save(); } }
  },
  // maintenance requests
  maintenance: {
    all:      () => (data.maintenance || []),
    findById: (id) => (data.maintenance || []).find(m => m.id === id),
    create:   (m) => {
      if (!data.maintenance) data.maintenance = [];
      m.id = nextId('maintenance'); m.created_at = new Date().toISOString().split('T')[0];
      data.maintenance.push(m); save(); return m;
    },
    update:   (id, ch) => {
      const i = (data.maintenance || []).findIndex(m => m.id === id);
      if (i > -1) { Object.assign(data.maintenance[i], ch); save(); }
    },
    delete:   (id) => { data.maintenance = (data.maintenance || []).filter(m => m.id !== id); save(); },
  },
  // audit log
  audit: {
    all:  () => (data.audit_log || []),
    log:  (entry) => {
      if (!data.audit_log) data.audit_log = [];
      entry.id = nextId('audit_log'); entry.ts = new Date().toISOString();
      data.audit_log.unshift(entry);
      if (data.audit_log.length > 200) data.audit_log = data.audit_log.slice(0, 200);
      save(); return entry;
    },
  },
};

module.exports = db;

