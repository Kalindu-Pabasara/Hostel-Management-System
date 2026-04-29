const express = require('express');
const router  = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const db = require('../db');

/* GET /api/maintenance — all (admin) or own (student) */
router.get('/', authenticate, (req, res) => {
  try {
    const all = db.maintenance ? db.maintenance.all() : [];
    if (req.user.role === 'admin') return res.json(all);
    res.json(all.filter(m => m.student_id === req.user.id));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* POST /api/maintenance — submit request (student) */
router.post('/', authenticate, (req, res) => {
  try {
    const { room_number, category, description, priority = 'medium' } = req.body;
    if (!room_number || !category || !description)
      return res.status(400).json({ message: 'Room, category and description required.' });
    const item = db.maintenance.create({
      student_id: req.user.id,
      studentName: req.user.name,
      room_number, category, description, priority,
      status: 'pending'
    });
    res.status(201).json({ message: 'Maintenance request submitted.', item });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* PATCH /api/maintenance/:id — update status (admin) */
router.patch('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const valid = ['pending', 'in-progress', 'resolved', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status.' });
    db.maintenance.update(parseInt(req.params.id), { status, admin_notes });
    res.json({ message: 'Status updated.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* DELETE /api/maintenance/:id (admin) */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    db.maintenance.delete(parseInt(req.params.id));
    res.json({ message: 'Deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
