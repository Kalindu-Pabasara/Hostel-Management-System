require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const rateLimit = require('express-rate-limit');
const db        = require('./db');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Rate Limiters ──────────────────────────────────────────── */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { message: '⛔ Too many login attempts. Please wait 15 minutes and try again.' },
  standardHeaders: true, legacyHeaders: false,
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: { message: '⛔ Too many registrations from this IP. Please try again later.' },
});

/* ── Middleware ─────────────────────────────────────────────── */
app.use(cors());
app.use(express.json({ limit: '5mb' }));

/* ── Apply rate limits to auth endpoints ────────────────────── */
app.post('/api/auth/login',    loginLimiter);
app.post('/api/auth/register', registerLimiter);


/* ── Static frontend files ──────────────────────────────────── */
app.use(express.static(path.join(__dirname, '../frontend')));

/* ── API Routes ─────────────────────────────────────────────── */
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/rooms',       require('./routes/rooms'));
app.use('/api/fees',        require('./routes/fees'));
app.use('/api/visitors',    require('./routes/visitors'));
app.use('/api/analytics',   require('./routes/analytics'));
app.use('/api/maintenance', require('./routes/maintenance'));

/* ── Room status change (admin) PATCH /api/rooms/:id/status ─── */
const { authenticate, requireAdmin } = require('./middleware/auth');
app.patch('/api/rooms/:id/status', authenticate, requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['available', 'occupied', 'maintenance'];
    if (!valid.includes(status))
      return res.status(400).json({ message: 'Invalid status. Use: available | occupied | maintenance' });
    const room = db.rooms.findById(parseInt(req.params.id));
    if (!room) return res.status(404).json({ message: 'Room not found.' });

    // If changing from occupied to available/maintenance, evict the active student
    if (room.status === 'occupied' && status !== 'occupied') {
        const alloc = db.allocations.all().find(a => a.room_id === room.id && a.is_active);
        if (alloc) {
            db.allocations.update(alloc.id, { is_active: 0, status: 'evicted' });
            db.notifications.create({ 
               user_id: alloc.student_id, 
               type: 'eviction', 
               message: `Admin has changed your room (${room.room_number}) status to ${status}. Your room allocation has been revoked.` 
            });
        }
    }

    db.rooms.setStatus(room.id, status);
    db.audit.log({ user: req.user.name, action: 'room_status_change', detail: `Room ${room.room_number} → ${status}` });
    res.json({ message: `Room ${room.room_number} status updated to ${status}.`, room: db.rooms.findById(room.id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ── Overdue students GET /api/fees/overdue ─────────────────── */
app.get('/api/fees/overdue', authenticate, requireAdmin, (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const students = db.users.all().filter(u => u.role === 'student' && u.status === 'active');
    const payments = db.feePayments.all();
    const overdue  = students.filter(s => {
      return !payments.some(p => p.student_id === s.id && p.billing_month === currentMonth && p.status === 'paid');
    }).map(s => {
      const alloc = db.allocations.all().find(a => a.student_id === s.id && a.is_active);
      const room  = alloc ? db.rooms.findById(alloc.room_id) : null;
      return { id: s.id, name: s.name, email: s.email, room: room?.room_number || '—' };
    });
    res.json(overdue);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ── Audit log GET /api/audit ────────────────────────────────── */
app.get('/api/audit', authenticate, requireAdmin, (req, res) => {
  try { res.json(db.audit.all()); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

/* ── Student dashboard GET /api/me/dashboard ────────────────── */
app.get('/api/me/dashboard', authenticate, (req, res) => {
  try {
    const uid     = req.user.id;
    const alloc   = db.allocations.all().find(a => a.student_id === uid && a.is_active);
    const room    = alloc ? db.rooms.findById(alloc.room_id) : null;
    const payments = db.feePayments.byStudent(uid).slice(-5).reverse();
    const visitors = db.visitors.byHost(uid).slice(-5).reverse();
    const maintenance = (db.maintenance.all()).filter(m => m.student_id === uid).slice(-3).reverse();
    const notifications = db.notifications.byUser(uid).filter(n => !n.is_read);
    res.json({ allocation: alloc, room, payments, visitors, maintenance, notifications });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ── Mark notification as read PATCH /api/notifications/:id/read ── */
app.patch('/api/notifications/:id/read', authenticate, (req, res) => {
    try {
        db.notifications.markRead(parseInt(req.params.id));
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ── Health check ───────────────────────────────────────────── */
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'JSON file' }));

/* ── Data Viewer endpoint (no auth) ─────────────────────────── */
app.get('/api/data/all', (req, res) => {
  try {
    res.json({
      users:         db.users.all().map(({ password, ...u }) => u),
      rooms:         db.rooms.all(),
      allocations:   db.allocations.all(),
      feeStructures: db.feeStructures.all(),
      feePayments:   db.feePayments.all(),
      visitors:      db.visitors.all(),
      maintenance:   db.maintenance.all(),
      audit:         db.audit.all(),
      notifications: db.notifications.all(),
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ── SPA fallback ───────────────────────────────────────────── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

/* ── Error handler ──────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

/* ── Start ──────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🏨  HostelMS Server  (JSON mode)    ║
  ╠════════════════════════════════════════╣
  ║  🌐  http://localhost:${PORT}/pages/login.html
  ║  📡  API: http://localhost:${PORT}/api
  ║  📊  Dashboard: http://localhost:${PORT}/pages/dashboard.html
  ╚════════════════════════════════════════╝
  `);
});
