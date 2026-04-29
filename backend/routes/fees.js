const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const db = require('../db');

/* GET /api/fees/structure */
router.get('/structure', authenticate, (req, res) => {
    try { res.json(db.feeStructures.all()); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

/* POST /api/fees/structure  (admin) */
router.post('/structure', authenticate, requireAdmin, (req, res) => {
    try {
        const { name, category, amount, billing_period = 'monthly', description, effective_from } = req.body;
        if (!name || !category || !amount || !effective_from)
            return res.status(400).json({ message: 'Required fields missing.' });
        const f = db.feeStructures.create({ name, category, amount: parseFloat(amount), billing_period, description: description || null, effective_from });
        res.status(201).json({ message: 'Fee structure added.', id: f.id });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* PUT /api/fees/structure/:id  (admin) */
router.put('/structure/:id', authenticate, requireAdmin, (req, res) => {
    try {
        const { name, category, amount, billing_period, description, effective_from } = req.body;
        db.feeStructures.update(parseInt(req.params.id), { name, category, amount: parseFloat(amount), billing_period, description: description || null, effective_from });
        res.json({ message: 'Fee structure updated.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* DELETE /api/fees/structure/:id  (admin) */
router.delete('/structure/:id', authenticate, requireAdmin, (req, res) => {
    try {
        db.feeStructures.delete(parseInt(req.params.id));
        res.json({ message: 'Fee structure deleted.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* POST /api/fees/payment  (admin & student) */
router.post('/payment', authenticate, (req, res) => {
    try {
        let { studentId, feeType, amount, method, payDate, payMonth, reference, notes, proof } = req.body;
        
        // Security: Students can only record for themselves
        if (req.user.role !== 'admin') {
            studentId = req.user.id;
        }
        
        if (!studentId || !feeType || !amount || !payDate || !payMonth)
            return res.status(400).json({ message: 'Required fields missing.' });
            
        const student = db.users.findBy('id', parseInt(studentId));
        const p = db.feePayments.create({
            student_id: parseInt(studentId),
            studentName: student?.name || 'Student',
            fee_type: feeType,
            amount: parseFloat(amount),
            payment_method: method || 'cash',
            payment_date: payDate,
            billing_month: payMonth,
            reference_no: reference || null,
            notes: notes || null,
            payment_proof: proof || null,
            status: req.user.role === 'admin' ? 'paid' : 'pending'
        });
        res.status(201).json({ message: 'Payment recorded successfully.', id: p.id });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* POST /api/fees/request (student) */
router.post('/request', authenticate, (req, res) => {
    try {
        const { feeStructureId } = req.body;
        const fee = db.feeStructures.findById(parseInt(feeStructureId));
        if (!fee) return res.status(404).json({ message: 'Fee structure not found.' });
        
        const now = new Date();
        const yyyyMm = now.toISOString().slice(0, 7);
        const yyyyMmDd = now.toISOString().split('T')[0];
        
        const p = db.feePayments.create({
            student_id: req.user.id,
            studentName: req.user.name,
            fee_type: fee.category,
            amount: parseFloat(fee.amount),
            payment_method: 'online',
            payment_date: yyyyMmDd,
            billing_month: yyyyMm,
            reference_no: null,
            notes: `Requested service: ${fee.name}`,
            status: 'pending'
        });
        res.status(201).json({ message: 'Service requested successfully. Awaiting approval.', id: p.id });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* PATCH /api/fees/payments/:id/approve (admin) */
router.patch('/payments/:id/approve', authenticate, requireAdmin, (req, res) => {
    try {
        const p = db.feePayments.findById(parseInt(req.params.id));
        if (!p) return res.status(404).json({ message: 'Payment not found.' });
        
        db.feePayments.update(p.id, { status: 'paid' });
        res.json({ message: 'Payment approved.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/fees/payments */
router.get('/payments', authenticate, (req, res) => {
    try {
        const payments = req.user.role === 'admin'
            ? db.feePayments.all()
            : db.feePayments.byStudent(req.user.id);
        res.json(payments);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* DELETE /api/fees/payments/:id (admin) */
router.delete('/payments/:id', authenticate, requireAdmin, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const p = db.feePayments.findById(id);
        if (!p) return res.status(404).json({ message: 'Payment record not found.' });

        db.feePayments.update(id, { status: 'delete_requested', prev_status: p.status });

        if (db.notifications && db.notifications.create) {
            db.notifications.create({
                user_id: p.student_id,
                type: 'payment_delete_request',
                payment_id: p.id,
                message: `Admin requests approval to delete your "${p.fee_type}" payment (ID: ${p.id}).`
            });
        }
        
        if (db.audit && db.audit.create) {
            db.audit.create({ action: 'payment_delete_requested', detail: `Admin requested to delete payment #${p.id}`, user: req.user.name });
        }
        res.json({ message: 'Deletion approval requested from student.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* POST /api/fees/payments/:id/approve_delete (student) */
router.post('/payments/:id/approve_delete', authenticate, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const p = db.feePayments.findById(id);
        if (!p) return res.status(404).json({ message: 'Payment not found.' });
        if (p.student_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized. You do not own this payment record.' });
        if (p.status !== 'delete_requested') return res.status(400).json({ message: 'Invalid payment state for deletion.' });
        
        // Clean up ghost notification
        if (db.notifications && db.notifications.all) {
            const ghost = db.notifications.all().find(n => n.type === 'payment_delete_request' && n.payment_id === id);
            if (ghost) db.notifications.markRead(ghost.id);
        }

        db.feePayments.delete(id);
        
        if (db.audit && db.audit.create) {
            db.audit.create({ action: 'payment_deleted', detail: `Payment #${p.id} fully deleted via student approval (${req.user.name}).`, user: req.user.name });
        }
        res.json({ message: 'Payment successfully deleted.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* POST /api/fees/payments/:id/reject_delete (student) */
router.post('/payments/:id/reject_delete', authenticate, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const p = db.feePayments.findById(id);
        if (!p) return res.status(404).json({ message: 'Payment not found.' });
        if (p.student_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized. You do not own this payment record.' });
        if (p.status !== 'delete_requested') return res.status(400).json({ message: 'Invalid payment state.' });

        // Restore precisely to what it was
        db.feePayments.update(id, { status: p.prev_status || 'pending', prev_status: null });
        
        // Clean up ghost notification
        if (db.notifications && db.notifications.all) {
            const ghost = db.notifications.all().find(n => n.type === 'payment_delete_request' && n.payment_id === id);
            if (ghost) db.notifications.markRead(ghost.id);
        }
        
        if (db.audit && db.audit.create) {
            db.audit.create({ action: 'payment_delete_rejected', detail: `Student ${req.user.name} rejected deletion of payment #${p.id}.`, user: req.user.name });
        }
        res.json({ message: 'Deletion rejected. Record safely preserved.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
