const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const db = require('../db');

/* POST /api/visitors */
router.post('/', authenticate, (req, res) => {
    try {
        const { visitorName, visitorNic, visitorPhone, hostId, hostStudent, relationship,
            visitPurpose, purposeDetail, visitDate, visitTime, numVisitors } = req.body;
        if (!visitorName || !visitorNic || !visitorPhone || !visitPurpose || !visitDate)
            return res.status(400).json({ message: 'Required fields missing.' });

        // Calculate current APPROVED visitors for this date
        const allOnDate = db.visitors.all().filter(v => v.visit_date === visitDate && v.status === 'approved');
        const approvedCount = allOnDate.reduce((sum, v) => sum + (parseInt(v.num_visitors) || 1), 0);
        
        if (approvedCount >= 5) {
            return res.status(400).json({ message: 'Maximum limit of 5 approved visitors per day has been reached for the hostel.' });
        }

        // Safe fallback in case the frontend payload uses hostStudent instead of hostId
        const sid = parseInt(hostStudent || hostId) || req.user.id;
        const host = db.users.findBy('id', sid);
        const v = db.visitors.create({
            visitor_name: visitorName, visitor_nic: visitorNic, visitor_phone: visitorPhone,
            host_student_id: sid, hostName: host?.name || '',
            relationship: relationship || null,
            visit_purpose: visitPurpose, purpose_detail: purposeDetail || null,
            visit_date: visitDate, visit_time: visitTime || null,
            num_visitors: parseInt(numVisitors) || 1,
            status: 'pending'
        });
        res.status(201).json({ message: 'Visitor registered. Awaiting approval.', id: v.id });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/visitors */
router.get('/', authenticate, (req, res) => {
    try {
        const visitors = req.user.role === 'admin'
            ? db.visitors.all()
            : db.visitors.byHost(req.user.id);
        res.json(visitors);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/visitors/date/:date/count */
router.get('/date/:date/count', authenticate, (req, res) => {
    try {
        const date = req.params.date;
        const allOnDate = db.visitors.all().filter(v => v.visit_date === date && v.status === 'approved');
        const count = allOnDate.reduce((sum, v) => sum + (parseInt(v.num_visitors) || 1), 0);
        res.json({ date, count, limit: 5 });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* PATCH /api/visitors/:id/status  (admin only) */
router.patch('/:id/status', authenticate, requireAdmin, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const newStatus = req.body.status;
        const visitor = db.visitors.findById(id);

        if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

        if (newStatus === 'approved') {
            const allOnDate = db.visitors.all().filter(v => v.visit_date === visitor.visit_date && v.status === 'approved' && v.id !== id);
            const approvedCount = allOnDate.reduce((sum, v) => sum + (parseInt(v.num_visitors) || 1), 0);
            const requestedCount = parseInt(visitor.num_visitors) || 1;

            if (approvedCount + requestedCount > 5) {
                return res.status(400).json({ 
                    message: `Cannot approve. Limit of 5 reached. Currently: ${approvedCount}/5 approved for ${visitor.visit_date}.` 
                });
            }
        }

        db.visitors.setStatus(id, newStatus);
        res.json({ message: `Visitor ${newStatus}.` });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* DELETE /api/visitors/:id  (admin only) */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
    try {
        db.visitors.delete(parseInt(req.params.id));
        res.json({ message: 'Visitor record deleted.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
