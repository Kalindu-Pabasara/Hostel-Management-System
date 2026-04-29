const express = require('express');
const router  = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const db = require('../db');

/* GET /api/analytics/overview */
router.get('/overview', authenticate, requireAdmin, (req, res) => {
  try {
    const rooms    = db.rooms.all();
    const users    = db.users.all();
    const payments = db.feePayments.all();
    const visitors = db.visitors.all();
    const allocs   = db.allocations.all();

    const totalRooms     = rooms.length;
    const availableRooms = rooms.filter(r => r.status === 'available').length;
    const occupiedRooms  = rooms.filter(r => r.status === 'occupied').length;
    const maintRooms     = rooms.filter(r => r.status === 'maintenance').length;
    const occupancyPct   = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const totalStudents  = users.filter(u => u.role === 'student').length;
    const activeStudents = users.filter(u => u.role === 'student' && u.status === 'active').length;

    const totalRevenue   = payments.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending').length;

    const pendingVisitors  = visitors.filter(v => v.status === 'pending').length;
    const approvedVisitors = visitors.filter(v => v.status === 'approved').length;

    res.json({
      rooms:    { total: totalRooms, available: availableRooms, occupied: occupiedRooms, maintenance: maintRooms, occupancyPct },
      students: { total: totalStudents, active: activeStudents },
      revenue:  { total: totalRevenue, pendingPayments },
      visitors: { pending: pendingVisitors, approved: approvedVisitors, total: visitors.length },
      allocations: { active: allocs.filter(a => a.is_active).length },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/analytics/revenue — monthly revenue for last 6 months */
router.get('/revenue', authenticate, requireAdmin, (req, res) => {
  try {
    const payments = db.feePayments.all().filter(p => p.status === 'paid');
    const monthly  = {};
    const now      = new Date();

    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = 0;
    }

    payments.forEach(p => {
      const m = p.billing_month || p.payment_date?.slice(0, 7);
      if (m && monthly[m] !== undefined) monthly[m] += parseFloat(p.amount || 0);
    });

    res.json(Object.entries(monthly).map(([month, revenue]) => ({ month, revenue })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/analytics/recent — recent activity feed */
router.get('/recent', authenticate, requireAdmin, (req, res) => {
  try {
    const payments = db.feePayments.all().slice(-5).reverse().map(p => ({
      type: 'payment', icon: '💳', text: `${p.studentName || 'Student'} paid LKR ${Number(p.amount).toLocaleString()}`,
      time: p.payment_date, status: p.status
    }));
    const visitors = db.visitors.all().slice(-5).reverse().map(v => ({
      type: 'visitor', icon: '👤', text: `${v.visitor_name} visiting ${v.hostName || 'student'}`,
      time: v.created_at, status: v.status
    }));
    const activity = [...payments, ...visitors]
      .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
      .slice(0, 8);
    res.json(activity);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
