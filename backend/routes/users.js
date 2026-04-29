const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middleware/auth');
const db = require('../db');

/* GET /api/users  (admin only) */
router.get('/', authenticate, requireAdmin, (req, res) => {
    try {
        const users = db.users.all().map(({ password, ...u }) => u);
        res.json(users);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/users/:id */
router.get('/:id', authenticate, (req, res) => {
    try {
        const user = db.users.findBy('id', parseInt(req.params.id));
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const { password, ...userInfo } = user;
        res.json(userInfo);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* PUT /api/users/:id */
router.put('/:id', authenticate, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (req.user.id !== id && req.user.role !== 'admin')
            return res.status(403).json({ message: 'Access denied.' });
        const { name, phone } = req.body;
        db.users.update(id, { name, phone });
        res.json({ message: 'Profile updated.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* PATCH /api/users/bulk-status  (admin only) - moved before /:id to prevent route clash */
router.patch('/bulk-status', authenticate, requireAdmin, (req, res) => {
    try {
        const { userIds, status } = req.body;
        if (!Array.isArray(userIds) || !status) return res.status(400).json({ message: 'Invalid data.' });
        userIds.forEach(id => db.users.update(parseInt(id), { status }));
        db.audit.log({ user: req.user.name, action: 'user_bulk_update', detail: `${status} applied to ${userIds.length} users` });
        res.json({ message: `Successfully updated ${userIds.length} users to ${status}.` });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* PATCH /api/users/:id/status  (admin only) */
router.patch('/:id/status', authenticate, requireAdmin, (req, res) => {
    try {
        db.users.update(parseInt(req.params.id), { status: req.body.status });
        res.json({ message: `User ${req.body.status}.` });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* PATCH /api/users/:id/reset-password  (admin only) */
router.patch('/:id/reset-password', authenticate, requireAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
        const hashed = await bcrypt.hash(newPassword, 12);
        db.users.update(parseInt(req.params.id), { password: hashed });
        db.audit.log({ user: req.user.name, action: 'password_reset', detail: `Reset password for user ID ${req.params.id}` });
        res.json({ message: 'Password successfully reset.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* DELETE /api/users/:id  (admin only) */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
    try {
        db.users.delete(parseInt(req.params.id));
        res.json({ message: 'User deleted.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

